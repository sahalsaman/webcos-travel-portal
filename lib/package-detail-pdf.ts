import type { TripDTO } from "@/types";
import { buildSinglePagePdf, pdfLine as line } from "@/lib/simple-pdf";

function shorten(text: string, max = 86) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

export function createPackageDetailPdf(trip: TripDTO, brand: { name: string; siteUrl: string }) {
  const duration = Math.max(1, trip.durationDays || trip.itinerary.length || Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86_400_000) + 1);
  const commands: string[] = [
    "0.02 0.38 0.88 rg 0 700 595 142 re f",
    line(brand.name.toUpperCase(), 42, 797, 13, true, "1 1 1"),
    line("TOUR PACKAGE", 42, 758, 11, true, "0.82 0.9 1"),
    line(shorten(trip.title, 45), 42, 727, 23, true, "1 1 1"),
    line("PACKAGE SUMMARY", 42, 664, 12, true, "0.02 0.38 0.88"),
    line(`Destination: ${trip.destination}, ${trip.country}`, 42, 640),
    line(`Duration: ${duration} day${duration === 1 ? "" : "s"}`, 42, 620),
    line(`Package type: ${trip.category}`, 42, 600),
    line(`Starting price: INR ${new Intl.NumberFormat("en-IN").format(trip.basePrice)} per person`, 42, 580, 11, true),
    "0.88 0.9 0.93 RG 42 556 m 553 556 l S",
    line("OVERVIEW", 42, 530, 12, true, "0.02 0.38 0.88"),
    line(shorten(trip.description || `Contact ${brand.name} for complete package information.`), 42, 505),
    "0.88 0.9 0.93 RG 42 480 m 553 480 l S",
    line("ITINERARY", 42, 454, 12, true, "0.02 0.38 0.88"),
  ];

  let y = 430;
  for (const day of trip.itinerary.slice(0, 8)) {
    commands.push(line(`Day ${day.day}: ${shorten(day.title, 65)}`, 42, y, 10, true));
    y -= 22;
  }
  if (!trip.itinerary.length) commands.push(line("Detailed day plan will be shared by our travel team.", 42, y));

  commands.push(
    "0.95 0.97 1 rg 42 142 511 78 re f",
    line("READY TO TRAVEL?", 58, 194, 11, true, "0.02 0.38 0.88"),
    line(`Visit ${brand.siteUrl} to book.`, 58, 171),
    line("Package availability and price are subject to confirmation.", 42, 92, 8, false, "0.45 0.49 0.56"),
    line("Page 1 of 1", 500, 92, 8, false, "0.45 0.49 0.56"),
  );

  return buildSinglePagePdf(commands);
}
