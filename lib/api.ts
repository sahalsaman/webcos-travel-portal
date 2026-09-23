import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import type { Role } from "@/lib/constants";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400, extra?: object) {
  return NextResponse.json({ success: false, message, ...extra }, { status });
}

function fieldLabel(path: PropertyKey[]) {
  const key = path.filter((part) => typeof part !== "number").at(-1);
  if (key === undefined) return "Form";
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

/** Convert validation issues into a message that legacy form handlers can display. */
export function validationErrorMessage(err: ZodError) {
  const messages = err.issues.map((issue) => `${fieldLabel(issue.path)}: ${issue.message}`);
  return [...new Set(messages)].slice(0, 3).join(" · ") || "Please check the highlighted fields";
}

/** Normalise thrown errors (Zod, Mongo duplicate keys, generic) to a response. */
export function handleError(err: unknown) {
  // requireApiRole throws a ready-made Response — pass it straight through.
  if (err instanceof Response) return err;
  if (err instanceof ZodError) {
    return fail(validationErrorMessage(err), 422, {
      errors: err.flatten().fieldErrors,
      formErrors: err.flatten().formErrors,
    });
  }
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  ) {
    return fail("A record with these details already exists", 409);
  }
  console.error("[api] unhandled error:", err);
  return fail("Something went wrong. Please try again.", 500);
}

/** Resolve the current session user inside a route handler, or null. */
export async function currentUser() {
  const session = await auth();
  return (session?.user as { id: string; role: Role } | undefined) ?? null;
}

/** Throws a 401/403 Response if the user is missing or lacks a role. */
export async function requireApiRole(roles?: Role[]) {
  const user = await currentUser();
  if (!user) throw fail("Authentication required", 401);
  if (roles && !roles.includes(user.role)) throw fail("Forbidden", 403);
  return user;
}
