import { Schema, model, models, type InferSchemaType } from "mongoose";

const AttendanceRegularizationSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    date: { type: Date, required: true, index: true },
    requestedCheckIn: { type: String, required: true },
    requestedCheckOut: { type: String, required: true },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    reviewNotes: { type: String, default: "", trim: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

AttendanceRegularizationSchema.index({ employee: 1, date: 1 }, { unique: true });

export type AttendanceRegularizationDoc = InferSchemaType<typeof AttendanceRegularizationSchema> & { _id: string };
export default models.AttendanceRegularization || model("AttendanceRegularization", AttendanceRegularizationSchema);
