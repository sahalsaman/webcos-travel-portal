import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { handleError, ok, requireApiRole } from "@/lib/api";
import { supplierSchema } from "@/lib/validations";
import "@/models";
import Supplier from "@/models/Supplier";

export async function GET() {
  try {
    await requireApiRole(["tenant", "tenant_employee"]);
    await connectDB();
    const suppliers = await (await tenantModel(Supplier)).find({}).sort({ companyName: 1, createdAt: -1 }).lean();
    return ok(suppliers);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireApiRole(["tenant", "tenant_employee"]);
    const data = supplierSchema.parse(await request.json());
    await connectDB();
    const supplier = await (await tenantModel(Supplier)).create({
      ...data,
      email: data.email?.toLowerCase() ?? "",
      countryCode: data.countryCode.toUpperCase(),
    });
    return ok({ id: String(supplier._id) }, 201);
  } catch (err) {
    return handleError(err);
  }
}
