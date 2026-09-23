import { getBrand } from "@/lib/business";
import { getAuthorizedBookingConfirmation } from "@/lib/booking-confirmation";
import { createBookingConfirmationPdf } from "@/lib/booking-confirmation-pdf";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token") ?? undefined;
  const booking = await getAuthorizedBookingConfirmation(id, token);
  if (!booking) {
    return Response.json({ success: false, message: "Booking confirmation not found" }, { status: 404 });
  }

  const pdf = createBookingConfirmationPdf(booking, await getBrand());
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${booking.bookingNumber}-premium.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
