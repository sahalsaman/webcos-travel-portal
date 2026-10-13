import { getBrand } from "@/lib/business";
import { headers } from "next/headers";
import Image from "next/image";
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get("host")?.split(":")[0].toLowerCase();
  const brand = host === "travel-portal.rentities.in"
    ? { name: "Travels Portal", logoUrl: "" }
    : await getBrand().catch(() => ({ name: "Travels Portal", logoUrl: "" }));
  return <main className="grid min-h-screen place-items-center bg-secondary/30 p-6"><section className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">{brand.logoUrl ? <Image src={brand.logoUrl} alt={brand.name} width={180} height={56} priority unoptimized className="mb-8 h-14 w-auto max-w-full object-contain object-left" /> : <p className="mb-8 text-xl font-bold">{brand.name}</p>}{children}</section></main>;
}
