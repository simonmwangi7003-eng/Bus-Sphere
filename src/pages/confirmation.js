import { readBookings } from "../services/storage.js";
import { renderBookingSummary } from "../components/booking-summary.js";
import { button } from "../components/button.js";
import { escapeHtml } from "../utils/helpers.js";

export function renderConfirmation() {
  const code = new URLSearchParams(window.location.hash.split("?")[1] || "").get("code");
  const booking = readBookings().find((item) => item.code === code) || null;
  if (!booking) {
    return `<section class="placeholder-page container"><div class="page-heading"><span class="section-overline">BOOKING</span><h1>We couldn't find this booking</h1><p>Return to the homepage to search for another trip.</p></div>${button("Plan another trip", { href: "#/" })}</section>`;
  }
  return `<section class="confirmation-view card"><span class="confirmation-icon" aria-hidden="true">✓</span>
    <h1>You're booked, ${escapeHtml(booking.passenger.name.split(/\s+/)[0])}!</h1>
    <p>Your seats are reserved. No payment was taken in this prototype.</p>
    <span class="confirmation-code">${booking.code}</span>
    ${renderBookingSummary(booking, booking.totalAmount)}
    <div class="placeholder-actions">${button("View my bookings", { href: "#/bookings" })}${button("Done", { href: "#/", variant: "ghost" })}</div>
  </section>`;
}
