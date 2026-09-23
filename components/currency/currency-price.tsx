"use client";

import { useCurrency } from "@/components/currency/currency-provider";

export function CurrencyPrice({ amount, decimals = false }: { amount: number; decimals?: boolean }) {
  const { formatCurrency } = useCurrency();
  return <>{formatCurrency(amount, { decimals })}</>;
}
