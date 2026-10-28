import { cities, terminals, travelClasses } from "../data/mock-data.js";
import { localDateString } from "../utils/helpers.js";
import { listRecords } from "../services/storage.js";

function cityOptions(selected) {
  return cities.map((city) => `<option value="${city}"${city === selected ? " selected" : ""}>${city}</option>`).join("");
}

function terminalOptions(city, selected = (terminals[city] || [])[0]) {
  return (terminals[city] || []).map((terminal) => `<option value="${terminal}"${terminal === selected ? " selected" : ""}>${terminal}</option>`).join("");
}

export function routeTerminalDefaults(origin, destination) {
  const route = listRecords("routes").find((record) => record.active
    && record.originCity === origin
    && record.destinationCity === destination);
  if (!route) return {};
  const terminalById = new Map(listRecords("terminals").map((terminal) => [terminal.id, terminal.name]));
  return {
    origin: terminalById.get(route.originTerminalId),
    destination: terminalById.get(route.destinationTerminalId)
  };
}

export function renderRouteSearch(search = {}) {
  search = search || {};
  const today = localDateString();
  const origin = cities.includes(search.origin) ? search.origin : "Nairobi";
  const destination = cities.includes(search.destination) ? search.destination : "Mombasa";
  const routeDefaults = routeTerminalDefaults(origin, destination);
  const passengerCount = Number(search.passengers) || 1;
  const vehicleType = search.vehicleType || "all";
  const classDisabled = vehicleType !== "coach";
  const travelClass = classDisabled ? "standard" : search.travelClass || "standard";
  return `<form class="route-search" id="route-search-form" novalidate>
    <div class="search-title"><div><span class="section-overline">PLAN YOUR JOURNEY</span><h2>Where would you like to go?</h2></div><span class="secure-note">◆ Great fares. No surprises.</span></div>
    <div class="search-grid">
      <div class="field"><label for="origin">FROM CITY</label><select id="origin" name="origin">${cityOptions(origin)}</select></div>
      <div class="field"><label for="origin-terminal">DEPARTURE TERMINAL</label><select id="origin-terminal" name="originTerminal" aria-label="Departure terminal">${terminalOptions(origin, search.originTerminal || routeDefaults.origin || (terminals[origin] || [])[0])}</select></div>
      <div class="field"><label for="destination">TO CITY</label><select id="destination" name="destination">${cityOptions(destination)}</select></div>
      <div class="field"><label for="destination-terminal">ARRIVAL TERMINAL</label><select id="destination-terminal" name="destinationTerminal" aria-label="Arrival terminal">${terminalOptions(destination, search.destinationTerminal || routeDefaults.destination || (terminals[destination] || [])[0])}</select></div>
      <div class="field"><label for="travel-date">DEPARTURE DATE</label><input id="travel-date" name="date" type="date" min="${today}" value="${search.date || today}" required /></div>
      <div class="field"><label for="return-date">RETURN DATE <span class="optional-label">OPTIONAL</span></label><input id="return-date" name="returnDate" type="date" min="${search.date || today}" value="${search.returnDate || ""}" aria-label="Optional return date" /></div>
      <div class="field"><label for="passengers">PASSENGERS</label><select id="passengers" name="passengers" aria-label="Number of passengers">${[1, 2, 3, 4].map((count) => `<option value="${count}"${count === passengerCount ? " selected" : ""}>${count} ${count === 1 ? "passenger" : "passengers"}</option>`).join("")}</select></div>
      <div class="field"><label for="vehicle-type">RIDE TYPE</label><select id="vehicle-type" name="vehicleType"><option value="all"${vehicleType === "all" ? " selected" : ""}>Any ride</option><option value="coach"${vehicleType === "coach" ? " selected" : ""}>Coach bus</option><option value="matatu"${vehicleType === "matatu" ? " selected" : ""}>Matatu</option></select></div>
      <div class="field"><label for="travel-class">TRAVEL CLASS</label><select id="travel-class" name="travelClass"${classDisabled ? " disabled" : ""}>${travelClasses.map((item) => `<option value="${item.id}"${item.id === travelClass ? " selected" : ""}>${item.label}</option>`).join("")}</select></div>
      <button class="button" type="submit">Find my ride <span aria-hidden="true">→</span></button>
    </div>
    <p class="search-error" id="search-error" role="alert"></p>
  </form>`;
}

export function updateTerminalOptions(city, select, selected) {
  const options = terminals[city] || [];
  select.replaceChildren(...options.map((terminal, index) => {
    const option = document.createElement("option");
    option.value = terminal;
    option.textContent = terminal;
    if (terminal === selected || (!selected && index === 0)) option.selected = true;
    return option;
  }));
}
