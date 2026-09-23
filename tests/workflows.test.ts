import assert from "node:assert/strict";
import test from "node:test";
import {
  PAYMENT_STATUSES,
  isCustomDateTripCategory,
} from "../lib/constants";
import { calculateQuotation } from "../lib/quotation";
import { calculateWorkHours } from "../lib/attendance";
import { normalizePackageHref } from "../lib/utils";
import {
  bookingSchema,
  campaignSchema,
  payrollSchema,
  quotationSchema,
  supplierSchema,
  leadSchema,
  visaSchema,
  expenseSchema,
  employeeUpdateSchema,
  invoiceSchema,
  tripSchema,
} from "../lib/validations";

test("legacy public trip links resolve to the packages routes", () => {
  assert.equal(normalizePackageHref("/trips?destination=Dubai"), "/packages?destination=Dubai");
  assert.equal(normalizePackageHref("/trips/dubai-break"), "/packages/dubai-break");
  assert.equal(normalizePackageHref("/packages?destination=Goa"), "/packages?destination=Goa");
});

test("quotation totals apply capped discount and tax after discount", () => {
  const result = calculateQuotation(
    [
      { description: "Package", quantity: 2, unitPrice: 10_000 },
      { description: "Transfer", quantity: 1, unitPrice: 2_500 },
    ],
    2_500,
    5,
  );
  assert.deepEqual(result, {
    items: [
      { description: "Package", quantity: 2, unitPrice: 10_000, amount: 20_000 },
      { description: "Transfer", quantity: 1, unitPrice: 2_500, amount: 2_500 },
    ],
    subtotal: 22_500,
    discount: 2_500,
    taxAmount: 1_000,
    totalAmount: 21_000,
  });
  assert.equal(calculateQuotation([{ description: "A", quantity: 1, unitPrice: 100 }], 500, 18).totalAmount, 0);
});

test("attendance hours are calculated from check-in and check-out", () => {
  assert.equal(calculateWorkHours("09:30", "18:00"), 8.5);
  assert.equal(calculateWorkHours("22:00", "06:00"), 8);
  assert.equal(calculateWorkHours("09:30", ""), 0);
});

test("quotation and operational forms reject missing mandatory fields", () => {
  assert.equal(quotationSchema.safeParse({}).success, false);
  assert.equal(supplierSchema.safeParse({}).success, false);
  assert.equal(campaignSchema.safeParse({}).success, false);
  assert.equal(payrollSchema.safeParse({}).success, false);
});

test("employee updates use a partial schema without dropping portal validation", () => {
  assert.equal(employeeUpdateSchema.safeParse({ name: "Updated Employee" }).success, true);
  assert.equal(employeeUpdateSchema.safeParse({ portalPassword: "123" }).success, false);
  assert.equal(employeeUpdateSchema.safeParse({ portalAccess: true, portalPages: [] }).success, false);
});

test("booking validation accepts fixed and custom date payloads but rejects invalid travelers", () => {
  const base = {
    tripId: "trip-1",
    seats: 2,
    travelerDetails: {
      name: "Test Traveler",
      email: "traveler@example.com",
      mobile: "9876543210",
      travellers: 2,
    },
  };
  assert.equal(bookingSchema.safeParse(base).success, true);
  assert.equal(bookingSchema.safeParse({ ...base, travelStartDate: "2026-10-01", travelEndDate: "2026-10-05" }).success, true);
  assert.equal(bookingSchema.safeParse({ ...base, travelerDetails: { ...base.travelerDetails, mobile: "123" } }).success, false);
});

test("package itinerary accepts multiple structured items per day", () => {
  const result = tripSchema.safeParse({
    title: "Swiss Highlights",
    destination: "Zurich",
    country: "Switzerland",
    basePrice: 120000,
    startDate: "2026-10-01",
    endDate: "2026-10-08",
    includedServices: ["flights", "hotels", "meals", "sightseeing"],
    itinerary: [{
      day: 1,
      title: "Welcome to Zurich",
      description: "Arrival day",
      transports: [{ title: "Airport transfer", description: "Private coach" }],
      hotels: [{ name: "Central Hotel", description: "Three-star stay", image: "https://example.com/hotel.jpg" }],
      meals: ["breakfast", "dinner"],
      sightseeing: [
        { name: "Old Town", description: "Guided walking tour", image: "https://example.com/old-town.jpg" },
        { name: "Lake Zurich", description: "Evening lake visit", image: "https://example.com/lake.jpg" },
      ],
    }],
  });
  assert.equal(result.success, true);
});

test("custom-date classification and workflow statuses cover implemented paths", () => {
  assert.equal(isCustomDateTripCategory("Family"), true);
  assert.equal(isCustomDateTripCategory("Holiday Package"), false);
  assert.ok(PAYMENT_STATUSES.includes("processing"));
  assert.ok(PAYMENT_STATUSES.includes("refunded"));
});

test("LMS campaign attribution and visa tracking enforce mandatory fields", () => {
  const lead = { customerName: "Campaign Lead", phone: "9876543210", source: "Marketing Campaign", status: "new", travelers: 2, budget: 50000 };
  assert.equal(leadSchema.safeParse(lead).success, false);
  assert.equal(leadSchema.safeParse({ ...lead, campaignId: "campaign-1" }).success, true);
  assert.equal(visaSchema.safeParse({ customerId: "customer-1", passportNumber: "P123456", destinationCountry: "UAE", visaType: "Tourist", status: "documents_pending" }).success, true);
  assert.equal(visaSchema.safeParse({ applicantName: "A" }).success, false);
});

test("finance expense and invoice forms validate money and date workflows", () => {
  assert.equal(expenseSchema.safeParse({ title: "Hotel advance", category: "Accommodation", amount: 5000, expenseDate: "2026-09-01", status: "approved" }).success, true);
  assert.equal(expenseSchema.safeParse({ title: "Bad", category: "Ops", amount: 0, expenseDate: "" }).success, false);
  assert.equal(invoiceSchema.safeParse({ customerName: "Test Customer", description: "Tour balance", amount: 15000, issueDate: "2026-09-10", dueDate: "2026-09-20", status: "sent" }).success, true);
  assert.equal(invoiceSchema.safeParse({ customerName: "Test Customer", description: "Tour balance", amount: 15000, issueDate: "2026-09-20", dueDate: "2026-09-10", status: "sent" }).success, false);
});
