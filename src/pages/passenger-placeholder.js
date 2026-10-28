import { button } from "../components/button.js";
import { renderDataTable } from "../components/data-table.js";
import { readBookings } from "../services/storage.js";
import { formatDate } from "../utils/helpers.js";

export function renderPassengerPlaceholder(title, description) {
  let content = `<div class="placeholder-panel card"><h2>Coming up next</h2><p>This section is ready for the next BusSphere stage. Page navigation and the shared application shell are in place.</p><div class="placeholder-actions">${button("Book a trip", { href: "#/" })}${button("Browse available trips", { href: "#/trips" })}</div></div>`;
  if (title === "Booking history") {
    const rows = readBookings().map((booking) => ({
      code: booking.code,
      route: `${booking.origin} → ${booking.destination}`,
      date: formatDate(booking.date),
      seats: booking.seats.join(", "),
      status: booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
    }));
    content = `<div class="placeholder-panel card"><h2>Your reservations</h2>${renderDataTable([
      { key: "code", label: "BOOKING" }, { key: "route", label: "ROUTE" }, { key: "date", label: "TRAVEL DATE" }, { key: "seats", label: "SEATS" }, { key: "status", label: "STATUS" }
    ], rows, "You haven't made a booking yet. Your reservations will show up here.")}<div class="placeholder-actions">${button("Find a ride", { href: "#/" })}</div></div>`;
  }
  return `<section class="placeholder-page container"><div class="page-heading"><span class="section-overline">BUSSPHERE</span><h1>${title}</h1><p>${description}</p></div>${content}</section>`;
}
