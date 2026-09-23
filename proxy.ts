import { NextResponse, type NextRequest } from "next/server";
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-portal-pathname", request.nextUrl.pathname);
  if (!headers.has("x-business-slug") && process.env.DEFAULT_BUSINESS_SLUG) {
    headers.set("x-business-slug", process.env.DEFAULT_BUSINESS_SLUG);
  }
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
