import { getBusiness } from "@/lib/business";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
export default async function Home() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role) redirect("/login");
  if (role === "super_admin") redirect("/super-admin");
  if (role === "partner" || role === "traveler") {
    const business = await getBusiness();
    redirect(new URL("/login", business.siteUrl).toString());
  }
  redirect("/admin");
}
