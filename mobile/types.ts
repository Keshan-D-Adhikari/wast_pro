import type { Timestamp } from 'firebase/firestore';

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

export interface BinData {
  plastic: BinCompartment;
  food: BinCompartment;
  metal: BinCompartment;
  /** When the firmware last wrote, as epoch milliseconds (from bins/<id>/lastUpdated). */
  lastUpdated?: number | null;
  /** Free-text location the firmware reports, e.g. "Horizon Campus" (not GPS). */
  location?: string;
}

export interface AppNotification {
  id: string;
  toUid: string;
  type: string;
  message: string;
  read: boolean;
  createdAt?: Timestamp | null;
}

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
}

export interface MarketplaceItem {
  id: string;
  wasteType: string;
  weightKg: number;
  totalPrice: number;
  sellerUid: string;
  sellerName: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'available' | 'sold';
  /** Set while sold: the order that bought it (lets rules tie a cancel back to it). */
  soldOrderId?: string;
  createdAt?: Timestamp;
}

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
  paymentMethod: 'cash' | 'card';
  paymentStatus: 'paid' | 'pending';
  paymentLast4: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  location: {
    latitude: number;
    longitude: number;
  };
  createdAt: Timestamp;
  cancelledAt: Timestamp | null;
  /** Set when the order was created by a seller accepting this buyer offer. */
  offerId?: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface Offer {
  id: string;
  listingId: string;
  buyerUid: string;
  buyerName: string;
  sellerUid: string;
  sellerName: string;
  wasteType: string;
  weightKg: number;
  askingPrice: number;
  offeredPrice: number;
  /** pending | accepted | rejected | withdrawn */
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: Timestamp;
  updatedAt?: Timestamp | null;
}
