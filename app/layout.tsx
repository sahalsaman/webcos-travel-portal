import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";
export const metadata: Metadata = { title: "Travels Portal", robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body className="min-h-screen bg-background text-foreground antialiased"><Providers>{children}</Providers></body></html>;
}
