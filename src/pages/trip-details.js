import { button } from "../components/button.js";
import { state } from "../state.js";
import { navigate } from "../navigation.js";
import { escapeHtml, formatDate, formatMoney } from "../utils/helpers.js";
import { findTrips } from "../services/booking-service.js";
import { listRecords } from "../services/storage.js";

const featureLabels = {
  wifi: "Free Wi-Fi",
  power: "Power outlets",
  restroom: "Restroom",
  "reclining-seats": "Reclining seats",
  "air-conditioning": "Air conditioning",
  "reading-light": "Reading lights",
  usb: "USB charging"
};

export function getSelectedTrip() {
  const parameters = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const id = parameters.get("id") || state.selectedTrip?.id;
  if (!id || !state.search?.origin || !state.search?.destination) return null;

  const search = {
    ...state.search,
    travelClass: parameters.get("travelClass") || state.search.travelClass || "standard",
    passengers: Number(parameters.get("passengers") || state.search.passengers || 1)
  };
  const trip = findTrips(search).find((candidate) => candidate.id === id);
  if (!trip) {
    state.selectedTrip = null;
    return null;
  }
  const scheduledTrip = listRecords("scheduledTrips").find((entry) => entry.id === id);
  state.selectedTrip = {
    ...trip, scheduledTrip
  };
  return state.selectedTrip;
}

function unavailableDetails() {
  return `<section class="placeholder-page container"><div class="page-heading"><span class="section-overline">TRIP DETAILS</span><h1>This trip is no longer available</h1><p>It may have departed, reached its booking cutoff, or sold out. Search again to find a bookable trip.</p></div><a class="button" href="#/" data-route-link>Search trips</a></section>`;
}

export function renderTripDetails() {
  const trip = getSelectedTrip();
  if (!trip) return unavailableDetails();

  const backQuery = new URLSearchParams({
    from: state.search.origin,
    to: state.search.destination,
    date: state.search.date,
    passengers: String(state.search.passengers || 1),
    travelClass: state.search.travelClass || "standard",
    vehicleType: state.search.vehicleType || "all"
  });
  if (state.search.returnDate) backQuery.set("returnDate", state.search.returnDate);
  if (state.search.originTerminal) backQuery.set("fromTerminal", state.search.originTerminal);
  if (state.search.destinationTerminal) backQuery.set("toTerminal", state.search.destinationTerminal);
  const scheduledTrip = trip.scheduledTrip;
  const route = listRecords("routes").find((record) => record.id === scheduledTrip.routeId);
  const bus = listRecords("buses").find((record) => record.id === scheduledTrip.busId);
  const operator = listRecords("operators").find((record) => record.id === scheduledTrip.operatorId);
  const terminals = new Map(listRecords("terminals").map((terminal) => [terminal.id, terminal]));
  const fromTerminal = terminals.get(route.originTerminalId);
  const toTerminal = terminals.get(route.destinationTerminalId);
  const fareRules = [
    `Displayed fare is per passenger${trip.vehicleType === "matatu" ? " in Kenyan shillings" : " and includes the selected coach class"}.`,
    ...(Number(scheduledTrip.fareConfiguration.bookingFee) > 0
      ? [`A ${formatMoney(scheduledTrip.fareConfiguration.bookingFee, trip.currency)} demo booking fee per passenger is added during checkout.`]
      : []),
    "No payment is processed by this prototype."
  ];
  const amenities = trip.amenities.map((feature) => featureLabels[feature] || feature);

  return `<section class="trip-detail-page container">
    <a class="trip-back-link" href="#/trips?${backQuery.toString()}" data-route-link>← Back to results</a>
    <div class="page-heading"><span class="section-overline">TRIP DETAILS · ${escapeHtml(scheduledTrip.id)}</span><h1>${escapeHtml(trip.origin)} to ${escapeHtml(trip.destination)}</h1><p>${escapeHtml(formatDate(trip.date))} · ${escapeHtml(trip.operator)} · ${escapeHtml(trip.vehicleLabel)}${trip.vehicleType === "coach" ? ` · ${escapeHtml(trip.fareClass)} fare` : ""}</p></div>
    <article class="trip-detail-card card">
      <div class="trip-detail-summary">
        <div class="trip-detail-route">
          <div><strong>${escapeHtml(trip.departure)}</strong><span>${escapeHtml(trip.origin)}</span><small>${escapeHtml(fromTerminal?.name || "")}</small></div>
          <div class="trip-detail-duration"><span></span><small>${escapeHtml(trip.duration)}</small></div>
          <div><strong>${escapeHtml(trip.arrival)}</strong><span>${escapeHtml(trip.destination)}</span><small>${escapeHtml(toTerminal?.name || "")}${trip.arrivalDate !== trip.date ? ` · ${escapeHtml(formatDate(trip.arrivalDate))}` : ""}</small></div>
        </div>
        <div class="trip-detail-fare"><span>${escapeHtml(trip.seatsLeft)} seats available</span><strong>${escapeHtml(formatMoney(trip.price, trip.currency))}</strong><small>per passenger</small>
          ${button("Choose seats", { action: "choose-seats" })}
        </div>
      </div>
      <div class="trip-detail-section">
        <h2>Journey timetable</h2>
        <div class="timetable-row"><time>${escapeHtml(trip.departure)}</time><div><strong>Depart ${escapeHtml(trip.origin)}</strong><span>${escapeHtml(fromTerminal?.name || "")}</span></div></div>
        <div class="timetable-row"><time>${escapeHtml(trip.arrival)}</time><div><strong>Arrive ${escapeHtml(trip.destination)}</strong><span>${escapeHtml(toTerminal?.name || "")}${trip.arrivalDate !== trip.date ? ` · ${escapeHtml(formatDate(trip.arrivalDate))}` : ""}</span></div></div>
        <p class="trip-detail-note">Times are local to each terminal. Allow at least 30 minutes to board.</p>
      </div>
      <div class="trip-detail-columns">
        <section class="trip-detail-section"><h2>Operator & ride</h2><p><strong>${escapeHtml(trip.operator)}</strong>${operator?.profile?.description ? ` — ${escapeHtml(operator.profile.description)}` : ""}</p><p>${escapeHtml(bus?.model || trip.vehicleLabel)} · ${escapeHtml(trip.vehicleLabel)}</p></section>
        <section class="trip-detail-section"><h2>Onboard amenities</h2><p>${amenities.length ? amenities.map(escapeHtml).join(" · ") : `No amenities listed for this ${escapeHtml(trip.vehicleLabel.toLowerCase())}.`}</p></section>
      </div>
      <div class="trip-detail-columns">
        <section class="trip-detail-section"><h2>Fare conditions</h2><p>${escapeHtml(trip.vehicleLabel)} fare: ${escapeHtml(formatMoney(trip.price, trip.currency))} per passenger.</p><ul>${fareRules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("")}</ul></section>
        <section class="trip-detail-section"><h2>Luggage & passenger requirements</h2><ul><li>One carry-on and one stored bag per passenger are included in this demo policy.</li><li>Keep valuables and travel documents with you; operator size and weight limits may apply.</li><li>Arrive at the departure terminal at least 30 minutes before departure with valid photo identification.</li><li>Each traveler must have a ticket and occupy their own reserved seat.</li></ul></section>
      </div>
      <section class="trip-detail-section"><h2>Cancellation policy</h2><p>Free cancellation is available up to 24 hours before departure in this demo. Changes and refunds are not processed by the prototype; final operator terms apply.</p></section>
    </article>
  </section>`;
}

export function bindTripDetails(main) {
  const chooseSeats = main.querySelector('[data-action="choose-seats"]');
  if (chooseSeats) chooseSeats.addEventListener("click", () => navigate("/seats"));
}
