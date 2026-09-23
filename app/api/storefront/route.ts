import { z } from "zod";
import * as data from "@/lib/data";
import * as dashboard from "@/lib/dashboard";
import { getAuthorizedBookingConfirmation } from "@/lib/booking-confirmation";
import { requireApiRole, handleError, ok, fail } from "@/lib/api";
import { tenantModel } from "@/lib/tenant-db";
import { getSettings } from "@/models/Settings";
import Quotation from "@/models/Quotation";
import Trip from "@/models/Trip";
import Destination from "@/models/Destination";
import Partner from "@/models/Partner";
import PartnerTrip from "@/models/PartnerTrip";

const text = z.string().max(250);
const limit = z.number().int().min(1).max(100).optional();
const filters = z.object({ q: text.optional(), destination: text.optional(), country: text.optional(), category: text.optional(), categories: z.array(text).max(20).optional(), excludeCategories: z.array(text).max(20).optional(), startDate: text.optional(), endDate: text.optional(), minPrice: z.number().nonnegative().optional(), maxPrice: z.number().nonnegative().optional(), sort: z.enum(["newest", "price-asc", "price-desc", "rating"]).optional(), page: z.number().int().min(1).max(10000).optional(), pageSize: limit }).optional();
const operations = {
  getActivityTypes: () => data.getActivityTypes(),
  getActivities: (args: unknown[]) => data.getActivities(z.tuple([z.object({ q: text.optional(), type: text.optional(), seasonal: z.boolean().optional(), bestSelling: z.boolean().optional(), limit }).optional()]).parse([args[0]])[0]),
  getActivityBySlug: (args: unknown[]) => data.getActivityBySlug(text.parse(args[0])),
  getDestinations: (args: unknown[]) => data.getDestinations(text.optional().parse(args[0])),
  getHomeDestinations: (args: unknown[]) => data.getHomeDestinations(text.optional().parse(args[0])),
  getDestinationLanding: (args: unknown[]) => data.getDestinationLanding(text.parse(args[0])),
  getOfferCards: (args: unknown[]) => data.getOfferCards(text.optional().parse(args[0]), limit.parse(args[1])),
  getTrips: (args: unknown[]) => data.getTrips(filters.parse(args[0])),
  getTripCategoryCounts: (args: unknown[]) => data.getTripCategoryCounts(filters.parse(args[0])),
  getFeaturedTrips: (args: unknown[]) => data.getFeaturedTrips(limit.parse(args[0])),
  getTripsByCategory: (args: unknown[]) => data.getTripsByCategory(text.parse(args[0]), limit.parse(args[1])),
  getTripBySlug: (args: unknown[]) => data.getTripBySlug(text.parse(args[0])),
  getRelatedTrips: (args: unknown[]) => data.getRelatedTrips(text.parse(args[0]), text.parse(args[1]), limit.parse(args[2])),
  getReviewsForTrip: (args: unknown[]) => data.getReviewsForTrip(text.parse(args[0])),
  getPartnerBySlug: (args: unknown[]) => data.getPartnerBySlug(text.parse(args[0])),
  getWhiteLabelTrip: (args: unknown[]) => data.getWhiteLabelTrip(text.parse(args[0]), text.parse(args[1])),
  getPartnerStorefront: (args: unknown[]) => data.getPartnerStorefront(text.parse(args[0])),
  trackPartnerTripClick: async (args: unknown[]) => { await data.trackPartnerTripClick(text.parse(args[0]), text.parse(args[1])); return null; },
  getHomeStats: () => data.getHomeStats(),
  getAuthorizedBookingConfirmation: (args: unknown[]) => getAuthorizedBookingConfirmation(text.parse(args[0]), text.optional().parse(args[1])),
  getQuotation: async (args: unknown[]) => (await tenantModel(Quotation)).findOne({ shareToken: z.string().min(16).max(200).parse(args[0]) }).lean(),
  getSitemapRecords: async () => {
    const [trips, destinations, partnerTrips, approvedPartners] = await Promise.all([
      (await tenantModel(Trip)).find({ status: "active" }).select("slug images updatedAt").lean(),
      (await tenantModel(Destination)).find({ status: "active" }).select("title images updatedAt").lean(),
      (await tenantModel(PartnerTrip)).find({ active: true }).select("partnerSlug tripSlug updatedAt").lean(),
      (await tenantModel(Partner)).find({ status: "approved" }).select("slug updatedAt").lean(),
    ]); return { trips, destinations, partnerTrips, approvedPartners };
  },
};
const partnerOperations = { getPartnerStats: dashboard.getPartnerStats, getPartnerEarningsChart: dashboard.getPartnerEarningsChart, getPartnerLinks: dashboard.getPartnerLinks, getPartnerBookings: dashboard.getPartnerBookings, getPartnerCommissions: dashboard.getPartnerCommissions, getResellableTrips: dashboard.getResellableTrips };
export async function POST(request: Request) {
  try {
    const { operation, args } = z.object({ operation: z.string(), args: z.array(z.unknown()).max(4).default([]).transform(values => values.map(value => value === null ? undefined : value)) }).parse(await request.json());
    if (Object.hasOwn(operations, operation)) return ok(await operations[operation as keyof typeof operations](args));
    if (operation === "getTravelerBookings" || operation === "getTravelerWishlist") {
      const user = await requireApiRole(["traveler"]);
      return ok(await dashboard[operation](user.id));
    }
    if (operation === "getPartnerByUser" || operation === "getSettings" || Object.hasOwn(partnerOperations, operation)) {
      const user = await requireApiRole(["partner"]);
      const partner = await dashboard.getPartnerByUser(user.id);
      if (!partner) return fail("Partner not found", 404);
      if (operation === "getPartnerByUser") return ok(partner);
      if (operation === "getSettings") return ok(await getSettings());
      return ok(await partnerOperations[operation as keyof typeof partnerOperations](String(partner._id)));
    }
    return fail("Unknown storefront operation", 404);
  } catch (e) { return handleError(e); }
}
