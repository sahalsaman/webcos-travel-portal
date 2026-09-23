import { getBrand } from "@/lib/business";
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrand().catch(() => ({ name: "Travels Portal" }));
  return <main className="grid min-h-screen place-items-center bg-secondary/30 p-6"><section className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm"><p className="mb-8 text-xl font-bold">{brand.name}</p>{children}</section></main>;
}
