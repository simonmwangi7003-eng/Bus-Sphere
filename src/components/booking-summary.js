import { formatDate, escapeHtml, formatMoney } from "../utils/helpers.js";

export function renderBookingSummary(booking, total) {
  const currency = "KES";
  const rideLabel = booking.vehicleLabel || `${booking.busClass || "Coach"} coach`;
  return `<div class="booking-summary"><strong>${escapeHtml(booking.origin)} → ${escapeHtml(booking.destination)}</strong><br>
    ${booking.originTerminal ? `${escapeHtml(booking.originTerminal)} → ${escapeHtml(booking.destinationTerminal || "")}<br>` : ""}
    ${escapeHtml(formatDate(booking.date))} · ${escapeHtml(booking.departure || "")}${booking.arrival ? ` – ${escapeHtml(booking.arrival)}` : ""}<br>
    ${booking.returnDate ? `Return ${escapeHtml(formatDate(booking.returnDate))}<br>` : ""}
    ${rideLabel ? `${escapeHtml(rideLabel)} · ` : ""}
    ${booking.seats?.length ? `Seat${booking.seats.length > 1 ? "s" : ""} ${booking.seats.map(escapeHtml).join(", ")}${booking.seatFares?.length ? ` (${booking.seatFares.map((entry) => `${escapeHtml(entry.seat)} ${escapeHtml(formatMoney(entry.fare, currency))}`).join(", ")})` : ""} · ` : ""}
    ${total !== undefined ? `<strong>${escapeHtml(formatMoney(total, currency))} total</strong>` : ""}</div>`;
}
