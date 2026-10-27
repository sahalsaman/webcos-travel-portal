import { auth } from "@/auth";
import { AdminShell } from "@/components/admin-shell";
import { redirect } from "next/navigation";

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "admin" || session.user.businessId) redirect("/");
  return <AdminShell user={{ name: session.user.name, email: session.user.email, image: session.user.image }}>{children}</AdminShell>;
}
