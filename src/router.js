import { currentPath, currentQuery, navigate } from "./navigation.js";
import { renderHome, bindHome } from "./pages/home.js";
import { renderTrips, bindTrips } from "./pages/trip-search.js";
import { renderSeats, bindSeats } from "./pages/seat-selection.js";
import { renderCheckout, bindCheckout } from "./pages/checkout.js";
import { renderConfirmation } from "./pages/confirmation.js";
import { renderPassengerPlaceholder } from "./pages/passenger-placeholder.js";
import { renderAdminPage } from "./pages/admin.js";
import { renderAccountPage } from "./pages/account.js";
import { renderTripDetails, bindTripDetails } from "./pages/trip-details.js";
import { renderRouteDiscovery, bindRouteDiscovery, renderTravelStories } from "./pages/storefront.js";
import { renderHeader, renderFooter } from "./components/shell.js";
import { renderAdminNavigation } from "./components/admin-navigation.js";
import { state } from "./state.js";
import { getTheme, setTheme } from "./services/theme.js";
import { resetDemoData } from "./services/storage.js";
import { notify } from "./components/notification.js";

const passengerViews = {
  "/bookings": ["Booking history", "View your saved trip reservations and their current status."],
  "/support": ["Passenger support", "Find help with a reservation, travel day, accessibility, or a change to your trip."],
  "/tickets": ["Digital tickets", "Your confirmed journeys and travel-ready tickets will appear here."],
  "/admin/cancellations": ["Cancellations", "Review cancellation requests and their booking status."],
  "/admin/refunds": ["Refunds", "Track passenger refunds and pending reimbursement requests."],
  "/admin/analytics": ["Analytics", "Explore booking trends, route performance, and passenger activity."],
  "/admin/settings": ["Settings", "Configure service preferences and operational settings."],
  "/policies": ["Travel policies", "Review the important travel information, sample fare conditions, and passenger guidance for the BusSphere demo."],
  "/terms": ["Terms of service", "The booking experience is a demonstration using local sample data. No commercial travel reservation is made."],
  "/privacy": ["Privacy", "This prototype stores demo reservations and theme preferences in your browser only."],
  "/refunds": ["Cancellations and refunds", "Cancellation and refund management are planned for a future BusSphere stage."]
};

export function renderRoute() {
  const path = currentPath();
  const query = currentQuery();
  const main = document.querySelector("#main-content");
  const isAdmin = path.startsWith("/admin");
  setTheme(getTheme());
  document.body.classList.toggle("admin-mode", isAdmin);
  document.querySelector("#site-header").innerHTML = renderHeader(path, isAdmin);
  document.querySelector("#site-footer").innerHTML = renderFooter();

  if (isAdmin) {
    main.innerHTML = renderAdminNavigation(path);
    const content = main.querySelector("[data-admin-content]");
    content.innerHTML = renderAdminPage(path);
    bindAdminActions(main);
    bindMenuToggle();
    bindThemeToggle();
    return;
  }

  function bindAdminActions(main) {
    const resetButton = main.querySelector("#reset-demo-data");
    if (!resetButton) return;
    resetButton.addEventListener("click", () => {
      if (!window.confirm("Reset all BusSphere demo records and remove browser changes? This cannot be undone.")) return;
      try {
        resetDemoData();
        renderRoute();
        notify("Demo data has been reset to the original sample records.");
      } catch (error) {
        console.error("Unable to reset BusSphere demo data:", error);
        notify(error.message || "Demo data could not be reset.", "error");
      }
    });
  }

  switch (path) {
    case "/":
      main.innerHTML = renderHome();
      bindHome(main);
      break;
    case "/trips":
      state.search = searchFromQuery(query) || state.search;
      main.innerHTML = renderTrips(state.search);
      bindTrips(main);
      break;
    case "/trip":
      state.search = searchFromQuery(query) || state.search;
      main.innerHTML = renderTripDetails();
      bindTripDetails(main);
      break;
    case "/seats":
      state.search = searchFromQuery(query) || state.search;
      main.innerHTML = renderSeats();
      bindSeats(main);
      break;
    case "/checkout":
      state.search = searchFromQuery(query) || state.search;
      main.innerHTML = renderCheckout();
      bindCheckout(main);
      break;
    case "/confirmation":
      main.innerHTML = renderConfirmation();
      break;
    case "/account":
      main.innerHTML = renderAccountPage();
      break;
    case "/routes":
      main.innerHTML = renderRouteDiscovery();
      bindRouteDiscovery(main);
      break;
    case "/stories":
      main.innerHTML = renderTravelStories();
      break;
    default: {
      const [title, description] = passengerViews[path] || ["Page not found", "The requested page is not available. Return to the homepage to plan your journey."];
      main.innerHTML = renderPassengerPlaceholder(title, description);
    }
  }
  bindMenuToggle();
  bindThemeToggle();
}

function handleNavigation(event) {
  const link = event.target.closest("a[data-route-link]");
  if (!link) return;
  const href = link.getAttribute("href");
  if (href?.startsWith("#/")) {
    event.preventDefault();
    navigate(href.slice(1));
  }
}

function searchFromQuery(query) {
  if (!query.has("from") || !query.has("to")) return null;
  return {
    origin: query.get("from"),
    destination: query.get("to"),
    date: query.get("date") || new Date().toISOString().slice(0, 10),
    returnDate: query.get("returnDate") || "",
    originTerminal: query.get("fromTerminal") || "",
    destinationTerminal: query.get("toTerminal") || "",
    passengers: Number(query.get("passengers") || 1),
    travelClass: query.get("travelClass") || "standard",
    vehicleType: query.get("vehicleType") || "all"
  };
}

function bindMenuToggle() {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".main-nav");
  const scrim = document.querySelector("[data-menu-scrim]");
  if (!toggle || !menu) return;
  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    scrim?.classList.toggle("visible", open);
  });
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    scrim?.classList.remove("visible");
  }));
  scrim?.addEventListener("click", () => {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    scrim.classList.remove("visible");
    toggle.focus();
  });
}

function bindThemeToggle() {
  const toggle = document.querySelector("[data-theme-toggle]");
  if (!toggle) return;
  const updateLabel = () => {
    const isDark = document.documentElement.dataset.theme === "dark";
    toggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
    toggle.title = `Switch to ${isDark ? "light" : "dark"} theme`;
  };
  updateLabel();
  toggle.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    updateLabel();
  });
}

export function startRouter() {
  window.addEventListener("hashchange", renderRoute);
  document.addEventListener("click", handleNavigation);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const menu = document.querySelector(".main-nav.open");
    const toggle = document.querySelector(".menu-toggle");
    if (menu && toggle) {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      document.querySelector("[data-menu-scrim]")?.classList.remove("visible");
      toggle.focus();
    }
  });
  renderRoute();
}
