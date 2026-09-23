import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { handleError, ok, requireApiRole } from "@/lib/api";
import { leadSchema } from "@/lib/validations";
import { shortId } from "@/lib/utils";
import "@/models";
import Lead from "@/models/Lead";

export async function GET(request: Request) {
  try {
    await requireApiRole(["admin"]);
    await connectDB();
    const campaign = new URL(request.url).searchParams.get("campaign");
    const leads = await (await tenantModel(Lead)).find(campaign ? { campaign } : {})
      .sort({ createdAt: -1 })
      .populate("campaign", "name channel")
      .populate("quotation", "quotationNumber status totalAmount")
      .lean();
    return ok(leads);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const data = leadSchema.parse(await request.json());
    await connectDB();
    const lead = await (await tenantModel(Lead)).create({
      ...data,
      leadNumber: shortId("LD-"),
      email: data.email?.toLowerCase() || "",
      campaign: data.source === "Marketing Campaign" && data.campaignId ? data.campaignId : null,
      travelDate: data.travelDate ? new Date(data.travelDate) : null,
    });
    return ok({ id: String(lead._id), leadNumber: lead.leadNumber }, 201);
  } catch (error) {
    return handleError(error);
  }
}
