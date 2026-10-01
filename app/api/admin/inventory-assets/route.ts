import { connectDB } from "@/lib/db";
import { handleError, ok, requireApiRole } from "@/lib/api";
import { tenantModel } from "@/lib/tenant-db";
import { inventoryAssetSchema } from "@/lib/validations";
import "@/models";
import InventoryAsset from "@/models/InventoryAsset";

export async function GET(request: Request) { try { await requireApiRole(["admin"]); await connectDB(); const kind = new URL(request.url).searchParams.get("kind"); const items = await (await tenantModel(InventoryAsset)).find(kind ? { kind } : {}).populate("supplier", "companyName phone").sort({ name: 1 }).lean(); return ok(items); } catch (error) { return handleError(error); } }
export async function POST(request: Request) { try { await requireApiRole(["admin"]); const data = inventoryAssetSchema.parse(await request.json()); await connectDB(); const item = await (await tenantModel(InventoryAsset)).create(data); return ok({ id: String(item._id) }, 201); } catch (error) { return handleError(error); } }
