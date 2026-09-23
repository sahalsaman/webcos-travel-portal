import { Schema, model, models, type InferSchemaType } from "mongoose";

const ReviewSchema = new Schema(
  {
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    status: {
      type: String,
      enum: ["published", "hidden"],
      default: "published",
    },
  },
  { timestamps: true },
);

// One review per traveler per trip.
ReviewSchema.index({ trip: 1, user: 1 }, { unique: true });

export type ReviewDoc = InferSchemaType<typeof ReviewSchema> & { _id: string };

export default models.Review || model("Review", ReviewSchema);
