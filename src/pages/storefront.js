import { popularDestinations, testimonials } from "../data/mock-data.js";
import { escapeHtml, formatMoney } from "../utils/helpers.js";
import { state } from "../state.js";
import { navigate } from "../navigation.js";

export function renderRouteDiscovery() {
  return `<section class="destination-section container routes-page">
    <div class="page-heading"><span class="section-overline">YOUR NEXT GOOD DAY OUT</span><h1>Explore Kenyan routes</h1><p>Compare coach trips and matatu routes connecting cities across Kenya, from quick city visits to a little more time by the coast.</p></div>
    <div class="destination-grid">${popularDestinations.map((destination, index) => `<button class="destination-card" type="button" data-route-destination="${escapeHtml(destination.city)}">
      <div class="destination-photo destination-photo-${index + 1}"><img src="https://images.unsplash.com/${destination.image}?auto=format&fit=crop&w=720&q=78" alt="" loading="lazy"></div>
      <span class="destination-caption"><span><strong>${escapeHtml(destination.city)}</strong><small>${escapeHtml(destination.region)}</small></span><b>from ${escapeHtml(formatMoney(destination.fare))}</b></span>
    </button>`).join("")}</div>
    <div class="route-list-section"><div class="storefront-heading"><div><span class="section-overline">A FEW GOOD WAYS TO GO</span><h2>Routes travelers love</h2></div></div>
      <div class="route-feature-grid">${[
        ["Nairobi", "Mombasa", "8h 35m", "KSh 1,200"],
        ["Nairobi", "Nakuru", "3h 5m", "KSh 450"],
        ["Mombasa", "Malindi", "2h 10m", "KSh 500"],
        ["Nairobi", "Kisumu", "6h 30m", "KSh 900"],
        ["Nairobi", "Thika", "1h", "KSh 200"]
      ].map(([from, to, duration, price]) => `<button class="route-feature card" type="button" data-feature-route="${from}|${to}"><span class="route-feature-top">POPULAR JOURNEY</span><strong>${from} <span>→</span> ${to}</strong><span class="route-feature-bottom">${duration}<b>from ${price}</b></span></button>`).join("")}</div>
    </div>
    <p class="mock-data-note routes-note">Sample route and fare information is illustrative demo data.</p>
  </section>`;
}

export function bindRouteDiscovery(main) {
  main.querySelectorAll("[data-route-destination]").forEach((button) => button.addEventListener("click", () => {
    const city = button.dataset.routeDestination;
    state.search = {
      origin: "Nairobi",
      destination: city === "Nairobi" ? "Mombasa" : city,
      date: new Date().toISOString().slice(0, 10), passengers: 1, travelClass: "standard",
      vehicleType: "all"
    };
    navigate("/");
    window.setTimeout(() => document.querySelector("#route-search-form")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  }));
  main.querySelectorAll("[data-feature-route]").forEach((button) => button.addEventListener("click", () => {
    const [origin, destination] = button.dataset.featureRoute.split("|");
    state.search = { origin, destination, date: new Date().toISOString().slice(0, 10), passengers: 1, travelClass: "standard", vehicleType: "all" };
    navigate(`/trips?${new URLSearchParams({ from: origin, to: destination, date: state.search.date, passengers: "1", travelClass: "standard", vehicleType: state.search.vehicleType })}`);
  }));
  main.querySelectorAll(".destination-photo img").forEach((image) => image.addEventListener("error", () => image.classList.add("image-failed"), { once: true }));
  main.querySelectorAll(".destination-photo img").forEach((image) => {
    if (image.complete && image.naturalWidth === 0) image.classList.add("image-failed");
  });
}

export function renderTravelStories() {
  return `<section class="container stories-page">
    <div class="page-heading"><span class="section-overline">KIND WORDS FROM THE ROAD</span><h1>Travelers said it best</h1><p>Stories inspired by the little moments that make a trip memorable. Testimonials below are sample mock data for the BusSphere demo.</p><span class="mock-data-note">MOCK DATA · NOT REAL CUSTOMER REVIEWS</span></div>
    <div class="testimonial-grid">${testimonials.map((testimonial) => `<article class="testimonial-card card"><div class="testimonial-stars">★★★★★</div><blockquote>“${escapeHtml(testimonial.quote)}”</blockquote><div class="testimonial-person"><span>${escapeHtml(testimonial.initials)}</span><div><strong>${escapeHtml(testimonial.name)}</strong><small>${escapeHtml(testimonial.detail)}</small></div></div></article>`).join("")}</div>
  </section>`;
}
