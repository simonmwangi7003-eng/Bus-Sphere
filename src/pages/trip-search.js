import { renderBusCard } from "../components/bus-card.js";
import { findTrips } from "../services/booking-service.js";
import { escapeHtml, formatDate } from "../utils/helpers.js";
import { state } from "../state.js";
import { travelClasses } from "../data/mock-data.js";

const pageSize = 5;

function timeOptions(name, title) {
  return `<div class="filter-group"><strong>${title}</strong>
    <label class="filter-option"><input type="checkbox" name="${name}" value="morning"> Morning <span>6am–12pm</span></label>
    <label class="filter-option"><input type="checkbox" name="${name}" value="afternoon"> Afternoon <span>12pm–6pm</span></label>
    <label class="filter-option"><input type="checkbox" name="${name}" value="evening"> Evening <span>6pm–12am</span></label>
    <label class="filter-option"><input type="checkbox" name="${name}" value="overnight"> Overnight <span>12am–6am</span></label>
  </div>`;
}

export function renderTrips(search) {
  if (!search?.origin || !search?.destination) {
    return `<section class="placeholder-page container"><div class="page-heading"><span class="section-overline">TRIP SEARCH</span><h1>Start with a route</h1><p>Choose your departure and arrival cities to see available journeys.</p></div><a class="button" href="#/" data-route-link>Search rides</a></section>`;
  }
  const availableTrips = findTrips(search);
  const currencyLabel = "KSh";
  const isMatatuSearch = search.vehicleType === "matatu";
  const rideTypeLabel = isMatatuSearch ? "Matatu" : search.vehicleType === "coach" ? "Coach bus" : "Any ride";
  const operators = [...new Map(availableTrips.map((trip) => [trip.operatorId, trip.operator])).entries()];
  return `<section class="passenger-content container">
    <div class="results-header"><div><span class="section-overline">YOUR NEXT ADVENTURE</span><h1>Rides from ${escapeHtml(search.origin)} to ${escapeHtml(search.destination)}</h1><p>${escapeHtml(formatDate(search.date))}${search.returnDate ? ` · Return ${escapeHtml(formatDate(search.returnDate))}` : ""} · ${escapeHtml(rideTypeLabel)} · <span id="trip-count" aria-live="polite"></span></p></div>
      <div class="field"><label for="trip-sort">SORT BY</label><select id="trip-sort"><option value="recommended">Recommended</option><option value="price">Lowest fare</option><option value="departure">Earliest departure</option><option value="duration">Shortest journey</option><option value="operator">Operator name</option></select></div>
    </div>
    <div class="results-layout"><aside class="filter-card card"><h2>Filter your trip</h2>
      ${timeOptions("departure-time-filter", "DEPARTURE TIME")}
      ${timeOptions("arrival-time-filter", "ARRIVAL TIME")}
      <div class="filter-group"><strong>PRICE (PER PASSENGER)</strong><div class="filter-range">
        <label class="field-label" for="minimum-price">Min ${currencyLabel}</label><input id="minimum-price" type="number" min="0" step="1" aria-label="Minimum fare">
        <label class="field-label" for="maximum-price">Max ${currencyLabel}</label><input id="maximum-price" type="number" min="0" step="1" aria-label="Maximum fare">
      </div></div>
      <div class="filter-group"><strong>OPERATOR</strong>${operators.length ? operators.map(([id, name]) => `<label class="filter-option"><input type="checkbox" name="operator-filter" value="${escapeHtml(id)}"> ${escapeHtml(name)}</label>`).join("") : '<span class="filter-hint">No operators available</span>'}</div>
      <div class="filter-group"><strong>${isMatatuSearch ? "MATATU FARE" : "TRAVEL CLASS"}</strong>${isMatatuSearch ? '<span class="filter-hint">Matatu trips use a single standard fare.</span>' : travelClasses.map((item) => `<label class="filter-option"><input type="checkbox" name="class-filter" value="${escapeHtml(item.id)}"> ${escapeHtml(item.label)}</label>`).join("")}</div>
      <div class="filter-group"><strong>JOURNEY DURATION (MINUTES)</strong><div class="filter-range">
        <label class="field-label" for="minimum-duration">Min</label><input id="minimum-duration" type="number" min="0" step="15" aria-label="Minimum journey duration in minutes">
        <label class="field-label" for="maximum-duration">Max</label><input id="maximum-duration" type="number" min="0" step="15" aria-label="Maximum journey duration in minutes">
      </div></div>
      <div class="filter-group"><strong>AMENITIES</strong>
        <label class="filter-option"><input type="checkbox" name="amenity-filter" value="wifi"> Free Wi-Fi</label>
        <label class="filter-option"><input type="checkbox" name="amenity-filter" value="power"> Power outlets</label>
        <label class="filter-option"><input type="checkbox" name="amenity-filter" value="restroom"> Restroom</label>
        <label class="filter-option"><input type="checkbox" name="amenity-filter" value="air-conditioning"> Air conditioning</label>
        <label class="filter-option"><input type="checkbox" name="amenity-filter" value="reclining-seats"> Reclining seats</label>
        <label class="filter-option"><input type="checkbox" name="amenity-filter" value="usb"> USB charging</label>
      </div>
      <button class="button ghost" id="clear-filters" type="button">Clear all filters</button>
    </aside><div class="trip-results"><div class="bus-list" id="bus-list" aria-live="polite"></div><button class="button ghost load-more" id="load-more" type="button" hidden>Load more trips</button></div></div>
  </section>`;
}

export function bindTrips(main) {
  if (!state.search?.origin || !state.search?.destination) return;
  const list = main.querySelector("#bus-list");
  const loadMore = main.querySelector("#load-more");
  let visibleCount = pageSize;

  const update = (resetPage = true) => {
    if (resetPage) visibleCount = pageSize;
    const checkedValues = (name) => [...main.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
    const readNumber = (selector) => main.querySelector(selector).value;
    const filters = {
      times: checkedValues("departure-time-filter"),
      arrivalTimes: checkedValues("arrival-time-filter"),
      amenities: checkedValues("amenity-filter"),
      operators: checkedValues("operator-filter"),
      busClasses: checkedValues("class-filter"),
      minimumPrice: readNumber("#minimum-price"),
      maximumPrice: readNumber("#maximum-price"),
      minimumDuration: readNumber("#minimum-duration"),
      maximumDuration: readNumber("#maximum-duration")
    };
    const results = findTrips(state.search, filters, main.querySelector("#trip-sort").value);
    const displayed = results.slice(0, visibleCount);
    main.querySelector("#trip-count").textContent = `${results.length} ${results.length === 1 ? "trip" : "trips"} available`;
    list.innerHTML = results.length
      ? displayed.map(renderBusCard).join("")
      : '<div class="empty-state"><strong>No trips found</strong><p>No bookable rides match this route, date, and filter combination. Try another date or clear your filters.</p><button class="button ghost" id="empty-clear-filters" type="button">Clear all filters</button></div>';
    loadMore.hidden = results.length <= visibleCount;
    const emptyClear = main.querySelector("#empty-clear-filters");
    if (emptyClear) emptyClear.addEventListener("click", clearFilters);
  };

  const clearFilters = () => {
    main.querySelectorAll('.filter-card input[type="checkbox"]').forEach((input) => { input.checked = false; });
    main.querySelectorAll(".filter-range input").forEach((input) => { input.value = ""; });
    update();
  };

  main.querySelector("#trip-sort").addEventListener("change", () => update());
  main.querySelectorAll(".filter-card input").forEach((input) => {
    input.addEventListener(input.type === "checkbox" ? "change" : "input", () => update());
  });
  main.querySelector("#clear-filters").addEventListener("click", clearFilters);
  loadMore.addEventListener("click", () => {
    visibleCount += pageSize;
    update(false);
  });
  update();
}
