import { getAdminOverview, getAdminRows } from "../services/admin-service.js";
import { renderDataTable } from "../components/data-table.js";
import { adminSections } from "../data/mock-data.js";
import { COLLECTIONS } from "../services/storage.js";

const definitions = {
  "/admin/buses": { title: "Vehicle management", description: "Review coach and matatu availability, vehicle details, and maintenance status.", data: "buses", columns: [{ key: "id", label: "REGISTRATION" }, { key: "name", label: "VEHICLE MODEL" }, { key: "capacity", label: "TYPE & CAPACITY" }, { key: "status", label: "STATUS" }] },
  "/admin/routes": { title: "Route management", description: "Manage the routes that connect BusSphere terminals.", data: "routes", columns: [{ key: "id", label: "ROUTE ID" }, { key: "name", label: "ROUTE" }, { key: "capacity", label: "DISTANCE" }, { key: "status", label: "STATUS" }] },
  "/admin/terminals": { title: "Terminal management", description: "Organize stop information and passenger terminal facilities.", data: "terminals", columns: [{ key: "id", label: "TERMINAL" }, { key: "name", label: "NAME" }, { key: "capacity", label: "CITY" }, { key: "status", label: "STATUS" }] },
  "/admin/schedules": { title: "Schedule management", description: "Review the generated sample departures and assigned services.", data: "schedules", columns: [{ key: "id", label: "TRIP" }, { key: "name", label: "ROUTE" }, { key: "capacity", label: "DEPARTURE" }, { key: "status", label: "STATUS" }] },
  "/admin/bookings": { title: "Booking management", description: "Review historical demo reservations and new bookings saved in this browser.", data: "bookings", columns: [{ key: "id", label: "BOOKING" }, { key: "route", label: "ROUTE" }, { key: "passenger", label: "PASSENGER" }, { key: "date", label: "DATE" }, { key: "status", label: "STATUS" }] },
  "/admin/passengers": { title: "Passenger management", description: "Review demo passengers and their saved contact records.", data: "passengers", columns: [{ key: "id", label: "PASSENGER" }, { key: "name", label: "NAME" }, { key: "capacity", label: "EMAIL" }, { key: "status", label: "STATUS" }] },
  "/admin/cancellations": { title: "Cancellations", description: "Review sample cancellation requests linked to historical bookings.", data: "cancellations", columns: [{ key: "id", label: "REQUEST" }, { key: "name", label: "REASON" }, { key: "capacity", label: "REQUESTED" }, { key: "status", label: "STATUS" }] },
  "/admin/refunds": { title: "Refunds", description: "Review sample refunds and their associated payment records.", data: "refunds", columns: [{ key: "id", label: "REFUND" }, { key: "name", label: "AMOUNT" }, { key: "capacity", label: "METHOD" }, { key: "status", label: "STATUS" }] }
};

export function renderAdminPage(path) {
  if (path === "/admin") return renderDashboard();
  if (path === "/admin/settings") return renderDataSettings();
  const page = definitions[path];
  if (!page) {
    const section = adminSections.find((item) => item.path === path);
    const title = section?.label || "Administration";
    return `<header class="page-heading"><span class="section-overline">BUSSPHERE ADMIN</span><h1>${title}</h1><p>This administration module is ready for implementation in a later stage.</p></header><section class="admin-panel card"><h2>Module placeholder</h2><p>Use the administration navigation to visit another module. This view is linked and ready for future business workflows.</p></section>`;
  }
  const rows = page.data ? getAdminRows(page.data) : [];
  const details = page.data ? renderDataTable(page.columns, rows) : `<div class="empty-state">This module is a navigation-ready placeholder for a future stage.</div>`;
  return `<header class="page-heading"><span class="section-overline">BUSSPHERE ADMIN</span><h1>${page.title}</h1><p>${page.description}</p></header><section class="admin-panel card"><h2>${page.data ? "Records" : "Module placeholder"}</h2>${details}</section>`;
}

function renderDataSettings() {
  const overview = getAdminOverview();
  return `<header class="page-heading"><span class="section-overline">BUSSPHERE ADMIN</span><h1>Settings</h1><p>Review your browser-local demo dataset and restore the original sample records when needed.</p></header>
    <section class="admin-panel card"><h2>Demo data</h2><p>The versioned dataset currently includes ${overview.operators} operators, ${overview.activeBuses} active buses, ${overview.terminals} terminals, ${overview.routes} routes, ${overview.trips} scheduled trips, ${overview.passengers} passengers, and ${overview.bookings} bookings.</p>
      <p>Resetting restores the original fictional sample records and removes bookings, passengers, and other changes added in this browser.</p>
      <button class="button" id="reset-demo-data" type="button">Reset demo data</button>
    </section>`;
}

function renderDashboard() {
  const overview = getAdminOverview();
  return `<header class="page-heading"><span class="section-overline">BUSSPHERE ADMIN</span><h1>Operations dashboard</h1><p>A quick overview of your coach and matatu network. These figures use local sample data.</p></header>
    <div class="admin-cards">
      <article class="admin-stat card"><span>OPERATORS</span><strong>${overview.operators}</strong><small>Fictional operator profiles</small></article>
      <article class="admin-stat card"><span>ACTIVE VEHICLES</span><strong>${overview.activeBuses}</strong><small>Coaches and matatus</small></article>
      <article class="admin-stat card"><span>TERMINALS</span><strong>${overview.terminals}</strong><small>Across US and Kenyan cities</small></article>
      <article class="admin-stat card"><span>ROUTES</span><strong>${overview.routes}</strong><small>Connected terminal pairs</small></article>
      <article class="admin-stat card"><span>SCHEDULED TRIPS</span><strong>${overview.trips}</strong><small>Linked service records</small></article>
      <article class="admin-stat card"><span>BOOKINGS</span><strong>${overview.bookings}</strong><small>Historical and new demo bookings</small></article>
      <article class="admin-stat card"><span>PASSENGERS</span><strong>${overview.passengers}</strong><small>Sample passenger profiles</small></article>
      <article class="admin-stat card"><span>DATA COLLECTIONS</span><strong>${COLLECTIONS.length}</strong><small>Versioned local storage</small></article>
    </div>
    <section class="admin-panel card"><h2>Recent bookings</h2>${renderDataTable([{ key: "id", label: "BOOKING" }, { key: "route", label: "ROUTE" }, { key: "passenger", label: "PASSENGER" }, { key: "status", label: "STATUS" }], getAdminRows("bookings").slice(0, 5), "New demo reservations will appear here.")}</section>`;
}
