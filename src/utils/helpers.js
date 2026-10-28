export function formatDate(dateString, options = { weekday: "short", month: "short", day: "numeric", year: "numeric" }) {
  if (!dateString) return "";
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-US", options);
}

export function localDateString(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

export function createId(prefix = "BS") {
  return `${prefix}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function cityLabel(city) {
  return city;
}

export function formatMoney(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);
}
