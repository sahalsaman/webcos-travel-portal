import { LmsNav } from "@/components/admin/lms-nav";

export default function LmsLayout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-5"><LmsNav />{children}</div>;
}
