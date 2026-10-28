export function getLayoutSeats(layout = {}) {
  const configuredSeats = Array.isArray(layout.seats) ? layout.seats : null;
  const seatNumbers = Array.isArray(layout.seatNumbers) ? layout.seatNumbers : [];
  const columns = Math.max(1, Number(layout.columns || layout.seatsPerRow) || 4);
  const categories = layout.categories || layout.seatCategories || {};
  const fares = layout.seatFares || layout.fares || {};

  const seats = configuredSeats || seatNumbers.map((number, index) => ({
    number,
    row: Math.floor(index / columns) + 1,
    column: index % columns + 1
  }));
  const normalizedSeats = seats.map((seat, index) => {
    const number = String(typeof seat === "object" ? seat.number ?? seat.id ?? seat.label ?? "" : seat);
    const row = Number(seat?.row) || Math.floor(index / columns) + 1;
    const column = Number(seat?.column) || index % columns + 1;
    const keyedCategory = categories[number];
    const keyedFare = fares[number];
    const configuredStatus = configuredSeatStatus(seat?.status);
    return {
      number,
      row,
      column,
      category: seat?.category || (typeof keyedCategory === "string" ? keyedCategory : keyedCategory?.name) || "",
      fare: finitePrice(seat?.fare ?? keyedFare?.fare),
      priceAdjustment: finitePrice(seat?.priceAdjustment ?? seat?.price ?? keyedFare?.priceAdjustment ?? (typeof keyedFare === "number" ? keyedFare : undefined)),
      configuredStatus,
      blocked: seat?.blocked === true || configuredStatus === "blocked"
    };
  }).filter((seat) => seat.number);
  const numbers = new Set();
  const positions = new Set();
  normalizedSeats.forEach((seat) => {
    const position = `${seat.row}:${seat.column}`;
    if (!Number.isInteger(seat.row) || seat.row < 1 || !Number.isInteger(seat.column) || seat.column < 1) {
      throw new Error(`Seat ${seat.number} has an invalid row or column in the configured layout.`);
    }
    if (numbers.has(seat.number) || positions.has(position)) {
      throw new Error("The configured seat layout contains a duplicate seat number or position.");
    }
    numbers.add(seat.number);
    positions.add(position);
  });
  return normalizedSeats;
}

export function getSeatInventory(trip, bookings = []) {
  const seats = getLayoutSeats(trip?.seatLayout || {});
  const bookedSeats = new Set(bookings
    .filter((booking) => booking.tripId === trip?.id && !["cancelled", "rejected"].includes(String(booking.status || "").toLowerCase()))
    .flatMap((booking) => (Array.isArray(booking.seats) ? booking.seats : []).map(String)));
  const blockedSeats = new Set([
    ...(trip?.blockedSeats || []),
    ...(trip?.seatLayout?.blockedSeats || [])
  ].map(String));
  const unavailableSeats = new Set([
    ...(trip?.unavailableSeats || []),
    ...(trip?.seatLayout?.unavailableSeats || [])
  ].map(String));

  return seats.map((seat) => {
    const booked = bookedSeats.has(seat.number) || seat.configuredStatus === "booked";
    const blocked = seat.blocked || blockedSeats.has(seat.number);
    const unavailable = seat.configuredStatus === "unavailable" || unavailableSeats.has(seat.number);
    return {
      ...seat,
      status: booked ? "booked" : blocked ? "blocked" : unavailable ? "unavailable" : "available"
    };
  });
}

export function getSeatFare(seat, baseFare) {
  if (Number.isFinite(seat?.fare)) return seat.fare;
  return Number(baseFare) + (Number.isFinite(seat?.priceAdjustment) ? seat.priceAdjustment : 0);
}

export function getSeatsTotal(seatNumbers, inventory, baseFare) {
  const fares = new Map(inventory.map((seat) => [seat.number, getSeatFare(seat, baseFare)]));
  return seatNumbers.reduce((total, number) => total + (fares.get(String(number)) ?? Number(baseFare)), 0);
}

function finitePrice(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) throw new Error("Configured seat fares and price adjustments must be nonnegative numbers.");
  return price;
}

function configuredSeatStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized || normalized === "available") return "";
  if (["blocked", "booked", "unavailable"].includes(normalized)) return normalized;
  return "unavailable";
}
