import { button } from "../components/button.js";

export function renderAccountPage() {
  return `<section class="placeholder-page container"><div class="page-heading"><span class="section-overline">YOUR BUSSPHERE</span><h1>Passenger account</h1><p>Your account area is ready for profile, preferences, and saved passenger information.</p></div>
    <div class="placeholder-panel card"><h2>Welcome aboard</h2><p>Account registration and sign-in will be connected in a future stage. You can already review reservations saved on this device.</p><div class="placeholder-actions">${button("View booking history", { href: "#/bookings" })}${button("Browse digital tickets", { href: "#/tickets", variant: "ghost" })}</div></div></section>`;
}
