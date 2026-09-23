import { Schema, model, models, type InferSchemaType } from "mongoose";
import { ADMIN_PORTAL_PAGE_KEYS, EMPLOYEE_STATUSES } from "@/lib/constants";

const EmployeeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    mobile: { type: String, trim: true },
    designation: { type: String, required: true, trim: true },
    department: { type: String, default: "Operations", trim: true, index: true },
    status: { type: String, enum: EMPLOYEE_STATUSES, default: "active", index: true },
    salary: { type: Number, default: 0, min: 0 },
    joinedAt: { type: Date },
    portalAccess: { type: Boolean, default: false, index: true },
    portalPages: { type: [String], enum: ADMIN_PORTAL_PAGE_KEYS, default: [] },
    hrAccess: { type: String, enum: ["self", "manage"], default: "self", index: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export type EmployeeDoc = InferSchemaType<typeof EmployeeSchema> & { _id: string };

export default models.Employee || model("Employee", EmployeeSchema);
