"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CURRENCY,
  DEFAULT_CURRENCY_RATES,
  formatConvertedCurrency,
  isCurrencyCode,
  type CurrencyCode,
  type CurrencyRates,
} from "@/lib/country_currency";

const STORAGE_KEY = "travel-portal-currency";

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatCurrency: (amountInINR: number, options?: { decimals?: boolean }) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children, initialCurrency, amountsAreInCurrency = false }: { children: React.ReactNode; initialCurrency?: string; amountsAreInCurrency?: boolean }) {
  const configuredCurrency = isCurrencyCode(initialCurrency) ? initialCurrency : DEFAULT_CURRENCY;
  const [currency, setCurrencyState] = useState<CurrencyCode>(configuredCurrency);
  const [rates, setRates] = useState<CurrencyRates>(DEFAULT_CURRENCY_RATES);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      if (initialCurrency && isCurrencyCode(initialCurrency)) return;
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isCurrencyCode(saved)) setCurrencyState(saved);
    }, 0);

    const controller = new AbortController();
    fetch("/api/currency-rates", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Unable to load rates"))))
      .then((data: { rates?: Partial<CurrencyRates> }) => {
        if (!data.rates) return;
        setRates({ ...DEFAULT_CURRENCY_RATES, ...data.rates, INR: 1 });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });

    return () => {
      window.clearTimeout(restoreTimer);
      controller.abort();
    };
  }, [initialCurrency]);

  const setCurrency = useCallback((nextCurrency: CurrencyCode) => {
    setCurrencyState(nextCurrency);
    window.localStorage.setItem(STORAGE_KEY, nextCurrency);
  }, []);

  const value = useMemo<CurrencyContextValue>(() => ({
    currency,
    setCurrency,
    formatCurrency: (amountInINR, options) => amountsAreInCurrency
      ? new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: options?.decimals ? 2 : 0, minimumFractionDigits: 0 }).format(Number.isFinite(amountInINR) ? amountInINR : 0)
      : formatConvertedCurrency(amountInINR, currency, rates, options?.decimals),
  }), [amountsAreInCurrency, currency, rates, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used inside CurrencyProvider");
  return context;
}
