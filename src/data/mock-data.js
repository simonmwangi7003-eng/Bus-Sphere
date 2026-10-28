export const trips = [
  { id: "trip-0815", departure: "08:15", arrival: "12:40", duration: "4h 25m", price: 3770, currency: "KES", operator: "Northstar Lines", initials: "NS", busClass: "Executive", terminalFrom: "Nairobi CBD — Kencom", terminalTo: "Nakuru Town Centre", rating: "4.8", reviews: 1240, features: ["wifi", "power", "restroom"], amenities: ["Free Wi-Fi", "Power outlets", "Restroom"], seatsLeft: 8 },
  { id: "trip-1030", departure: "10:30", arrival: "15:20", duration: "4h 50m", price: 3120, currency: "KES", operator: "Greenway Express", initials: "GW", busClass: "Standard", terminalFrom: "Nairobi CBD — Kencom", terminalTo: "Mombasa CBD — Buxton", rating: "4.7", reviews: 986, features: ["wifi", "restroom"], amenities: ["Free Wi-Fi", "Restroom"], seatsLeft: 12 },
  { id: "trip-1345", departure: "13:45", arrival: "18:05", duration: "4h 20m", price: 4680, currency: "KES", operator: "Coastline Coach", initials: "CC", busClass: "VIP", terminalFrom: "Nairobi CBD — Kencom", terminalTo: "Kisumu Bus Park", rating: "4.9", reviews: 2105, features: ["wifi", "power"], amenities: ["Free Wi-Fi", "Power outlets"], seatsLeft: 5 },
  { id: "trip-1820", departure: "18:20", arrival: "23:10", duration: "4h 50m", price: 3510, currency: "KES", operator: "Northstar Lines", initials: "NS", busClass: "Executive", terminalFrom: "Nairobi CBD — Kencom", terminalTo: "Eldoret Central Stage", rating: "4.8", reviews: 1240, features: ["wifi", "power", "restroom"], amenities: ["Free Wi-Fi", "Power outlets", "Restroom"], seatsLeft: 9 }
];

export const kenyanCities = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Nyeri", "Malindi"];
export const cities = kenyanCities;
export const terminals = {
  Nairobi: ["Nairobi CBD — Kencom", "Railways Bus Station"],
  Mombasa: ["Mombasa CBD — Buxton", "Mwembe Tayari"],
  Kisumu: ["Kisumu Bus Park", "Jomo Kenyatta Highway Stage"],
  Nakuru: ["Nakuru Town Centre", "Nakuru Bus Park"],
  Eldoret: ["Eldoret Central Stage", "Eldoret Bus Park"],
  Thika: ["Thika Town Stage", "Makongeni Stage"],
  Nyeri: ["Nyeri Bus Park", "Nyeri Town Stage"],
  Malindi: ["Malindi Bus Park", "Malindi Town Stage"]
};
export const travelClasses = [
  { id: "standard", label: "Standard", priceMultiplier: 1, description: "A comfortable seat for the essentials." },
  { id: "executive", label: "Executive", priceMultiplier: 1.35, description: "Extra room, priority boarding, and a little more ease." },
  { id: "vip", label: "VIP", priceMultiplier: 1.8, description: "Our most spacious seat with premium onboard comforts." }
];
export const popularDestinations = [
  { city: "Nairobi", region: "Kenya", fare: 300, currency: "KES", image: "photo-1516026672322-bc52d61a55d5" },
  { city: "Mombasa", region: "Kenya", fare: 1200, currency: "KES", image: "photo-1514214246283-d427a95c5d2f" },
  { city: "Kisumu", region: "Kenya", fare: 900, currency: "KES", image: "photo-1516026672322-bc52d61a55d5" },
  { city: "Nakuru", region: "Kenya", fare: 450, currency: "KES", image: "photo-1516026672322-bc52d61a55d5" },
  { city: "Eldoret", region: "Kenya", fare: 1000, currency: "KES", image: "photo-1516026672322-bc52d61a55d5" },
  { city: "Thika", region: "Kenya", fare: 200, currency: "KES", image: "photo-1516026672322-bc52d61a55d5" },
  { city: "Nyeri", region: "Kenya", fare: 500, currency: "KES", image: "photo-1516026672322-bc52d61a55d5" },
  { city: "Malindi", region: "Kenya", fare: 1500, currency: "KES", image: "photo-1514214246283-d427a95c5d2f" }
];
export const testimonials = [
  { quote: "The booking was refreshingly simple, and my bus was right on time. I'll use BusSphere for my next weekend away.", name: "Jordan M.", detail: "Traveled from Nairobi to Nakuru", initials: "JM" },
  { quote: "Being able to compare departure times and pick my seat made the whole trip feel effortless.", name: "Amara K.", detail: "Traveled from Mombasa to Malindi", initials: "AK" },
  { quote: "Clear updates, a comfortable ride, and no surprises at checkout. Exactly how travel should feel.", name: "Leo R.", detail: "Traveled from Nairobi to Kisumu", initials: "LR" }
];
export const faqItems = [
  { question: "How do I book a seat?", answer: "Search your route and departure date, compare available trips, then choose your seats and enter passenger details. Your booking is saved in this demo browser." },
  { question: "Can I change or cancel a trip?", answer: "Cancellation rules vary by operator. Trip cards show the sample cancellation window; change and refund workflows are planned for a future stage." },
  { question: "When should I arrive at the terminal?", answer: "We recommend arriving at least 30 minutes before departure. Check your selected terminal and operator instructions before travel." },
  { question: "Are these fares and schedules live?", answer: "No. BusSphere currently uses illustrative mock schedules and fares for demonstration; it does not connect to live operators or process payments." }
];
export const occupiedSeats = [2, 5, 9, 14];
export const adminSections = [
  { path: "/admin", label: "Dashboard" },
  { path: "/admin/buses", label: "Vehicle management" },
  { path: "/admin/routes", label: "Route management" },
  { path: "/admin/terminals", label: "Terminal management" },
  { path: "/admin/schedules", label: "Schedule management" },
  { path: "/admin/bookings", label: "Booking management" },
  { path: "/admin/passengers", label: "Passenger management" },
  { path: "/admin/cancellations", label: "Cancellations" },
  { path: "/admin/refunds", label: "Refunds" },
  { path: "/admin/analytics", label: "Analytics" },
  { path: "/admin/settings", label: "Settings" }
];
