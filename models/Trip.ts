import { Schema, model, models, type InferSchemaType } from "mongoose";
import { PACKAGE_SERVICES, PACKAGE_TYPES, TRIP_STATUSES, TRIP_CATEGORIES } from "@/lib/constants";

const ItinerarySchema = new Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    transports: {
      type: [{ title: { type: String, required: true, trim: true }, description: { type: String, default: "" }, _id: false }],
      default: [],
    },
    hotels: {
      type: [{ name: { type: String, required: true, trim: true }, description: { type: String, default: "" }, image: { type: String, default: "" }, verified: { type: Boolean, default: true }, _id: false }],
      default: [],
    },
    meals: { type: [String], enum: ["breakfast", "lunch", "dinner"], default: [] },
    sightseeing: {
      type: [{ name: { type: String, required: true, trim: true }, description: { type: String, default: "" }, image: { type: String, default: "" }, _id: false }],
      default: [],
    },
  },
  { _id: false },
);

const TripSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    destination: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    itinerary: { type: [ItinerarySchema], default: [] },
    inclusions: { type: [String], default: [] },
    includedServices: { type: [String], enum: PACKAGE_SERVICES, default: [] },
    exclusions: { type: [String], default: [] },
    holidayPackage: { type: Boolean, default: true, index: true },
    basePrice: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 1, default: 1 },
    totalSeats: { type: Number, default: 0, min: 0 },
    availableSeats: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    pickupLocation: { type: String, default: "" },
    departureCities: { type: [String], default: [] },
    category: { type: String, enum: TRIP_CATEGORIES, default: "Holiday Package", index: true },
    packageType: { type: String, enum: PACKAGE_TYPES, default: "Standard", index: true },
    status: { type: String, enum: TRIP_STATUSES, default: "draft", index: true },
    featured: { type: Boolean, default: false, index: true },
    tags: { type: [String], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    country: { type: String, default: "India" },
    visaRequired: { type: Boolean, default: false },
    visaNote: { type: String, default: "", trim: true },
    visaDocuments: { type: [String], default: [] },
    visaFee: { type: Number, default: 0, min: 0 },
    permitRequired: { type: Boolean, default: false },
    permitNote: { type: String, default: "", trim: true },
    permitDocuments: { type: [String], default: [] },
    permitFee: { type: Number, default: 0, min: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Full-text search across the fields used by the search bar.
TripSchema.index({ title: "text", destination: "text", description: "text", tags: "text" });
TripSchema.index({ status: 1, featured: -1, createdAt: -1 });
TripSchema.index({ status: 1, destination: 1, rating: -1, createdAt: -1 });
TripSchema.index({ status: 1, category: 1, startDate: 1 });
TripSchema.index({ status: 1, basePrice: 1 });

export type TripDoc = InferSchemaType<typeof TripSchema> & { _id: string };

export default models.Trip || model("Trip", TripSchema);
