import { z } from "zod";
import { fail, handleError, ok } from "@/lib/api";
import { requestPhoneOtp } from "@/lib/phone-otp";

const bodySchema = z.object({ mobile: z.string().trim().min(1), purpose: z.enum(["login", "register"]).default("login") });

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const delivery = await requestPhoneOtp(body.mobile, body.purpose);
    return ok({ expiresIn: 300, testMode: delivery.testMode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send a WhatsApp code";
    if (message.startsWith("Enter ") || message.startsWith("Too many") || message.startsWith("No account") || message.startsWith("AUTH_SECRET")) return fail(message, 400);
    return handleError(error);
  }
}
