import { Schema, model, models } from "mongoose";

const PlatformAdminSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, default: "" },
  password: { type: String, required: true },
}, { timestamps: true });

export default models.PlatformAdmin || model("PlatformAdmin", PlatformAdminSchema);
