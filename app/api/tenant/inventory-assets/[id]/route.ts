import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { tenantModel } from "@/lib/tenant-db";
import { inventoryAssetSchema } from "@/lib/validations";
import "@/models";
import Hotel from "@/models/Hotel";
import Vehicle from "@/models/Vehicle";
import { collectCloudinaryUrls, removeUnusedCloudinaryImages } from "@/lib/cloudinary-media";
type Ctx = { params: Promise<{ id: string }> };
const modelFor = (kind: "hotel" | "vehicle") => kind === "hotel" ? Hotel : Vehicle;
export async function PATCH(request: Request, { params }: Ctx) { try { await requireApiRole(["tenant", "tenant_employee"]); const data = inventoryAssetSchema.parse(await request.json()); const { id } = await params; await connectDB(); const { kind, ...asset } = data; const Model = await tenantModel(modelFor(kind)); const previous = await Model.findById(id).lean(); const item = await Model.findByIdAndUpdate(id, asset, { new: true, runValidators: true }).lean(); if (previous && item) await removeUnusedCloudinaryImages(collectCloudinaryUrls(previous)); return item ? ok({ ...item, kind }) : fail("Inventory item not found", 404); } catch (error) { return handleError(error); } }
export async function DELETE(request: Request, { params }: Ctx) { try { await requireApiRole(["tenant", "tenant_employee"]); const kind = new URL(request.url).searchParams.get("kind"); if (kind !== "hotel" && kind !== "vehicle") return fail("Inventory kind is required", 400); const { id } = await params; await connectDB(); const item = await (await tenantModel(modelFor(kind))).findByIdAndDelete(id); if (item) await removeUnusedCloudinaryImages(collectCloudinaryUrls(item)); return item ? ok({ deleted: true }) : fail("Inventory item not found", 404); } catch (error) { return handleError(error); } }
