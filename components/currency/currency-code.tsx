"use client";

import { useCurrency } from "@/components/currency/currency-provider";

/** Displays the tenant's configured business currency beside an amount field. */
export function CurrencyCode() {
  const { currency } = useCurrency();
  return <>{currency}</>;
}
