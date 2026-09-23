import { Schema, model, models, type InferSchemaType } from "mongoose";
import { PAYROLL_STATUSES } from "@/lib/constants";

const PayrollSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    month: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/, index: true },
    basicSalary: { type: Number, required: true, min: 0 },
    allowances: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    netPay: { type: Number, required: true, min: 0 },
    status: { type: String, enum: PAYROLL_STATUSES, default: "draft", index: true },
    paymentDate: { type: Date, default: null },
    paymentReference: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

PayrollSchema.index({ employee: 1, month: 1 }, { unique: true });

export type PayrollDoc = InferSchemaType<typeof PayrollSchema> & { _id: string };

export default models.Payroll || model("Payroll", PayrollSchema);
