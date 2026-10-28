import { cities, travelClasses } from "../data/mock-data.js";
import { createId } from "../utils/helpers.js";
import { listRecords, saveBooking } from "./storage.js";
import { getSeatFare, getSeatInventory, getSeatsTotal } from "../utils/seats.js";

export function getTripSeatInventory(tripId) {
  const trip = listRecords("scheduledTrips").find((record) => record.id === tripId);
  if (!trip) throw new Error("The selected trip's seat layout could not be found.");
  return getSeatInventory(trip, listRecords("bookings"));
}

export function validateSeatSelection(tripId, seatNumbers, passengerCount) {
  if (!Number.isInteger(passengerCount) || passengerCount < 1 || passengerCount > 4) {
    return { valid: false, error: "Choose between one and four seats for this booking." };
  }
  if (!Array.isArray(seatNumbers) || seatNumbers.length !== passengerCount
    || new Set(seatNumbers.map(String)).size !== seatNumbers.length) {
    return { valid: false, error: `Select exactly ${passengerCount} different ${passengerCount === 1 ? "seat" : "seats"}.` };
  }
  const inventory = getTripSeatInventory(tripId);
  const seatsByNumber = new Map(inventory.map((seat) => [seat.number, seat]));
  const unavailable = seatNumbers.map(String).filter((number) => seatsByNumber.get(number)?.status !== "available");
  if (unavailable.length) {
    return { valid: false, error: `Seat${unavailable.length > 1 ? "s" : ""} ${unavailable.join(", ")} no longer available. Please choose again.` };
  }
  return { valid: true, inventory };
}

export function findTrips(search, filters = {}, sort = "recommended") {
  const requestedClass = travelClasses.find((item) => item.id === search.travelClass) || travelClasses[0];
  const requestedOrigin = search.origin;
  const requestedDestination = search.destination;
  const routes = listRecords("routes");
  const terminals = listRecords("terminals");
  const buses = listRecords("buses");
  const operators = listRecords("operators");
  const routeById = new Map(routes.map((route) => [route.id, route]));
  const terminalById = new Map(terminals.map((terminal) => [terminal.id, terminal]));
  const busById = new Map(buses.map((bus) => [bus.id, bus]));
  const operatorById = new Map(operators.map((operator) => [operator.id, operator]));
  const now = Date.now();
  let results = listRecords("scheduledTrips", { filters: { departureDate: search.date }, sortBy: "departureAt", order: "asc" })
    .filter((trip) => (trip.status === "scheduled" || trip.status === "boarding")
      && Date.parse(trip.departureAt) > now
      && Date.parse(trip.bookingCutoffAt) > now)
    .map((trip) => {
      const route = routeById.get(trip.routeId);
      const bus = busById.get(trip.busId);
      const operator = operatorById.get(trip.operatorId);
      if (!route || !route.active || !bus || bus.status !== "active" || !bus.active
        || !operator || !operator.active
        || route.originCity !== requestedOrigin || route.destinationCity !== requestedDestination) return null;
      const vehicleType = bus.vehicleType || route.transportType || "coach";
      if (search.vehicleType && search.vehicleType !== "all" && search.vehicleType !== vehicleType) return null;
      const selectedClass = vehicleType === "matatu" ? travelClasses[0] : requestedClass;
      if (search.originTerminal && terminalById.get(route.originTerminalId)?.name !== search.originTerminal) return null;
      if (search.destinationTerminal && terminalById.get(route.destinationTerminalId)?.name !== search.destinationTerminal) return null;
      if (!cities.includes(requestedOrigin) || !cities.includes(requestedDestination)) return null;
      if (!terminalById.get(route.originTerminalId)?.active || !terminalById.get(route.destinationTerminalId)?.active) return null;
      const fare = trip.fareConfiguration.classes.find((entry) => entry.classId === selectedClass.id);
      if (!fare) return null;
      const featureLabels = {
        wifi: "Free Wi-Fi", power: "Power outlets", restroom: "Restroom",
        "reclining-seats": "Reclining seats", "air-conditioning": "Air conditioning",
        "reading-light": "Reading lights", usb: "USB charging"
      };
      const originTerminal = terminalById.get(route.originTerminalId);
      const destinationTerminal = terminalById.get(route.destinationTerminalId);
      const seatsLeft = getSeatInventory(trip, listRecords("bookings"))
        .filter((seat) => seat.status === "available").length;
      if (seatsLeft < Number(search.passengers || 1)) return null;
      return {
        id: trip.id, routeId: route.id, busId: bus.id, operatorId: operator.id,
        vehicleType, vehicleLabel: vehicleType === "matatu" ? "Matatu" : "Coach bus",
        departure: trip.departureTime, arrival: trip.arrivalTime,
        date: trip.departureDate, arrivalDate: trip.arrivalDate,
        duration: `${Math.floor(route.durationMinutes / 60)}h ${route.durationMinutes % 60}m`,
        price: fare.fare, currency: "KES", operator: operator.name, initials: operator.initials,
        busClass: vehicleType === "matatu" ? "Matatu" : travelClasses.find((entry) => entry.id === bus.travelClass)?.label || selectedClass.label,
        fareClass: selectedClass.label,
        classId: selectedClass.id, coachClassId: bus.travelClass,
        origin: search.origin, destination: search.destination,
        originTerminal: originTerminal?.name || "", destinationTerminal: destinationTerminal?.name || "",
        rating: String(operator.profile.rating), reviews: operator.profile.reviewCount,
        features: bus.amenities,
        amenities: bus.amenities.map((feature) => featureLabels[feature] || feature),
        seatsLeft,
        durationMinutes: route.durationMinutes,
        passengers: search.passengers,
        travelClass: selectedClass.id,
        scheduledTrip: trip
      };
    }).filter(Boolean);
  if (filters.times?.length) {
    results = results.filter((trip) => {
      const hour = Number(trip.departure.slice(0, 2));
      return filters.times.some((period) => matchesTimePeriod(hour, period));
    });
  }
  if (filters.arrivalTimes?.length) {
    results = results.filter((trip) => {
      const hour = Number(trip.arrival.slice(0, 2));
      return filters.arrivalTimes.some((period) => matchesTimePeriod(hour, period));
    });
  }
  if (filters.amenities?.length) results = results.filter((trip) => filters.amenities.every((amenity) => trip.features.includes(amenity)));
  if (filters.operators?.length) results = results.filter((trip) => filters.operators.includes(trip.operatorId));
  if (filters.busClasses?.length) results = results.filter((trip) => filters.busClasses.includes(trip.coachClassId));
  if (filters.minimumPrice !== "" && filters.minimumPrice !== undefined) results = results.filter((trip) => trip.price >= Number(filters.minimumPrice));
  if (filters.maximumPrice !== "" && filters.maximumPrice !== undefined) results = results.filter((trip) => trip.price <= Number(filters.maximumPrice));
  if (filters.minimumDuration !== "" && filters.minimumDuration !== undefined) results = results.filter((trip) => trip.durationMinutes >= Number(filters.minimumDuration));
  if (filters.maximumDuration !== "" && filters.maximumDuration !== undefined) results = results.filter((trip) => trip.durationMinutes <= Number(filters.maximumDuration));
  if (sort === "price") results.sort((a, b) => a.price - b.price || a.departure.localeCompare(b.departure));
  if (sort === "departure") results.sort((a, b) => a.departure.localeCompare(b.departure));
  if (sort === "duration") results.sort((a, b) => a.durationMinutes - b.durationMinutes || a.departure.localeCompare(b.departure));
  if (sort === "operator") results.sort((a, b) => a.operator.localeCompare(b.operator) || a.departure.localeCompare(b.departure));
  return results;
}

function matchesTimePeriod(hour, period) {
  if (period === "overnight") return hour < 6;
  if (period === "morning") return hour >= 6 && hour < 12;
  if (period === "afternoon") return hour >= 12 && hour < 18;
  return period === "evening" && hour >= 18;
}

export function reserveTrip({ search, trip, seats, passenger }) {
  const currentSearch = { ...search, passengers: Number(search.passengers || 1), travelClass: trip.classId || search.travelClass };
  const bookableTrip = findTrips(currentSearch).find((candidate) => candidate.id === trip.id);
  if (!bookableTrip) {
    throw new Error("The selected trip is no longer bookable for your party. Please search again.");
  }
  const selection = validateSeatSelection(trip.id, seats, currentSearch.passengers);
  if (!selection.valid) throw new Error(selection.error);
  trip = bookableTrip;
  const scheduledTrip = trip.scheduledTrip || listRecords("scheduledTrips").find((record) => record.id === trip.id);
  if (!scheduledTrip) throw new Error("The selected trip is no longer available. Please search again.");
  const route = listRecords("routes").find((record) => record.id === scheduledTrip.routeId);
  const bus = listRecords("buses").find((record) => record.id === scheduledTrip.busId);
  const operator = listRecords("operators").find((record) => record.id === scheduledTrip.operatorId);
  const passengers = listRecords("passengers");
  const existingPassenger = passengers.find((record) => record.email.toLowerCase() === passenger.email.toLowerCase());
  const passengerRecord = existingPassenger || {
    id: createPassengerId(passenger.email),
    firstName: passenger.name.trim().split(/\s+/)[0],
    lastName: passenger.name.trim().split(/\s+/).slice(1).join(" ") || "Traveler",
    email: passenger.email, phone: passenger.phone || "",
    preferredClass: trip.classId || "standard", createdAt: new Date().toISOString(), active: true, archivedAt: null
  };
  const reference = createBookingReference();
  const seatFares = seats.map((number) => ({
    seat: String(number),
    fare: getSeatFare(selection.inventory.find((seat) => seat.number === String(number)), trip.price)
  }));
  const seatTotal = getSeatsTotal(seats, selection.inventory, trip.price);
  const booking = {
    ...search,
    id: reference,
    bookingReference: reference,
    tripId: scheduledTrip.id,
    routeId: scheduledTrip.routeId,
    busId: scheduledTrip.busId,
    operatorId: scheduledTrip.operatorId,
    operator: operator?.name || trip.operator,
    busClass: trip.fareClass || trip.busClass,
    originTerminal: trip.originTerminal || search.originTerminal,
    destinationTerminal: trip.destinationTerminal || search.destinationTerminal,
    departure: trip.departure,
    arrival: trip.arrival,
    duration: trip.duration,
    price: trip.price,
    seatFares,
    paymentMethod: "Demo card",
    passengerId: passengerRecord.id,
    seats: [...seats],
    passenger,
    code: createId("BS"),
    status: "confirmed",
    createdAt: new Date().toISOString()
  };
  booking.code = booking.bookingReference;
  booking.id = createId("BK");
  booking.bookingReference = reference;
  booking.ticket = { ticketNumber: createId("TKT"), issuedAt: booking.createdAt, status: "issued" };
  booking.tripSnapshot = {
    id: scheduledTrip.id, routeId: route.id, busId: bus.id, operatorId: operator.id,
    operatorName: operator.name, busRegistration: bus.registration, busModel: bus.model,
    busClass: trip.fareClass || trip.busClass, vehicleType: trip.vehicleType,
    currency: trip.currency, originCity: search.origin, destinationCity: search.destination,
    originTerminalId: route.originTerminalId, destinationTerminalId: route.destinationTerminalId,
    departureAt: scheduledTrip.departureAt, arrivalAt: scheduledTrip.arrivalAt,
    departureTime: trip.departure, arrivalTime: trip.arrival, departureDate: scheduledTrip.departureDate
  };
  const currency = "KES";
  const bookingFee = Number(scheduledTrip.fareConfiguration.bookingFee) || 0;
  booking.currency = currency;
  booking.vehicleType = scheduledTrip.vehicleType || trip.vehicleType || "coach";
  booking.vehicleLabel = booking.vehicleType === "matatu" ? "Matatu" : "Coach bus";
  booking.fareSnapshot = {
    currency, unitFare: trip.price, quantity: seats.length, subtotal: seatTotal,
    seatFares,
    discount: null, fees: bookingFee ? [{ code: "booking-fee", amount: bookingFee * seats.length }] : [],
    taxes: [{ code: "tax", amount: 0 }], totalAmount: seatTotal + bookingFee * seats.length
  };
  booking.totalAmount = booking.fareSnapshot.totalAmount;
  return saveBooking(booking, existingPassenger ? null : passengerRecord);
}

function createPassengerId(email) {
  return `PS${email.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function createBookingReference() {
  return `BS${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
