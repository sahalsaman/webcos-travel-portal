import { getBusiness, getBusinessCredentials } from "@/lib/business";

export const WABIS_TEMPLATE_KEYS = [
  "otp",
  "booking",
  "hotelBooking",
  "reminder",
  "experience",
] as const;

export type WabisTemplateKey = (typeof WABIS_TEMPLATE_KEYS)[number];

type WabisSendInput = {
  to: string;
  template: WabisTemplateKey;
  variables?: Array<string | number | null | undefined>;
};

const WABIS_TEMPLATE_ENDPOINT = "https://app.wabis.in/api/workspace/v1/whatsapp/templates/send";

/** Wabis accepts an international number as digits only: 918547929822, not +918547929822. */
function wabisRecipient(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^00/, "");
  if (!/^[1-9]\d{6,14}$/.test(digits)) {
    throw new Error("Enter a valid phone number with country code");
  }
  return digits;
}

async function wabisConfiguration() {
  const credential = (await getBusinessCredentials()).find((item) => item.platform === "WABIS_API");
  return {
    apiKey: credential?.apikey?.trim() ?? "",
    channelId: credential?.name?.trim() ?? "",
    languageCode: credential?.languageCode?.trim() || "en",
    templates: credential?.templates ?? {},
  };
}

export async function isWabisOtpConfigured() {
  const config = await wabisConfiguration();
  return Boolean(config.apiKey && config.templates.otp?.trim());
}

/** Send a configured Wabis template. Missing templates intentionally no-op. */
export async function sendWabisTemplate(input: WabisSendInput) {
  const config = await wabisConfiguration();
  const templateName = config.templates[input.template]?.trim();
  if (!config.apiKey || !templateName) return { sent: false, skipped: true };

  const variables = (input.variables ?? []).filter((value): value is string | number => value !== null && value !== undefined).map(String);
  const response = await fetch(WABIS_TEMPLATE_ENDPOINT, {
    method: "POST",
    headers: { "X-API-Key": config.apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(config.channelId ? { channelId: config.channelId } : {}),
      to: wabisRecipient(input.to),
      templateName,
      languageCode: config.languageCode,
      ...(variables.length ? { variables: variables.join(",") } : {}),
    }),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(detail?.message || "Wabis could not send the template message");
  }
  return { sent: true, skipped: false };
}

export async function sendBookingWhatsApp(input: { phone: string; travelerName: string; bookingNumber: string; tripTitle: string; bookingStatus?: string; travelStartDate?: Date | string | null }) {
  try {
    const business = await getBusiness();
    const travelDate = input.travelStartDate ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(input.travelStartDate)) : "To be confirmed";
    const bookingUrl = new URL("/traveler/bookings", business.siteUrl).toString();
    const bookingStatus = (input.bookingStatus || "pending").replace(/[_-]/g, " ");
    const formattedStatus = bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1);
    const update = `Your booking is ${formattedStatus.toLowerCase()}. Our team will share the next steps with you shortly.`;
    return await sendWabisTemplate({ to: input.phone, template: "booking", variables: [input.travelerName, input.tripTitle, formattedStatus, travelDate, input.bookingNumber, update, bookingUrl] });
  } catch (error) {
    console.error("[wabis] booking message failed:", error instanceof Error ? error.message : error);
    return { sent: false, skipped: false };
  }
}

export async function sendHotelBookingWhatsApp(input: { phone: string; travelerName: string; hotelName: string; location: string; checkIn: Date | string; checkOut: Date | string; roomDetails: string; bookingNumber: string; hotelId: string }) {
  try {
    const business = await getBusiness();
    const formatDate = (value: Date | string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
    const bookingUrl = new URL(`/hotels/${input.hotelId}`, business.siteUrl).toString();
    return await sendWabisTemplate({ to: input.phone, template: "hotelBooking", variables: [input.travelerName, input.hotelName, input.location, formatDate(input.checkIn), formatDate(input.checkOut), input.roomDetails, input.bookingNumber, bookingUrl] });
  } catch (error) {
    console.error("[wabis] hotel booking message failed:", error instanceof Error ? error.message : error);
    return { sent: false, skipped: false };
  }
}
