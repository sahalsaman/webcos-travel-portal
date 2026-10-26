import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { tenantModel } from "@/lib/tenant-db";
import Booking from "@/models/Booking";
import Trip from "@/models/Trip";

type Context = { params: Promise<{ id: string }> };

/** Logged-in travellers can see a compact, privacy-conscious group preview. */
export async function GET(_request: Request, { params }: Context) {
  try {
    await requireApiRole(["traveler"]);
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return fail("Package not found", 404);
    await connectDB();
    const trip = await (await tenantModel(Trip)).findById(id).select("category").lean<{ category?: string }>();
    if (!trip || trip.category !== "Group Trip") return fail("Package not found", 404);

    const BookingModel = await tenantModel(Booking);
    const filter = { trip: id, paymentStatus: "paid", status: { $nin: ["cancelled", "refunded"] } };
    const [totals, bookings] = await Promise.all([
      BookingModel.aggregate<{ _id: null; travellers: number }>([
        { $match: { ...filter, trip: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: null, travellers: { $sum: "$seats" } } },
      ]),
      BookingModel.find(filter).sort({ createdAt: -1 }).limit(4)
        .populate({ path: "traveler", model: "User", select: "name image" }).lean(),
    ]);

    const avatars = bookings.flatMap((booking) => {
      const traveler = booking.traveler as unknown as { name?: string; image?: string } | null;
      return traveler?.name ? [{ name: traveler.name, image: traveler.image }] : [];
    });
    return ok({ count: totals[0]?.travellers ?? 0, avatars });
  } catch (error) {
    return handleError(error);
  }
}
