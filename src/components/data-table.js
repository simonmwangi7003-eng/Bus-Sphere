import { escapeHtml } from "../utils/helpers.js";

export function renderDataTable(columns, rows, emptyMessage = "No records to display yet.") {
  if (!rows.length) return `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
  return `<div class="data-table-wrap"><table class="data-table"><thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead><tbody>
    ${rows.map((row) => `<tr>${columns.map((column) => {
      const value = row[column.key] ?? "—";
      if (column.key === "status") return `<td><span class="status-badge${value === "Pending" ? " pending" : value === "Cancelled" ? " cancelled" : ""}">${escapeHtml(value)}</span></td>`;
      return `<td>${escapeHtml(value)}</td>`;
    }).join("")}</tr>`).join("")}
  </tbody></table></div>`;
}
