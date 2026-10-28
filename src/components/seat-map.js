import { listRecords } from "../services/storage.js";
import { getSeatInventory, getSeatFare } from "../utils/seats.js";
import { escapeHtml, formatMoney } from "../utils/helpers.js";

export function renderSeatMap(tripId, baseFare = 0, currency = "KES") {
  const trip = listRecords("scheduledTrips").find((record) => record.id === tripId);
  if (!trip) return '<p class="seat-map-error" role="alert">The seat layout for this trip could not be loaded. Search for another trip.</p>';

  const layout = trip.seatLayout || {};
  const inventory = getSeatInventory(trip, listRecords("bookings"));
  const columns = Math.max(1, ...inventory.map((seat) => seat.column));
  const aisleAfterColumn = Number(layout.aisleAfterColumn) || 0;
  const hasAisle = aisleAfterColumn > 0 && aisleAfterColumn < columns;
  const gridColumns = columns + Number(hasAisle);
  const gridTemplateColumns = Array.from({ length: gridColumns }, (_, index) =>
    hasAisle && index === aisleAfterColumn ? "var(--aisle-track)" : "var(--seat-track)"
  ).join(" ");
  const rows = Math.max(Number(layout.rows) || 0, ...inventory.map((seat) => seat.row));
  const buttons = inventory.map((seat) => {
    const cssColumn = seat.column + Number(hasAisle && seat.column > aisleAfterColumn);
    const stateLabel = seat.status === "available" ? "available" : seat.status;
    const fare = getSeatFare(seat, baseFare);
    const details = [
      `Seat ${seat.number}`,
      stateLabel,
      seat.category ? `${seat.category} seat` : "",
      formatMoney(fare, currency)
    ].filter(Boolean).join(", ");
    return `<button class="seat seat-${seat.status}${seat.category ? ` seat-category-${escapeHtml(seat.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}` : ""}" type="button" data-seat="${escapeHtml(seat.number)}" data-seat-fare="${escapeHtml(fare)}" data-seat-status="${escapeHtml(seat.status)}" aria-label="${escapeHtml(details)}"${seat.category ? ` title="${escapeHtml(seat.category)}"` : ""} aria-pressed="false"${seat.status !== "available" ? " disabled" : ""} style="grid-column:${cssColumn};grid-row:${seat.row}">${escapeHtml(seat.number)}<span class="seat-fare">${escapeHtml(formatMoney(fare, currency))}</span>${seat.category ? `<span class="seat-category-label">${escapeHtml(seat.category)}</span>` : ""}<span class="seat-state-text">${escapeHtml(stateLabel)}</span></button>`;
  }).join("");

  const aisle = hasAisle ? `<span class="seat-aisle" aria-hidden="true" style="grid-column:${aisleAfterColumn + 1};grid-row:1 / span ${rows}"></span>` : "";
  return `<div class="bus-seat-map">
    <div class="bus-driver" aria-label="Driver position"><span aria-hidden="true">◉</span> Driver · Front of bus</div>
    <div class="seat-layout" role="group" aria-label="Bus seat selection" style="--seat-rows:${rows};--seat-grid-template:${gridTemplateColumns}">${aisle}${buttons}</div>
  </div>
  <div class="seat-legend" role="list" aria-label="Seat availability legend">
    <span role="listitem"><i class="legend-square available" aria-hidden="true"></i> Available</span>
    <span role="listitem"><i class="legend-square chosen" aria-hidden="true"></i> Selected</span>
    <span role="listitem"><i class="legend-square booked" aria-hidden="true"></i> Booked</span>
    <span role="listitem"><i class="legend-square blocked" aria-hidden="true"></i> Blocked</span>
    <span role="listitem"><i class="legend-square unavailable" aria-hidden="true"></i> Unavailable</span>
  </div>`;
}
