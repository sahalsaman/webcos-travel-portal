import { Schema, model, models, type InferSchemaType } from "mongoose";
import { BOOKING_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";

const TravelerDetailsSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    travellers: { type: Number, default: 1, min: 1 },
    departureCity: { type: String, default: "" },
    adults: { type: Number, default: 1, min: 0 },
    childrenWithBed: { type: Number, default: 0, min: 0 },
    childrenWithoutBed: { type: Number, default: 0, min: 0 },
    infants: { type: Number, default: 0, min: 0 },
    notes: String,
  },
  { _id: false },
);

const ComplianceDocumentSchema = new Schema({ label:{type:String,required:true}, fileId:{type:String,required:true}, fileName:{type:String,required:true} },{_id:false});
const ComplianceAnswerSchema = new Schema({ hasDocument:{type:Boolean,required:true}, documents:{type:[ComplianceDocumentSchema],default:[]} },{_id:false});

const BookingSchema = new Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
    traveler: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    // Set when booked through a white-label link; null for direct bookings.
    partner: { type: Schema.Types.ObjectId, ref: "Partner", default: null, index: true },
    partnerTrip: { type: Schema.Types.ObjectId, ref: "PartnerTrip", default: null },

    travelerDetails: { type: TravelerDetailsSchema, required: true },
    travelCompliance: { visa:{type:ComplianceAnswerSchema,default:null}, permit:{type:ComplianceAnswerSchema,default:null} },
    visaFee: { type: Number, default: 0, min: 0 },
    permitFee: { type: Number, default: 0, min: 0 },
    complianceFee: { type: Number, default: 0, min: 0 },
    seats: { type: Number, required: true, min: 1 },
    // Optional at schema level so legacy bookings remain editable. All new
    // booking entry points populate these snapshot dates.
    travelStartDate: { type: Date, default: null },
    travelEndDate: { type: Date, default: null },

    // Pricing snapshot at time of booking (per seat unless noted).
    basePrice: { type: Number, required: true },
    commission: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 }, // total
    sellingPrice: { type: Number, required: true }, // per seat
    totalAmount: { type: Number, required: true }, // traveler pays (total)
    partnerEarnings: { type: Number, default: 0 }, // total
    adminEarnings: { type: Number, default: 0 }, // total

    status: { type: String, enum: BOOKING_STATUSES, default: "pending", index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "created", index: true },
    payment: { type: Schema.Types.ObjectId, ref: "Payment", default: null },
    // Tracks whether this booking currently occupies fixed-departure inventory.
    // This makes payment verification and cancellation idempotent.
    inventoryReserved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

BookingSchema.index({ paymentStatus: 1, createdAt: -1 });
BookingSchema.index({ paymentStatus: 1, trip: 1 });
BookingSchema.index({ traveler: 1, createdAt: -1 });
BookingSchema.index({ partner: 1, createdAt: -1 });

export type BookingDoc = InferSchemaType<typeof BookingSchema> & { _id: string };

export default models.Booking || model("Booking", BookingSchema);
