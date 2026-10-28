import { adminSections } from "../data/mock-data.js";
import { getCollectionCounts, listRecords } from "./storage.js";
import { formatMoney } from "../utils/helpers.js";

export function getAdminOverview() {
  const counts = getCollectionCounts();
  return {
    routes: counts.routes,
    activeBuses: listRecords("buses", { filters: { status: "active" } }).length,
    bookings: counts.bookings,
    passengers: counts.passengers,
    operators: counts.operators,
    terminals: counts.terminals,
    trips: counts.scheduledTrips
  };
}

export function getAdminRows(section) {
  if (section === "bookings") {
    return listRecords("bookings", { sortBy: "createdAt", order: "desc", limit: 100 }).map((booking) => ({
      id: booking.bookingReference, route: `${booking.tripSnapshot.originCity} → ${booking.tripSnapshot.destinationCity}`,
      passenger: booking.passengerSnapshot.name, date: booking.tripSnapshot.departureDate,
      status: booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
    }));
  }
  if (section === "buses") return listRecords("buses", { sortBy: "id", order: "asc", limit: 100 }).map((bus) => ({
    id: bus.registration, name: bus.model, capacity: `${bus.capacity} seats · ${bus.vehicleType === "matatu" ? "Matatu" : "Coach"}`,
    status: bus.status === "active" ? "Active" : "Maintenance"
  }));
  if (section === "routes") {
    const terminals = new Map(listRecords("terminals").map((terminal) => [terminal.id, terminal.name]));
    return listRecords("routes", { sortBy: "id", order: "asc", limit: 100 }).map((route) => ({
      id: route.code,
      name: `${route.originCity} → ${route.destinationCity}`,
      capacity: route.distanceKm ? `${route.distanceKm} km` : `${route.distanceMiles} miles`,
      status: route.active ? "Active" : "Archived",
      originTerminal: terminals.get(route.originTerminalId),
      destinationTerminal: terminals.get(route.destinationTerminalId)
    }));
  }
  if (section === "terminals") return listRecords("terminals", { sortBy: "city", order: "asc", limit: 100 }).map((terminal) => ({
    id: terminal.id, name: terminal.name, capacity: terminal.city, status: terminal.active ? "Active" : "Archived"
  }));
  if (section === "schedules") {
    const routes = new Map(listRecords("routes").map((route) => [route.id, route]));
    return listRecords("scheduledTrips", { sortBy: "departureAt", order: "asc", limit: 100 }).map((trip) => {
      const route = routes.get(trip.routeId);
      return {
        id: trip.id, name: `${route?.originCity || "—"} → ${route?.destinationCity || "—"}`,
        capacity: `${trip.departureDate} ${trip.departureTime}`,
        status: trip.status
      };
    });
  }
  if (section === "passengers") return listRecords("passengers", { sortBy: "lastName", order: "asc", limit: 100 }).map((passenger) => ({
    id: passenger.id, name: `${passenger.firstName} ${passenger.lastName}`, capacity: passenger.email, status: passenger.active ? "Active" : "Archived"
  }));
  if (section === "cancellations") return listRecords("cancellations", { sortBy: "createdAt", order: "desc", limit: 100 }).map((cancellation) => ({
    id: cancellation.id, name: cancellation.reason, capacity: cancellation.requestedAt.slice(0, 10), status: cancellation.status
  }));
  if (section === "refunds") return listRecords("refunds", { sortBy: "createdAt", order: "desc", limit: 100 }).map((refund) => ({
    id: refund.id, name: formatMoney(refund.amount, refund.currency), capacity: refund.method, status: refund.status
  }));
  return [];
}

export function getAdminSections() {
  return adminSections;
}
