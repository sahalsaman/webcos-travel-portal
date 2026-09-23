/** Calculate decimal hours from 24-hour HH:mm values, including overnight shifts. */
export function calculateWorkHours(checkIn?: string, checkOut?: string) {
  if (!checkIn || !checkOut) return 0;
  const pattern = /^(\d{2}):(\d{2})$/;
  const start = checkIn.match(pattern);
  const end = checkOut.match(pattern);
  if (!start || !end) return 0;

  const startMinutes = Number(start[1]) * 60 + Number(start[2]);
  let endMinutes = Number(end[1]) * 60 + Number(end[2]);
  if (startMinutes > 1439 || endMinutes > 1439) return 0;
  if (endMinutes < startMinutes) endMinutes += 24 * 60;

  return Number(((endMinutes - startMinutes) / 60).toFixed(2));
}
