/** Shared enums & option lists used by models, forms and UI. */

export const ROLES = ["admin","vendor", "vendor_employee", "vendor_partner", "vendor_traveler"] as const;
export type Role = (typeof ROLES)[number];

export const PARTNER_TYPES = [
  "Travel Agency",
  "Travel Influencer",
  "Tour Promoter",
  "Community Leader",
  "Trip Coordinator",
] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];

export const PARTNER_STATUSES = ["pending", "approved", "suspended"] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export const TRIP_STATUSES = ["draft", "active", "inactive", "soldout"] as const;
export const DESTINATION_STATUSES = ["active", "inactive"] as const;
export const ACTIVITY_STATUSES = ["draft", "active", "inactive"] as const;
export const ACTIVITY_TYPE_STATUSES = ["active", "inactive"] as const;
export const ACTIVITY_BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;
export const OFFER_CARD_STATUSES = ["active", "inactive"] as const;
export const EMPLOYEE_STATUSES = ["active", "inactive"] as const;
export const SUPPLIER_STATUSES = ["active", "inactive"] as const;
export const SUPPLIER_TYPES = [
  "Hotel",
  "Transport",
  "Activity",
  "Restaurant",
  "Guide",
  "Visa",
  "Insurance",
  "Other",
] as const;
export const CAMPAIGN_STATUSES = ["draft", "scheduled", "active", "paused", "completed"] as const;
export const CAMPAIGN_CHANNELS = [
  "Email",
  "Social Media",
  "WhatsApp",
  "SMS",
  "Search Ads",
  "Display Ads",
  "Influencer",
  "Other",
] as const;
export const PAYROLL_STATUSES = ["draft", "processed", "paid"] as const;
export const QUOTATION_STATUSES = ["draft", "sent", "accepted", "rejected", "expired"] as const;
export const LEAD_STATUSES = ["new", "contacted", "qualified", "quoted", "won", "lost"] as const;
export const LEAD_SOURCES = ["Marketing Campaign", "Website", "WhatsApp", "Phone", "Referral", "Walk-in", "Other"] as const;
export const VISA_STATUSES = ["documents_pending", "documents_received", "submitted", "under_review", "approved", "rejected", "completed"] as const;
export const TICKET_TYPES = ["flight", "train", "bus", "cruise", "other"] as const;
export const TICKET_STATUSES = ["requested", "on_hold", "booked", "ticketed", "cancelled", "refunded"] as const;
export const HOTEL_RESERVATION_STATUSES = ["requested", "on_hold", "confirmed", "checked_in", "checked_out", "cancelled"] as const;
export const EXPENSE_STATUSES = ["pending", "approved", "paid", "cancelled"] as const;
export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"] as const;
export const REPUTATION_PLATFORMS = ["Google", "Tripadvisor", "Facebook", "Instagram", "Trustpilot", "Website", "Other"] as const;
export const REPUTATION_SENTIMENTS = ["positive", "neutral", "negative"] as const;
export const REPUTATION_STATUSES = ["new", "reviewing", "response_drafted", "responded", "escalated", "resolved"] as const;
export const ATTENDANCE_STATUSES = ["present", "absent", "late", "half_day", "work_from_home", "on_leave"] as const;
export const PERFORMANCE_STATUSES = ["draft", "in_review", "completed"] as const;
export const LEAVE_TYPES = ["annual", "sick", "casual", "unpaid", "maternity", "paternity", "other"] as const;
export const LEAVE_REQUEST_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export const HR_TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const HR_TASK_STATUSES = ["todo", "in_progress", "blocked", "completed", "cancelled"] as const;

export const ADMIN_PORTAL_PAGES = [
  { key: "dashboard", label: "Dashboard", href: "/admin" },
  { key: "lms", label: "Bookings & LMS", href: "/admin/lms" },
  { key: "hrm", label: "HRM", href: "/admin/hrm" },
  { key: "users", label: "Users", href: "/admin/users" },
  { key: "inventory", label: "Inventory", href: "/admin/inventory" },
  { key: "finance", label: "Finance", href: "/admin/finance" },
  { key: "reputation", label: "ORM", href: "/admin/reputation" },
  { key: "reports", label: "Reports", href: "/admin/reports" },
  { key: "campaigns", label: "Marketing Campaigns", href: "/admin/campaigns" },
  { key: "settings", label: "Settings", href: "/admin/settings" },
] as const;
export type AdminPortalPageKey = (typeof ADMIN_PORTAL_PAGES)[number]["key"];
export const ADMIN_PORTAL_PAGE_KEYS = ADMIN_PORTAL_PAGES.map((page) => page.key) as [AdminPortalPageKey, ...AdminPortalPageKey[]];

export function adminPortalPageKeyForPath(pathname: string) {
  const cleanPath = pathname.split("?")[0] || "/admin";
  const match = [...ADMIN_PORTAL_PAGES]
    .sort((a, b) => b.href.length - a.href.length)
    .find((page) => cleanPath === page.href || cleanPath.startsWith(`${page.href}/`));
  return match?.key ?? "dashboard";
}

export function suggestedEmployeePortalPages(designation: string) {
  const text = designation.toLowerCase();
  if (text.includes("finance") || text.includes("account")) return ["dashboard", "lms", "users", "finance", "reports"];
  if (text.includes("sales") || text.includes("booking")) return ["dashboard", "lms", "users"];
  if (text.includes("content") || text.includes("marketing")) return ["dashboard", "inventory", "campaigns", "reputation", "lms", "reports"];
  if (text.includes("operation") || text.includes("trip") || text.includes("package")) return ["dashboard", "inventory", "lms", "users"];
  if (text.includes("hr") || text.includes("human")) return ["dashboard", "hrm", "settings", "reports"];
  return ["dashboard"];
}
export type TripStatus = (typeof TRIP_STATUSES)[number];
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];
export type ActivityTypeStatus = (typeof ACTIVITY_TYPE_STATUSES)[number];
export type ActivityBookingStatus = (typeof ACTIVITY_BOOKING_STATUSES)[number];
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];
export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];
export type SupplierType = (typeof SUPPLIER_TYPES)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
export type CampaignChannel = (typeof CAMPAIGN_CHANNELS)[number];
export type PayrollStatus = (typeof PAYROLL_STATUSES)[number];
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadSource = (typeof LEAD_SOURCES)[number];
export type VisaStatus = (typeof VISA_STATUSES)[number];
export type TicketType = (typeof TICKET_TYPES)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type HotelReservationStatus = (typeof HOTEL_RESERVATION_STATUSES)[number];
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type ReputationPlatform = (typeof REPUTATION_PLATFORMS)[number];
export type ReputationSentiment = (typeof REPUTATION_SENTIMENTS)[number];
export type ReputationStatus = (typeof REPUTATION_STATUSES)[number];
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export type PerformanceStatus = (typeof PERFORMANCE_STATUSES)[number];
export type LeaveType = (typeof LEAVE_TYPES)[number];
export type LeaveRequestStatus = (typeof LEAVE_REQUEST_STATUSES)[number];
export type HrTaskPriority = (typeof HR_TASK_PRIORITIES)[number];
export type HrTaskStatus = (typeof HR_TASK_STATUSES)[number];

export const COUNTRY_OPTIONS = [
  { name: "India", code: "IN", currency: "INR", symbol: "₹" },
  { name: "United Arab Emirates", code: "AE", currency: "AED", symbol: "د.إ" },
  { name: "Indonesia", code: "ID", currency: "IDR", symbol: "Rp" },
  { name: "Maldives", code: "MV", currency: "MVR", symbol: "Rf" },
  { name: "Singapore", code: "SG", currency: "SGD", symbol: "S$" },
  { name: "Thailand", code: "TH", currency: "THB", symbol: "฿" },
  { name: "Malaysia", code: "MY", currency: "MYR", symbol: "RM" },
  { name: "Vietnam", code: "VN", currency: "VND", symbol: "₫" },
  { name: "Sri Lanka", code: "LK", currency: "LKR", symbol: "Rs" },
  { name: "Azerbaijan", code: "AZ", currency: "AZN", symbol: "₼" },
  { name: "Georgia", code: "GE", currency: "GEL", symbol: "₾" },
  { name: "Turkey", code: "TR", currency: "TRY", symbol: "₺" },
  { name: "Japan", code: "JP", currency: "JPY", symbol: "¥" },
  { name: "France", code: "FR", currency: "EUR", symbol: "€" },
] as const;
export type CountryOption = (typeof COUNTRY_OPTIONS)[number];

export const TRIP_CATEGORIES = [
  "Holiday Package",
  "Honeymoon",
  "Family",
  "Group Trip",
  "Strangers",
  "Wellness",
  "Spiritual",
  "Festival",
  "Golden Horizons (Senior Care)",
  "Limitless Access (Mobility Support)",
  "Bespoke Private Journeys",
] as const;
export type TripCategory = (typeof TRIP_CATEGORIES)[number];

export const VIBE_CIRCLE_TRIP_CATEGORIES = [
  "Strangers",
  "Golden Horizons (Senior Care)",
  "Limitless Access (Mobility Support)",
  "Bespoke Private Journeys",
] as const;

export const HOLIDAY_TRIP_CATEGORIES = TRIP_CATEGORIES.filter(
  (category) => !(VIBE_CIRCLE_TRIP_CATEGORIES as readonly string[]).includes(category),
);

/** Customer-facing label while preserving the legacy stored category value. */
export function tripThemeLabel(category?: string) {
  return category === "Strangers" || category === "Solo" ? "Travel Circles" : category ?? "";
}
export const PACKAGE_TYPES = ["Luxury","Premium", "Standard", "Budget-Friendly"] as const;
export type PackageType = (typeof PACKAGE_TYPES)[number];

export const PACKAGE_SERVICES = [
  "flights",
  "hotels",
  "sightseeing",
  "visa",
  "meals",
  "tour-manager",
  "transfers",
  "travel-insurance",
] as const;
export type PackageService = (typeof PACKAGE_SERVICES)[number];
export const PACKAGE_SERVICE_LABELS: Record<PackageService, string> = {
  flights: "Flights",
  hotels: "Hotels",
  sightseeing: "Sightseeing",
  visa: "Visa",
  meals: "Meals",
  "tour-manager": "Tour Manager",
  transfers: "Transfers",
  "travel-insurance": "Travel Insurance",
};

export const PACKAGE_INCLUSION_OPTIONS = [
  "🚍 AC Premium Transportation from Kochi and back",
  "🏨 1 Night Accommodation at a selected Munnar resort",
  "🍹 Welcome Drink on arrival",
  "🍽️ Day 1 Breakfast",
  "🍛 Day 1 Lunch",
  "🍽️ Day 1 Dinner",
  "🍳 Day 2 Breakfast",
  "🍛 Day 2 Lunch",
  "🌿 Munnar Sightseeing as per itinerary",
  "🎯 Voibee Ice-Breaking Activities",
  "🤝 Stranger-to-Friends Social Games",
  "🏆 Team Challenges & Fun Activities",
  "🔥 Campfire Evening subject to resort/weather conditions",
  "🎤 Antakshari / Open Mic / Group Activities",
  "📸 Group Photography & Trip Moments",
  "🎥 Reel & Photo Challenges",
  "🏅 Voibee Team Awards",
  "☕ Chai & Conversations Session",
  "🧑‍💼 Professional Trip Coordinator",
  "🩹 Basic First-Aid Support",
  "💧 Drinking Water during the trip",
  "🧳 Luggage Assistance/Handling at the resort, where provided by the property",
] as const;

export const PACKAGE_EXCLUSION_OPTIONS = [
  "Personal expenses",
  "Expenses incurred outside the itinerary",
  "Alcoholic beverages",
  "Cigarettes, tobacco or other personal consumables",
  "Room service",
  "Laundry",
  "Additional food or beverages outside the included meals",
  "Resort-paid activities or facilities not specifically mentioned",
  "Boating / adventure activities unless specifically mentioned as included",
  "Entry fees not specifically mentioned in the package",
  "Shopping expenses",
  "Personal photography/videography expenses",
  "Travel insurance",
  "Medical expenses and personal medication",
  "Any expenses arising due to weather, roadblocks, natural calamities or other circumstances beyond Voibee’s control",
  "Any additional transportation required due to personal reasons",
  "Anything not specifically mentioned under “Package Inclusions”",
] as const;

export const FIXED_DEPARTURE_TRIP_CATEGORIES = [
  "Holiday Package",
  "Strangers",
  "Festival",
] as const;

export const CUSTOM_DATE_TRIP_CATEGORIES = [
  "Honeymoon",
  "Family",
  "Group Trip",
  "Wellness",
  "Spiritual",
  "Golden Horizons (Senior Care)",
  "Limitless Access (Mobility Support)",
  "Bespoke Private Journeys",
] as const;

export function isFixedDepartureTripCategory(category?: string) {
  return (FIXED_DEPARTURE_TRIP_CATEGORIES as readonly string[]).includes(category ?? "");
}

export function isCustomDateTripCategory(category?: string) {
  return (CUSTOM_DATE_TRIP_CATEGORIES as readonly string[]).includes(category ?? "");
}

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "Advanced",
  "Paid",
  "cancelled",
  "completed",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "created",
  "processing",
  "paid",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const COMMISSION_STATUSES = ["pending", "payable", "paid"] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "registration",
  "booking",
  "payment",
  "reminder",
  "payout",
  "system",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Settings singleton defaults (platform fee is configurable). */
export const DEFAULT_SETTINGS = {
  defaultCommission: 1000, // suggested partner commission (INR)
  platformFeePercent: 0, // % of partner commission retained by platform
  platformFeeFlat: 0, // flat INR per booking retained by platform
  currency: "INR",
  minWithdrawal: 1000,
  quotationTerms: "",
  quotationPolicy: "",
  quotationImportantInformation: "",
  quotationOtherInformation: "",
};
