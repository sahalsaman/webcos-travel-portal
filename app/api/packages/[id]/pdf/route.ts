import { getBrand } from "@/lib/business";
import { getTripBySlug } from "@/lib/data";
import { createPackageDetailPdf } from "@/lib/package-detail-pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await getTripBySlug(id);
  if (!trip) return Response.json({ error: "Package not found" }, { status: 404 });

  const pdf = createPackageDetailPdf(trip, await getBrand());
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${trip.slug}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
