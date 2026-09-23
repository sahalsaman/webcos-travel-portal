import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/utils";
import "@/models"; // ensure all schemas are registered
import Trip from "@/models/Trip";
import Destination from "@/models/Destination";
import OfferCard from "@/models/OfferCard";
import Partner from "@/models/Partner";
import PartnerTrip from "@/models/PartnerTrip";
import Review from "@/models/Review";
import User from "@/models/User";
import Booking from "@/models/Booking";
import Activity from "@/models/Activity";
import ActivityType from "@/models/ActivityType";

import type { TripDTO, PartnerDTO, ReviewDTO, DestinationDTO, OfferCardDTO, ActivityDTO, ActivityTypeDTO } from "@/types";

/** Run a DB query, returning `fallback` if the DB is unreachable/unconfigured. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    await connectDB();
    return await fn();
  } catch (err) {
    console.error("[data] query failed:", (err as Error).message);
    return fallback;
  }
}

export function isIndiaCountry(code?: string) {
  return (code ?? "IN").toUpperCase() === "IN";
}

export async function getActivityTypes() {
  return safe(async () => serialize(await (await tenantModel(ActivityType)).find({ status: "active" }).sort({ sortOrder: 1, featured: -1, name: 1 }).lean()) as ActivityTypeDTO[], []);
}

export async function getActivities(filters: { q?: string; type?: string; seasonal?: boolean; bestSelling?: boolean; limit?: number } = {}) {
  return safe(async () => {
    const query: Record<string, unknown> = { status: "active" };
    if (filters.q) query.$text = { $search: filters.q };
    if (filters.type) {
      const type = await (await tenantModel(ActivityType)).findOne({ slug: filters.type }).select("_id").lean();
      if (type) query.type = type._id;
    }
    if (filters.seasonal) query.seasonal = true;
    if (filters.bestSelling) query.bestSelling = true;
    const items = await (await tenantModel(Activity)).find(query).sort({ featured: -1, bestSelling: -1, createdAt: -1 }).limit(filters.limit ?? 60).populate({ path: "type", model: "ActivityType", select: "name slug" }).lean();
    return serialize(items) as ActivityDTO[];
  }, [] as ActivityDTO[]);
}

export async function getActivityBySlug(slug: string) {
  return safe(async () => {
    const activity = await (await tenantModel(Activity)).findOne({ slug, status: "active" }).populate({ path: "type", model: "ActivityType", select: "name slug" }).lean();
    return activity ? serialize(activity) as ActivityDTO : null;
  }, null as ActivityDTO | null);
}

const getCachedDestinations = (async (countryCode: string) => {
  return safe(async () => {
    const query: Record<string, unknown> = { status: "active" };
    if (!isIndiaCountry(countryCode)) query.countryCode = { $ne: "IN" };

    const items = await (await tenantModel(Destination)).find(query)
      .sort({ popular: -1, featured: -1, title: 1 })
      .lean();

    if (items.length > 0) return serialize(items) as DestinationDTO[];

    const tripMatch: Record<string, unknown> = { status: "active" };
    if (!isIndiaCountry(countryCode)) tripMatch.country = { $ne: "India" };

    const fromTrips = await (await tenantModel(Trip)).aggregate([
      { $match: tripMatch },
      {
        $group: {
          _id: "$destination",
          basePrice: { $min: "$basePrice" },
          image: { $first: { $arrayElemAt: ["$images", 0] } },
          country: { $first: { $ifNull: ["$country", "India"] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return fromTrips.map((d) => ({
      _id: String(d._id),
      title: String(d._id),
      description: "",
      images: d.image ? [d.image] : [],
      basePrice: Number(d.basePrice) || 0,
      status: "active",
      featured: false,
      tags: [],
      popular: false,
      country: d.country || "India",
      countryCode: d.country === "India" ? "IN" : "INTL",
      createdAt: new Date().toISOString(),
    })) as DestinationDTO[];
  }, [] as DestinationDTO[]);
});

export async function getDestinations(countryCode?: string) {
  return getCachedDestinations(countryCode?.toUpperCase() || "IN");
}

export async function getHomeDestinations(countryCode?: string) {
  const items = await getDestinations(countryCode);

  return {
    domestic: isIndiaCountry(countryCode)
      ? items.filter((d) => d.countryCode.toUpperCase() === "IN")
      : [],
    international: items.filter((d) => d.countryCode.toUpperCase() !== "IN"),
  };
}

export async function getDestinationLanding(slug: string) {
  return safe(async () => {
    const destinationTitle = slug.replaceAll("-", " ");
    const destinationRecord = await (await tenantModel(Destination)).findOne({
      status: "active",
      title: new RegExp(`^${destinationTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    }).lean();
    const destinationName = destinationRecord?.title || slug.replaceAll("-", " ");
    const trips = await (await tenantModel(Trip)).find({ status: "active", destination: new RegExp(`^${destinationName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") })
      .sort({ featured: -1, rating: -1, createdAt: -1 })
      .lean();
    if (!destinationRecord && trips.length === 0) return null;
    const destination = destinationRecord
      ? serialize(destinationRecord) as DestinationDTO
      : { _id: destinationName, title: trips[0].destination, description: `Explore curated ${trips[0].destination} holiday packages and trips.`, images: trips[0].images, basePrice: Math.min(...trips.map((trip) => trip.basePrice)), status: "active" as const, featured: false, tags: [], popular: false, country: trips[0].country, countryCode: trips[0].country === "India" ? "IN" : "INTL", createdAt: new Date().toISOString() };
    return { destination, trips: serialize(trips) as TripDTO[] };
  }, null as { destination: DestinationDTO; trips: TripDTO[] } | null);
}

export async function getOfferCards(countryCode?: string, limit = 4) {
  return safe(async () => {
    const query: Record<string, unknown> = { status: "active" };
    if (!isIndiaCountry(countryCode)) query.countryCode = { $ne: "IN" };

    const items = await (await tenantModel(OfferCard)).find(query)
      .sort({ featured: -1, sortOrder: 1, createdAt: -1 })
      .limit(limit)
      .lean();

    return serialize(items) as OfferCardDTO[];
  }, [] as OfferCardDTO[]);
}

export interface TripFilters {
  q?: string;
  destination?: string;
  country?: string;
  category?: string;
  categories?: readonly string[];
  excludeCategories?: readonly string[];
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "rating";
  page?: number;
  pageSize?: number;
}

function buildTripQuery(filters: TripFilters, includeCategory = true) {
  const query: Record<string, unknown> = { status: "active" };
  if (filters.destination) query.destination = new RegExp(filters.destination, "i");
  if (filters.country) query.country = new RegExp(`^${filters.country}$`, "i");
  if (filters.categories?.length) {
    const categories = filters.categories.flatMap((category) => category === "Strangers" ? ["Strangers", "Solo"] : [category]);
    query.category = { $in: categories };
  } else if (filters.excludeCategories?.length) {
    const categories = filters.excludeCategories.flatMap((category) => category === "Strangers" ? ["Strangers", "Solo"] : [category]);
    query.category = { $nin: categories };
  }
  if (includeCategory && filters.category) {
    query.category = filters.category === "Group Trip"
      ? { $in: ["Group Trip", "Group"] }
      : filters.category === "Strangers"
        ? { $in: ["Strangers", "Solo"] }
        : filters.category;
  }
  if (filters.q) query.$text = { $search: filters.q };
  if (filters.startDate || filters.endDate) {
    const rangeStart = filters.startDate ? new Date(`${filters.startDate}T00:00:00.000Z`) : undefined;
    const rangeEnd = filters.endDate ? new Date(`${filters.endDate}T23:59:59.999Z`) : rangeStart;
    if (rangeStart && rangeEnd && !Number.isNaN(rangeStart.getTime()) && !Number.isNaN(rangeEnd.getTime())) {
      query.startDate = { $lte: rangeEnd };
      query.endDate = { $gte: rangeStart };
    }
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    query.basePrice = {
      ...(filters.minPrice != null ? { $gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { $lte: filters.maxPrice } : {}),
    };
  }
  return query;
}

export async function getTripCategoryCounts(filters: TripFilters = {}) {
  return safe(async () => {
    const rows = await (await tenantModel(Trip)).aggregate<{ _id: string; count: number }>([
      { $match: buildTripQuery(filters, false) },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const category = row._id === "Group" ? "Group Trip" : row._id;
      counts[category] = (counts[category] ?? 0) + row.count;
    }
    return counts;
  }, {} as Record<string, number>);
}

export async function getTrips(filters: TripFilters = {}) {
  const {
    q,
    destination,
    country,
    category,
    categories,
    excludeCategories,
    startDate,
    endDate,
    minPrice,
    maxPrice,
    sort = "newest",
    page = 1,
    pageSize = 9,
  } = filters;

  return safe(
    async () => {
      const query = buildTripQuery({ q, destination, country, category, categories, excludeCategories, startDate, endDate, minPrice, maxPrice });

      const sortMap: Record<string, Record<string, 1 | -1>> = {
        newest: { createdAt: -1 },
        "price-asc": { basePrice: 1 },
        "price-desc": { basePrice: -1 },
        rating: { rating: -1 },
      };

      const [items, total] = await Promise.all([
        (await tenantModel(Trip)).find(query)
          .sort(sortMap[sort])
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean(),
        (await tenantModel(Trip)).countDocuments(query),
      ]);

      return {
        items: serialize(items) as TripDTO[],
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    },
    { items: [], total: 0, page, pageSize, totalPages: 1 },
  );
}

const getCachedFeaturedTrips = (async (limit: number) => {
  return safe(async () => {
    const items = await (await tenantModel(Trip)).find({ status: "active", featured: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    // Fall back to newest active trips if nothing is flagged featured.
    if (items.length === 0) {
      const recent = await (await tenantModel(Trip)).find({ status: "active" })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      return serialize(recent) as TripDTO[];
    }
    return serialize(items) as TripDTO[];
  }, [] as TripDTO[]);
});

export async function getFeaturedTrips(limit = 6) {
  return getCachedFeaturedTrips(limit);
}

export async function getTripsByCategory(category: string, limit = 4) {
  return safe(async () => {
    const items = await (await tenantModel(Trip)).find({ status: "active", category })
      .sort({ startDate: 1 })
      .limit(limit)
      .lean();
    return serialize(items) as TripDTO[];
  }, [] as TripDTO[]);
}

export async function getTripBySlug(slug: string) {
  return safe(async () => {
    const trip = await (await tenantModel(Trip)).findOne({ slug, status: "active" }).lean();
    return trip ? (serialize(trip) as TripDTO) : null;
  }, null);
}

export async function getRelatedTrips(tripId: string, destination: string, limit = 3) {
  return safe(async () => {
    const items = await (await tenantModel(Trip)).find({
      _id: { $ne: tripId },
      status: "active",
      destination: new RegExp(`^${destination.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    })
      .limit(limit)
      .lean();
    return serialize(items) as TripDTO[];
  }, [] as TripDTO[]);
}

export async function getReviewsForTrip(tripId: string) {
  return safe(async () => {
    const reviews = await (await tenantModel(Review)).find({ trip: tripId, status: "published" })
      .populate({ path: "user", model: "User", select: "name image" })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return serialize(reviews) as ReviewDTO[];
  }, [] as ReviewDTO[]);
}

export async function getPartnerBySlug(slug: string) {
  return safe(async () => {
    const partner = await (await tenantModel(Partner)).findOne({ slug, status: "approved" })
      .populate({ path: "user", model: "User", select: "name image" })
      .lean();
    return partner ? (serialize(partner) as PartnerDTO) : null;
  }, null);
}

/** Resolve a white-label listing for /p/<partnerSlug>/<tripSlug>. */
export async function getWhiteLabelTrip(partnerSlug: string, tripSlug: string) {
  return safe(async () => {
    const pt = await (await tenantModel(PartnerTrip)).findOne({
      partnerSlug,
      tripSlug,
      active: true,
    })
      .populate({ path: "trip", model: "Trip", match: { status: "active" } })
      .populate({
        path: "partner",
        model: "Partner",
        populate: { path: "user", model: "User", select: "name image" },
      })
      .lean<{ trip: unknown; partner: unknown; commission: number; sellingPrice: number; active: boolean }>();

    if (!pt || !pt.partner || !pt.trip) return null;
    return serialize(pt) as unknown as {
      _id: string;
      trip: TripDTO;
      partner: PartnerDTO;
      commission: number;
      sellingPrice: number;
      active: boolean;
    };
  }, null);
}

/** Partner storefront for /p/<partnerSlug>, listing selected trips. */
export async function getPartnerStorefront(partnerSlug: string) {
  return safe(async () => {
    const partner = await (await tenantModel(Partner)).findOne({ slug: partnerSlug, status: "approved" })
      .populate({ path: "user", model: "User", select: "name image" })
      .lean();
    if (!partner) return null;

    const links = await (await tenantModel(PartnerTrip)).find({
      partner: partner._id,
      partnerSlug,
      active: true,
    })
      .sort({ createdAt: -1 })
      .populate({ path: "trip", model: "Trip", match: { status: "active" } })
      .lean();

    return {
      partner: serialize(partner) as PartnerDTO,
      links: (serialize(links) as Array<{
        _id: string;
        tripSlug: string;
        commission: number;
        sellingPrice: number;
        active: boolean;
        clicks: number;
        bookings: number;
        trip: TripDTO | null;
      }>).filter((link) => Boolean(link.trip)),
    };
  }, null);
}

/** Fire-and-forget click counter for white-label links. */
export async function trackPartnerTripClick(partnerSlug: string, tripSlug: string) {
  try {
    await connectDB();
    await (await tenantModel(PartnerTrip)).updateOne(
      { partnerSlug, tripSlug },
      { $inc: { clicks: 1 } },
    );
  } catch {
    /* non-critical */
  }
}

export async function getHomeStats() {
  return safe(
    async () => {
      const [trips, partners, bookings, travelers] = await Promise.all([
        (await tenantModel(Trip)).countDocuments({ status: "active" }),
        (await tenantModel(Partner)).countDocuments({ status: "approved" }),
        (await tenantModel(Booking)).countDocuments({ status: { $in: ["confirmed", "completed"] } }),
        (await tenantModel(User)).countDocuments({ role: "traveler" }),
      ]);
      return { trips, partners, bookings, travelers };
    },
    { trips: 0, partners: 0, bookings: 0, travelers: 0 },
  );
}
