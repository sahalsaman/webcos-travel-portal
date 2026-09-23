import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { serialize } from "@/lib/utils";
import "@/models";
import Trip from "@/models/Trip";
import Partner from "@/models/Partner";
import PartnerTrip from "@/models/PartnerTrip";
import Booking from "@/models/Booking";
import User from "@/models/User";
import Commission from "@/models/Commission";
import Wishlist from "@/models/Wishlist";
import OfferCard from "@/models/OfferCard";
import Destination from "@/models/Destination";
import Payment from "@/models/Payment";
import Employee from "@/models/Employee";
import Supplier from "@/models/Supplier";
import Campaign from "@/models/Campaign";
import Payroll from "@/models/Payroll";
import Quotation from "@/models/Quotation";
import Lead from "@/models/Lead";
import VisaApplication from "@/models/VisaApplication";
import TicketTracking from "@/models/TicketTracking";
import HotelReservation from "@/models/HotelReservation";
import Expense from "@/models/Expense";
import Invoice from "@/models/Invoice";
import Reputation from "@/models/Reputation";
import Attendance from "@/models/Attendance"; import PerformanceReview from "@/models/PerformanceReview"; import LeaveRequest from "@/models/LeaveRequest"; import HrTask from "@/models/HrTask";
import AttendanceRegularization from "@/models/AttendanceRegularization";
import Activity from "@/models/Activity";
import ActivityType from "@/models/ActivityType";
import ActivityBooking from "@/models/ActivityBooking";
import type { UserDTO } from "@/types";
import { getCurrentUser } from "@/lib/session";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    await connectDB();
    return await fn();
  } catch (err) {
    console.error("[dashboard] query failed:", (err as Error).message);
    return fallback;
  }
}

async function hrEmployeeScope() {
  const user = await getCurrentUser();
  if (!user || user.role === "admin") return null;
  if (user.role !== "employee") return { _id: null };
  const employee = await (await tenantModel(Employee)).findOne({ user: user.id, status: "active", portalAccess: true })
    .select("_id hrAccess")
    .lean<{ _id: unknown; hrAccess?: "self" | "manage" }>();
  if (!employee) return { _id: null };
  return employee.hrAccess === "manage" ? null : { _id: employee._id };
}

async function hrRecordScope() {
  const employee = await hrEmployeeScope();
  if (!employee) return {};
  return { employee: employee._id };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Last `n` months as {key, label} from oldest to newest. */
function lastMonths(n: number) {
  const now = new Date();
  const arr: { y: number; m: number; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push({ y: d.getFullYear(), m: d.getMonth(), label: MONTHS[d.getMonth()] });
  }
  return arr;
}

/* ----------------------------- ADMIN ----------------------------- */

export async function getAdminStats() {
  return safe(
    async () => {
      const [destinations, activeDestinations, trips, activeTrips, bookings, partners, travelers, revenueAgg] =
        await Promise.all([
          (await tenantModel(Destination)).countDocuments({}),
          (await tenantModel(Destination)).countDocuments({ status: "active" }),
          (await tenantModel(Trip)).countDocuments({}),
          (await tenantModel(Trip)).countDocuments({ status: "active" }),
          (await tenantModel(Booking)).countDocuments({ paymentStatus: "paid" }),
          (await tenantModel(Partner)).countDocuments({}),
          (await tenantModel(User)).countDocuments({ role: "traveler" }),
          (await tenantModel(Booking)).aggregate([
            { $match: { paymentStatus: "paid" } },
            {
              $group: {
                _id: null,
                revenue: { $sum: "$totalAmount" },
                adminRevenue: { $sum: "$adminEarnings" },
              },
            },
          ]),
        ]);
      return {
        destinations,
        activeDestinations,
        trips,
        activeTrips,
        bookings,
        partners,
        travelers,
        revenue: revenueAgg[0]?.revenue ?? 0,
        adminRevenue: revenueAgg[0]?.adminRevenue ?? 0,
      };
    },
    {
      destinations: 0,
      activeDestinations: 0,
      trips: 0,
      activeTrips: 0,
      bookings: 0,
      partners: 0,
      travelers: 0,
      revenue: 0,
      adminRevenue: 0,
    },
  );
}

export async function getAdminCharts() {
  return safe(
    async () => {
      const months = lastMonths(6);
      const start = new Date(months[0].y, months[0].m, 1);

      const monthly = await (await tenantModel(Booking)).aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: start } } },
        {
          $group: {
            _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
            bookings: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]);

      const trend = months.map((mo) => {
        const found = monthly.find(
          (x) => x._id.y === mo.y && x._id.m === mo.m + 1,
        );
        return {
          month: mo.label,
          bookings: found?.bookings ?? 0,
          revenue: found?.revenue ?? 0,
        };
      });

      const topTrips = await (await tenantModel(Booking)).aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: "$trip", bookings: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } },
        { $sort: { bookings: -1 } },
        { $limit: 5 },
        { $lookup: { from: "trips", localField: "_id", foreignField: "_id", as: "trip" } },
        { $unwind: "$trip" },
        { $project: { name: "$trip.title", bookings: 1, revenue: 1 } },
      ]);

      const topPartners = await (await tenantModel(Partner)).find({})
        .sort({ totalEarnings: -1 })
        .limit(5)
        .select("businessName totalEarnings")
        .lean();

      return {
        trend,
        topTrips: serialize(topTrips),
        topPartners: serialize(topPartners).map((p: { businessName: string; totalEarnings: number }) => ({
          name: p.businessName,
          earnings: p.totalEarnings,
        })),
      };
    },
    { trend: [], topTrips: [], topPartners: [] },
  );
}

export async function getRecentBookings(limit = 8) {
  return safe(async () => {
    const bookings = await (await tenantModel(Booking)).find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: "trip", model: "Trip", select: "title destination" })
      .populate({ path: "traveler", model: "User", select: "name email" })
      .populate({ path: "partner", model: "Partner", select: "businessName" })
      .lean();
    return serialize(bookings);
  }, []);
}

export async function listAdminTrips() {
  return safe(async () => serialize(await (await tenantModel(Trip)).find({})
    .sort({ createdAt: -1 })
    .select("title slug destination country images featured category holidayPackage startDate endDate itinerary.day availableSeats totalSeats basePrice status")
    .lean()), []);
}

export async function listAdminBookableTrips() {
  return safe(
    async () =>
      serialize(
        await (await tenantModel(Trip)).find({ status: "active" })
          .sort({ startDate: 1, title: 1 })
          .select("title destination basePrice availableSeats totalSeats startDate status")
          .lean(),
      ),
    [],
  );
}

export async function getAdminTripById(id: string) {
  return safe(async () => {
    const trip = await (await tenantModel(Trip)).findById(id).lean();
    return trip ? serialize(trip) : null;
  }, null);
}

export async function listAdminOfferCards() {
  return safe(async () => serialize(await (await tenantModel(OfferCard)).find({}).sort({ sortOrder: 1, createdAt: -1 }).lean()), []);
}

export async function getAdminOfferCardById(id: string) {
  return safe(async () => {
    const offer = await (await tenantModel(OfferCard)).findById(id).lean();
    return offer ? serialize(offer) : null;
  }, null);
}

export async function listAdminDestinations() {
  return safe(async () => serialize(await (await tenantModel(Destination)).find({}).sort({ featured: -1, createdAt: -1 }).lean()), []);
}

export async function listAdminActivityTypes() {
  return safe(async () => serialize(await (await tenantModel(ActivityType)).find({}).sort({ sortOrder: 1, name: 1 }).lean()), []);
}

export async function listAdminActivities() {
  return safe(async () => serialize(await (await tenantModel(Activity)).find({}).sort({ createdAt: -1 }).populate({ path: "type", model: "ActivityType", select: "name slug" }).lean()), []);
}

export async function listAdminActivityBookings() {
  return safe(async () => serialize(await (await tenantModel(ActivityBooking)).find({}).sort({ createdAt: -1 }).populate({ path: "activity", model: "Activity", select: "title slug destination" }).lean()), []);
}

export async function getAdminDestinationById(id: string) {
  return safe(async () => {
    const destination = await (await tenantModel(Destination)).findById(id).lean();
    return destination ? serialize(destination) : null;
  }, null);
}

export async function listAdminTravelers() {
  return safe(async () => {
    const travelers = await (await tenantModel(User)).find({ role: "traveler" }).sort({ createdAt: -1 }).select("name email mobile image status createdAt").lean();
    const ids = travelers.map((traveler) => traveler._id);
    const bookingAgg = await (await tenantModel(Booking)).aggregate([
      { $match: { traveler: { $in: ids } } },
      {
        $group: {
          _id: "$traveler",
          bookingCount: { $sum: 1 },
          paidAmount: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0] } },
          lastBookingAt: { $max: "$createdAt" },
        },
      },
    ]);
    const bookings = await (await tenantModel(Booking)).find({ traveler: { $in: ids } })
      .sort({ createdAt: -1 })
      .populate({ path: "trip", model: "Trip", select: "title destination startDate" })
      .lean();
    const summaryByTraveler = new Map(bookingAgg.map((item) => [String(item._id), item]));
    const bookingsByTraveler = new Map<string, unknown[]>();
    for (const booking of serialize(bookings) as Array<Record<string, unknown>>) {
      const key = String(booking.traveler);
      bookingsByTraveler.set(key, [...(bookingsByTraveler.get(key) ?? []), booking]);
    }
    return serialize(travelers).map((traveler: Record<string, unknown>) => {
      const key = String(traveler._id);
      const summary = summaryByTraveler.get(key);
      return {
        ...traveler,
        bookingCount: summary?.bookingCount ?? 0,
        paidAmount: summary?.paidAmount ?? 0,
        lastBookingAt: summary?.lastBookingAt ?? null,
        bookings: bookingsByTraveler.get(key) ?? [],
      };
    }) as unknown as UserDTO[];
  }, []);
}

export async function getAdminFinanceSummary() {
  return safe(async () => {
    const [bookingAgg, paymentAgg, commissionAgg, recentPayments] = await Promise.all([
      (await tenantModel(Booking)).aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            paidRevenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0] } },
            adminEarnings: { $sum: "$adminEarnings" },
            partnerEarnings: { $sum: "$partnerEarnings" },
            bookings: { $sum: 1 },
          },
        },
      ]),
      (await tenantModel(Payment)).aggregate([
        {
          $group: {
            _id: "$status",
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      (await tenantModel(Commission)).aggregate([
        {
          $group: {
            _id: "$status",
            amount: { $sum: "$amount" },
            platformFee: { $sum: "$platformFee" },
            count: { $sum: 1 },
          },
        },
      ]),
      (await tenantModel(Payment)).find({})
        .sort({ createdAt: -1 })
        .limit(12)
        .populate({ path: "booking", model: "Booking", select: "bookingNumber travelerDetails totalAmount paymentStatus" })
        .lean(),
    ]);
    return {
      totals: bookingAgg[0] ?? { totalRevenue: 0, paidRevenue: 0, adminEarnings: 0, partnerEarnings: 0, bookings: 0 },
      paymentsByStatus: serialize(paymentAgg),
      commissionsByStatus: serialize(commissionAgg),
      recentPayments: serialize(recentPayments),
    };
  }, { totals: { totalRevenue: 0, paidRevenue: 0, adminEarnings: 0, partnerEarnings: 0, bookings: 0 }, paymentsByStatus: [], commissionsByStatus: [], recentPayments: [] });
}

export async function listAdminEarnings() {
  return safe(async () => serialize(await (await tenantModel(Booking)).find({ paymentStatus: "paid" })
    .sort({ createdAt: -1 })
    .populate({ path: "trip", model: "Trip", select: "title destination" })
    .populate({ path: "partner", model: "Partner", select: "businessName" })
    .select("bookingNumber trip partner travelerDetails totalAmount partnerEarnings adminEarnings createdAt")
    .lean()), []);
}

export async function listAdminEmployees() {
  return safe(async () => serialize(await (await tenantModel(Employee)).find((await hrEmployeeScope()) ?? {}).sort({ createdAt: -1 }).lean()), []);
}

export async function getAdminEmployeeById(id: string) {
  return safe(async () => {
    const employee = await (await tenantModel(Employee)).findById(id).lean();
    return employee ? serialize(employee) : null;
  }, null);
}

export async function listAdminBookings() {
  return safe(async () => {
    const bookings = await (await tenantModel(Booking)).find({})
      .sort({ createdAt: -1 })
      .populate({ path: "trip", model: "Trip", select: "title destination holidayPackage startDate endDate totalSeats availableSeats" })
      .populate({ path: "traveler", model: "User", select: "name email" })
      .populate({ path: "partner", model: "Partner", select: "businessName" })
      .lean();
    return serialize(bookings);
  }, []);
}

export async function listAdminPartners() {
  return safe(async () => {
    const partners = await (await tenantModel(Partner)).find({})
      .sort({ createdAt: -1 })
      .populate({ path: "user", model: "User", select: "name email" })
      .lean();
    return serialize(partners);
  }, []);
}

export async function listAdminSuppliers() {
  return safe(async () => {
    const suppliers = await (await tenantModel(Supplier)).find({}).sort({ companyName: 1, createdAt: -1 }).lean();
    return serialize(suppliers);
  }, []);
}

export async function getAdminSupplierById(id: string) {
  return safe(async () => {
    const supplier = await (await tenantModel(Supplier)).findById(id).lean();
    return supplier ? serialize(supplier) : null;
  }, null);
}

export async function listAdminCampaigns() {
  return safe(async () => {
    const campaigns = await (await tenantModel(Campaign)).find({}).sort({ startDate: -1, createdAt: -1 }).lean();
    const counts = await (await tenantModel(Lead)).aggregate([{ $match: { campaign: { $ne: null } } }, { $group: { _id: "$campaign", count: { $sum: 1 } } }]);
    const countMap = new Map(counts.map((item) => [String(item._id), item.count]));
    return serialize(campaigns).map((campaign: Record<string, unknown>) => ({ ...campaign, leadCount: countMap.get(String(campaign._id)) ?? 0 }));
  }, []);
}

export async function listAdminPayroll() {
  return safe(async () => {
    const payroll = await (await tenantModel(Payroll)).find(await hrRecordScope())
      .sort({ month: -1, createdAt: -1 })
      .populate({ path: "employee", model: "Employee", select: "name email designation department" })
      .lean();
    return serialize(payroll);
  }, []);
}

export async function listAdminQuotations() {
  return safe(async () => {
    const quotations = await (await tenantModel(Quotation)).find({}).sort({ createdAt: -1 })
      .populate({ path: "lead", model: "Lead", select: "leadNumber customerName" })
      .populate({ path: "customer", model: "User", select: "name email mobile" })
      .populate({ path: "trip", model: "Trip", select: "title destination basePrice" })
      .lean();
    return serialize(quotations);
  }, []);
}

export async function listAdminLeads(campaignId?: string) {
  return safe(async () => serialize(await (await tenantModel(Lead)).find(campaignId ? { campaign: campaignId } : {})
    .sort({ createdAt: -1 })
    .populate({ path: "campaign", model: "Campaign", select: "name channel" })
    .populate({ path: "quotation", model: "Quotation", select: "quotationNumber status totalAmount" })
    .lean()), []);
}

export async function listAdminVisas() {
  return safe(async () => serialize(await (await tenantModel(VisaApplication)).find({}).sort({ createdAt: -1 }).populate("lead", "leadNumber customerName").populate("customer", "name email mobile").lean()), []);
}
export async function listAdminTickets() { return safe(async()=>serialize(await (await tenantModel(TicketTracking)).find({}).sort({departureAt:1,createdAt:-1}).populate("lead","leadNumber customerName").populate("customer","name email mobile").lean()),[]); }
export async function listAdminHotelReservations() { return safe(async()=>serialize(await (await tenantModel(HotelReservation)).find({}).sort({checkIn:1,createdAt:-1}).populate("lead","leadNumber customerName").populate("customer","name email mobile").lean()),[]); }

export async function listAdminExpenses() { return safe(async () => serialize(await (await tenantModel(Expense)).find({}).sort({ expenseDate: -1, createdAt: -1 }).lean()), []); }
export async function listAdminInvoices() { return safe(async () => serialize(await (await tenantModel(Invoice)).find({}).sort({ issueDate: -1, createdAt: -1 }).lean()), []); }
export async function listAdminReputation() { return safe(async () => serialize(await (await tenantModel(Reputation)).find({}).sort({ reviewedAt: -1, createdAt: -1 }).lean()), []); }
export async function getAdminReputationSummary() { return safe(async () => { const [total, unresolved, negative, ratings] = await Promise.all([(await tenantModel(Reputation)).countDocuments({}), (await tenantModel(Reputation)).countDocuments({ status: { $nin: ["responded", "resolved"] } }), (await tenantModel(Reputation)).countDocuments({ sentiment: "negative", status: { $ne: "resolved" } }), (await tenantModel(Reputation)).aggregate([{ $group: { _id: null, average: { $avg: "$rating" } } }])]); return { total, unresolved, negative, averageRating: Number((ratings[0]?.average ?? 0).toFixed(1)) }; }, { total: 0, unresolved: 0, negative: 0, averageRating: 0 }); }
const employeePopulate={path:"employee",model:"Employee",select:"name email designation department"};
export async function listAdminAttendance(){return safe(async()=>serialize(await (await tenantModel(Attendance)).find(await hrRecordScope()).sort({date:-1}).populate(employeePopulate).lean()),[])}
export async function listAttendanceRegularizations(){return safe(async()=>serialize(await (await tenantModel(AttendanceRegularization)).find(await hrRecordScope()).sort({createdAt:-1}).populate(employeePopulate).lean()),[])}
export async function listAdminPerformanceReviews(){return safe(async()=>serialize(await (await tenantModel(PerformanceReview)).find(await hrRecordScope()).sort({createdAt:-1}).populate(employeePopulate).lean()),[])}
export async function listAdminLeaveRequests(){return safe(async()=>serialize(await (await tenantModel(LeaveRequest)).find(await hrRecordScope()).sort({startDate:-1}).populate(employeePopulate).lean()),[])}
export async function listAdminHrTasks(){return safe(async()=>serialize(await (await tenantModel(HrTask)).find(await hrRecordScope()).sort({dueDate:1}).populate(employeePopulate).lean()),[])}

/* ----------------------------- PARTNER ----------------------------- */

export async function getPartnerByUser(userId: string) {
  return safe(async () => {
    const partner = await (await tenantModel(Partner)).findOne({ user: userId })
      .populate({ path: "user", model: "User", select: "name email image" })
      .lean();
    return partner ? serialize(partner) : null;
  }, null);
}

export async function getPartnerStats(partnerId: string) {
  return safe(
    async () => {
      const [bookings, links, clicksAgg, partner] = await Promise.all([
        (await tenantModel(Booking)).countDocuments({ partner: partnerId, paymentStatus: "paid" }),
        (await tenantModel(PartnerTrip)).countDocuments({ partner: partnerId, active: true }),
        (await tenantModel(PartnerTrip)).aggregate([
          { $match: { partner: (await (await tenantModel(Partner)).findById(partnerId))?._id } },
          { $group: { _id: null, clicks: { $sum: "$clicks" }, bookings: { $sum: "$bookings" } } },
        ]),
        (await tenantModel(Partner)).findById(partnerId).select("totalEarnings pendingEarnings paidEarnings").lean<{
          totalEarnings: number;
          pendingEarnings: number;
          paidEarnings: number;
        }>(),
      ]);
      const clicks = clicksAgg[0]?.clicks ?? 0;
      const conversion = clicks > 0 ? Math.round((bookings / clicks) * 100) : 0;
      return {
        bookings,
        activeLinks: links,
        clicks,
        conversion,
        totalEarnings: partner?.totalEarnings ?? 0,
        pendingEarnings: partner?.pendingEarnings ?? 0,
        paidEarnings: partner?.paidEarnings ?? 0,
      };
    },
    {
      bookings: 0,
      activeLinks: 0,
      clicks: 0,
      conversion: 0,
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
    },
  );
}

export async function getPartnerEarningsChart(partnerId: string) {
  return safe(async () => {
    const months = lastMonths(6);
    const start = new Date(months[0].y, months[0].m, 1);
    const monthly = await (await tenantModel(Commission)).aggregate([
      { $match: { partner: (await (await tenantModel(Partner)).findById(partnerId))?._id, createdAt: { $gte: start } } },
      {
        $group: {
          _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
          earnings: { $sum: "$amount" },
        },
      },
    ]);
    return months.map((mo) => ({
      month: mo.label,
      earnings: monthly.find((x) => x._id.y === mo.y && x._id.m === mo.m + 1)?.earnings ?? 0,
    }));
  }, []);
}

export async function getPartnerLinks(partnerId: string) {
  return safe(async () => {
    const links = await (await tenantModel(PartnerTrip)).find({ partner: partnerId })
      .sort({ createdAt: -1 })
      .populate({ path: "trip", model: "Trip", select: "title destination basePrice images slug status" })
      .lean();
    return serialize(links);
  }, []);
}

export async function getPartnerBookings(partnerId: string) {
  return safe(async () => {
    const bookings = await (await tenantModel(Booking)).find({ partner: partnerId })
      .sort({ createdAt: -1 })
      .populate({ path: "trip", model: "Trip", select: "title destination" })
      .populate({ path: "traveler", model: "User", select: "name email" })
      .lean();
    return serialize(bookings);
  }, []);
}

export async function getPartnerCommissions(partnerId: string) {
  return safe(async () => {
    const rows = await (await tenantModel(Commission)).find({ partner: partnerId })
      .sort({ createdAt: -1 })
      .populate({ path: "trip", model: "Trip", select: "title" })
      .populate({ path: "booking", model: "Booking", select: "bookingNumber" })
      .lean();
    return serialize(rows);
  }, []);
}

/** Active packages a partner can resell, annotated with whether a link exists. */
export async function getResellableTrips(partnerId: string) {
  return safe(async () => {
    const [trips, existing] = await Promise.all([
      (await tenantModel(Trip)).find({ status: "active" }).sort({ createdAt: -1 }).lean(),
      (await tenantModel(PartnerTrip)).find({ partner: partnerId }).select("trip commission").lean(),
    ]);
    const map = new Map(existing.map((e) => [String(e.trip), e.commission]));
    return serialize(trips).map((t: { _id: string }) => ({
      ...t,
      existingCommission: map.has(String(t._id)) ? map.get(String(t._id)) : null,
    }));
  }, []);
}

/* ----------------------------- TRAVELER ----------------------------- */

export async function getTravelerBookings(userId: string) {
  return safe(async () => {
    const bookings = await (await tenantModel(Booking)).find({ traveler: userId })
      .sort({ createdAt: -1 })
      .populate({ path: "trip", model: "Trip", select: "title destination images slug startDate endDate" })
      .lean();
    return serialize(bookings);
  }, []);
}

export async function getTravelerWishlist(userId: string) {
  return safe(async () => {
    const wl = await (await tenantModel(Wishlist)).findOne({ user: userId })
      .populate({ path: "trips", model: "Trip" })
      .lean<{ trips: unknown[] }>();
    return wl ? serialize(wl.trips) : [];
  }, []);
}
