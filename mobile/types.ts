import type { Timestamp } from 'firebase/firestore';

export type WasteType = 'plastic' | 'food' | 'metal';

// One compartment inside the ESP32 firmware's "bins/Bin001" node in Realtime
// Database (see iotConfig.js). Fields are optional since a freshly-flashed
// device, or one missing a sensor, may not have uploaded them yet.
export interface BinCompartment {
  level?: number;
  weight?: number;
  moisture?: number;
  status?: string;
  overweight?: boolean;
  timestamp?: string;
}

export interface BinData {
  plastic: BinCompartment;
  food: BinCompartment;
  metal: BinCompartment;
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
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}
