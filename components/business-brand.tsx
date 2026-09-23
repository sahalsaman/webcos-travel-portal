"use client";
import { createContext, useContext } from "react";
export interface Brand { name: string; logoUrl: string; siteUrl: string; primaryColor: string }
const Context = createContext<Brand>({ name: "Travels Portal", logoUrl: "", siteUrl: "/", primaryColor: "#0060e6" });
export const useBusinessBrand = () => useContext(Context);
export function BusinessBrand({ brand, children }: { brand: Brand; children: React.ReactNode }) {
  return <Context.Provider value={brand}><div style={{ "--color-primary": brand.primaryColor } as React.CSSProperties}>{children}</div></Context.Provider>;
}
