import { Schema, model, models, type InferSchemaType } from "mongoose";
import { EXPENSE_STATUSES } from "@/lib/constants";
const ExpenseSchema = new Schema({ expenseNumber: { type: String, required: true, unique: true, index: true }, title: { type: String, required: true, trim: true }, category: { type: String, required: true, trim: true, index: true }, vendor: { type: String, default: "", trim: true }, amount: { type: Number, required: true, min: 0 }, expenseDate: { type: Date, required: true, index: true }, status: { type: String, enum: EXPENSE_STATUSES, default: "pending", index: true }, paymentReference: { type: String, default: "", trim: true }, notes: { type: String, default: "", trim: true } }, { timestamps: true });
export type ExpenseDoc = InferSchemaType<typeof ExpenseSchema> & { _id: string };
export default models.Expense || model("Expense", ExpenseSchema);
