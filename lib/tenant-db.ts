import mongoose, { type Model } from "mongoose";
import { getBusiness } from "@/lib/business";

/** Resolve each model against this request's business. Never switch a global connection. */
export async function tenantModel<T extends Model<unknown>>(template: T): Promise<T> {
  const business = await getBusiness();
  await import("@/models");
  const connection = mongoose.connection.useDb(business.databaseName, { useCache: true });
  for (const [name, model] of Object.entries(mongoose.models)) {
    if (!connection.models[name]) connection.model(name, model.schema);
  }
  return connection.model(template.modelName) as T;
}
