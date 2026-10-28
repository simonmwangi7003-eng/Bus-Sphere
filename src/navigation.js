import { state } from "./state.js";

export const passengerLinks = [
  { path: "/", label: "Book a trip" },
  { path: "/routes", label: "Explore routes" },
  { path: "/stories", label: "Travel stories" },
  { path: "/support", label: "Passenger support" }
];

export function navigate(path) {
  let normalized = path.startsWith("/") ? path : `/${path}`;
  if (/^\/(trip|seats|checkout|confirmation)(\?|$)/.test(normalized)) {
    const queryStart = normalized.indexOf("?");
    const pathname = queryStart < 0 ? normalized : normalized.slice(0, queryStart);
    const parameters = new URLSearchParams(queryStart < 0 ? "" : normalized.slice(queryStart + 1));
    if (state.selectedTrip && !parameters.has("id")) parameters.set("id", state.selectedTrip.id);
    if (state.search) {
      parameters.set("from", state.search.origin);
      parameters.set("to", state.search.destination);
      parameters.set("date", state.search.date);
      if (state.search.returnDate) parameters.set("returnDate", state.search.returnDate);
      if (state.search.originTerminal) parameters.set("fromTerminal", state.search.originTerminal);
      if (state.search.destinationTerminal) parameters.set("toTerminal", state.search.destinationTerminal);
      parameters.set("passengers", String(state.search.passengers));
      if (state.search.travelClass) parameters.set("travelClass", state.search.travelClass);
      if (state.search.vehicleType) parameters.set("vehicleType", state.search.vehicleType);
    }
    normalized = `${pathname}?${parameters.toString()}`;
  }
  if (window.location.hash.slice(1) === normalized) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = normalized;
  }
}

export function currentPath() {
  const raw = window.location.hash.slice(1) || "/";
  return raw.split("?")[0] || "/";
}

export function currentQuery() {
  const raw = window.location.hash.slice(1);
  return new URLSearchParams(raw.includes("?") ? raw.slice(raw.indexOf("?") + 1) : "");
}
