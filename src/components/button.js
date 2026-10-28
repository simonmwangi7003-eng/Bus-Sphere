import { escapeHtml } from "../utils/helpers.js";

export function button(label, { href = "", variant = "", type = "button", disabled = false, action = "" } = {}) {
  const classes = `button${variant ? ` ${variant}` : ""}`;
  const disabledAttribute = disabled ? " disabled" : "";
  const actionAttribute = action ? ` data-action="${escapeHtml(action)}"` : "";
  if (href) return `<a class="${classes}" href="${escapeHtml(href)}" data-route-link${actionAttribute}>${escapeHtml(label)}</a>`;
  return `<button class="${classes}" type="${type}"${disabledAttribute}${actionAttribute}>${escapeHtml(label)}</button>`;
}
