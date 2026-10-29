import mongoose, { type Model } from "mongoose";
import { configuredTenantDatabase } from "@/lib/db";
import { getBusiness } from "@/lib/business";

/** Resolve each model against this request's business. Never switch a global connection. */
export async function tenantModel<T extends Model<unknown>>(template: T): Promise<T> {
  await import("@/models");
  const connection = mongoose.connection.useDb(configuredTenantDatabase(), { useCache: true });
  const modelName = template.modelName;
  const existing = connection.models[modelName];
  if (existing) return existing as T;

  // Register only the model requested for this query. Previously every query
  // copied every schema into the tenant connection, multiplying dashboard
  // latency as the application gained more models.
  const sharedModel = mongoose.models[modelName];
  if (!sharedModel) throw new Error(`Model ${modelName} is not registered`);
  // Each tenant model runs in one shared database. Clone the schema so its
  // query middleware can scope every normal model operation to the active
  // business without changing the platform registry model.
  const schema = sharedModel.schema.clone();
  schema.pre(["find", "findOne", "findOneAndUpdate", "findOneAndDelete", "findOneAndReplace", "updateOne", "updateMany", "replaceOne", "deleteOne", "deleteMany", "count", "countDocuments", "distinct"], async function scopeBusiness(this: { getQuery(): Record<string, unknown>; setQuery(filter: Record<string, unknown>): void }) {
    const business = await getBusiness();
    this.setQuery({ ...this.getQuery(), businessId: business._id });
  });
  schema.pre("aggregate", async function scopeAggregate(this: { pipeline(): Array<Record<string, unknown>> }) {
    const business = await getBusiness();
    this.pipeline().unshift({ $match: { businessId: business._id } });
  });
  schema.pre("validate", function stampBusiness(this: { get(path: string): unknown; set(path: string, value: unknown): void }, next: (error?: Error) => void) {
    if (!this.get("businessId")) getBusiness().then((business) => { this.set("businessId", business._id); next(); }).catch(next);
    else next();
  });
  return connection.model(modelName, schema) as T;
}
