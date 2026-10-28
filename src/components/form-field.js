import { escapeHtml } from "../utils/helpers.js";

export function formField({ label, name, type = "text", value = "", required = false, options = [], min = "" }) {
  const requiredAttribute = required ? " required" : "";
  const safeName = escapeHtml(name);
  const safeLabel = escapeHtml(label);
  if (options.length) {
    return `<div class="field"><label for="${safeName}">${safeLabel}</label><select id="${safeName}" name="${safeName}"${requiredAttribute}>${options.map((option) => {
      const optionValue = typeof option === "string" ? option : option.value;
      const optionLabel = typeof option === "string" ? option : option.label;
      return `<option value="${escapeHtml(optionValue)}"${String(value) === String(optionValue) ? " selected" : ""}>${escapeHtml(optionLabel)}</option>`;
    }).join("")}</select></div>`;
  }
  return `<div class="field"><label for="${safeName}">${safeLabel}</label><input id="${safeName}" name="${safeName}" type="${escapeHtml(type)}" value="${escapeHtml(value)}"${min ? ` min="${escapeHtml(min)}"` : ""}${requiredAttribute} /></div>`;
}
