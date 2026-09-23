import { Schema, model, models, type InferSchemaType } from "mongoose";

const WishlistSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    trips: [{ type: Schema.Types.ObjectId, ref: "Trip" }],
  },
  { timestamps: true },
);

export type WishlistDoc = InferSchemaType<typeof WishlistSchema> & {
  _id: string;
};

export default models.Wishlist || model("Wishlist", WishlistSchema);
