import { connectDB } from "@/lib/db";
import { handleError, ok, requireApiRole } from "@/lib/api";
import { tenantModel } from "@/lib/tenant-db";
import { inventoryAssetSchema } from "@/lib/validations";
import "@/models";
import Hotel from "@/models/Hotel";
import Vehicle from "@/models/Vehicle";

const modelFor = (kind: "hotel" | "vehicle") => kind === "hotel" ? Hotel : Vehicle;

export async function GET(request: Request) { try { await requireApiRole(["admin"]); await connectDB(); const kind = new URL(request.url).searchParams.get("kind"); if (kind === "hotel" || kind === "vehicle") { const items = await (await tenantModel(modelFor(kind))).find({}).populate("supplier", "companyName phone").sort({ name: 1 }).lean(); return ok(items.map((item) => ({ ...item, kind }))); } const [hotels, vehicles] = await Promise.all([tenantModel(Hotel), tenantModel(Vehicle)]); const [hotelItems, vehicleItems] = await Promise.all([hotels.find({}).populate("supplier", "companyName phone").lean(), vehicles.find({}).populate("supplier", "companyName phone").lean()]); return ok([...hotelItems.map((item) => ({ ...item, kind: "hotel" })), ...vehicleItems.map((item) => ({ ...item, kind: "vehicle" }))]); } catch (error) { return handleError(error); } }
export async function POST(request: Request) { try { await requireApiRole(["admin"]); const data = inventoryAssetSchema.parse(await request.json()); await connectDB(); const { kind, ...asset } = data; const item = await (await tenantModel(modelFor(kind))).create(asset); return ok({ id: String(item._id) }, 201); } catch (error) { return handleError(error); } }
