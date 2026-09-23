"use client";

import { useBusinessBrand } from "@/components/business-brand";
import { useState } from "react";
import { Download, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function BookingRowActions({ id, bookingNumber }: { id: string; bookingNumber: string }) {
  const brand = useBusinessBrand();
  const [sharing, setSharing] = useState(false);
  const downloadUrl = `/api/bookings/${encodeURIComponent(bookingNumber)}/confirmation`;

  async function shareBooking() {
    setSharing(true);
    try {
      const response = await fetch(`/api/admin/bookings/${id}/share`, { method: "POST" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to create share link");

      const url = new URL(result.data.path, brand.siteUrl).toString();
      if (navigator.share) {
        await navigator.share({
          title: `${brand.name} booking ${bookingNumber}`,
          text: `View your ${brand.name} booking details for ${bookingNumber}.`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Booking link copied");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") toast.error((error as Error).message);
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => void shareBooking()}
        disabled={sharing}
        title="Share booking link"
        aria-label={`Share booking ${bookingNumber}`}
      >
        {sharing ? <Loader2 className="animate-spin" /> : <Share2 />}
      </Button>
      <Button asChild variant="ghost" size="icon" title="Download booking PDF">
        <a href={downloadUrl} download aria-label={`Download booking ${bookingNumber} PDF`}>
          <Download />
        </a>
      </Button>
    </div>
  );
}
