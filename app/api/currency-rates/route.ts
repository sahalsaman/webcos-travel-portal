import { NextResponse } from "next/server";
import {
  DEFAULT_CURRENCY_RATES,
  SUPPORTED_CURRENCIES,
  type CurrencyCode,
  type CurrencyRates,
} from "@/lib/currency";

export const revalidate = 21_600;

type FrankfurterRate = { quote?: string; rate?: number };

export async function GET() {
  try {
    const quotes = SUPPORTED_CURRENCIES.map((currency) => currency.code)
      .filter((code) => code !== "INR")
      .join(",");
    const response = await fetch(
      `https://api.frankfurter.dev/v2/rates?base=INR&quotes=${quotes}`,
      { next: { revalidate } },
    );
    if (!response.ok) throw new Error(`Currency provider returned ${response.status}`);

    const data = (await response.json()) as FrankfurterRate[];
    const rates: CurrencyRates = { ...DEFAULT_CURRENCY_RATES, INR: 1 };
    for (const item of data) {
      const code = item.quote?.toUpperCase() as CurrencyCode | undefined;
      if (code && code in rates && Number.isFinite(item.rate) && Number(item.rate) > 0) {
        rates[code] = Number(item.rate);
      }
    }

    return NextResponse.json({ base: "INR", rates });
  } catch {
    return NextResponse.json({ base: "INR", rates: DEFAULT_CURRENCY_RATES, fallback: true });
  }
}
