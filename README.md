# BusSphere

BusSphere is a static, responsive coach- and matatu-booking prototype for Kenyan cities, built with HTML5, CSS3, and native ES modules. It runs directly through Visual Studio Code's Live Server extension; no build step or package installation is required.

## Run locally

1. Open this folder in Visual Studio Code.
2. Install the **Live Server** extension if it is not already available.
3. Open `index.html` and select **Go Live**.

The app uses hash-based navigation so passenger and administration views work on static hosting.

## Project structure

- `index.html` — application entry point
- `assets/` — logo, bus, terminal, and icon assets
- `src/app.js` — application initialization
- `src/router.js` and `src/navigation.js` — hash router and navigation
- `src/data/` — mock records and generated, internally linked demo collections
- `src/services/` — booking, storage, and administration mock services
- `src/utils/` — form validation and shared helpers
- `src/components/` — shared UI components
- `src/pages/` — passenger and administration page views
- `src/css/` — global, layout, component, passenger, admin, and responsive styles

## Storefront capabilities

The homepage includes terminal-based route search across Kenyan cities, coach or matatu selection, optional return dates, passenger counts, Standard/Executive/VIP coach classes, local route recommendations, explicitly labeled mock testimonials, FAQs, and contact/policy links. All fares are displayed in Kenyan shillings (KES). The account menu links to booking history and digital tickets. Use the header theme control to switch between light and dark palettes.

Destination photography is optional remote imagery; colored local CSS fallbacks remain visible when an image cannot load. All schedules, fares, operator ratings, and testimonials are demonstration data.

## Local demo data

On first launch, BusSphere seeds version 4 of its browser-local data store at `bussphere.database`. It includes fictional coach operators and fleet, Kenyan matatu operators and minibuses, Kenyan cities and terminals, coach and matatu routes, schedules, passengers, bookings, payments, promotions, and sample cancellations and refunds. Existing version 1, 2, and 3 browser data is upgraded; USD-denominated demo amounts are converted to KES at the fixed demo rate of KSh 130 per USD, while routes and associated bookings outside Kenya are excluded. Bookings retain trip, passenger, fare, payment, currency, and ticket snapshots; trip records reference their route, vehicle, and operator.

Changes are saved to `localStorage` and survive a page reload. Existing `bussphere.bookings` data is migrated where possible. Storage corruption, incompatible versions, and unavailable or full browser storage are reported in the interface; when storage cannot be used, the current tab runs with temporary data. The admin **Settings** page offers a confirmation-protected **Reset demo data** action that restores the fictional sample records and discards browser-local changes.

The data services provide collection reads, search, filtering, sorting, create/update/archive, safe deletion, transactions, and booking seat-availability checks. Transaction records and referenced records cannot be hard-deleted.

Public trip search uses those shared records for active schedules, operators, coach and matatu details, fares, terminal names, and remaining seats. All destinations are Kenyan cities; select a ride type or compare all rides. All displayed fares are in KES. Search excludes departed trips, past booking cutoffs, inactive services, and trips without enough seats for the requested party. Results can be filtered and sorted, and trip details show the matching timetable, terminals, fares, and demo travel policies.

Seat selection is rendered from each scheduled trip's configured seat layout, including its row/column positions, aisle, optional categories, and per-seat fares. The layout remains responsive to different configured dimensions. Booked seats are derived from non-cancelled booking seat assignments; blocked and unavailable seats are excluded from selection and identified in the accessible legend. The selection must match the passenger count, is rechecked before checkout and again inside the booking transaction, and does not create temporary holds. Availability is limited to this browser's local demo data and does not provide cross-device or concurrent reservations.

## Prototype notes

The data and booking services use browser storage and local mock data only. No payment, email, or production reservation is processed. Some administration workflows remain placeholders intended for future integration.
