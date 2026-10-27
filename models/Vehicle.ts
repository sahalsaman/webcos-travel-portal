import { Schema, model, models, type InferSchemaType } from "mongoose";

const VehicleSchema = new Schema({
  supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
  name: { type: String, required: true, trim: true },
  vehicleType: { type: String, default: "", trim: true },
  numberOfVehicle: { type: Number, default: 1, trim: true },
  description: { type: String, default: "", trim: true },
  facilities: { type: [String], default: [] },
}, { timestamps: true });

VehicleSchema.index({ supplier: 1, name: 1 });
export type VehicleDoc = InferSchemaType<typeof VehicleSchema> & { _id: string };
export default models.Vehicle || model("Vehicle", VehicleSchema);
