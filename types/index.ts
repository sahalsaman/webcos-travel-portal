import type {
  Role,
  TripStatus,
  TripCategory,
  PackageType,
  PackageService,
  PartnerStatus,
  PartnerType,
  BookingStatus,
  PaymentStatus,
  CommissionStatus,
  OFFER_CARD_STATUSES,
  EmployeeStatus,
  AdminPortalPageKey,
  SupplierStatus,
  SupplierType,
  CampaignStatus,
  CampaignChannel,
  PayrollStatus,
  QuotationStatus,
  LeadStatus,
  LeadSource,
  VisaStatus,
  TicketType, TicketStatus, HotelReservationStatus,
  ExpenseStatus,
  InvoiceStatus,
  ReputationPlatform,
  ReputationSentiment,
  ReputationStatus,
  AttendanceStatus, PerformanceStatus, LeaveType, LeaveRequestStatus, HrTaskPriority, HrTaskStatus,
  ActivityStatus, ActivityTypeStatus, ActivityBookingStatus,
} from "@/lib/constants";

/** Plain (serialized) shapes returned to client components. */

export interface ItineraryItem {
  day: number;
  title: string;
  description: string;
  transports?: ItineraryTransport[];
  hotels?: ItineraryHotel[];
  meals?: ItineraryMeal[];
  sightseeing?: SightseeingPlace[];
}

export interface ItineraryTransport {
  title: string;
  description: string;
}

export interface ItineraryHotel {
  name: string;
  description: string;
  image: string;
  verified?: boolean;
}

export type ItineraryMeal = "breakfast" | "lunch" | "dinner";

export interface SightseeingPlace {
  name: string;
  description: string;
  image: string;
}

export interface TripDTO {
  _id: string;
  title: string;
  slug: string;
  destination: string;
  country: string;
  visaRequired?: boolean;
  visaNote?: string;
  visaDocuments?: string[];
  visaFee?: number;
  permitRequired?: boolean;
  permitNote?: string;
  permitDocuments?: string[];
  permitFee?: number;
  description: string;
  images: string[];
  itinerary: ItineraryItem[];
  inclusions: string[];
  includedServices?: PackageService[];
  exclusions: string[];
  holidayPackage?: boolean;
  basePrice: number;
  durationDays?: number;
  totalSeats: number;
  availableSeats: number;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  departureCities?: string[];
  category: TripCategory;
  packageType: PackageType;
  status: TripStatus;
  featured: boolean;
  tags: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface DestinationDTO {
  _id: string;
  title: string;
  description: string;
  images: string[];
  basePrice: number;
  status: "active" | "inactive";
  featured: boolean;
  tags: string[];
  popular: boolean;
  country: string;
  countryCode: string;
  createdAt: string;
}

export interface ActivityTypeDTO {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  status: ActivityTypeStatus;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ActivityDTO {
  _id: string;
  title: string;
  slug: string;
  type: string | Pick<ActivityTypeDTO, "_id" | "name" | "slug">;
  destination: string;
  country: string;
  shortDescription: string;
  description: string;
  images: string[];
  basePrice: number;
  originalPrice: number;
  duration: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  importantInfo: string[];
  meetingPoint: string;
  seasonal: boolean;
  bestSelling: boolean;
  featured: boolean;
  status: ActivityStatus;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface ActivityBookingDTO {
  _id: string;
  bookingNumber: string;
  activity: string | Pick<ActivityDTO, "_id" | "title" | "slug" | "destination">;
  name: string;
  email: string;
  mobile: string;
  activityDate: string;
  timeSlot: string;
  adults: number;
  children: number;
  totalParticipants: number;
  unitPrice: number;
  totalAmount: number;
  status: ActivityBookingStatus;
  paymentStatus: PaymentStatus;
  notes: string;
  createdAt: string;
}

export interface OfferCardDTO {
  _id: string;
  title: string;
  description: string;
  images: string[];
  href: string;
  ctaLabel: string;
  priceLabel: string;
  status: (typeof OFFER_CARD_STATUSES)[number];
  featured: boolean;
  sortOrder: number;
  tags: string[];
  country: string;
  countryCode: string;
  createdAt: string;
}


export interface UserDTO {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: Role;
  image?: string;
  createdAt?: string;
}

export interface EmployeeDTO {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  designation: string;
  department: string;
  status: EmployeeStatus;
  salary: number;
  joinedAt?: string;
  portalAccess?: boolean;
  portalPages?: AdminPortalPageKey[];
  hrAccess?: "self" | "manage";
  notes?: string;
  createdAt: string;
}

export interface SupplierDTO {
  _id: string;
  companyName: string;
  contactName: string;
  email?: string;
  phone: string;
  type: SupplierType;
  status: SupplierStatus;
  country: string;
  countryCode: string;
  city: string;
  address: string;
  taxId: string;
  commissionRate: number;
  notes: string;
  createdAt: string;
}

export interface CampaignDTO {
  _id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  targetAudience: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate?: string | null;
  owner: string;
  description: string;
  notes: string;
  createdAt: string;
  leadCount?: number;
}

export interface LeadDTO {
  _id: string;
  leadNumber: string;
  customerName: string;
  email?: string;
  phone: string;
  destination: string;
  travelDate?: string | null;
  travelers: number;
  budget: number;
  source: LeadSource;
  status: LeadStatus;
  campaign?: string | Pick<CampaignDTO, "_id" | "name" | "channel"> | null;
  quotation?: string | Pick<QuotationDTO, "_id" | "quotationNumber" | "status" | "totalAmount"> | null;
  assignedTo: string;
  notes: string;
  createdAt: string;
}

export interface VisaApplicationDTO {
  _id: string;
  lead?: string | Pick<LeadDTO, "_id" | "leadNumber" | "customerName"> | null;
  customer?: string | Pick<UserDTO, "_id" | "name" | "email" | "mobile"> | null;
  visaNumber: string;
  applicantName: string;
  phone: string;
  email?: string;
  passportNumber: string;
  destinationCountry: string;
  visaType: string;
  status: VisaStatus;
  submittedAt?: string | null;
  expectedAt?: string | null;
  completedAt?: string | null;
  bookingNumber: string;
  assignedTo: string;
  notes: string;
  createdAt: string;
}

export interface TicketTrackingDTO { _id:string; lead?:string|Pick<LeadDTO,"_id"|"leadNumber"|"customerName">|null; customer?:string|Pick<UserDTO,"_id"|"name"|"email"|"mobile">|null; trackingNumber:string; customerName:string; phone:string; ticketType:TicketType; provider:string; referenceNumber:string; origin:string; destination:string; departureAt:string; arrivalAt?:string|null; travelers:number; amount:number; status:TicketStatus; assignedTo:string; notes:string; createdAt:string; }
export interface HotelReservationDTO { _id:string; lead?:string|Pick<LeadDTO,"_id"|"leadNumber"|"customerName">|null; customer?:string|Pick<UserDTO,"_id"|"name"|"email"|"mobile">|null; trackingNumber:string; customerName:string; phone:string; hotelName:string; destination:string; confirmationNumber:string; checkIn:string; checkOut:string; rooms:number; guests:number; roomType:string; mealPlan:string; amount:number; status:HotelReservationStatus; assignedTo:string; notes:string; createdAt:string; }

export interface ExpenseDTO { _id: string; expenseNumber: string; title: string; category: string; vendor: string; amount: number; expenseDate: string; status: ExpenseStatus; paymentReference: string; notes: string; createdAt: string; }
export interface InvoiceDTO { _id: string; invoiceNumber: string; customerName: string; customerEmail?: string; customerPhone: string; description: string; amount: number; issueDate: string; dueDate: string; status: InvoiceStatus; bookingNumber: string; notes: string; createdAt: string; }
export interface ReputationDTO { _id: string; platform: ReputationPlatform; reviewerName: string; rating: number; reviewText: string; reviewUrl: string; sentiment: ReputationSentiment; status: ReputationStatus; assignedTo: string; responseText: string; reviewedAt: string; respondedAt?: string | null; notes: string; createdAt: string; }
type EmployeeRef = string | Pick<EmployeeDTO, "_id" | "name" | "email" | "designation" | "department">;
export interface AttendanceDTO { _id:string; employee:EmployeeRef; date:string; status:AttendanceStatus; checkIn:string; checkOut:string; workHours:number; notes:string; }
export interface AttendanceRegularizationDTO { _id:string; employee:EmployeeRef; date:string; requestedCheckIn:string; requestedCheckOut:string; reason:string; status:"pending"|"approved"|"rejected"; reviewNotes:string; createdAt:string; }
export interface PerformanceReviewDTO { _id:string; employee:EmployeeRef; period:string; score:number; goals:string; achievements:string; feedback:string; reviewer:string; status:PerformanceStatus; createdAt:string; }
export interface LeaveRequestDTO { _id:string; employee:EmployeeRef; type:LeaveType; startDate:string; endDate:string; days:number; status:LeaveRequestStatus; reason:string; adminNotes:string; }
export interface HrTaskDTO { _id:string; employee:EmployeeRef; title:string; description:string; dueDate:string; priority:HrTaskPriority; status:HrTaskStatus; assignedBy:string; completedAt?:string|null; }

export interface PayrollDTO {
  _id: string;
  employee: string | Pick<EmployeeDTO, "_id" | "name" | "email" | "designation" | "department">;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: PayrollStatus;
  paymentDate?: string | null;
  paymentReference: string;
  notes: string;
  createdAt: string;
}

export interface QuotationDTO {
  _id: string;
  quotationNumber: string;
  shareToken: string;
  lead?: string | Pick<LeadDTO, "_id" | "leadNumber" | "customerName"> | null;
  customer?: string | Pick<UserDTO, "_id" | "name" | "email" | "mobile"> | null;
  trip?: string | Pick<TripDTO, "_id" | "title" | "destination" | "basePrice"> | null;
  customItinerary?: ItineraryItem[];
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  title: string;
  items: { description: string; quantity: number; unitPrice: number; amount: number }[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  validUntil: string;
  status: QuotationStatus;
  notes: string;
  terms: string;
  policy: string;
  importantInformation: string;
  otherInformation: string;
  createdAt: string;
}

export interface PartnerDTO {
  _id: string;
  user: string | UserDTO;
  businessName: string;
  slug: string;
  partnerType: PartnerType;
  logo?: string;
  bannerImage?: string;
  profileImage?: string;
  bio?: string;
  socialLinks?: { label: string; url: string }[];
  contactEmail?: string;
  contactPhone?: string;
  status: PartnerStatus;
  defaultCommission: number;
  totalEarnings: number;
  pendingEarnings: number;
}

export interface PartnerTripDTO {
  _id: string;
  partner: string | PartnerDTO;
  trip: string | TripDTO;
  partnerSlug: string;
  tripSlug: string;
  commission: number;
  sellingPrice: number;
  active: boolean;
  clicks: number;
  bookings: number;
}

export interface BookingDTO {
  _id: string;
  bookingNumber: string;
  trip: string | TripDTO;
  traveler: string | UserDTO;
  partner?: string | PartnerDTO | null;
  travelerDetails: {
    name: string;
    email: string;
    mobile: string;
    travellers: number;
    notes?: string;
  };
  seats: number;
  basePrice: number;
  commission: number;
  platformFee: number;
  sellingPrice: number;
  totalAmount: number;
  partnerEarnings: number;
  adminEarnings: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface CommissionDTO {
  _id: string;
  booking: string;
  partner: string;
  trip: string;
  amount: number;
  platformFee: number;
  status: CommissionStatus;
  createdAt: string;
}

export interface ReviewDTO {
  _id: string;
  trip: string;
  user: UserDTO;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
