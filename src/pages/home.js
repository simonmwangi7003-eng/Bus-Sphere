import { renderRouteSearch, routeTerminalDefaults, updateTerminalOptions } from "../components/route-search.js";
import { validateRouteSearch } from "../utils/validation.js";
import { cityLabel, escapeHtml } from "../utils/helpers.js";
import { state } from "../state.js";
import { notify } from "../components/notification.js";
import { navigate } from "../navigation.js";
import { popularDestinations, testimonials, faqItems } from "../data/mock-data.js";
import { formatMoney } from "../utils/helpers.js";

const busArtwork = `<img class="hero-bus-art" src="./assets/buses/coach.svg" alt="" />`;

export function renderHome() {
  return `<section class="home-hero">
    <div class="hero-orbit hero-orbit-one" aria-hidden="true"></div><div class="hero-orbit hero-orbit-two" aria-hidden="true"></div>
    <div class="home-copy">
      <div class="section-overline">THE ROAD HAS ROOM FOR EVERYONE</div>
      <h1>Get there.<br>Feel <em>good.</em></h1>
      <p>From comfortable coaches to Kenya's lively matatus, find a ride that fits your plans, your people, and your kind of trip.</p>
      <div class="trust-row"><div class="avatar-stack" aria-hidden="true"><span>J</span><span>M</span><span>A</span><span>+</span></div><div><div class="trust-stars">★★★★★ <b>4.9/5</b></div><div class="trust-caption">A little love from 2M+ travelers</div></div></div>
    </div>
    <div class="hero-landscape" aria-hidden="true"></div>${busArtwork}
    <div class="hero-note"><span aria-hidden="true">✳</span><div><strong>Your window seat is waiting.</strong><small>Good things happen between here and there.</small></div></div>
  </section>
  ${renderRouteSearch(state.search)}
  <section class="destination-section container" id="destinations">
    <div class="storefront-heading"><div><span class="section-overline">A CHANGE OF SCENERY AWAITS</span><h2>Places worth the ride</h2><p>Little escapes and big-city plans, all starting close to home.</p></div><a class="inline-link" href="#/routes" data-route-link>Explore all routes <span>→</span></a></div>
    <div class="destination-grid">${popularDestinations.map((destination, index) => `<a class="destination-card" href="#/" data-home-destination="${escapeHtml(destination.city)}">
      <div class="destination-photo destination-photo-${index + 1}" data-fallback="${escapeHtml(destination.city)}"><img src="https://images.unsplash.com/${destination.image}?auto=format&fit=crop&w=720&q=78" alt="${escapeHtml(destination.city)} travel destination" loading="lazy"></div>
      <div class="destination-caption"><span><strong>${escapeHtml(destination.city)}</strong><small>${escapeHtml(destination.region)}</small></span><b>from ${escapeHtml(formatMoney(destination.fare))}</b></div>
    </a>`).join("")}</div>
  </section>
  <section class="featured-section">
    <div class="container"><div class="storefront-heading"><div><span class="section-overline">A FEW GOOD WAYS TO GO</span><h2>Popular journeys</h2><p>Handy routes for the plans you make most.</p></div><a class="inline-link" href="#/routes" data-route-link>See all journeys <span>→</span></a></div>
      <div class="route-feature-grid">${[
        ["Nairobi", "Mombasa", "8h 35m", "KSh 1,200", "Coast-bound journeys from the capital"],
        ["Nairobi", "Nakuru", "3h 5m", "KSh 450", "A ride into the Rift Valley"],
        ["Mombasa", "Malindi", "2h 10m", "KSh 500", "A relaxed trip up the coast"],
        ["Nairobi", "Mombasa", "8h 35m", "KSh 1,200", "Coast-bound matatus from the capital"],
        ["Nairobi", "Nakuru", "3h 5m", "KSh 450", "A matatu ride into the Rift Valley"]
      ].map(([from, to, duration, price, caption]) => `<a class="route-feature card" href="#/" data-feature-route="${from}|${to}"><span class="route-feature-top">A FAVORITE ROUTE</span><strong>${from} <span>→</span> ${to}</strong><small>${caption}</small><span class="route-feature-bottom">${duration}<b>from ${price}</b></span></a>`).join("")}</div>
    </div>
  </section>
  <section class="operator-section container">
    <div class="storefront-heading"><div><span class="section-overline">GOOD PEOPLE, GOOD OPERATORS</span><h2>Ride with the best</h2><p>Comfortable coaches and Kenya's trusted matatu operators.</p></div></div>
    <div class="operator-grid">
      ${[["NS","Northstar Lines","4.8","Window views, your way."],["GW","Greenway Express","4.7","A smoother kind of everyday."],["CC","Coastline Coach","4.9","The scenic route specialists."],["NC","Nairobi City Shuttle","4.7","Shared matatu rides from the capital."],["CM","Coastline Matatu Sacco","4.8","Coast-bound journeys from Mombasa."],["LR","Lake Region Matatu","4.6","Connecting Kisumu and the lakeside towns."]].map(([mark,name,rating,tagline]) => `<article class="operator-tile card"><span class="operator-monogram">${mark}</span><div><strong>${name}</strong><small>${tagline}</small></div><span class="operator-score">★ ${rating}</span></article>`).join("")}
    </div>
  </section>
  <section class="upcoming-section container">
    <div class="upcoming-visual"><div class="upcoming-visual-copy"><span class="section-overline">YOUR NEXT LITTLE GETAWAY</span><h2>Pick a date.<br>We'll find the way.</h2><p>One less thing to plan. A few more moments to look forward to.</p><a href="#route-search-form" class="button secondary" data-scroll-search>Find a trip <span>→</span></a></div><img src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=82" alt="Mountain road winding into a sunny valley" loading="lazy"></div>
    <div class="upcoming-trip-row"><div><span class="section-overline">COMING UP ON THE CALENDAR</span><h2>Good days to get away</h2></div><div class="upcoming-pills">${[
      ["Mombasa", "This weekend", "Nairobi"],
      ["Nakuru", "Next Friday", "Nairobi"],
      ["Malindi", "A day trip", "Mombasa"]
    ].map(([to, date, from]) => `<button class="upcoming-pill" type="button" data-upcoming-route="${from}|${to.split(",")[0]}"><span class="upcoming-date">${date}</span><strong>${from} <span>→</span> ${to}</strong><small>See available times</small></button>`).join("")}</div></div>
  </section>
  <section class="travel-benefits"><div class="container"><div class="storefront-heading"><div><span class="section-overline">TRAVEL SHOULD FEEL LIKE THIS</span><h2>More journey. Less worry.</h2></div></div>
    <div class="benefit-cards">
      <article class="benefit-card card"><div class="benefit-icon">✓</div><h3>Easy from the start</h3><p>Clear options, simple booking, and all your trip details in one place.</p></article>
      <article class="benefit-card card"><div class="benefit-icon amber">KSh</div><h3>Good value, no guesswork</h3><p>Transparent sample fares and operators you can compare at a glance.</p></article>
      <article class="benefit-card card"><div class="benefit-icon peach">✦</div><h3>Your seat, your choice</h3><p>Choose an available seat on your coach or matatu ride.</p></article>
    </div>
  </div></section>
  <section class="testimonial-section container"><div class="storefront-heading"><div><span class="section-overline">KIND WORDS FROM THE ROAD</span><h2>Travelers said it best</h2><p>These are sample testimonials created for the BusSphere demo.</p></div><span class="mock-data-note">MOCK DATA</span></div>
    <div class="testimonial-grid">${testimonials.map((testimonial) => `<article class="testimonial-card card"><div class="testimonial-stars" aria-label="5 out of 5 stars">★★★★★</div><blockquote>“${escapeHtml(testimonial.quote)}”</blockquote><div class="testimonial-person"><span>${escapeHtml(testimonial.initials)}</span><div><strong>${escapeHtml(testimonial.name)}</strong><small>${escapeHtml(testimonial.detail)}</small></div></div></article>`).join("")}</div>
  </section>
  <section class="faq-section" id="faq"><div class="container faq-layout"><div class="faq-intro"><span class="section-overline">GOOD TO KNOW</span><h2>Questions for the road?</h2><p>Here are a few helpful things to know before you go.</p><a class="inline-link" href="#/support" data-route-link>Get in touch <span>→</span></a></div>
    <div class="faq-list">${faqItems.map((item) => `<details class="faq-item"><summary>${escapeHtml(item.question)}<span aria-hidden="true">+</span></summary><p>${escapeHtml(item.answer)}</p></details>`).join("")}</div>
  </div></section>`;
}

export function bindHome(main) {
  const form = main.querySelector("#route-search-form");
  const originSelect = form.querySelector("#origin");
  const destinationSelect = form.querySelector("#destination");
  const departureDate = form.querySelector("#travel-date");
  const returnDate = form.querySelector("#return-date");
  const vehicleTypeSelect = form.querySelector("#vehicle-type");
  const travelClassSelect = form.querySelector("#travel-class");
  const updateTravelClass = () => {
    travelClassSelect.disabled = vehicleTypeSelect.value === "matatu"
      || vehicleTypeSelect.value !== "coach";
    if (travelClassSelect.disabled) travelClassSelect.value = "standard";
  };
  vehicleTypeSelect.addEventListener("change", updateTravelClass);
  updateTravelClass();
  const updateDateLimits = () => {
    returnDate.min = departureDate.value;
    if (returnDate.value && returnDate.value < departureDate.value) returnDate.value = "";
  };
  departureDate.addEventListener("change", updateDateLimits);
  originSelect.addEventListener("change", () => {
    const defaults = routeTerminalDefaults(originSelect.value, destinationSelect.value);
    updateTerminalOptions(originSelect.value, form.querySelector("#origin-terminal"), defaults.origin);
    updateTravelClass();
  });
  destinationSelect.addEventListener("change", () => {
    const defaults = routeTerminalDefaults(originSelect.value, destinationSelect.value);
    updateTerminalOptions(destinationSelect.value, form.querySelector("#destination-terminal"), defaults.destination);
    updateTravelClass();
  });

  const searchForRoute = (origin, destination) => {
    originSelect.value = origin;
    destinationSelect.value = destination;
    vehicleTypeSelect.value = "all";
    updateTravelClass();
    const defaults = routeTerminalDefaults(origin, destination);
    updateTerminalOptions(origin, form.querySelector("#origin-terminal"), defaults.origin);
    updateTerminalOptions(destination, form.querySelector("#destination-terminal"), defaults.destination);
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    form.querySelector("#origin").focus({ preventScroll: true });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const search = {
      origin: cityLabel(formData.get("origin")),
      destination: cityLabel(formData.get("destination")),
      originTerminal: String(formData.get("originTerminal")),
      destinationTerminal: String(formData.get("destinationTerminal")),
      date: String(formData.get("date")),
      returnDate: String(formData.get("returnDate") || ""),
      passengers: Number(formData.get("passengers")),
      travelClass: String(formData.get("travelClass") || "standard"),
      vehicleType: String(formData.get("vehicleType") || "all")
    };
    const error = validateRouteSearch(search);
    main.querySelector("#search-error").textContent = error;
    if (error) {
      notify(error, "error");
      return;
    }
    state.search = search;
    state.trips = [];
    navigate(`/trips?${new URLSearchParams({
      from: search.origin, to: search.destination, fromTerminal: search.originTerminal,
      toTerminal: search.destinationTerminal, date: search.date, returnDate: search.returnDate,
      passengers: String(search.passengers), travelClass: search.travelClass,
      vehicleType: search.vehicleType
    }).toString()}`);
  });

  main.querySelectorAll("[data-home-destination]").forEach((destinationLink) => {
    destinationLink.addEventListener("click", (event) => {
      event.preventDefault();
      const destination = destinationLink.dataset.homeDestination;
      searchForRoute("Nairobi", destination === "Nairobi" ? "Mombasa" : destination);
    });
  });
  main.querySelectorAll("[data-feature-route], [data-upcoming-route]").forEach((routeLink) => {
    routeLink.addEventListener("click", () => {
      const [origin, destination] = (routeLink.dataset.featureRoute || routeLink.dataset.upcomingRoute).split("|");
      searchForRoute(origin, destination);
    });
  });
  main.querySelectorAll("[data-scroll-search]").forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    form.querySelector("#origin").focus({ preventScroll: true });
  }));
  main.querySelectorAll(".destination-photo img, .upcoming-visual img").forEach((image) => {
    image.addEventListener("error", () => image.classList.add("image-failed"), { once: true });
    if (image.complete && image.naturalWidth === 0) image.classList.add("image-failed");
  });
  main.querySelectorAll(".faq-item").forEach((item) => item.addEventListener("toggle", () => {
    item.querySelector("summary span").textContent = item.open ? "−" : "+";
  }));
}
