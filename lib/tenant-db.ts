import mongoose, { type Model } from "mongoose";
import { getBusiness } from "@/lib/business";

/** Resolve each model against this request's business. Never switch a global connection. */
export async function tenantModel<T extends Model<unknown>>(template: T): Promise<T> {
  const business = await getBusiness();
  await import("@/models");
  const connection = mongoose.connection.useDb(business.databaseName, { useCache: true });
  const modelName = template.modelName;
  const existing = connection.models[modelName];
  if (existing) return existing as T;

  // Register only the model requested for this query. Previously every query
  // copied every schema into the tenant connection, multiplying dashboard
  // latency as the application gained more models.
  const sharedModel = mongoose.models[modelName];
  if (!sharedModel) throw new Error(`Model ${modelName} is not registered`);
  return connection.model(modelName, sharedModel.schema) as T;
}
