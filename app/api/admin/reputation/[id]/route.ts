import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { reputationSchema } from "@/lib/validations";
import Reputation from "@/models/Reputation";

type Ctx = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Ctx) { try { await requireApiRole(["admin"]); const { id } = await params; const data = reputationSchema.parse(await request.json()); await connectDB(); const record = await (await tenantModel(Reputation)).findByIdAndUpdate(id, { ...data, reviewedAt: new Date(data.reviewedAt), respondedAt: data.respondedAt ? new Date(data.respondedAt) : null }, { new: true, runValidators: true }).lean(); return record ? ok(record) : fail("Reputation record not found", 404); } catch (error) { return handleError(error); } }
export async function DELETE(_request: Request, { params }: Ctx) { try { await requireApiRole(["admin"]); const { id } = await params; await connectDB(); const record = await (await tenantModel(Reputation)).findByIdAndDelete(id); return record ? ok({ id }) : fail("Reputation record not found", 404); } catch (error) { return handleError(error); } }
