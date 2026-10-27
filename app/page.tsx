import { getBusiness } from "@/lib/business";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
export default async function Home() {
  const host = (await headers()).get("host")?.split(":")[0].toLowerCase();
  // Local Portal development must never hand a shared browser session back to
  // the tenant website. It should present the Portal login instead.
  if (host === "localhost" || host === "127.0.0.1") redirect("/login");

  const session = await auth();
  const role = session?.user?.role;
  if (!role) redirect("/login");
  if (role === "admin" && !session?.user?.businessId) redirect("/admin");
  if (role === "tenant_partner" || role === "tenant_traveler") {
    const business = await getBusiness();
    redirect(new URL("/login", business.siteUrl).toString());
  }
  redirect("/tenant");
}
