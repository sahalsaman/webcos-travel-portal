import { connectDB } from "@/lib/db";
import { handleError, ok, requireApiRole } from "@/lib/api";
import { tenantModel } from "@/lib/tenant-db";
import { COUNTRY_OPTIONS } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import Activity from "@/models/Activity";
import ActivityType from "@/models/ActivityType";
import Destination from "@/models/Destination";
import Hotel from "@/models/Hotel";
import Supplier from "@/models/Supplier";
import Vehicle from "@/models/Vehicle";

const kinds = ["destination", "hotel", "transportation", "activity"] as const;
type Kind = (typeof kinds)[number];

function countryCode(country: string) {
  return COUNTRY_OPTIONS.find((item) => item.name.toLowerCase() === country.toLowerCase())?.code ?? "IN";
}

async function selfManagedSupplier(country: string, city: string) {
  const SupplierModel = await tenantModel(Supplier);
  const existing = await SupplierModel.findOne({ companyName: "Self managed inventory" });
  if (existing) return existing;
  return SupplierModel.create({
    companyName: "Self managed inventory", phone: "Not applicable", type: "Other", status: "active",
    country, countryCode: countryCode(country), city,
  });
}

export async function POST(request: Request) {
  try {
    await requireApiRole(["tenant", "tenant_employee"]);
    const body = await request.json() as { kind?: Kind; name?: string; description?: string; location?: string; country?: string; supplierId?: string; image?: string };
    const kind = body.kind;
    const name = body.name?.trim();
    const description = body.description?.trim() ?? "";
    const country = body.country?.trim() || "India";
    const location = body.location?.trim() || "";
    const image = body.image?.trim() || "";
    if (!kind || !kinds.includes(kind) || !name) return Response.json({ success: false, message: "Inventory type and name are required" }, { status: 422 });

    await connectDB();
    if (kind === "destination") {
      const DestinationModel = await tenantModel(Destination);
      const existing = await DestinationModel.findOne({ title: name, country });
      if (existing) return ok({ id: String(existing._id), existing: true });
      const item = await DestinationModel.create({ title: name, country, countryCode: countryCode(country), description, images: image ? [image] : [], basePrice: 0, status: "active", featured: false, popular: false, tags: [] });
      return ok({ id: String(item._id) }, 201);
    }

    const supplier = body.supplierId ? await (await tenantModel(Supplier)).findById(body.supplierId) : await selfManagedSupplier(country, location);
    if (!supplier) return Response.json({ success: false, message: "Select a valid supplier before saving this inventory" }, { status: 422 });

    if (kind === "hotel" || kind === "transportation") {
      const Model = await tenantModel(kind === "hotel" ? Hotel : Vehicle);
      const existing = await Model.findOne({ supplier: supplier._id, name });
      if (existing) return ok({ id: String(existing._id), existing: true });
      const item = await Model.create({ supplier: supplier._id, name, image, description, facilities: [] });
      return ok({ id: String(item._id) }, 201);
    }

    const ActivityTypeModel = await tenantModel(ActivityType);
    let activityType = await ActivityTypeModel.findOne({ status: "active" }).sort({ sortOrder: 1 });
    if (!activityType) activityType = await ActivityTypeModel.create({ name: "Sightseeing", slug: "sightseeing", status: "active", description: "AI generated sightseeing activities" });
    const ActivityModel = await tenantModel(Activity);
    const existing = await ActivityModel.findOne({ title: name, destination: location || country });
    if (existing) return ok({ id: String(existing._id), existing: true });
    const item = await ActivityModel.create({ title: name, slug: `${slugify(name)}-${Date.now()}`, type: activityType._id, destination: location || country, country, shortDescription: description, description, images: image ? [image] : [], basePrice: 0, childPrice: 0, originalPrice: 0, duration: "", highlights: [], inclusions: [], exclusions: [], importantInfo: [], meetingPoint: "", seasonal: false, bestSelling: false, featured: false, status: "draft" });
    return ok({ id: String(item._id) }, 201);
  } catch (error) {
    return handleError(error);
  }
}
