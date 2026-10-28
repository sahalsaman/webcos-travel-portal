import { Schema, model, models, type InferSchemaType } from "mongoose";

const HotelSchema = new Schema({
  supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
  name: { type: String, required: true, trim: true },
  image: { type: String, default: "" },
  description: { type: String, default: "", trim: true },
  directHotelBooking: { type: Boolean, default: false },
  additionalTax: { type: Boolean, default: false },
  taxLabel: { type: String, default: "GST", trim: true },
  taxPercentage: { type: Number, default: 0, min: 0, max: 100 },
  facilities: { type: [String], default: [] },
  rooms: [{
    description: { type: String, default: "", trim: true },
    category: { type: String, default: "", trim: true },
    capacity: { type: Number, default: 1 },
    numberOfRooms: { type: Number, default: 1 },
    price: { type: Number, required: true },
    amenities: { type: [String], default: [] },
  }],
  additianalInclude:[
    {
      name: { type: String, default: "", trim: true },
      description: { type: String, default: "", trim: true },
      price: { type: Number, default: 0 },
    }
  ]
}, { timestamps: true });

HotelSchema.index({ supplier: 1, name: 1 });
export type HotelDoc = InferSchemaType<typeof HotelSchema> & { _id: string };
export default models.Hotel || model("Hotel", HotelSchema);
