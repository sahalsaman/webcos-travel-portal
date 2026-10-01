import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { tenantModel } from "@/lib/tenant-db";
import { inventoryAssetSchema } from "@/lib/validations";
import "@/models";
import InventoryAsset from "@/models/InventoryAsset";
type Ctx = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Ctx) { try { await requireApiRole(["admin"]); const data = inventoryAssetSchema.partial().parse(await request.json()); const { id } = await params; await connectDB(); const item = await (await tenantModel(InventoryAsset)).findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean(); return item ? ok(item) : fail("Inventory item not found", 404); } catch (error) { return handleError(error); } }
export async function DELETE(_request: Request, { params }: Ctx) { try { await requireApiRole(["admin"]); const { id } = await params; await connectDB(); const item = await (await tenantModel(InventoryAsset)).findByIdAndDelete(id); return item ? ok({ deleted: true }) : fail("Inventory item not found", 404); } catch (error) { return handleError(error); } }
