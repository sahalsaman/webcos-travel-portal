import { Schema, model, models, type InferSchemaType } from "mongoose";

const HotelSchema = new Schema({
  supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
  name: { type: String, required: true, trim: true },
  image: { type: String, default: "" },
  description: { type: String, default: "", trim: true },
  facilities: { type: [String], default: [] },
}, { timestamps: true });

HotelSchema.index({ supplier: 1, name: 1 });
export type HotelDoc = InferSchemaType<typeof HotelSchema> & { _id: string };
export default models.Hotel || model("Hotel", HotelSchema);
