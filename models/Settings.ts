import { Schema, model, models, type InferSchemaType } from "mongoose";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { getBusiness } from "@/lib/business";
import { tenantModel } from "@/lib/tenant-db";

/** One settings record per business.  Keep tenant ownership explicit even
 * when the database is already selected by tenantModel(). */
const SettingsSchema = new Schema({
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, unique: true, index: true },
  defaultCommission: { type: Number, default: DEFAULT_SETTINGS.defaultCommission },
  platformFeePercent: { type: Number, default: DEFAULT_SETTINGS.platformFeePercent },
  platformFeeFlat: { type: Number, default: DEFAULT_SETTINGS.platformFeeFlat },
  currency: { type: String, default: DEFAULT_SETTINGS.currency },
  minWithdrawal: { type: Number, default: DEFAULT_SETTINGS.minWithdrawal },
  quotationTerms: { type: String, default: DEFAULT_SETTINGS.quotationTerms, trim: true },
  quotationPolicy: { type: String, default: DEFAULT_SETTINGS.quotationPolicy, trim: true },
  quotationImportantInformation: { type: String, default: DEFAULT_SETTINGS.quotationImportantInformation, trim: true },
  quotationOtherInformation: { type: String, default: DEFAULT_SETTINGS.quotationOtherInformation, trim: true },
  quotationTheme: { type: String, default: DEFAULT_SETTINGS.quotationTheme, trim: true },
  quotationColor: { type: String, default: DEFAULT_SETTINGS.quotationColor, trim: true },
}, { timestamps: true });

export type SettingsDoc = InferSchemaType<typeof SettingsSchema> & { _id: string };
const Settings = models.Settings || model("Settings", SettingsSchema);

export async function getSettings() {
  const business = await getBusiness();
  const SettingsModel = await tenantModel(Settings);
  const existing = await SettingsModel.findOne({ businessId: business._id }).lean();
  if (existing) return existing;
  return (await SettingsModel.create({ businessId: business._id })).toObject();
}

export default Settings;
