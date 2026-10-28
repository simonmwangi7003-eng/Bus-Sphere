import { createSeedDatabase } from "../data/seed-data.js";
import { kenyanCities } from "../data/mock-data.js";
import { createId } from "../utils/helpers.js";
import { getLayoutSeats, getSeatInventory } from "../utils/seats.js";

export const STORAGE_KEY = "bussphere.database";
export const LEGACY_BOOKINGS_KEY = "bussphere.bookings";
export const SCHEMA_VERSION = 4;
export const COLLECTIONS = [
  "operators", "buses", "terminals", "routes", "scheduledTrips", "passengers",
  "bookings", "promotions", "payments", "cancellations", "refunds"
];

let database = null;
let persistent = true;
let startupWarning = "";
const LEGACY_USD_TO_KES = 130;

const references = {
  buses: { operatorId: "operators" },
  routes: { originTerminalId: "terminals", destinationTerminalId: "terminals", operatorId: "operators" },
  scheduledTrips: { routeId: "routes", busId: "buses", operatorId: "operators" },
  bookings: { tripId: "scheduledTrips", passengerId: "passengers", paymentId: "payments" },
  payments: { bookingId: "bookings" },
  cancellations: { bookingId: "bookings" },
  refunds: { bookingId: "bookings", cancellationId: "cancellations", paymentId: "payments" }
};
const uniqueFields = {
  operators: ["name"],
  buses: ["registration"],
  terminals: [],
  routes: ["code"],
  scheduledTrips: [],
  passengers: ["email"],
  bookings: ["bookingReference"],
  promotions: ["code"],
  payments: ["providerReference"],
  cancellations: [],
  refunds: []
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function recordsOf(source, collection) {
  return Array.isArray(source?.collections?.[collection]) ? source.collections[collection] : [];
}

function convertAmount(amount, multiplier) {
  const value = Number(amount);
  return Number.isFinite(value) ? Math.round(value * multiplier) : amount;
}

function migrateFareSnapshot(snapshot, multiplier) {
  if (!snapshot) return snapshot;
  return {
    ...snapshot,
    currency: "KES",
    unitFare: convertAmount(snapshot.unitFare, multiplier),
    subtotal: convertAmount(snapshot.subtotal, multiplier),
    totalAmount: convertAmount(snapshot.totalAmount, multiplier),
    discount: snapshot.discount ? { ...snapshot.discount, amount: convertAmount(snapshot.discount.amount, multiplier) } : null,
    fees: (snapshot.fees || []).map((fee) => ({ ...fee, amount: convertAmount(fee.amount, multiplier) })),
    taxes: (snapshot.taxes || []).map((tax) => ({ ...tax, amount: convertAmount(tax.amount, multiplier) })),
    seatFares: Array.isArray(snapshot.seatFares)
      ? snapshot.seatFares.map((seatFare) => ({ ...seatFare, fare: convertAmount(seatFare.fare, multiplier) }))
      : snapshot.seatFares
  };
}

function migrateStoredRecord(collection, source) {
  const record = clone(source);
  if (collection === "scheduledTrips") {
    const fare = record.fareConfiguration || {};
    const multiplier = fare.currency === "KES" ? 1 : LEGACY_USD_TO_KES;
    record.fareConfiguration = {
      ...fare,
      currency: "KES",
      baseFare: convertAmount(fare.baseFare, multiplier),
      bookingFee: convertAmount(fare.bookingFee, multiplier),
      classes: (fare.classes || []).map((entry) => ({ ...entry, fare: convertAmount(entry.fare, multiplier) }))
    };
    record.seatLayout = record.seatLayout ? {
      ...record.seatLayout,
      seatFares: Object.fromEntries(Object.entries(record.seatLayout.seatFares || {}).map(([seat, fareConfig]) => [
        seat, { ...fareConfig, priceAdjustment: convertAmount(fareConfig.priceAdjustment, multiplier) }
      ]))
    } : record.seatLayout;
  } else if (collection === "bookings") {
    const multiplier = record.currency === "KES" ? 1 : LEGACY_USD_TO_KES;
    record.currency = "KES";
    record.price = convertAmount(record.price, multiplier);
    record.totalAmount = convertAmount(record.totalAmount, multiplier);
    record.fareSnapshot = migrateFareSnapshot(record.fareSnapshot, multiplier);
    if (record.tripSnapshot) record.tripSnapshot = { ...record.tripSnapshot, currency: "KES" };
    if (Array.isArray(record.seatFares)) {
      record.seatFares = record.seatFares.map((seatFare) => ({ ...seatFare, fare: convertAmount(seatFare.fare, multiplier) }));
    }
  } else if (collection === "payments" || collection === "refunds") {
    const multiplier = record.currency === "KES" ? 1 : LEGACY_USD_TO_KES;
    record.currency = "KES";
    if ("amount" in record) record.amount = convertAmount(record.amount, multiplier);
    if ("refundedAmount" in record) record.refundedAmount = convertAmount(record.refundedAmount, multiplier);
  } else if (collection === "promotions") {
    record.minimumFare = convertAmount(record.minimumFare, LEGACY_USD_TO_KES);
    if (record.discountType === "fixed") record.discountValue = convertAmount(record.discountValue, LEGACY_USD_TO_KES);
    record.currency = "KES";
  }
  return record;
}

function normalizeLegacyBooking(legacy, seed, index) {
  const trip = seed.collections.scheduledTrips.find((entry) => entry.id === legacy.tripId)
    || seed.collections.scheduledTrips.find((entry) => {
      const route = seed.collections.routes.find((item) => item.id === entry.routeId);
      return route?.originCity === (legacy.origin === "Washington, DC" ? "Washington" : legacy.origin)
        && route?.destinationCity === (legacy.destination === "Washington, DC" ? "Washington" : legacy.destination);
    })
    || seed.collections.scheduledTrips[index % seed.collections.scheduledTrips.length];
  const route = seed.collections.routes.find((entry) => entry.id === trip.routeId);
  const passenger = seed.collections.passengers[index % seed.collections.passengers.length];
  const name = legacy.passenger?.name || `${passenger.firstName} ${passenger.lastName}`;
  const seats = Array.isArray(legacy.seats) && legacy.seats.length ? legacy.seats : ["1"];
  const quantity = seats.length;
  const multiplier = legacy.currency === "KES" || !Number(legacy.price) ? 1 : LEGACY_USD_TO_KES;
  const unitFare = convertAmount(Number(legacy.price) || trip.fareConfiguration.baseFare, multiplier);
  const subtotal = unitFare * quantity;
  const bookingFee = 325 * quantity;
  const totalAmount = legacy.totalAmount ? convertAmount(legacy.totalAmount, multiplier) : subtotal + bookingFee;
  const preferredId = legacy.id || `LEGACY${String(index + 1).padStart(4, "0")}`;
  const id = seed.collections.bookings.some((entry) => entry.id === preferredId)
    ? `LEGACY${String(index + 1).padStart(4, "0")}` : preferredId;
  const preferredReference = legacy.bookingReference || legacy.code;
  const bookingReference = preferredReference && !seed.collections.bookings.some((entry) => entry.bookingReference === preferredReference)
    ? preferredReference : createId("BS");
  const bookedAt = legacy.createdAt || legacy.bookedAt || new Date().toISOString();
  return {
    ...legacy,
    id, bookingReference, code: bookingReference, migrationSource: "legacy",
    passengerId: passenger.id, tripId: trip.id,
    status: String(legacy.status || "confirmed").toLowerCase(),
    bookedAt, createdAt: bookedAt, updatedAt: bookedAt, archivedAt: null,
    quantity, seats,
    origin: legacy.origin || route.originCity,
    destination: legacy.destination || route.destinationCity,
    date: legacy.date || trip.departureDate,
    departure: legacy.departure || trip.departureTime,
    arrival: legacy.arrival || trip.arrivalTime,
    originTerminal: legacy.originTerminal || route.originTerminalId,
    destinationTerminal: legacy.destinationTerminal || route.destinationTerminalId,
    price: unitFare,
    totalAmount, currency: "KES",
    vehicleType: trip.vehicleType || route.transportType || "coach",
    vehicleLabel: (trip.vehicleType || route.transportType) === "matatu" ? "Matatu" : "Coach bus",
    passenger: { name, email: legacy.passenger?.email || passenger.email, phone: legacy.passenger?.phone || passenger.phone },
    passengerSnapshot: { id: passenger.id, name, email: legacy.passenger?.email || passenger.email, phone: legacy.passenger?.phone || passenger.phone },
    tripSnapshot: {
      id: trip.id, routeId: route.id, busId: trip.busId, operatorId: trip.operatorId,
      operatorName: legacy.operator || "BusSphere Demo Operator",
      busClass: legacy.busClass || trip.busClass,
      vehicleType: trip.vehicleType || route.transportType || "coach",
      currency: "KES",
      originCity: legacy.origin || route.originCity,
      destinationCity: legacy.destination || route.destinationCity,
      originTerminalId: route.originTerminalId, destinationTerminalId: route.destinationTerminalId,
      departureAt: trip.departureAt, arrivalAt: trip.arrivalAt,
      departureTime: trip.departureTime, arrivalTime: trip.arrivalTime,
      departureDate: legacy.date || trip.departureDate
    },
    fareSnapshot: legacy.fareSnapshot
      ? migrateFareSnapshot(legacy.fareSnapshot, multiplier)
      : { currency: "KES", unitFare, quantity, subtotal, discount: null, fees: [{ code: "booking-fee", amount: bookingFee }], taxes: [{ code: "tax", amount: 0 }], totalAmount },
    paymentId: `LEGACYPAY${String(index + 1).padStart(4, "0")}`,
    ticket: legacy.ticket || { ticketNumber: createId("TKT"), issuedAt: bookedAt, status: "issued" }
  };
}

function importLegacyBookings(seed, existingBookings = []) {
  let skipped = 0;
  existingBookings.forEach((legacy, index) => {
    if (!legacy || typeof legacy !== "object") return;
    const origin = legacy.origin === "Washington, DC" ? "Washington" : legacy.origin;
    const destination = legacy.destination === "Washington, DC" ? "Washington" : legacy.destination;
    if ((origin && !kenyanCities.includes(origin)) || (destination && !kenyanCities.includes(destination))) {
      skipped += 1;
      return;
    }
    const booking = normalizeLegacyBooking(legacy, seed, index);
    seed.collections.bookings.push(booking);
    if (!seed.collections.payments.some((payment) => payment.id === booking.paymentId)) {
      seed.collections.payments.push({
        id: booking.paymentId, bookingId: booking.id,
        amount: booking.totalAmount, currency: booking.currency,
        method: legacy.paymentMethod || "Demo card",
        status: legacy.paymentStatus || "paid",
        providerReference: `MIGRATED-${booking.bookingReference}`,
        paidAt: booking.bookedAt, refundedAmount: 0,
        createdAt: booking.bookedAt, archivedAt: null
      });
    }
  });
  return skipped;
}

function validDatabaseShape(value) {
  return value && typeof value === "object"
    && Number.isInteger(value.schemaVersion)
    && value.collections && typeof value.collections === "object"
    && COLLECTIONS.every((collection) => Array.isArray(value.collections[collection]));
}

function reconcileDatabase(stored, seed) {
  let excludedOutOfCountryRoutes = 0;
  for (const collection of COLLECTIONS) {
    const storedRecords = recordsOf(stored, collection).filter((record) => {
      if (!record || typeof record !== "object" || Array.isArray(record) || typeof record.id !== "string" || !record.id) return false;
      if (stored.schemaVersion >= SCHEMA_VERSION) return true;
      if (collection === "routes") {
        const supported = kenyanCities.includes(record.originCity) && kenyanCities.includes(record.destinationCity);
        if (!supported) excludedOutOfCountryRoutes += 1;
        return supported;
      }
      if (collection === "terminals") return kenyanCities.includes(record.city);
      return true;
    });
    if (stored.schemaVersion >= SCHEMA_VERSION) {
      seed.collections[collection] = clone(storedRecords);
    } else {
      const merged = new Map(recordsOf(seed, collection).map((record) => [record.id, record]));
      for (const record of storedRecords) merged.set(record.id,
        stored.schemaVersion < 3 ? migrateStoredRecord(collection, record) : record);
      seed.collections[collection] = [...merged.values()];
    }
  }
  let changed;
  do {
    const previousCount = COLLECTIONS.reduce((count, collection) => count + seed.collections[collection].length, 0);
    const idsByCollection = Object.fromEntries(COLLECTIONS.map((collection) => [
      collection, new Set(seed.collections[collection].map((record) => record.id))
    ]));
    for (const [collection, foreignKeys] of Object.entries(references)) {
      seed.collections[collection] = seed.collections[collection].filter((record) =>
        Object.entries(foreignKeys).every(([field, target]) => idsByCollection[target].has(record[field]))
      );
    }
    const routes = new Map(seed.collections.routes.map((route) => [route.id, route]));
    const buses = new Map(seed.collections.buses.map((bus) => [bus.id, bus]));
    seed.collections.scheduledTrips = seed.collections.scheduledTrips.filter((trip) => {
      const route = routes.get(trip.routeId);
      const bus = buses.get(trip.busId);
      const busSeats = new Set(Array.isArray(bus?.seatLayout?.seatNumbers) ? bus.seatLayout.seatNumbers.map(String) : []);
      return route?.operatorId === trip.operatorId
        && bus?.operatorId === trip.operatorId
        && Array.isArray(trip.seatLayout?.seatNumbers)
        && busSeats.size === bus.capacity
        && trip.seatLayout.seatNumbers.length === bus.capacity
        && trip.seatLayout.seatNumbers.every((seat) => busSeats.has(String(seat)));
    });
    const bookings = new Map(seed.collections.bookings.map((booking) => [booking.id, booking]));
    const payments = new Map(seed.collections.payments.map((payment) => [payment.id, payment]));
    seed.collections.bookings = seed.collections.bookings.filter((booking) =>
      payments.get(booking.paymentId)?.bookingId === booking.id);
    seed.collections.payments = seed.collections.payments.filter((payment) =>
      bookings.get(payment.bookingId)?.paymentId === payment.id);
    changed = COLLECTIONS.reduce((count, collection) => count + seed.collections[collection].length, 0) !== previousCount;
  } while (changed);
  seed.updatedAt = new Date().toISOString();
  return { database: seed, excludedOutOfCountryRoutes };
}

function persist(nextDatabase) {
  if (!persistent) {
    database = nextDatabase;
    return false;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDatabase));
    database = nextDatabase;
    return true;
  } catch (error) {
    if (error?.name === "QuotaExceededError" || error?.name === "NS_ERROR_DOM_QUOTA_REACHED") {
      persistent = false;
      startupWarning = "Browser storage is full. Demo data will remain available for this tab, but changes may not persist after closing it.";
      console.error("BusSphere local data storage quota exceeded:", error);
      database = nextDatabase;
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("bussphere:storage-warning", { detail: startupWarning }));
      return false;
    }
    console.error("Unable to save BusSphere data:", error);
    throw new Error("Your change could not be saved. Check browser storage permissions and try again.");
  }
}

export function initializeDataStore({ reset = false } = {}) {
  startupWarning = "";
  persistent = true;
  if (reset) {
    database = createSeedDatabase();
    const saved = persist(database);
    return { seeded: true, migrated: false, persistent: saved, warning: startupWarning };
  }
  let stored = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        stored = JSON.parse(raw);
      } catch (error) {
        console.error("BusSphere data store was corrupted; restoring demo data:", error);
        startupWarning = "Saved demo data could not be read, so a fresh demo dataset has been loaded.";
      }
    }
  } catch (error) {
    persistent = false;
    console.warn("BusSphere browser storage is unavailable; using a temporary demo dataset:", error);
    startupWarning = "Browser storage is unavailable. Changes will only last for this tab.";
  }

  const seed = createSeedDatabase();
  if (stored?.schemaVersion > SCHEMA_VERSION) {
    database = seed;
    persistent = false;
    startupWarning = `This demo dataset was created with a newer schema (version ${stored.schemaVersion}). It is running a temporary compatible dataset without replacing your saved data.`;
    return { seeded: false, migrated: false, persistent: false, warning: startupWarning };
  }

  let migrated = false;
  if (validDatabaseShape(stored)) {
    migrated = stored.schemaVersion < SCHEMA_VERSION;
    const reconciliation = reconcileDatabase(stored, seed);
    database = reconciliation.database;
    if (reconciliation.excludedOutOfCountryRoutes) {
      const count = reconciliation.excludedOutOfCountryRoutes;
      startupWarning = `Excluded ${count} saved route${count === 1 ? "" : "s"} outside Kenya and their dependent schedules and bookings.`;
    }
  } else {
    database = seed;
    migrated = Boolean(stored);
  }

  if (persistent) {
    try {
      const legacyValue = localStorage.getItem(LEGACY_BOOKINGS_KEY);
      if (legacyValue) {
        const parsed = JSON.parse(legacyValue);
        if (Array.isArray(parsed) && parsed.length && !database.metadata?.legacyBookingsImportComplete) {
          const skipped = importLegacyBookings(database, parsed);
          database.metadata = { ...(database.metadata || {}), legacyBookingsImportComplete: true };
          migrated = true;
          if (skipped) {
            const legacyWarning = `${skipped} older booking${skipped === 1 ? "" : "s"} outside Kenyan cities could not be imported.`;
            startupWarning = startupWarning ? `${startupWarning} ${legacyWarning}` : legacyWarning;
          }
        }
      }
    } catch (error) {
      console.error("Unable to migrate previous BusSphere bookings:", error);
      startupWarning = "Older saved bookings could not be migrated. The new demo dataset is available.";
    }
  }
  const seeded = !stored || !validDatabaseShape(stored);
  if (stored && !validDatabaseShape(stored) && !startupWarning) {
    startupWarning = "Saved BusSphere data used an incompatible format, so a fresh demo dataset has been loaded.";
  }
  const saved = persist(database);
  return { seeded, migrated, persistent: saved, warning: startupWarning };
}

export function getStorageWarning() {
  return startupWarning;
}

export function isPersistent() {
  return persistent;
}

export function getDatabaseSnapshot() {
  ensureInitialized();
  return clone(database);
}

export function getRecord(collection, id) {
  ensureCollection(collection);
  const record = database.collections[collection].find((entry) => entry.id === id && !entry.archivedAt);
  return record ? clone(record) : null;
}

export function listRecords(collection, options = {}) {
  ensureCollection(collection);
  const { includeArchived = false, filters = {}, query = "", sortBy = "createdAt", order = "desc", limit = Infinity } = options;
  let records = database.collections[collection].filter((record) =>
    (includeArchived || !record.archivedAt)
    && Object.entries(filters).every(([key, value]) => value === undefined || value === "" || record[key] === value)
  );
  if (query) {
    const term = String(query).toLowerCase();
    records = records.filter((record) => JSON.stringify(record).toLowerCase().includes(term));
  }
  if (sortBy) {
    const direction = order === "asc" ? 1 : -1;
    records = [...records].sort((left, right) => {
      const a = left[sortBy] ?? "";
      const b = right[sortBy] ?? "";
      return (typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b))) * direction;
    });
  }
  return clone(records.slice(0, limit));
}

export function searchRecords(collection, query, options = {}) {
  return listRecords(collection, { ...options, query });
}

export function createRecord(collection, record) {
  return transact((working) => {
    ensureCollection(collection);
    const created = { ...record, id: record.id || createId(collection.slice(0, 3).toUpperCase()), createdAt: record.createdAt || new Date().toISOString(), archivedAt: null };
    validateRecord(collection, created, working);
    if (working.collections[collection].some((entry) => entry.id === created.id)) throw new Error(`A ${collection} record with id "${created.id}" already exists.`);
    working.collections[collection].push(created);
    return created;
  });
}

export function updateRecord(collection, id, changes) {
  return transact((working) => {
    ensureCollection(collection);
    const index = working.collections[collection].findIndex((entry) => entry.id === id && !entry.archivedAt);
    if (index < 0) throw new Error(`No active ${collection} record was found for "${id}".`);
    const patch = typeof changes === "function" ? changes(clone(working.collections[collection][index])) : changes;
    const updated = { ...working.collections[collection][index], ...patch, id, updatedAt: new Date().toISOString() };
    validateRecord(collection, updated, working);
    working.collections[collection][index] = updated;
    return updated;
  });
}

export function archiveRecord(collection, id) {
  return updateRecord(collection, id, { archivedAt: new Date().toISOString(), active: false });
}

export function deleteRecord(collection, id) {
  return transact((working) => {
    ensureCollection(collection);
    const record = working.collections[collection].find((entry) => entry.id === id);
    if (!record) throw new Error(`No ${collection} record was found for "${id}".`);
    const dependent = Object.entries(references).some(([childCollection, fields]) =>
      Object.entries(fields).some(([field, parentCollection]) => parentCollection === collection
        && working.collections[childCollection].some((child) => child[field] === id))
    );
    const referencedBySnapshot = collection === "promotions" && working.collections.bookings.some((booking) =>
      booking.fareSnapshot?.discount?.promotionId === id);
    if (dependent || referencedBySnapshot || ["bookings", "payments", "cancellations", "refunds"].includes(collection)) {
      throw new Error(`This ${collection} record has transaction history or related records; archive it instead of deleting it.`);
    }
    working.collections[collection] = working.collections[collection].filter((entry) => entry.id !== id);
    return record;
  });
}

export function transact(mutator) {
  ensureInitialized();
  const working = clone(database);
  const result = mutator(working);
  working.updatedAt = new Date().toISOString();
  const saved = persist(working);
  if (!saved && persistent === false) return clone(result);
  return clone(result);
}

export function resetDemoData() {
  const fresh = createSeedDatabase();
  return transact((working) => {
    working.schemaVersion = fresh.schemaVersion;
    working.createdAt = fresh.createdAt;
    working.seedVersion = fresh.seedVersion;
    working.metadata = fresh.metadata;
    for (const collection of COLLECTIONS) working.collections[collection] = fresh.collections[collection];
    return { reset: true, counts: getCollectionCounts(working) };
  });
}

export function getCollectionCounts(source = null) {
  const target = source || getDatabaseSnapshot();
  return Object.fromEntries(COLLECTIONS.map((collection) => [collection, recordsOf(target, collection).filter((record) => !record.archivedAt).length]));
}

export function readBookings() {
  return listRecords("bookings", { sortBy: "createdAt", order: "desc" }).map((booking) => ({
    ...booking,
    code: booking.code || booking.bookingReference,
    origin: booking.origin || booking.tripSnapshot?.originCity || "",
    destination: booking.destination || booking.tripSnapshot?.destinationCity || "",
    date: booking.date || booking.tripSnapshot?.departureDate || "",
    departure: booking.departure || booking.tripSnapshot?.departureTime || "",
    arrival: booking.arrival || booking.tripSnapshot?.arrivalTime || "",
    price: booking.price || booking.fareSnapshot?.unitFare || 0,
    passenger: booking.passenger || {
      name: booking.passengerSnapshot?.name || "",
      email: booking.passengerSnapshot?.email || "",
      phone: booking.passengerSnapshot?.phone || ""
    }
  }));
}

export function saveBooking(booking, newPassenger = null) {
  return transact((working) => {
    if (newPassenger && !working.collections.passengers.some((record) => record.id === newPassenger.id)) {
      validateRecord("passengers", newPassenger, working);
      working.collections.passengers.push(newPassenger);
    }
    const passenger = booking.passengerId
      ? working.collections.passengers.find((record) => record.id === booking.passengerId)
      : null;
    if (!passenger) throw new Error("The passenger record could not be found. Please try again.");
    const trip = working.collections.scheduledTrips.find((record) => record.id === booking.tripId);
    if (!trip) throw new Error("The selected trip is no longer available. Please search again.");
    const seats = (booking.seats || []).map(String);
    const quantity = booking.quantity || seats.length;
    const inventoryByNumber = new Map(getSeatInventory(trip, working.collections.bookings)
      .map((seat) => [seat.number, seat]));
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > inventoryByNumber.size
      || quantity !== seats.length
      || new Set(seats).size !== seats.length
      || seats.some((seat) => inventoryByNumber.get(seat)?.status !== "available")) {
      throw new Error("One or more selected seats are no longer available. Please choose different seats.");
    }
    const id = booking.id || createId("BK");
    const bookingReference = booking.bookingReference || booking.code || createId("BS");
    const passengerSnapshot = booking.passengerSnapshot || {
      id: passenger?.id,
      name: booking.passenger?.name || `${passenger?.firstName || "Demo"} ${passenger?.lastName || "Passenger"}`,
      email: booking.passenger?.email || passenger?.email || "",
      phone: booking.passenger?.phone || passenger?.phone || ""
    };
    const currency = "KES";
    const subtotal = booking.fareSnapshot?.subtotal ?? booking.price * quantity;
    const bookingFee = (Number(trip.fareConfiguration.bookingFee) || 0) * quantity;
    const totalAmount = booking.totalAmount || subtotal + bookingFee;
    const paymentId = booking.paymentId || createId("PAY");
    const createdAt = booking.createdAt || new Date().toISOString();
    const complete = {
      ...booking, id, bookingReference, code: bookingReference,
      passengerId: passenger?.id, passenger: { name: passengerSnapshot.name, email: passengerSnapshot.email, phone: passengerSnapshot.phone },
      passengerSnapshot, tripId: trip.id, paymentId, seats: [...seats], quantity,
      status: booking.status || "confirmed",
      date: booking.date || trip.departureDate,
      totalAmount, currency,
      fareSnapshot: booking.fareSnapshot || {
        currency, unitFare: booking.price, quantity, subtotal, discount: null,
        fees: bookingFee ? [{ code: "booking-fee", amount: bookingFee }] : [],
        taxes: [{ code: "tax", amount: 0 }], totalAmount
      },
      createdAt, bookedAt: booking.bookedAt || createdAt, updatedAt: createdAt, archivedAt: null
    };
    const payment = {
      id: paymentId, bookingId: id,
      amount: totalAmount, currency,
      method: booking.paymentMethod || "Demo card",
      status: booking.paymentStatus || "paid",
      providerReference: `DEMO-${bookingReference}`,
      paidAt: createdAt, refundedAmount: 0,
      createdAt, archivedAt: null
    };
    complete.paymentMethod = payment.method;
    complete.paymentStatus = payment.status;
    working.collections.payments.unshift(payment);
    validateRecord("bookings", complete, working);
    working.collections.bookings.unshift(complete);
    validateRecord("payments", payment, working);
    return complete;
  });
}

export function clearBookings() {
  return transact((working) => {
    working.collections.bookings = working.collections.bookings.filter((booking) => booking.id.startsWith("BK"));
    const bookingIds = new Set(working.collections.bookings.map((booking) => booking.id));
    working.collections.payments = working.collections.payments.filter((payment) => bookingIds.has(payment.bookingId));
    return true;
  });
}

function validateRecord(collection, record, source) {
  for (const field of uniqueFields[collection] || []) {
    const duplicate = source.collections[collection].find((entry) => entry.id !== record.id
      && entry[field] && String(entry[field]).toLowerCase() === String(record[field]).toLowerCase());
    if (duplicate) throw new Error(`A ${collection} record already uses ${field} "${record[field]}".`);
  }
  const foreignKeys = references[collection] || {};
  for (const [field, target] of Object.entries(foreignKeys)) {
    if (!record[field] || !source.collections[target].some((entry) => entry.id === record[field])) {
      throw new Error(`The ${collection} record references a missing ${target} record (${record[field]}).`);
    }
  }
  if (collection === "scheduledTrips") {
    const route = source.collections.routes.find((entry) => entry.id === record.routeId);
    const bus = source.collections.buses.find((entry) => entry.id === record.busId);
    const busSeats = getLayoutSeats(bus?.seatLayout || {});
    const tripSeats = getLayoutSeats(record.seatLayout || {});
    const busSeatNumbers = busSeats.map((seat) => seat.number);
    const tripSeatNumbers = tripSeats.map((seat) => seat.number);
    const busSeatSet = new Set(busSeatNumbers);
    if (route && route.operatorId !== record.operatorId) throw new Error("The scheduled trip operator must match the route operator.");
    if (bus && bus.operatorId !== record.operatorId) throw new Error("The scheduled trip operator must match the assigned bus operator.");
    if (!Number.isFinite(Date.parse(record.departureAt)) || !Number.isFinite(Date.parse(record.arrivalAt))
      || new Date(record.arrivalAt) <= new Date(record.departureAt)) {
      throw new Error("A scheduled trip must arrive after it departs.");
    }
    if (!busSeatNumbers.length || !tripSeatNumbers.length
      || busSeatNumbers.length !== bus.capacity
      || tripSeatNumbers.length !== bus.capacity
      || new Set(tripSeatNumbers.map(String)).size !== tripSeatNumbers.length
      || tripSeatNumbers.some((seat) => !busSeatSet.has(String(seat)))) {
      throw new Error("A scheduled trip must use the assigned bus's valid seat layout.");
    }
    const fares = record.fareConfiguration;
    if (!Number.isFinite(fares?.baseFare) || fares.baseFare <= 0
      || !Number.isFinite(fares.bookingFee) || fares.bookingFee < 0
      || !Array.isArray(fares.classes) || !fares.classes.length
      || fares.classes.some((entry) => !entry.classId || !Number.isFinite(entry.fare) || entry.fare < 0)) {
      throw new Error("A scheduled trip must include a valid fare configuration.");
    }
  }
}

function ensureCollection(collection) {
  ensureInitialized();
  if (!COLLECTIONS.includes(collection)) throw new Error(`Unknown BusSphere collection "${collection}".`);
}

function ensureInitialized() {
  if (!database) initializeDataStore();
}
