import { Schema, model, models, type InferSchemaType } from "mongoose";
import { SUPPLIER_STATUSES, SUPPLIER_TYPES } from "@/lib/constants";

const SupplierSchema = new Schema(
  {
    companyName: { type: String, required: true, trim: true, index: true },
    contactName: { type: String, default: "", trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    type: { type: String, enum: SUPPLIER_TYPES, required: true, index: true },
    status: { type: String, enum: SUPPLIER_STATUSES, default: "active", index: true },
    country: { type: String, required: true, trim: true },
    countryCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    city: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    taxId: { type: String, default: "", trim: true },
    commissionRate: { type: Number, default: 0, min: 0, max: 100 },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export type SupplierDoc = InferSchemaType<typeof SupplierSchema> & { _id: string };

export default models.Supplier || model("Supplier", SupplierSchema);
