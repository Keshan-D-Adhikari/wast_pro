// SHARED TYPESCRIPT TYPES
// This file describes the SHAPE of the data used across the app: what fields a
// user, listing, order or offer has. TypeScript uses these shapes to catch
// mistakes (for example a misspelled field name) while you write code.
// They match the documents stored in Firestore and the bin data in the IoT database.
// "interface" = a list of fields. A "?" after a name means the field is optional.
import type { Timestamp } from 'firebase/firestore';

// The three waste compartments of the smart bin. Only these words are allowed.
export type WasteType = 'plastic' | 'food' | 'metal';

// One compartment inside the ESP32 firmware's "bins/Bin001" node in Realtime
// Database (see iotConfig.js). Fields are optional since a freshly-flashed
// device, or one missing a sensor, may not have uploaded them yet.
export interface BinCompartment {
  level?: number;
  weight?: number;
  moisture?: number;
  /** Firmware-computed status: EMPTY | LOW | HALF | '75%' | FULL | ERROR — see constants/bin-status.ts. */
  status?: string;
  overweight?: boolean;
  timestamp?: string;
}

// All three compartments of one bin, plus when it last reported and where it is.
// Comes from the IoT Realtime Database.
export interface BinData {
  plastic: BinCompartment;
  food: BinCompartment;
  metal: BinCompartment;
  /** When the firmware last wrote, as epoch milliseconds (from bins/<id>/lastUpdated). */
  lastUpdated?: number | null;
  /** Free-text location the firmware reports, e.g. "Horizon Campus" (not GPS). */
  location?: string;
}

// A notification shown to a user. Saved in Firestore. "toUid" is the user who receives it.
// Timestamp is Firestore's own date-and-time type.
export interface AppNotification {
  id: string;
  toUid: string;
  type: string;
  message: string;
  read: boolean;
  createdAt?: Timestamp | null;
}

// The profile document saved in Firestore at users/<uid>. Created in
// CreateAccount.tsx. Only the first four fields are set at sign-up; the rest are
// added later when the user edits their profile or sets up their bin.
export interface UserProfile {
  fullName: string;
  email: string;
  role: 'seller' | 'buyer';
  createdAt?: string;
  phone?: string;
  photoURL?: string;
  location?: string;
  points?: number;
  /** The smart bin this seller sees (a key under bins/ in the IoT database). Set by an admin; defaults to bin001. */
  binId?: string;
  /** Where the smart bin physically is (the firmware sends no GPS). Set by the seller from the dashboard. */
  binLocation?: { latitude: number; longitude: number };
  /** The company or place name the buyer picked for where the smart bin is kept. */
  binPlaceName?: string;
}

// A listing: waste a seller has put up for sale in the marketplace.
// Saved in Firestore. Buyers browse these.
export interface MarketplaceItem {
  id: string;
  wasteType: string;
  weightKg: number;
  totalPrice: number;
  sellerUid: string;
  sellerName: string;
  // Pickup position, used to draw the map and the route.
  location: {
    latitude: number;
    longitude: number;
  };
  // 'available' = can still be bought, 'sold' = a buyer has ordered it.
  status: 'available' | 'sold';
  /** Set while sold: the order that bought it (lets rules tie a cancel back to it). */
  soldOrderId?: string;
  createdAt?: Timestamp;
}

// An order: a buyer buying a listing. Saved in Firestore.
export interface Order {
  id: string;
  listingId: string;
  buyerUid: string;
  buyerName: string;
  sellerUid: string;
  sellerName: string;
  wasteType: string;
  weightKg: number;
  totalPrice: number;
  // Cash on pickup, or card (paid through Stripe, see functions/index.js).
  paymentMethod: 'cash' | 'card';
  paymentStatus: 'paid' | 'pending';
  // Last 4 digits of the card, or null if the buyer paid by cash.
  paymentLast4: string | null;
  // Order life cycle: pending -> confirmed -> completed (or cancelled).
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  location: {
    latitude: number;
    longitude: number;
  };
  createdAt: Timestamp;
  cancelledAt: Timestamp | null;
  /** Set when the order was created by a seller accepting this buyer offer. */
  offerId?: string;
  /** True from the moment a seller accepts an offer until the buyer chooses to buy or decline. */
  awaitingBuyer?: boolean;
  /** 1-5 stars the buyer gave after the order was completed. */
  rating?: number;
}

// A simple GPS point (for example the phone's current position).
export interface UserLocation {
  latitude: number;
  longitude: number;
}

// An offer: a buyer proposes a different price for a listing. The seller can
// accept or reject it. Saved in Firestore.
export interface Offer {
  id: string;
  listingId: string;
  buyerUid: string;
  buyerName: string;
  sellerUid: string;
  sellerName: string;
  wasteType: string;
  weightKg: number;
  // The seller's listed price and the buyer's proposed price.
  askingPrice: number;
  offeredPrice: number;
  /** pending | accepted | rejected | withdrawn */
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: Timestamp;
  updatedAt?: Timestamp | null;
}
