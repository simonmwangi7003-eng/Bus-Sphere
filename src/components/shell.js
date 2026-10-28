import { escapeHtml } from "../utils/helpers.js";
import { passengerLinks } from "../navigation.js";

const brand = `<a class="brand" href="#/" data-route-link aria-label="BusSphere home">
  <img class="brand-mark" src="./assets/icons/bus.svg" alt="" />
  <span>BusSphere<span class="brand-dot">.</span></span>
</a>`;

export function renderHeader(path, isAdmin = false) {
  const links = isAdmin ? [{ path: "/", label: "Passenger site" }, { path: "/admin", label: "Admin dashboard" }] : passengerLinks;
  return `<div class="announcement-bar"><span>YOUR NEXT GETAWAY, A LITTLE CLOSER.</span><span>Find a ride you’ll love, from just KSh 2,470.</span><a href="#/routes" data-route-link>Explore fares <span aria-hidden="true">→</span></a></div>
    <div class="header-main">
      ${brand}
      <nav class="main-nav" aria-label="Main navigation">
        ${links.map((link) => `<a class="nav-link${path === link.path ? " active" : ""}" href="#${link.path}" data-route-link>${link.label}</a>`).join("")}
      </nav>
      <div class="header-actions">
        ${!isAdmin ? `<button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch to dark theme" title="Switch to dark theme"><span aria-hidden="true">◐</span><span class="theme-toggle-label">Theme</span></button>
          <details class="account-menu"><summary><span class="account-avatar" aria-hidden="true">✳</span><span class="account-menu-label">My account</span><span class="account-chevron" aria-hidden="true">⌄</span></summary>
            <div class="account-popover"><strong>Your BusSphere</strong><a href="#/account" data-route-link>Account overview</a><a href="#/bookings" data-route-link>Booking history</a><a href="#/tickets" data-route-link>Digital tickets</a></div>
          </details>` : ""}
        <button class="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false"><span></span><span></span></button>
      </div>
    </div>
    <button class="nav-scrim" type="button" data-menu-scrim aria-label="Close navigation" tabindex="-1"></button>`;
}

export function renderFooter() {
  const year = new Date().getFullYear();
  return `<div class="footer-main">
      <div class="footer-about">${brand}<p>Good trips start here. Thoughtful bus journeys for wherever life takes you.</p><a href="mailto:hello@bussphere.example">hello@bussphere.example</a><a href="tel:+18005550142">1 (800) 555-0142</a></div>
      <div class="footer-column"><strong>PLAN YOUR TRIP</strong><a href="#/" data-route-link>Search rides</a><a href="#/routes" data-route-link>Popular routes</a><a href="#/bookings" data-route-link>Booking history</a></div>
      <div class="footer-column"><strong>HERE TO HELP</strong><a href="#/support" data-route-link>Passenger support</a><a href="#/tickets" data-route-link>Digital tickets</a><a href="mailto:hello@bussphere.example">Contact us</a></div>
      <div class="footer-column"><strong>THE SMALL PRINT</strong><a href="#/policies" data-route-link>Travel policies</a><a href="#/terms" data-route-link>Terms of service</a><a href="#/privacy" data-route-link>Privacy</a></div>
    </div><div class="footer-bottom"><p>© ${escapeHtml(year)} BusSphere Travel Co. · All fares and schedules shown are illustrative demo data.</p><a href="#/admin" data-route-link>Operator portal <span aria-hidden="true">→</span></a></div>`;
}
