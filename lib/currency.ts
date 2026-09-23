export const SUPPORTED_CURRENCIES = [
  { code: "INR", label: "Indian Rupee", symbol: "₹", locale: "en-IN" },
  { code: "USD", label: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "AED", label: "UAE Dirham", symbol: "AED", locale: "en-AE" },
  { code: "EUR", label: "Euro", symbol: "€", locale: "en-IE" },
  { code: "GBP", label: "British Pound", symbol: "£", locale: "en-GB" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];
export type CurrencyRates = Record<CurrencyCode, number>;

export const DEFAULT_CURRENCY: CurrencyCode = "INR";
export const DEFAULT_CURRENCY_RATES: CurrencyRates = {
  INR: 1,
  USD: 0.0105,
  AED: 0.0385,
  EUR: 0.009,
  GBP: 0.0078,
};

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return SUPPORTED_CURRENCIES.some((currency) => currency.code === value);
}

export function formatConvertedCurrency(
  amountInINR: number,
  currency: CurrencyCode,
  rates: CurrencyRates,
  decimals = false,
) {
  const definition = SUPPORTED_CURRENCIES.find((item) => item.code === currency);
  const converted = (Number.isFinite(amountInINR) ? amountInINR : 0) * (rates[currency] || 1);

  return new Intl.NumberFormat(definition?.locale ?? "en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: decimals ? 2 : 0,
    minimumFractionDigits: 0,
  }).format(converted);
}
