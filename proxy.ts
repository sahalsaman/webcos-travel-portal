import { NextResponse, type NextRequest } from "next/server";
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-portal-pathname", request.nextUrl.pathname);
  if (!headers.has("x-business-slug") && process.env.DEFAULT_BUSINESS_SLUG) {
    headers.set("x-business-slug", process.env.DEFAULT_BUSINESS_SLUG);
  }
  // Keep older tenant form clients working while routes are organised under
  // /api/tenant. Without this, Next returns its HTML 404 page and callers
  // attempting response.json() show the misleading "Unexpected token '<'".
  const legacyTenantApis = new Set([
    "activities", "activity-types", "campaigns", "employees", "expenses",
    "hr-tasks", "integrations", "invoices", "leaves", "offers", "partners",
    "payroll", "performance", "profile", "quotations", "reputation", "travelers", "uploads", "visas",
  ]);
  const [, api, resource, ...rest] = request.nextUrl.pathname.split("/");
  if (api === "api" && resource && legacyTenantApis.has(resource)) {
    const url = request.nextUrl.clone();
    url.pathname = ["", "api", "tenant", resource, ...rest].join("/");
    return NextResponse.rewrite(url, { request: { headers } });
  }
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
