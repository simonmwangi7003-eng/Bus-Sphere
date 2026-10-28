import { renderSeatMap } from "../components/seat-map.js";
import { getSelectedTrip } from "./trip-details.js";
import { state } from "../state.js";
import { navigate } from "../navigation.js";
import { button } from "../components/button.js";
import { getTripSeatInventory, validateSeatSelection } from "../services/booking-service.js";
import { getSeatFare, getSeatsTotal } from "../utils/seats.js";
import { escapeHtml, formatMoney } from "../utils/helpers.js";

export function renderSeats() {
  const trip = getSelectedTrip();
  if (!trip) {
    return `<section class="placeholder-page container"><div class="page-heading"><span class="section-overline">SEAT SELECTION</span><h1>This trip is no longer available</h1><p>Search again to find a bookable trip.</p></div><a class="button" href="#/" data-route-link>Search trips</a></section>`;
  }
  const search = state.search || { origin: "Nairobi", destination: "Mombasa", passengers: 1 };
  const count = Number(search.passengers || 1);
  if (!Number.isInteger(count) || count < 1 || count > 4) {
    return `<section class="placeholder-page container"><div class="page-heading"><span class="section-overline">SEAT SELECTION</span><h1>Invalid passenger count</h1><p>Search again and choose between one and four passengers.</p></div><a class="button" href="#/" data-route-link>Search trips</a></section>`;
  }
  const inventory = getTripSeatInventory(trip.id);
  const categories = [...new Set(inventory.map((seat) => seat.category).filter(Boolean))];
  return `<section class="placeholder-page container"><div class="page-heading"><span class="section-overline">MAKE IT YOURS</span><h1>Choose your seats</h1><p>Select exactly ${count} ${count === 1 ? "seat" : "seats"} for your trip. Your selection is not held or reserved until your booking is confirmed.</p></div>
    <article class="placeholder-panel card"><h2>${escapeHtml(trip.operator)} · ${escapeHtml(trip.departure)}</h2>${renderSeatMap(trip.id, trip.price, trip.currency)}
      ${categories.length ? `<p class="seat-category-note">Seat categories: ${categories.map(escapeHtml).join(" · ")}</p>` : ""}
      <div class="seat-summary"><p id="seat-count" aria-live="polite">No seats selected</p><div class="seat-total" id="seat-total">${escapeHtml(formatMoney(0))}</div><p class="seat-price-note" id="seat-price-note">Select ${count} ${count === 1 ? "seat" : "seats"} to continue.</p><p class="seat-selection-error" id="seat-selection-error" role="alert"></p><button class="button" id="continue-seats" type="button" disabled>Continue to checkout</button></div>
      <div class="placeholder-actions">${button("Back to trip", { href: `#/trip?id=${encodeURIComponent(trip.id)}`, variant: "ghost" })}</div>
    </article></section>`;
}

export function bindSeats(main) {
  const trip = getSelectedTrip();
  if (!trip) return;
  const maximum = Number(state.search?.passengers || 1);
  if (state.seatTripId !== trip.id) state.seats = [];
  state.seatTripId = trip.id;
  const initialInventory = getTripSeatInventory(trip.id);
  const initiallyAvailable = new Set(initialInventory.filter((seat) => seat.status === "available").map((seat) => seat.number));
  state.seats = state.seats.map(String).filter((seat) => initiallyAvailable.has(seat)).slice(0, maximum);
  const continueButton = main.querySelector("#continue-seats");
  const bindSeatButtons = () => main.querySelectorAll("[data-seat]").forEach((seat) => {
    seat.addEventListener("click", () => {
      const number = String(seat.dataset.seat);
      const index = state.seats.indexOf(number);
      if (index >= 0) {
        state.seats.splice(index, 1);
        seat.classList.remove("selected");
        seat.setAttribute("aria-pressed", "false");
      } else {
        if (state.seats.length >= maximum) {
          main.querySelector("#seat-selection-error").textContent = `You can select up to ${maximum} ${maximum === 1 ? "seat" : "seats"} for this booking.`;
          return;
        }
        const latestInventory = getTripSeatInventory(trip.id);
        const latestSeat = latestInventory.find((entry) => entry.number === number);
        if (!latestSeat || latestSeat.status !== "available") {
          const message = `Seat ${number} is no longer available. Choose a different seat.`;
          main.querySelector("#seat-selection-error").textContent = message;
          seat.className = `seat seat-${latestSeat?.status || "unavailable"}`;
          seat.dataset.seatStatus = latestSeat?.status || "unavailable";
          seat.disabled = true;
          seat.setAttribute("aria-label", `Seat ${number}, ${latestSeat?.status || "unavailable"}`);
          seat.querySelector(".seat-state-text").textContent = latestSeat?.status || "unavailable";
          return;
        }
        state.seats.push(number);
        seat.classList.add("selected");
        seat.setAttribute("aria-pressed", "true");
      }
      state.seats.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      updateSummary();
    });
  });

  const updateSummary = () => {
      const inventory = getTripSeatInventory(trip.id);
      const seatsByNumber = new Map(inventory.map((seat) => [seat.number, seat]));
      const unavailableSelections = state.seats.filter((number) => seatsByNumber.get(number)?.status !== "available");
      if (unavailableSelections.length) {
        state.seats = state.seats.filter((number) => !unavailableSelections.includes(number));
        main.querySelector("#seat-selection-error").textContent = `Seat${unavailableSelections.length > 1 ? "s" : ""} ${unavailableSelections.join(", ")} became unavailable. Please choose again.`;
      }
      main.querySelectorAll("[data-seat]").forEach((button) => {
        const number = String(button.dataset.seat);
        const seat = seatsByNumber.get(number);
        if (!seat) return;
        button.className = `seat seat-${seat.status}${state.seats.includes(number) ? " selected" : ""}${seat.category ? ` seat-category-${seat.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : ""}`;
        button.disabled = seat.status !== "available";
        button.setAttribute("aria-pressed", String(state.seats.includes(number)));
        button.setAttribute("aria-label", `Seat ${number}, ${state.seats.includes(number) ? "selected" : seat.status}${seat.category ? `, ${seat.category} seat` : ""}, ${formatMoney(getSeatFare(seat, trip.price), trip.currency)}`);
        button.dataset.seatStatus = seat.status;
        button.querySelector(".seat-state-text").textContent = state.seats.includes(number) ? "selected" : seat.status;
      });
      const total = getSeatsTotal(state.seats, inventory, trip.price);
      main.querySelector("#seat-count").textContent = state.seats.length
        ? `Seat${state.seats.length > 1 ? "s" : ""} ${state.seats.join(", ")}`
        : "No seats selected";
      main.querySelector("#seat-total").textContent = formatMoney(total, trip.currency);
      main.querySelector("#seat-price-note").textContent = state.seats.length
        ? state.seats.map((number) => {
          const seat = inventory.find((entry) => entry.number === number);
          return `${number}: ${formatMoney(getSeatFare(seat, trip.price), trip.currency)}`;
        }).join(" · ")
        : `Select ${maximum} ${maximum === 1 ? "seat" : "seats"} to continue.`;
      if (!unavailableSelections.length) main.querySelector("#seat-selection-error").textContent = "";
      continueButton.disabled = state.seats.length !== maximum;
  };

  bindSeatButtons();
  updateSummary();
  continueButton.addEventListener("click", () => {
    const validation = validateSeatSelection(trip.id, state.seats, maximum);
    if (!validation.valid) {
      main.querySelector("#seat-selection-error").textContent = validation.error;
      updateSummary();
      return;
    }
    if (state.seats.length === maximum) navigate("/checkout");
  });
}
