import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { handleError, ok, requireApiRole } from "@/lib/api";
import { reputationSchema } from "@/lib/validations";
import Reputation from "@/models/Reputation";

export async function GET() { try { await requireApiRole(["admin"]); await connectDB(); return ok(await (await tenantModel(Reputation)).find({}).sort({ reviewedAt: -1 }).lean()); } catch (error) { return handleError(error); } }
export async function POST(request: Request) { try { await requireApiRole(["admin"]); const data = reputationSchema.parse(await request.json()); await connectDB(); const record = await (await tenantModel(Reputation)).create({ ...data, reviewedAt: new Date(data.reviewedAt), respondedAt: data.respondedAt ? new Date(data.respondedAt) : null }); return ok({ id: String(record._id) }, 201); } catch (error) { return handleError(error); } }
