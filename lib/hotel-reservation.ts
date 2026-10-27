import { fail } from "@/lib/api";
import { tenantModel } from "@/lib/tenant-db";
import Hotel from "@/models/Hotel";
import HotelReservation from "@/models/HotelReservation";

type ReservationInput = {
  hotelId: string; roomId: string; rooms: number; guests: number; checkIn: string; checkOut: string; status: string;
};

export async function prepareHotelReservation(input: ReservationInput, excludeId?: string) {
  const hotels = await tenantModel(Hotel);
  const hotel = await hotels.findById(input.hotelId).select("name rooms additionalTax taxPercentage").lean();
  if (!hotel) throw fail("Selected hotel was not found", 404);

  const room = hotel.rooms.find((item: { _id: unknown }) => String(item._id) === input.roomId);
  if (!room) throw fail("Selected room was not found", 404);
  if (input.guests > room.capacity * input.rooms) {
    throw fail(`This room accommodates up to ${room.capacity} guest(s) per room`, 422);
  }

  const reservations = await tenantModel(HotelReservation);
  const overlap: Record<string, unknown> = {
    hotel: input.hotelId,
    roomId: input.roomId,
    status: { $ne: "cancelled" },
    checkIn: { $lt: new Date(input.checkOut) },
    checkOut: { $gt: new Date(input.checkIn) },
  };
  if (excludeId) overlap._id = { $ne: excludeId };
  const totals = await reservations.aggregate<{ _id: null; booked: number }>([
    { $match: overlap },
    { $group: { _id: null, booked: { $sum: "$rooms" } } },
  ]);
  const booked = totals[0]?.booked ?? 0;
  if (booked + input.rooms > room.numberOfRooms) {
    throw fail(`Only ${Math.max(0, room.numberOfRooms - booked)} ${room.name} room(s) are available for these dates`, 422);
  }

  const nights = Math.max(1, Math.ceil((new Date(input.checkOut).getTime() - new Date(input.checkIn).getTime()) / 86_400_000));
  return {
    hotel: hotel._id,
    roomId: room._id,
    hotelName: hotel.name,
    roomType: room.name,
    amount: room.price * input.rooms * nights * (hotel.additionalTax ? 1 + (hotel.taxPercentage ?? 0) / 100 : 1),
  };
}
