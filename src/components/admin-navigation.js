import { getAdminSections } from "../services/admin-service.js";

export function renderAdminNavigation(path) {
  return `<div class="admin-shell">
    <aside class="admin-sidebar"><p class="admin-sidebar-title">BUSSPHERE ADMIN</p><nav class="admin-nav" aria-label="Administration">
      ${getAdminSections().map((section) => `<a href="#${section.path}" data-route-link class="${path === section.path ? "active" : ""}">${section.label}</a>`).join("")}
    </nav></aside>
    <section class="admin-main" data-admin-content></section>
  </div>`;
}
