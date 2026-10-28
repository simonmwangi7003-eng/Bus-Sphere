import { escapeHtml, formatMoney } from "../utils/helpers.js";
import { button } from "./button.js";

export function renderBusCard(trip) {
  const detailsQuery = new URLSearchParams({
    id: trip.id,
    from: trip.origin,
    to: trip.destination,
    date: trip.date,
    passengers: String(trip.passengers),
    travelClass: trip.travelClass || "standard",
    vehicleType: trip.vehicleType || "all",
    fromTerminal: trip.originTerminal || "",
    toTerminal: trip.destinationTerminal || ""
  });
  return `<article class="bus-card card">
    <div class="bus-main">
      <div class="operator"><div class="operator-logo">${escapeHtml(trip.initials)}</div><div><div class="operator-name">${escapeHtml(trip.operator)}</div><div class="operator-rating">★ ${escapeHtml(trip.rating)} <span>(${Number(trip.reviews).toLocaleString()} reviews)</span></div></div></div>
      <div class="times"><div class="time-block"><b>${escapeHtml(trip.departure)}</b><small>${escapeHtml(trip.origin)}</small></div><div class="journey-line"><i></i>${escapeHtml(trip.duration)}</div><div class="time-block"><b>${escapeHtml(trip.arrival)}</b><small>${escapeHtml(trip.destination)}</small></div></div>
      <div class="bus-features">${trip.amenities.map((amenity) => `<span class="feature-chip">${escapeHtml(amenity)}</span>`).join("")}</div>
      <div class="bus-price"><span class="bus-class-badge">${escapeHtml(trip.busClass)}${trip.vehicleType === "matatu" ? "" : " coach"}</span><b>${escapeHtml(formatMoney(trip.price, trip.currency))}</b><small>per traveler</small>${button("View trip details", { href: `#/trip?${detailsQuery.toString()}` })}</div>
    </div>
    <div class="bus-details-row"><span><small>FROM</small><strong>${escapeHtml(trip.originTerminal || trip.terminalFrom)}</strong></span><span><small>ARRIVES AT</small><strong>${escapeHtml(trip.destinationTerminal || trip.terminalTo)}</strong></span><span class="seat-availability">● ${escapeHtml(trip.seatsLeft)} seats available</span></div>
    <div class="bus-meta"><span>Free cancellation up to 24 hours before departure</span><span>${escapeHtml(trip.amenities.join(" · "))}</span></div>
  </article>`;
}
