import type { BookingConfirmation } from "@/lib/booking-confirmation";
import { buildMultiPagePdf, pdfLine as line } from "@/lib/simple-pdf";

const GREEN = "0.04 0.27 0.23";
const TEAL = "0.03 0.50 0.40";
const GOLD = "0.77 0.49 0.10";
const INK = "0.10 0.13 0.16";
const MUTED = "0.40 0.44 0.47";
const BORDER = "0.82 0.86 0.85";
const CREAM = "0.97 0.96 0.92";
const MINT = "0.84 0.92 0.89";

function money(value: number) {
  return `INR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`;
}

function date(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function wrapText(value: string, limit = 72) {
  const words = value.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    if (`${current} ${word}`.trim().length > limit && current) {
      lines.push(current);
      current = word;
    } else current = `${current} ${word}`.trim();
  });
  if (current) lines.push(current);
  return lines;
}

function fillRect(x: number, y: number, width: number, height: number, color: string) {
  return `${color} rg ${x} ${y} ${width} ${height} re f`;
}

function strokeRect(x: number, y: number, width: number, height: number, color = BORDER) {
  return `${color} RG 0.7 w ${x} ${y} ${width} ${height} re S`;
}

function rule(x1: number, y1: number, x2: number, y2: number, color = BORDER, width = 0.7) {
  return `${color} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`;
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function itineraryHeight(day: BookingConfirmation["trip"]["itinerary"][number]) {
  let height = 52;
  if (day.description) height += wrapText(day.description, 78).length * 10 + 4;
  (day.transports ?? []).forEach((item) => { height += 11 + wrapText(item.description || "", 56).length * 9 + 5; });
  (day.hotels ?? []).forEach((hotel) => { height += 11 + wrapText(hotel.description || "", 56).length * 9 + 5; });
  if (day.meals?.length) height += 22;
  (day.sightseeing ?? []).forEach((place) => { height += 11 + wrapText(place.description || "", 55).length * 9 + 4; });
  return Math.max(104, height + 14);
}

function renderItineraryDay(
  commands: string[],
  day: BookingConfirmation["trip"]["itinerary"][number],
  index: number,
  top: number,
  height: number,
) {
  const bottom = top - height;
  commands.push(strokeRect(42, bottom, 511, height));
  commands.push(rule(42, top, 553, top, TEAL, 3));
  commands.push(line(`DAY ${day.day || index + 1}`, 62, top - 21, 8, false, GOLD));
  commands.push(line(day.title || `Day ${index + 1}`, 62, top - 39, 15, false, GREEN));
  let y = top - 52;
  if (day.description) {
    wrapText(day.description, 78).forEach((text) => {
      commands.push(line(text, 62, y, 8, false, MUTED));
      y -= 10;
    });
    y -= 4;
  }

  const addRows = (label: string, rows: Array<{ title: string; description?: string }>) => {
    if (!rows.length) return;
    commands.push(line(label, 62, y, 7, false, MUTED));
    rows.forEach((row, rowIndex) => {
      commands.push(line(`${rowIndex ? "+ " : ""}${row.title}`, 146, y, 8, false, INK));
      y -= 11;
      wrapText(row.description || "", 56).forEach((text) => {
        commands.push(line(text, 146, y, 7, false, MUTED));
        y -= 9;
      });
      if (rowIndex < rows.length - 1) y -= 2;
    });
    y -= 5;
  };

  addRows("TRANSPORT", (day.transports ?? []).map((item) => ({ title: item.title, description: item.description })));
  addRows("STAY", (day.hotels ?? []).map((hotel) => ({ title: hotel.name, description: hotel.description })));
  if (day.meals?.length) {
    commands.push(line("MEALS", 62, y, 7, false, MUTED));
    commands.push(line(day.meals.map(titleCase).join(", "), 146, y, 8, false, INK));
    y -= 22;
  }
  if (day.sightseeing?.length) {
    commands.push(line("SIGHTSEEING", 62, y, 7, false, TEAL));
    commands.push(rule(132, y + 5, 132, Math.max(bottom + 16, y - (day.sightseeing.length * 32)), GOLD, 1.4));
    day.sightseeing.forEach((place) => {
      commands.push(line(place.name, 148, y, 9, false, INK));
      y -= 11;
      wrapText(place.description || "", 55).forEach((text) => {
        commands.push(line(text, 148, y, 7, false, MUTED));
        y -= 9;
      });
      y -= 4;
    });
  }
  return bottom;
}

function firstPage(booking: BookingConfirmation, brand: { name: string; siteUrl: string }) {
  const guests = booking.travelerDetails.travellers || booking.seats;
  const durationDays = Math.max(1, Math.round((new Date(booking.travelEndDate).getTime() - new Date(booking.travelStartDate).getTime()) / 86_400_000) + 1);
  const commands: string[] = [
    line(brand.siteUrl, 204, 810, 9, false, MUTED),
    fillRect(42, 685, 511, 115, GREEN),
    line(brand.name.toUpperCase(), 62, 772, 9, false, GOLD),
    line(booking.bookingNumber, 430, 772, 9, false, "1 1 1"),
    line(booking.trip.title, 62, 726, 27, false, "1 1 1"),
    line("Curated travel document", 62, 706, 9, false, "0.88 0.93 0.92"),
    fillRect(42, 605, 511, 80, CREAM),
    strokeRect(42, 605, 511, 80),
    rule(186, 605, 186, 685), rule(340, 605, 340, 685), rule(468, 605, 468, 685),
    line("DESTINATION", 55, 665, 7, false, MUTED),
    line(`${booking.trip.destination}, ${booking.trip.country}`, 55, 642, 11, false, INK),
    line("TRAVEL DATES", 199, 665, 7, false, MUTED),
    line(`${date(booking.travelStartDate)} -`, 199, 642, 10, false, INK),
    line(date(booking.travelEndDate), 199, 627, 10, false, INK),
    line(`${durationDays} DAYS / ${Math.max(0, durationDays - 1)} NIGHT${durationDays === 2 ? "" : "S"}`, 199, 611, 7, false, GREEN),
    line("DEPARTURE", 353, 665, 7, false, MUTED),
    line(booking.travelerDetails.departureCity || booking.trip.pickupLocation || "Joining Direct", 353, 642, 10, false, INK),
    line("GUESTS", 481, 665, 7, false, MUTED),
    line(String(guests), 481, 642, 11, false, INK),
    line(`traveler${guests === 1 ? "" : "s"}`, 481, 625, 10, false, INK),
    strokeRect(42, 478, 511, 127),
    rule(291, 478, 291, 605),
    fillRect(291, 478, 262, 127, MINT),
    line("LEAD TRAVELER", 64, 575, 9, false, TEAL),
    line(booking.travelerDetails.name, 64, 546, 16, false, INK),
    line(booking.travelerDetails.email, 64, 524, 8, false, INK),
    line(booking.travelerDetails.mobile, 64, 508, 8, false, INK),
    line("PAYMENT SUMMARY", 314, 575, 9, false, TEAL),
    line(money(booking.totalAmount), 314, 540, 23, false, GREEN),
    line(`${money(booking.sellingPrice)} per traveler x ${booking.seats}`, 314, 523, 8, false, MUTED),
    line(`STATUS - ${booking.paymentStatus.toUpperCase()}`, 314, 500, 8, false, TEAL),
  ];
  return { commands, y: 458 };
}

function continuationPage(booking: BookingConfirmation, brand: { name: string; siteUrl: string }) {
  return {
    commands: [
      fillRect(0, 774, 595, 68, GREEN),
      line(brand.name.toUpperCase(), 42, 810, 9, false, GOLD),
      line(booking.bookingNumber, 444, 810, 8, false, "1 1 1"),
      line(`ITINERARY - ${booking.trip.title}`, 42, 788, 15, false, "1 1 1"),
    ],
    y: 754,
  };
}

export function createBookingConfirmationPdf(booking: BookingConfirmation, brand: { name: string; siteUrl: string }) {
  const first = firstPage(booking, brand);
  const pages: string[][] = [first.commands];
  let commands = first.commands;
  let y = first.y;

  booking.trip.itinerary?.forEach((day, index) => {
    const height = Math.min(650, itineraryHeight(day));
    if (y - height < 62) {
      const next = continuationPage(booking, brand);
      commands = next.commands;
      pages.push(commands);
      y = next.y;
    }
    y = renderItineraryDay(commands, day, index, y, height) - 12;
  });

  const pageCount = pages.length;
  pages.forEach((page, index) => {
    page.push(rule(42, 42, 553, 42, BORDER));
    page.push(line(`${brand.name.toUpperCase()} - Computer-generated booking document`, 42, 24, 7, false, MUTED));
    page.push(line(`${index + 1} / ${pageCount}`, 520, 24, 7, false, MUTED));
  });
  return buildMultiPagePdf(pages);
}
