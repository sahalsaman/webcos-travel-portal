import { tenantModel } from "@/lib/tenant-db";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isIndiaCountry } from "@/lib/data";
import { serialize } from "@/lib/utils";
import "@/models";
import Destination from "@/models/Destination";

function flagFromCode(code: string) {
  const normalized = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return "";
  return normalized
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tripHref(params: Record<string, string>) {
  const search = new URLSearchParams(params);
  return `/packages?${search.toString()}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const visitorCountry = searchParams.get("c") ?? "IN";

  if (q.length < 2) return NextResponse.json({ success: true, data: [] });

  try {
    await connectDB();
    const rx = new RegExp(escapeRegex(q), "i");
    const allowDomestic = isIndiaCountry(visitorCountry);
    const destinationQuery: Record<string, unknown> = { status: "active", $or: [{ title: rx }, { country: rx }, { tags: rx }] };
    if (!allowDomestic) {
      destinationQuery.countryCode = { $ne: "IN" };
    }

    const destinations = await (await tenantModel(Destination)).find(destinationQuery)
      .sort({ popular: -1, featured: -1, title: 1 })
      .limit(9)
      .select("title country countryCode images")
      .lean();

    const destinationItems = (serialize(destinations) as Array<{ _id: string; title: string; country: string; countryCode: string; images?: string[] }>).map((destination) => ({
      id: `destination-${destination._id}`,
      title: destination.title,
      destination: destination.title,
      country: destination.country,
      countryCode: destination.countryCode,
      flag: flagFromCode(destination.countryCode),
      image: destination.images?.[0] ?? "",
      href: tripHref({ destination: destination.title, ...(visitorCountry ? { c: visitorCountry } : {}) }),
    }));

    return NextResponse.json({ success: true, data: destinationItems });
  } catch (err) {
    console.error("[search] query failed:", (err as Error).message);
    return NextResponse.json({ success: true, data: [] });
  }
}
