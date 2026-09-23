import { Schema, model, models, type InferSchemaType } from "mongoose";
import { COMMISSION_STATUSES } from "@/lib/constants";

/** Ledger entry created when a partner-driven booking is paid. */
const CommissionSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    partner: { type: Schema.Types.ObjectId, ref: "Partner", required: true, index: true },
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    amount: { type: Number, required: true }, // partner earnings (total)
    platformFee: { type: Number, default: 0 },
    status: {
      type: String,
      enum: COMMISSION_STATUSES,
      default: "pending",
      index: true,
    },
    payoutDate: Date,
  },
  { timestamps: true },
);

export type CommissionDoc = InferSchemaType<typeof CommissionSchema> & {
  _id: string;
};

export default models.Commission || model("Commission", CommissionSchema);
