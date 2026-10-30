import { connectDB } from "@/lib/db";
import { notifyAdminsAndEmployees } from "@/lib/notifications";
import { tenantModel } from "@/lib/tenant-db";
import { getBusiness } from "@/lib/business";
import Trip from "@/models/Trip";

const AGENCY_TIME_ZONE = "Asia/Kolkata";
const MANAGED_STATUSES = ["active", "soldout"] as const;

type FixedDepartureTrip = {
  _id?: unknown;
  title?: string;
  holidayPackage?: boolean;
  status?: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
};

const dailySyncs = new Map<string, Promise<void>>();

function agencyTodayKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: AGENCY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: "year" | "month" | "day") => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dateKey(value?: Date | string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

export function isFixedDepartureBookingClosed(trip: FixedDepartureTrip, now = new Date()) {
  if (trip.holidayPackage !== false) return false;
  const start = dateKey(trip.startDate);
  return Boolean(start && start <= agencyTodayKey(now));
}

export function dateDrivenTripStatus(trip: FixedDepartureTrip, now = new Date()): "inactive" | "soldout" | undefined {
  if (trip.holidayPackage !== false || !MANAGED_STATUSES.includes(trip.status as (typeof MANAGED_STATUSES)[number])) return undefined;
  const start = dateKey(trip.startDate);
  const end = dateKey(trip.endDate);
  const today = agencyTodayKey(now);
  if (end && end < today) return "inactive";
  if (trip.status === "active" && start && start <= today) return "soldout";
  return undefined;
}

async function reconcileTripStatus(trip: FixedDepartureTrip, businessId: unknown, now = new Date()) {
  const nextStatus = dateDrivenTripStatus(trip, now);
  if (!nextStatus || nextStatus === trip.status || !trip._id) return trip.status;

  const TripModel = await tenantModel(Trip);
  const result = await TripModel.updateOne(
    {
      _id: trip._id,
      businessId,
      status: trip.status,
      holidayPackage: false,
      startDate: trip.startDate,
      endDate: trip.endDate,
    },
    { $set: { status: nextStatus } },
  );
  if (result.modifiedCount === 1) {
    trip.status = nextStatus;
    const title = trip.title || "Untitled package";
    const label = nextStatus === "inactive" ? "expired and unpublished" : "closed for new bookings";
    await notifyAdminsAndEmployees({
      type: "system",
      title: "Fixed departure status updated",
      message: `“${title}” has been ${label} based on its travel dates.`,
      meta: { href: "/inventory/packages", packageId: String(trip._id), status: nextStatus },
    }, "inventory");
    return nextStatus;
  }

  const current = await TripModel.findById(trip._id).select("status").lean();
  if (current?.status) trip.status = current.status;
  return current?.status ?? trip.status;
}

/** Persist date-driven status changes and notify agency staff once per transition. */
export async function syncFixedDepartureStatuses(now = new Date()) {
  await connectDB();
  const business = await getBusiness();
  const today = agencyTodayKey(now);
  const syncKey = `${String(business._id)}:${today}`;
  const previousSync = dailySyncs.get(syncKey);
  if (previousSync) return previousSync;

  const sync = (async () => {
    const todayStart = new Date(`${today}T00:00:00.000Z`);
    const tomorrow = new Date(todayStart);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const trips = await (await tenantModel(Trip))
      .find({
        businessId: business._id,
        holidayPackage: false,
        status: { $in: MANAGED_STATUSES },
        $or: [
          { endDate: { $lt: todayStart } },
          { status: "active", startDate: { $lt: tomorrow } },
        ],
      })
      .select("_id title holidayPackage status startDate endDate")
      .lean();

    for (const trip of trips) await reconcileTripStatus(trip, business._id, now);
  })();
  dailySyncs.set(syncKey, sync);
  try {
    await sync;
  } catch (error) {
    dailySyncs.delete(syncKey);
    throw error;
  }
}

/** Apply the same rule to one trip before booking or editing it. */
export async function syncFixedDepartureStatus(trip: FixedDepartureTrip, now = new Date()) {
  await connectDB();
  const business = await getBusiness();
  return reconcileTripStatus(trip, business._id, now);
}
