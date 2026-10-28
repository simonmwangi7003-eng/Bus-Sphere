import { getSelectedTrip } from "./trip-details.js";
import { renderBookingSummary } from "../components/booking-summary.js";
import { validatePassengerForm } from "../utils/validation.js";
import { notify } from "../components/notification.js";
import { reserveTrip } from "../services/booking-service.js";
import { state } from "../state.js";
import { navigate } from "../navigation.js";
import { getTripSeatInventory, validateSeatSelection } from "../services/booking-service.js";
import { getSeatFare, getSeatsTotal } from "../utils/seats.js";

export function renderCheckout() {
  const trip = getSelectedTrip();
  if (!trip) {
    return `<section class="placeholder-page container"><div class="page-heading"><span class="section-overline">CHECKOUT</span><h1>This trip is no longer available</h1><p>Search again to find a bookable trip.</p></div><a class="button" href="#/" data-route-link>Search trips</a></section>`;
  }
  const search = state.search || { origin: "Nairobi", destination: "Mombasa", date: new Date().toISOString().slice(0, 10), passengers: 1 };
  if (!state.seats.length) {
    return `<section class="placeholder-page container"><div class="page-heading"><span class="section-overline">CHECKOUT</span><h1>Select your seats first</h1><p>Choose your seats before continuing to checkout.</p></div><a class="button" href="#/seats" data-route-link>Choose seats</a></section>`;
  }
  const seatValidation = validateSeatSelection(trip.id, state.seats, Number(search.passengers || 1));
  if (!seatValidation.valid) {
    return `<section class="placeholder-page container"><div class="page-heading"><span class="section-overline">SEAT AVAILABILITY</span><h1>Please choose your seats again</h1><p>${seatValidation.error}</p></div><a class="button" href="#/seats" data-route-link>Review available seats</a></section>`;
  }
  const inventory = getTripSeatInventory(trip.id);
  const bookingFee = Number(trip.scheduledTrip?.fareConfiguration?.bookingFee) || 0;
  const seatTotal = getSeatsTotal(state.seats, inventory, trip.price) + bookingFee * state.seats.length;
  const seatFares = state.seats.map((seat) => ({
    seat, fare: getSeatFare(inventory.find((entry) => entry.number === String(seat)), trip.price)
  }));
  return `<section class="placeholder-page container"><div class="page-heading"><span class="section-overline">ONE LAST THING</span><h1>Passenger details</h1><p>Enter your contact information to reserve your seats. This prototype does not process payments.</p></div>
    <div class="placeholder-panel card"><h2>Your trip</h2>${renderBookingSummary({ ...search, originTerminal: trip.originTerminal, destinationTerminal: trip.destinationTerminal, busClass: trip.busClass, vehicleLabel: trip.vehicleLabel, currency: trip.currency, departure: trip.departure, arrival: trip.arrival, seats: state.seats, seatFares }, seatTotal)}
      <form class="checkout-form" id="checkout-form" novalidate>
        <div class="field"><label for="passenger-name">FULL NAME</label><input id="passenger-name" name="name" autocomplete="name" required minlength="2" placeholder="Your name"></div>
        <div class="field"><label for="passenger-email">EMAIL ADDRESS</label><input id="passenger-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com"></div>
        <p class="search-error" id="checkout-error" role="alert"></p>
        <button class="button" type="submit">Reserve my seats</button>
      </form></div></section>`;
}

export function bindCheckout(main) {
  const form = main.querySelector("#checkout-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const error = validatePassengerForm(form);
    if (error) {
      main.querySelector("#checkout-error").textContent = error;
      notify(error, "error");
      return;
    }
    const formData = new FormData(form);
    const trip = getSelectedTrip();
    const search = state.search || { origin: "Nairobi", destination: "Mombasa", date: new Date().toISOString().slice(0, 10), passengers: 1 };
    try {
      state.booking = reserveTrip({
        search,
        trip,
        seats: state.seats,
        passenger: { name: String(formData.get("name")).trim(), email: String(formData.get("email")).trim() }
      });
      navigate(`/confirmation?code=${encodeURIComponent(state.booking.code)}`);
    } catch (saveError) {
      main.querySelector("#checkout-error").textContent = saveError.message;
      notify(saveError.message, "error");
    }
  });
}
