import { z } from "zod";
import {
  TRIP_CATEGORIES, PACKAGE_TYPES,
  PACKAGE_SERVICES,
  TRIP_STATUSES,
  OFFER_CARD_STATUSES,
  BOOKING_STATUSES,
  SUPPLIER_STATUSES,
  SUPPLIER_TYPES,
  CAMPAIGN_STATUSES,
  CAMPAIGN_CHANNELS,
  PAYROLL_STATUSES,
  QUOTATION_STATUSES,
  PAYMENT_STATUSES,
  PARTNER_TYPES,
  DESTINATION_STATUSES,
  ACTIVITY_STATUSES,
  ACTIVITY_TYPE_STATUSES,
  EMPLOYEE_STATUSES,
  ADMIN_PORTAL_PAGE_KEYS,
  LEAD_SOURCES,
  LEAD_STATUSES,
  VISA_STATUSES,
  TICKET_TYPES, TICKET_STATUSES, HOTEL_RESERVATION_STATUSES,
  EXPENSE_STATUSES,
  INVOICE_STATUSES,
  REPUTATION_PLATFORMS,
  REPUTATION_SENTIMENTS,
  REPUTATION_STATUSES,
  ATTENDANCE_STATUSES, PERFORMANCE_STATUSES, LEAVE_TYPES, LEAVE_REQUEST_STATUSES, HR_TASK_PRIORITIES, HR_TASK_STATUSES,
} from "@/lib/constants";

const mobile = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const travelerRegisterSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  mobile,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const partnerRegisterSchema = travelerRegisterSchema.extend({
  businessName: z.string().trim().min(2, "Business name is required"),
  partnerType: z.enum(PARTNER_TYPES).optional(),
  profileImage: z.string().url().optional().or(z.literal("")),
  socialLinks: z
    .array(z.object({ label: z.string(), url: z.string().url() }))
    .optional(),
});

export const adminPartnerInviteSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  mobile,
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessName: z.string().trim().min(2, "Business name is required"),
  partnerType: z.enum(PARTNER_TYPES).default("Travel Agency"),
  status: z.enum(["pending", "approved"]).default("approved"),
  defaultCommission: z.number().nonnegative().default(1000),
});

export const adminTravelerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  mobile,
});

const tripBaseSchema = z.object({
  title: z.string().trim().min(3),
  destination: z.string().trim().min(2),
  country: z.string().trim().default("India"),
  visaRequired: z.boolean().default(false),
  visaNote: z.string().trim().default(""),
  visaDocuments: z.array(z.string().trim().min(2)).default([]),
  visaFee: z.number().nonnegative().default(0),
  permitRequired: z.boolean().default(false),
  permitNote: z.string().trim().default(""),
  permitDocuments: z.array(z.string().trim().min(2)).default([]),
  permitFee: z.number().nonnegative().default(0),
  description: z.string().default(""),
  images: z.array(z.string()).default([]),
  itinerary: z
    .array(
      z.object({
        day: z.number().int().positive(),
        title: z.string(),
        description: z.string().default(""),
        transports: z.array(z.object({ title: z.string().trim().min(1), description: z.string().default("") })).default([]),
        hotels: z.array(z.object({ name: z.string().trim().min(1), description: z.string().default(""), image: z.string().default(""), verified: z.boolean().default(true) })).default([]),
        meals: z.array(z.enum(["breakfast", "lunch", "dinner"])).default([]),
        sightseeing: z.array(z.object({ name: z.string().trim().min(1), description: z.string().default(""), image: z.string().default("") })).default([]),
      }),
    )
    .default([]),
  inclusions: z.array(z.string()).default([]),
  includedServices: z.array(z.enum(PACKAGE_SERVICES)).default([]),
  exclusions: z.array(z.string()).default([]),
  holidayPackage: z.boolean().default(true),
  basePrice: z.number().nonnegative(),
  durationDays: z.number().int().positive().default(1),
  totalSeats: z.number().int().nonnegative().default(0),
  availableSeats: z.number().int().nonnegative().default(0),
  startDate: z.string(),
  endDate: z.string(),
  pickupLocation: z.string().default(""),
  departureCities: z.array(z.string().trim().min(2)).default([]),
  category: z.enum(TRIP_CATEGORIES).default("Holiday Package"),
  packageType: z.enum(PACKAGE_TYPES).default("Standard"),
  status: z.enum(TRIP_STATUSES).default("draft"),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

function validateTravelRequirements(data:{visaRequired?:boolean;visaNote?:string;visaDocuments?:string[];permitRequired?:boolean;permitNote?:string;permitDocuments?:string[]},ctx:z.RefinementCtx){if(data.visaRequired){if(!data.visaNote)ctx.addIssue({code:"custom",path:["visaNote"],message:"Add the traveler visa note"});if(!data.visaDocuments?.length)ctx.addIssue({code:"custom",path:["visaDocuments"],message:"Add at least one required visa document"})}if(data.permitRequired){if(!data.permitNote)ctx.addIssue({code:"custom",path:["permitNote"],message:"Add the traveler permit note"});if(!data.permitDocuments?.length)ctx.addIssue({code:"custom",path:["permitDocuments"],message:"Add at least one required permit document"})}}

export const tripSchema=tripBaseSchema.superRefine(validateTravelRequirements);
export const tripUpdateSchema=tripBaseSchema.partial().superRefine(validateTravelRequirements);

export const destinationSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().default(""),
  images: z.array(z.string()).default([]),
  basePrice: z.number().nonnegative().default(0),
  status: z.enum(DESTINATION_STATUSES).default("active"),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  popular: z.boolean().default(false),
  country: z.string().trim().default("India"),
  countryCode: z.string().trim().length(2).default("IN"),
});

export const activityTypeSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  description: z.string().default(""),
  image: z.string().default(""),
  status: z.enum(ACTIVITY_TYPE_STATUSES).default("active"),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const activitySchema = z.object({
  title: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  type: z.string().trim().min(1),
  destination: z.string().trim().min(2),
  country: z.string().trim().default("India"),
  shortDescription: z.string().default(""),
  description: z.string().default(""),
  images: z.array(z.string()).default([]),
  basePrice: z.number().nonnegative(),
  originalPrice: z.number().nonnegative().default(0),
  duration: z.string().default(""),
  highlights: z.array(z.string()).default([]),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  importantInfo: z.array(z.string()).default([]),
  meetingPoint: z.string().default(""),
  seasonal: z.boolean().default(false),
  bestSelling: z.boolean().default(false),
  featured: z.boolean().default(false),
  status: z.enum(ACTIVITY_STATUSES).default("draft"),
});

export const activityBookingSchema = z.object({
  activityId: z.string().trim().min(1),
  name: z.string().trim().min(2),
  email: z.string().email(),
  mobile: z.string().trim().min(6),
  activityDate: z.string().trim().min(1),
  timeSlot: z.string().default(""),
  adults: z.number().int().nonnegative().default(1),
  children: z.number().int().nonnegative().default(0),
  notes: z.string().default(""),
}).refine((data) => data.adults + data.children > 0, { path: ["adults"], message: "Add at least one guest" });

const employeeFieldsSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  mobile: z.string().trim().optional().or(z.literal("")),
  designation: z.string().trim().min(2),
  department: z.string().trim().default("Operations"),
  status: z.enum(EMPLOYEE_STATUSES).default("active"),
  salary: z.number().nonnegative().default(0),
  joinedAt: z.string().optional().or(z.literal("")),
  portalAccess: z.boolean().default(false),
  portalPassword: z.string().optional().or(z.literal("")),
  portalPages: z.array(z.enum(ADMIN_PORTAL_PAGE_KEYS)).default([]),
  hrAccess: z.enum(["self", "manage"]).default("self"),
  notes: z.string().default(""),
});

export const employeeSchema = employeeFieldsSchema.superRefine((data, ctx) => {
  if (data.portalAccess && data.portalPages.length === 0) {
    ctx.addIssue({ code: "custom", path: ["portalPages"], message: "Select at least one portal page" });
  }
  if (data.portalPassword && data.portalPassword.length < 6) {
    ctx.addIssue({ code: "custom", path: ["portalPassword"], message: "Password must be at least 6 characters" });
  }
});

export const employeeUpdateSchema = employeeFieldsSchema.partial().superRefine((data, ctx) => {
  if (data.portalAccess === true && data.portalPages?.length === 0) {
    ctx.addIssue({ code: "custom", path: ["portalPages"], message: "Select at least one portal page" });
  }
  if (data.portalPassword && data.portalPassword.length < 6) {
    ctx.addIssue({ code: "custom", path: ["portalPassword"], message: "Password must be at least 6 characters" });
  }
});

export const offerCardSchema = z.object({
  title: z.string().trim().min(2),
  description: z.string().default(""),
  images: z.array(z.string()).default([]),
  href: z.string().trim().min(1).default("/packages"),
  ctaLabel: z.string().trim().default("View packages"),
  priceLabel: z.string().trim().default(""),
  status: z.enum(OFFER_CARD_STATUSES).default("active"),
  featured: z.boolean().default(false),
  sortOrder: z.number().default(0),
  tags: z.array(z.string()).default([]),
  country: z.string().trim().default("India"),
  countryCode: z.string().trim().length(2).default("IN"),
});

export const whiteLabelSchema = z.object({
  tripId: z.string().min(1),
  commission: z.number().nonnegative(),
});

export const adminManualBookingSchema = z.object({
  tripId: z.string().min(1),
  seats: z.number().int().positive().max(50),
  status: z.enum(BOOKING_STATUSES).default("confirmed"),
  paymentStatus: z.enum(PAYMENT_STATUSES).default("paid"),
  travelerDetails: z.object({
    name: z.string().trim().min(2),
    email: z.string().email(),
    mobile,
    travellers: z.number().int().positive().default(1),
    notes: z.string().optional(),
  }),
});

export const adminBookingTravelerSchema = z.object({
  totalAmount: z.number().nonnegative(),
  travelerDetails: z.object({
    name: z.string().trim().min(2),
    email: z.string().email(),
    mobile,
    travellers: z.number().int().positive().default(1),
    notes: z.string().optional(),
  }),
});

export const supplierSchema = z.object({
  companyName: z.string().trim().min(2),
  contactName: z.string().trim().default(""),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().min(7),
  type: z.enum(SUPPLIER_TYPES),
  status: z.enum(SUPPLIER_STATUSES).default("active"),
  country: z.string().trim().min(2),
  countryCode: z.string().trim().length(2),
  city: z.string().trim().default(""),
  address: z.string().trim().default(""),
  taxId: z.string().trim().default(""),
  commissionRate: z.number().min(0).max(100).default(0),
  notes: z.string().trim().default(""),
});

export const campaignSchema = z.object({
  name: z.string().trim().min(2),
  channel: z.enum(CAMPAIGN_CHANNELS),
  status: z.enum(CAMPAIGN_STATUSES).default("draft"),
  targetAudience: z.string().trim().min(2),
  budget: z.number().nonnegative(),
  spent: z.number().nonnegative().default(0),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().optional().or(z.literal("")),
  owner: z.string().trim().default(""),
  description: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export const payrollSchema = z.object({
  employeeId: z.string().trim().min(1),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  basicSalary: z.number().nonnegative(),
  allowances: z.number().nonnegative().default(0),
  deductions: z.number().nonnegative().default(0),
  status: z.enum(PAYROLL_STATUSES).default("draft"),
  paymentDate: z.string().trim().optional().or(z.literal("")),
  paymentReference: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export const quotationSchema = z.object({
  leadId: z.string().trim().optional().or(z.literal("")),
  customerId: z.string().trim().optional().or(z.literal("")),
  itineraryId: z.string().trim().optional().or(z.literal("")),
  customItinerary: z.array(z.object({ day: z.number().int().positive(), title: z.string().trim().min(1), description: z.string().trim().default("") })).default([]),
  customerName: z.string().trim().default(""),
  customerEmail: z.string().trim().email().optional().or(z.literal("")),
  customerPhone: z.string().trim().default(""),
  title: z.string().trim().min(2),
  items: z.array(z.object({
    description: z.string().trim().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
  })).min(1),
  discount: z.number().nonnegative().default(0),
  taxRate: z.number().min(0).max(100).default(0),
  validUntil: z.string().trim().min(1),
  status: z.enum(QUOTATION_STATUSES).default("draft"),
  notes: z.string().trim().default(""),
  terms: z.string().trim().default(""),
  policy: z.string().trim().default(""),
  importantInformation: z.string().trim().default(""),
  otherInformation: z.string().trim().default(""),
}).refine((data) => Boolean(data.leadId || data.customerId), { path: ["customerId"], message: "Select a customer or lead" });

export const leadSchema = z.object({
  customerName: z.string().trim().min(2),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().min(7),
  destination: z.string().trim().default(""),
  travelDate: z.string().trim().optional().or(z.literal("")),
  travelers: z.number().int().positive().default(1),
  budget: z.number().nonnegative().default(0),
  source: z.enum(LEAD_SOURCES),
  status: z.enum(LEAD_STATUSES).default("new"),
  campaignId: z.string().trim().optional().or(z.literal("")),
  assignedTo: z.string().trim().default(""),
  notes: z.string().trim().default(""),
}).superRefine((data, ctx) => {
  if (data.source === "Marketing Campaign" && !data.campaignId) {
    ctx.addIssue({ code: "custom", path: ["campaignId"], message: "Select the source campaign" });
  }
});

export const visaSchema = z.object({
  leadId: z.string().trim().optional().or(z.literal("")),
  customerId: z.string().trim().optional().or(z.literal("")),
  passportNumber: z.string().trim().min(4),
  destinationCountry: z.string().trim().min(2),
  visaType: z.string().trim().min(2),
  status: z.enum(VISA_STATUSES).default("documents_pending"),
  submittedAt: z.string().trim().optional().or(z.literal("")),
  expectedAt: z.string().trim().optional().or(z.literal("")),
  completedAt: z.string().trim().optional().or(z.literal("")),
  bookingNumber: z.string().trim().default(""),
  assignedTo: z.string().trim().default(""),
  notes: z.string().trim().default(""),
}).refine((data) => Boolean(data.leadId || data.customerId), { path: ["customerId"], message: "Select a customer or lead" });

export const ticketTrackingSchema = z.object({ leadId:z.string().trim().optional().or(z.literal("")), customerId:z.string().trim().optional().or(z.literal("")), ticketType:z.enum(TICKET_TYPES), provider:z.string().trim().min(2), referenceNumber:z.string().trim().default(""), origin:z.string().trim().min(2), destination:z.string().trim().min(2), departureAt:z.string().trim().min(1), arrivalAt:z.string().trim().optional().or(z.literal("")), travelers:z.number().int().positive().default(1), amount:z.number().nonnegative().default(0), status:z.enum(TICKET_STATUSES).default("requested"), assignedTo:z.string().trim().default(""), notes:z.string().trim().default("") }).refine((data)=>Boolean(data.leadId||data.customerId),{path:["customerId"],message:"Select a customer or lead"});
export const hotelReservationSchema = z.object({ leadId:z.string().trim().optional().or(z.literal("")), customerId:z.string().trim().optional().or(z.literal("")), hotelName:z.string().trim().min(2), destination:z.string().trim().min(2), confirmationNumber:z.string().trim().default(""), checkIn:z.string().trim().min(1), checkOut:z.string().trim().min(1), rooms:z.number().int().positive().default(1), guests:z.number().int().positive().default(1), roomType:z.string().trim().default(""), mealPlan:z.string().trim().default(""), amount:z.number().nonnegative().default(0), status:z.enum(HOTEL_RESERVATION_STATUSES).default("requested"), assignedTo:z.string().trim().default(""), notes:z.string().trim().default("") }).refine((data)=>Boolean(data.leadId||data.customerId),{path:["customerId"],message:"Select a customer or lead"}).refine((data)=>new Date(data.checkOut)>new Date(data.checkIn),{path:["checkOut"],message:"Check-out must be after check-in"});

export const expenseSchema = z.object({
  title: z.string().trim().min(2),
  category: z.string().trim().min(2),
  vendor: z.string().trim().default(""),
  amount: z.number().positive(),
  expenseDate: z.string().trim().min(1),
  status: z.enum(EXPENSE_STATUSES).default("pending"),
  paymentReference: z.string().trim().default(""),
  notes: z.string().trim().default(""),
});

export const invoiceSchema = z.object({
  customerName: z.string().trim().min(2),
  customerEmail: z.string().trim().email().optional().or(z.literal("")),
  customerPhone: z.string().trim().default(""),
  description: z.string().trim().min(2),
  amount: z.number().positive(),
  issueDate: z.string().trim().min(1),
  dueDate: z.string().trim().min(1),
  status: z.enum(INVOICE_STATUSES).default("draft"),
  bookingNumber: z.string().trim().default(""),
  notes: z.string().trim().default(""),
}).superRefine((data, ctx) => {
  if (data.issueDate && data.dueDate && data.dueDate < data.issueDate) {
    ctx.addIssue({ code: "custom", path: ["dueDate"], message: "Due date cannot be before issue date" });
  }
});

export const reputationSchema = z.object({
  platform: z.enum(REPUTATION_PLATFORMS), reviewerName: z.string().trim().min(2), rating: z.number().min(1).max(5),
  reviewText: z.string().trim().min(2), reviewUrl: z.string().trim().url().optional().or(z.literal("")),
  sentiment: z.enum(REPUTATION_SENTIMENTS), status: z.enum(REPUTATION_STATUSES).default("new"), assignedTo: z.string().trim().default(""),
  responseText: z.string().trim().default(""), reviewedAt: z.string().trim().min(1), respondedAt: z.string().trim().optional().or(z.literal("")), notes: z.string().trim().default(""),
});
export const attendanceSchema=z.object({employeeId:z.string().min(1),date:z.string().min(1),status:z.enum(ATTENDANCE_STATUSES),checkIn:z.string().default(""),checkOut:z.string().default(""),workHours:z.number().min(0).max(24).default(0),notes:z.string().trim().default("")});
const attendanceTime=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/,"Use a valid time");
export const attendanceRegularizationSchema=z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/,"Use a valid date"),requestedCheckIn:attendanceTime,requestedCheckOut:attendanceTime,reason:z.string().trim().min(5,"Please provide a reason").max(500)});
export const performanceReviewSchema=z.object({employeeId:z.string().min(1),period:z.string().trim().min(2),score:z.number().min(1).max(5),goals:z.string().trim().default(""),achievements:z.string().trim().default(""),feedback:z.string().trim().min(2),reviewer:z.string().trim().default(""),status:z.enum(PERFORMANCE_STATUSES)});
export const leaveRequestSchema=z.object({employeeId:z.string().min(1),type:z.enum(LEAVE_TYPES),startDate:z.string().min(1),endDate:z.string().min(1),days:z.number().min(.5),status:z.enum(LEAVE_REQUEST_STATUSES),reason:z.string().trim().min(2),adminNotes:z.string().trim().default("")}).refine(x=>x.endDate>=x.startDate,{path:["endDate"],message:"End date cannot be before start date"});
export const hrTaskSchema=z.object({employeeId:z.string().min(1),title:z.string().trim().min(2),description:z.string().trim().default(""),dueDate:z.string().min(1),priority:z.enum(HR_TASK_PRIORITIES),status:z.enum(HR_TASK_STATUSES),assignedBy:z.string().trim().default(""),completedAt:z.string().optional().or(z.literal(""))});

export const bookingSchema = z.object({
  tripId: z.string().min(1),
  partnerSlug: z.string().optional(),
  bookingMode: z.enum(["online", "offline"]).default("online"),
  seats: z.number().int().positive().max(50),
  travelStartDate: z.string().trim().optional().or(z.literal("")),
  travelEndDate: z.string().trim().optional().or(z.literal("")),
  travelerDetails: z.object({
    name: z.string().trim().min(2),
    email: z.string().email(),
    mobile,
    travellers: z.number().int().positive(),
    departureCity: z.string().trim().default(""),
    adults: z.number().int().nonnegative().default(1),
    childrenWithBed: z.number().int().nonnegative().default(0),
    childrenWithoutBed: z.number().int().nonnegative().default(0),
    infants: z.number().int().nonnegative().default(0),
    notes: z.string().optional(),
  }),
  travelCompliance: z.object({
    visa: z.object({ hasDocument:z.boolean(), documents:z.array(z.object({ label:z.string().trim().min(1), fileId:z.string().trim().min(1), fileName:z.string().trim().min(1) })).default([]) }).optional(),
    permit: z.object({ hasDocument:z.boolean(), documents:z.array(z.object({ label:z.string().trim().min(1), fileId:z.string().trim().min(1), fileName:z.string().trim().min(1) })).default([]) }).optional(),
  }).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type TravelerRegisterInput = z.infer<typeof travelerRegisterSchema>;
export type PartnerRegisterInput = z.infer<typeof partnerRegisterSchema>;
export type AdminPartnerInviteInput = z.infer<typeof adminPartnerInviteSchema>;
export type AdminTravelerInput = z.infer<typeof adminTravelerSchema>;
export type AdminBookingTravelerInput = z.infer<typeof adminBookingTravelerSchema>;
export type TripInput = z.infer<typeof tripSchema>;
export type DestinationInput = z.infer<typeof destinationSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
