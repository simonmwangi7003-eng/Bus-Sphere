import { cities, terminals as terminalNames, travelClasses, trips as sampleTrips } from "./mock-data.js";
import { createId, localDateString } from "../utils/helpers.js";

const operatorNames = [
  ["Northstar Lines", "NS"], ["Greenway Express", "GW"], ["Coastline Coach", "CC"],
  ["Pine & Peak Transit", "PP"], ["Bluebird Motorways", "BM"], ["Cedar Trail Coaches", "CT"],
  ["Sunward Transit", "ST"], ["Open Road Lines", "OR"], ["Harborlight Express", "HE"],
  ["Copperleaf Coaches", "CL"], ["Meadowland Bus Co.", "MB"], ["Silverline Transit", "SL"],
  ["Highland Hopper", "HH"], ["Daybreak Motor Coach", "DM"], ["Juniper Journey", "JJ"],
  ["Nairobi City Shuttle", "NC"], ["Coastline Matatu Sacco", "CM"],
  ["Lake Region Matatu", "LR"], ["Rift Valley Shuttle", "RV"], ["Central Kenya Matatus", "CK"]
];
const busModels = ["MCI J4500", "Prevost H3-45", "Van Hool CX45", "Setra S 516 HD", "Volvo 9700"];
const matatuModels = ["Toyota HiAce Matatu", "Nissan Caravan Matatu"];
const amenities = ["wifi", "power", "restroom", "reclining-seats", "air-conditioning", "reading-light", "usb"];
const paymentMethods = ["Visa", "Mastercard", "PayPal", "Apple Pay", "Google Pay"];
const givenNames = ["Avery", "Jordan", "Morgan", "Taylor", "Casey", "Riley", "Jamie", "Quinn", "Cameron", "Skyler", "Amara", "Leo", "Sofia", "Noah", "Maya", "Ethan", "Zoe", "Kai", "Isla", "Miles"];
const familyNames = ["Miller", "Rivera", "Chen", "Patel", "Brooks", "Kim", "Reed", "Nguyen", "Carter", "Morgan", "Diaz", "Bennett", "Foster", "Wright", "Turner"];
const cityCoordinates = [
  [-1.2864, 36.8172], [-4.0435, 39.6682], [-0.0917, 34.768], [-0.3031, 36.08],
  [0.5143, 35.2698], [-1.0332, 37.0692], [-0.4167, 36.95], [-3.2192, 40.1169]
];

function dateAtOffset(offset, baseDate = new Date()) {
  const date = new Date(baseDate);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return localDateString(date);
}

function timestamp(date, time) {
  return new Date(`${date}T${time}:00Z`).toISOString();
}

function arrivalTime(date, departure, durationMinutes) {
  const arrival = new Date(`${date}T${departure}:00Z`);
  arrival.setUTCMinutes(arrival.getUTCMinutes() + durationMinutes);
  return { date: arrival.toISOString().slice(0, 10), time: arrival.toISOString().slice(11, 16), timestamp: arrival.toISOString() };
}

function makeSeatLayout(capacity, vehicleType = "coach") {
  const columns = vehicleType === "matatu" ? 3 : 4;
  const rows = Math.ceil(capacity / columns);
  return {
    rows, columns, seatsPerRow: columns, aisleAfterColumn: 2,
    seatNumbers: Array.from({ length: capacity }, (_, index) => String(index + 1)),
    seatCategories: vehicleType === "coach" ? { "1": "Extra legroom", "2": "Extra legroom" } : {},
    seatFares: vehicleType === "coach" ? { "1": { priceAdjustment: 650 }, "2": { priceAdjustment: 650 } } : {}
  };
}

function durationForRoute(index, distance) {
  return Math.round((distance / 54) * 60 + 24 + (index % 4) * 8);
}

function fareForRoute(route, classId) {
  if (route.transportType === "matatu") return Math.round(route.distanceKm * 2.2 + 150);
  const travelClass = travelClasses.find((entry) => entry.id === classId) || travelClasses[0];
  return Math.round((route.distanceKm * 6 + 250) * travelClass.priceMultiplier);
}

function buildOperators(now) {
  return operatorNames.map(([name, initials], index) => ({
    id: `OP${String(index + 1).padStart(3, "0")}`,
    name, initials,
    profile: {
      foundedYear: 1988 + (index * 3) % 32,
      rating: Number((4.2 + (index % 8) * 0.1).toFixed(1)),
      reviewCount: 240 + index * 137,
      description: index < 15
        ? `${name} offers friendly, dependable coach travel and thoughtful onboard comforts.`
        : `${name} connects major Kenyan towns with convenient shared matatu service.`,
      supportEmail: `support${index + 1}@${name.toLowerCase().replace(/[^a-z]/g, "")}.example`,
      supportPhone: `+254-700-555-${String(100 + index).slice(-3)}`
    },
    active: true,
    createdAt: timestamp(dateAtOffset(-365 - index * 30, now), "09:00"),
    archivedAt: null
  }));
}

function buildTerminals(now) {
  return Object.entries(terminalNames).flatMap(([city, names], cityIndex) => names.map((name, terminalIndex) => ({
    id: `TM${String(cityIndex * 2 + terminalIndex + 1).padStart(3, "0")}`,
    name, city,
    state: "Kenya",
    county: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Kiambu", "Nyeri", "Kilifi"][cityIndex],
    address: `${100 + cityIndex * 41 + terminalIndex * 27} ${["Market", "Broadway", "Union", "Central"][cityIndex % 4]} Street`,
    latitude: cityCoordinates[cityIndex][0] + terminalIndex * 0.015,
    longitude: cityCoordinates[cityIndex][1] - terminalIndex * 0.015,
    facilities: ["waiting-area", "restrooms", "ticket-desk"].concat(terminalIndex ? ["accessible-entry"] : []),
    active: true, createdAt: timestamp(dateAtOffset(-700 + cityIndex, now), "08:00"), archivedAt: null
  })));
}

function buildRoutes(terminalRecords, operators, now) {
  const byCity = new Map();
  terminalRecords.forEach((terminal) => {
    const entries = byCity.get(terminal.city) || [];
    entries.push(terminal);
    byCity.set(terminal.city, entries);
  });
  const groups = [
    { group: cities, transportType: "coach" },
    { group: cities, transportType: "matatu" }
  ];
  return groups.flatMap(({ group, transportType }) => group.flatMap((origin, groupIndex) =>
    Array.from({ length: group.length - 1 }, (_, stepIndex) => {
      const step = stepIndex + 1;
      const destinationIndex = (groupIndex + step) % group.length;
      const destination = group[destinationIndex];
      const index = groupIndex * (group.length - 1) + stepIndex + (transportType === "matatu" ? 40 : 0);
      const distanceKm = Math.round(Math.hypot(
        (cityCoordinates[groupIndex][0] - cityCoordinates[destinationIndex][0]) * 111,
        (cityCoordinates[groupIndex][1] - cityCoordinates[destinationIndex][1]) * 111
      ));
      const operatorIndex = transportType === "matatu"
        ? 15 + (groupIndex + step * 2) % 5
        : (groupIndex + step * 2) % 15;
      return {
        id: transportType === "matatu" ? `RT${String(index + 1).padStart(3, "0")}` : `RTKC${String(index + 1).padStart(3, "0")}`,
        code: transportType === "matatu" ? `R-${String(101 + index)}` : `R-KC-${String(index + 1).padStart(3, "0")}`,
        originCity: origin, destinationCity: destination, transportType,
        originTerminalId: byCity.get(origin)[index % 2].id,
        destinationTerminalId: byCity.get(destination)[(index + 1) % 2].id,
        operatorId: operators[operatorIndex].id,
        distanceKm,
        durationMinutes: transportType === "matatu"
          ? Math.round((distanceKm / 55) * 60 + 35)
          : durationForRoute(index, distanceKm),
        active: true, createdAt: timestamp(dateAtOffset(-250 - index, now), "10:00"), archivedAt: null
      };
    })
  ));
}

function buildBuses(operators, now) {
  return Array.from({ length: 40 }, (_, index) => {
    const vehicleType = index < 30 ? "coach" : "matatu";
    const operator = operators[Math.floor(index / 2)];
    const capacity = vehicleType === "matatu" ? 14 + (index % 2) * 2 : index % 5 === 0 ? 36 : 40 + (index % 3) * 2;
    const busClass = vehicleType === "matatu" ? travelClasses[0] : travelClasses[index % travelClasses.length];
    return {
      id: `BUS${String(index + 1).padStart(3, "0")}`,
      registration: `BS-${String.fromCharCode(65 + index % 26)}${String(1040 + index).slice(1)}`,
      operatorId: operator.id,
      model: vehicleType === "matatu" ? matatuModels[index % matatuModels.length] : busModels[index % busModels.length],
      year: 2019 + index % 7,
      vehicleType,
      capacity,
      seatLayout: makeSeatLayout(capacity, vehicleType),
      amenities: vehicleType === "matatu" ? [] : amenities.filter((_, amenityIndex) => (index + amenityIndex) % (amenityIndex % 2 ? 3 : 4) !== 0),
      travelClass: busClass.id,
      status: index === 27 ? "maintenance" : "active",
      active: index !== 27,
      maintenance: {
        lastServiceDate: dateAtOffset(-35 - index, now),
        nextServiceDate: dateAtOffset(20 + index, now),
        notes: index === 27 ? "Scheduled preventative maintenance; unavailable for assignment." : "Routine inspection passed."
      },
      createdAt: timestamp(dateAtOffset(-180 - index, now), "08:00"), archivedAt: null
    };
  });
}

function buildPassengers(now) {
  return Array.from({ length: 50 }, (_, index) => {
    const firstName = givenNames[index % givenNames.length];
    const lastName = familyNames[Math.floor(index / 2) % familyNames.length];
    return {
      id: `PS${String(index + 1).padStart(3, "0")}`,
      firstName, lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index + 1}@example.test`,
      phone: `+1-202-555-${String(1000 + index).slice(-4)}`,
      preferredClass: travelClasses[index % travelClasses.length].id,
      createdAt: timestamp(dateAtOffset(-120 + index, now), "12:00"),
      active: true, archivedAt: null
    };
  });
}

function buildScheduledTrips(routes, buses, operators, now) {
  const timeSlots = ["06:45", "08:15", "10:30", "13:45", "16:20", "18:20", "20:10"];
  return Array.from({ length: 100 }, (_, index) => {
    const route = routes[index % routes.length];
    const operator = operators.find((entry) => entry.id === route.operatorId);
    const fleet = buses.filter((bus) => bus.operatorId === operator.id && bus.active);
    const bus = fleet[index % fleet.length];
    let dayOffset = Math.floor(index / routes.length);
    let departureTime = timeSlots[Math.floor(index / routes.length) % timeSlots.length];
    if (dayOffset === 0) {
      const today = dateAtOffset(0, now);
      const upcomingSlots = timeSlots.filter((slot) => new Date(`${today}T${slot}:00Z`) > now);
      if (upcomingSlots.length) departureTime = upcomingSlots[index % upcomingSlots.length];
      else dayOffset = 1;
    }
    const departureDate = dateAtOffset(dayOffset, now);
    const arrival = arrivalTime(departureDate, departureTime, route.durationMinutes);
    const classId = bus.travelClass;
    const baseFare = fareForRoute(route, "standard");
    return {
      id: `TRK${String(index + 1).padStart(4, "0")}`,
      routeId: route.id, busId: bus.id, operatorId: operator.id,
      departureAt: timestamp(departureDate, departureTime),
      arrivalAt: arrival.timestamp, departureTime, arrivalTime: arrival.time,
      departureDate, arrivalDate: arrival.date,
      fareConfiguration: {
        currency: "KES", baseFare,
        classes: travelClasses.map((travelClass) => ({
          classId: travelClass.id,
          fare: Math.round(baseFare * travelClass.priceMultiplier)
        })),
        bookingFee: 325, taxRate: 0
      },
      seatLayout: bus.seatLayout,
      bookingCutoffAt: new Date(new Date(`${departureDate}T${departureTime}:00Z`).getTime() - 60 * 60 * 1000).toISOString(),
      status: new Date(timestamp(departureDate, departureTime)) <= now ? "completed" : "scheduled",
      createdAt: timestamp(dateAtOffset(-50, now), "09:00"),
      archivedAt: null,
      busClass: classId,
      vehicleType: "coach"
    };
  });
}

function buildMatatuTrips(routes, buses, operators, now) {
  const serviceTimes = ["08:15", "13:30", "17:00", "20:00"];
  return routes.filter((route) => route.transportType === "matatu").flatMap((route, routeIndex) => {
    const operator = operators.find((entry) => entry.id === route.operatorId);
    const bus = buses.find((entry) => entry.vehicleType === "matatu" && entry.operatorId === route.operatorId);
    if (!operator || !bus) throw new Error(`Matatu route ${route.id} is missing its operator or vehicle.`);
    const departures = [];
    for (let dayOffset = 0; dayOffset < 3 && departures.length < 6; dayOffset += 1) {
      const date = dateAtOffset(dayOffset, now);
      serviceTimes
        .filter((time) => dayOffset > 0 || new Date(`${date}T${time}:00Z`) > now)
        .slice(0, 2)
        .forEach((time) => departures.push({ date, time }));
    }

    return departures.map(({ date, time }, departureIndex) => {
      const arrival = arrivalTime(date, time, route.durationMinutes);
      const baseFare = fareForRoute(route, "standard");
      const id = `TRM${String(routeIndex * 6 + departureIndex + 1).padStart(4, "0")}`;
      return {
        id, routeId: route.id, busId: bus.id, operatorId: operator.id,
        departureAt: timestamp(date, time), arrivalAt: arrival.timestamp,
        departureTime: time, arrivalTime: arrival.time,
        departureDate: date, arrivalDate: arrival.date,
        fareConfiguration: {
          currency: "KES", baseFare, bookingFee: 0, taxRate: 0,
          classes: [{ classId: "standard", fare: baseFare }]
        },
        seatLayout: bus.seatLayout,
        bookingCutoffAt: new Date(new Date(`${date}T${time}:00Z`).getTime() - 15 * 60 * 1000).toISOString(),
        status: "scheduled", createdAt: timestamp(dateAtOffset(-7, now), "09:00"),
        archivedAt: null, busClass: "standard", vehicleType: "matatu"
      };
    });
  });
}

function buildPromotions(now) {
  return Array.from({ length: 10 }, (_, index) => ({
    id: `PR${String(index + 1).padStart(3, "0")}`,
    code: `ROAD${String(10 + index * 5)}`,
    title: ["First trip treat", "Weekend wanderer", "Window seat special", "Early bird fare", "City hopper"][index % 5],
    discountType: index % 3 === 0 ? "fixed" : "percent",
    discountValue: index % 3 === 0 ? (5 + index) * 130 : 10 + index % 4 * 5,
    startsAt: timestamp(dateAtOffset(-30, now), "00:00"),
    endsAt: timestamp(dateAtOffset(60 + index, now), "23:59"),
    minimumFare: 2600, currency: "KES", maxRedemptions: 500 + index * 100,
    active: index !== 9, createdAt: timestamp(dateAtOffset(-40 + index, now), "11:00"), archivedAt: null
  }));
}

export function createSeedDatabase(now = new Date()) {
  const operators = buildOperators(now);
  const terminalRecords = buildTerminals(now);
  const routes = buildRoutes(terminalRecords, operators, now);
  const buses = buildBuses(operators, now);
  const passengers = buildPassengers(now);
  const scheduledTrips = [
    ...buildScheduledTrips(routes.filter((route) => route.transportType === "coach"), buses, operators, now),
    ...buildMatatuTrips(routes, buses, operators, now)
  ];
  const promotions = buildPromotions(now);
  const bookings = [];
  const payments = [];
  const cancellations = [];
  const refunds = [];
  const methods = paymentMethods;

  scheduledTrips.forEach((trip, index) => {
    const route = routes.find((entry) => entry.id === trip.routeId);
    const bus = buses.find((entry) => entry.id === trip.busId);
    const operator = operators.find((entry) => entry.id === trip.operatorId);
    const passenger = passengers[index % passengers.length];
    const selectedClass = trip.fareConfiguration.classes.find((entry) => entry.classId === trip.busClass);
    const quantity = index % 7 === 0 ? 2 : 1;
    const unitFare = selectedClass.fare;
    const subtotal = unitFare * quantity;
    const promotion = index % 10 === 0 ? promotions[index % promotions.length] : null;
    const discountAmount = promotion ? Math.min(subtotal, promotion.discountType === "fixed" ? promotion.discountValue : Math.round(subtotal * promotion.discountValue / 100)) : 0;
    const bookingFee = trip.fareConfiguration.bookingFee * quantity;
    const taxAmount = 0;
    const totalAmount = subtotal - discountAmount + bookingFee + taxAmount;
    const tripDate = new Date(trip.departureAt);
    const isCancelled = index % 13 === 0;
    const isCompleted = new Date(trip.departureAt) <= now && !isCancelled;
    const bookingStatus = isCancelled ? "cancelled" : isCompleted ? "completed" : "confirmed";
    const paymentStatus = isCancelled ? (index % 2 === 0 ? "refunded" : "void") : "paid";
    const bookedAt = new Date(tripDate.getTime() - (3 + index % 18) * 86400000).toISOString();
    const seats = Array.from({ length: quantity }, (_, seatIndex) => String(index % Math.max(1, bus.capacity - quantity) + seatIndex + 1));
    const isCoach = trip.vehicleType === "coach";
    const recordNumber = String(index + 1).padStart(4, "0");
    const booking = {
      id: `${isCoach ? "BK4" : "BK"}${recordNumber}`,
      bookingReference: `${isCoach ? "BS4" : "BS"}${String(310000 + index).slice(-6)}`,
      passengerId: passenger.id,
      tripId: trip.id,
      origin: route.originCity,
      destination: route.destinationCity,
      date: trip.departureDate,
      departure: trip.departureTime,
      arrival: trip.arrivalTime,
      price: unitFare,
      paymentMethod: methods[index % methods.length],
      paymentStatus,
      status: bookingStatus,
      bookedAt, updatedAt: bookedAt,
      quantity, seats,
      currency: "KES",
      passengerSnapshot: { id: passenger.id, name: `${passenger.firstName} ${passenger.lastName}`, email: passenger.email, phone: passenger.phone },
      tripSnapshot: {
        id: trip.id, routeId: route.id, busId: bus.id, operatorId: operator.id,
        operatorName: operator.name, busRegistration: bus.registration, busModel: bus.model,
        busClass: trip.busClass, vehicleType: trip.vehicleType || bus.vehicleType || route.transportType || "coach",
        currency: "KES",
        originCity: route.originCity, destinationCity: route.destinationCity,
        originTerminalId: route.originTerminalId, destinationTerminalId: route.destinationTerminalId,
        departureAt: trip.departureAt, arrivalAt: trip.arrivalAt,
        departureTime: trip.departureTime, arrivalTime: trip.arrivalTime,
        departureDate: trip.departureDate, arrivalDate: trip.arrivalDate
      },
      fareSnapshot: {
        currency: "KES", unitFare, quantity, subtotal,
        discount: promotion ? { promotionId: promotion.id, code: promotion.code, amount: discountAmount } : null,
        fees: [{ code: "booking-fee", amount: bookingFee }],
        taxes: [{ code: "tax", amount: taxAmount }],
        totalAmount
      },
      totalAmount, currency: "KES",
      vehicleType: trip.vehicleType || bus.vehicleType || route.transportType || "coach",
      vehicleLabel: (trip.vehicleType || bus.vehicleType || route.transportType) === "matatu" ? "Matatu" : "Coach bus",
      paymentId: `${isCoach ? "PAY4" : "PAY"}${recordNumber}`,
      ticket: { ticketNumber: `${isCoach ? "TKT4" : "TKT"}${String(710000 + index).slice(-6)}`, issuedAt: bookedAt, status: bookingStatus === "cancelled" ? "void" : "issued" },
      createdAt: bookedAt, archivedAt: null
    };
    bookings.push(booking);
    payments.push({
      id: booking.paymentId,
      bookingId: booking.id,
      amount: totalAmount, currency: "KES",
      method: booking.paymentMethod,
      status: paymentStatus,
      providerReference: `DEMO${isCoach ? "4" : ""}-${String(810000 + index).slice(-6)}`,
      paidAt: bookedAt,
      refundedAmount: paymentStatus === "refunded" ? totalAmount : 0,
      createdAt: bookedAt, archivedAt: null
    });
    if (isCancelled) {
      const cancellationId = `CAN${String(cancellations.length + 1).padStart(3, "0")}`;
      const cancellation = {
        id: cancellationId, bookingId: booking.id,
        reason: ["Change of plans", "Schedule conflict", "Passenger request"][index % 3],
        status: paymentStatus === "refunded" ? "refunded" : "approved",
        requestedAt: bookedAt, processedAt: bookedAt, createdAt: bookedAt, archivedAt: null
      };
      cancellations.push(cancellation);
      if (paymentStatus === "refunded") refunds.push({
        id: `RF${String(refunds.length + 1).padStart(3, "0")}`,
        bookingId: booking.id, cancellationId,
        paymentId: booking.paymentId,
        amount: totalAmount, currency: "KES",
        status: "completed", method: methods[index % methods.length],
        requestedAt: bookedAt, processedAt: bookedAt, createdAt: bookedAt, archivedAt: null
      });
    }
  });

  return {
    schemaVersion: 4,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    seedVersion: 4,
    collections: { operators, buses, terminals: terminalRecords, routes, scheduledTrips, passengers, bookings, promotions, payments, cancellations, refunds },
    metadata: { demo: true, sampleRouteCount: sampleTrips.length, timezone: "UTC" }
  };
}
