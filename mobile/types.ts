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
  createdAt?: any;
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
  createdAt: any;
  cancelledAt: any | null;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}
