/**
 * Shared commission engine for agency pricing.
 *
 * Spec example (platform fee = 0):
 *   Base Price      = 10,000
 *   Partner Comm.   =  1,000
 *   Traveler Pays   = 11,000   (base + commission)
 *   Partner Earns   =  1,000
 *   Admin Receives  = 10,000
 *
 * Platform fee is configurable and is taken out of the partner's commission
 * (so the traveler's price never changes because of it):
 *   platformFee   = platformFeeFlat + platformFeePercent% of commission
 *   partnerEarns  = commission - platformFee   (floored at 0)
 *   adminReceives = base + platformFee
 *   travelerPays  = base + commission
 *
 * All figures are PER SEAT unless `seats` is provided, in which case every
 * money field is multiplied by the seat count.
 */

export interface CommissionConfig {
  platformFeePercent?: number; // e.g. 5 => 5%
  platformFeeFlat?: number; // flat INR per seat
}

export interface CommissionInput {
  basePrice: number;
  commission: number; // partner-set commission per seat (0 for direct/admin sales)
  seats?: number;
  config?: CommissionConfig;
}

export interface CommissionBreakdown {
  seats: number;
  basePrice: number; // per seat
  commission: number; // per seat
  platformFee: number; // total across seats
  sellingPrice: number; // per seat (what traveler sees)
  travelerPays: number; // total across seats
  partnerEarns: number; // total across seats
  adminReceives: number; // total across seats
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calculateCommission({
  basePrice,
  commission,
  seats = 1,
  config = {},
}: CommissionInput): CommissionBreakdown {
  const base = Math.max(0, basePrice || 0);
  const comm = Math.max(0, commission || 0);
  const n = Math.max(1, Math.floor(seats || 1));

  const feePercent = Math.max(0, config.platformFeePercent || 0);
  const feeFlat = Math.max(0, config.platformFeeFlat || 0);

  // Platform fee per seat, capped at the commission so partner never goes negative.
  const platformFeePerSeat = Math.min(
    comm,
    (comm * feePercent) / 100 + feeFlat,
  );

  const sellingPrice = base + comm; // per seat
  const partnerEarnsPerSeat = Math.max(0, comm - platformFeePerSeat);
  const adminReceivesPerSeat = base + platformFeePerSeat;

  return {
    seats: n,
    basePrice: round2(base),
    commission: round2(comm),
    platformFee: round2(platformFeePerSeat * n),
    sellingPrice: round2(sellingPrice),
    travelerPays: round2(sellingPrice * n),
    partnerEarns: round2(partnerEarnsPerSeat * n),
    adminReceives: round2(adminReceivesPerSeat * n),
  };
}

/** Selling price per seat = base + commission. */
export function sellingPrice(basePrice: number, commission: number) {
  return Math.max(0, basePrice || 0) + Math.max(0, commission || 0);
}
