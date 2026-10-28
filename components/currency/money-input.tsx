"use client";

import * as React from "react";
import { useCurrency } from "@/components/currency/currency-provider";
import { Input } from "@/components/ui/input";

/** A numeric business-amount input with the current tenant currency visible. */
export const MoneyInput = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(
  ({ className, ...props }, ref) => {
    const { currency } = useCurrency();
    return <div className="relative"><Input ref={ref} type="number" className={`pr-16 ${className ?? ""}`} {...props} /><span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-muted-foreground">{currency}</span></div>;
  },
);
MoneyInput.displayName = "MoneyInput";
