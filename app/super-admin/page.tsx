import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BusinessManager } from "@/components/business-manager";
export default async function SuperAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/super-admin");
  if (session.user.role !== "super_admin") redirect("/admin");
  return <main className="mx-auto max-w-6xl p-6 sm:p-12"><p className="text-sm font-semibold text-primary">TRAVELS PORTAL · SUPER ADMIN</p><h1 className="mt-3 text-4xl font-bold">Your businesses</h1><p className="mt-3 text-muted-foreground">Create an agency, set its brand, and give its team a private management portal.</p><BusinessManager /></main>;
}
