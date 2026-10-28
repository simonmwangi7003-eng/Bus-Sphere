import { localDateString } from "./helpers.js";

export function validateRouteSearch({ origin, destination, date, returnDate, passengers }) {
  if (!origin || !destination) return "Choose a departure and arrival city.";
  if (String(origin).trim().toLowerCase() === String(destination).trim().toLowerCase()) return "Choose two different cities to find available rides.";
  const isValidDate = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
  };
  if (!isValidDate(date) || date < localDateString()) return "Please choose today or a future departure date.";
  if (returnDate && (!isValidDate(returnDate) || returnDate < date)) return "Your return date must be the same day as or after departure.";
  if (!Number.isInteger(Number(passengers)) || Number(passengers) < 1 || Number(passengers) > 4) return "Choose between one and four travelers.";
  return "";
}

export function validatePassengerForm(form) {
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  if (name.length < 2) return "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  return "";
}
