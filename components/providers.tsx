"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { CurrencyProvider } from "@/components/currency/currency-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <CurrencyProvider>
          {children}
          <Toaster richColors position="top-center" closeButton />
        </CurrencyProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
