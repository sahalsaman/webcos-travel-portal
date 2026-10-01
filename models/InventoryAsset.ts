import { Schema, model, models, type InferSchemaType } from "mongoose";

const InventoryAssetSchema = new Schema({
  supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
  kind: { type: String, enum: ["hotel", "vehicle"], required: true, index: true },
  name: { type: String, required: true, trim: true },
  image: { type: String, default: "" },
  description: { type: String, default: "", trim: true },
  facilities: { type: [String], default: [] },
}, { timestamps: true });

InventoryAssetSchema.index({ supplier: 1, kind: 1, name: 1 });
export type InventoryAssetDoc = InferSchemaType<typeof InventoryAssetSchema> & { _id: string };
export default models.InventoryAsset || model("InventoryAsset", InventoryAssetSchema);
