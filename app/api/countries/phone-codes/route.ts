import { NextResponse } from "next/server";
import { COUNTRY_PHONE_CODES } from "@/lib/country_currency";

/** Public reference data consumed by tenant websites during sign-in and sign-up. */
export function GET() {
  return NextResponse.json({ success: true, data: COUNTRY_PHONE_CODES });
}
