import { NextResponse } from "next/server";
import { getDestinations } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("c") ?? undefined;
  const destinations = await getDestinations(country);

  return NextResponse.json({ success: true, data: destinations });
}
