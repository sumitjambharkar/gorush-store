export interface StoreAddress {
  addressLine: string;
  area: string;
  city: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Merchant {
  _id: string;
  ownerName: string;
  mobile: string;
  storeName: string;
  cuisine: string;
  priceLevel: number;
  coverImage: string;
  address: StoreAddress;
  isOpen: boolean;
  settings: { autoAccept: boolean; busyMode: boolean; loudAlerts: boolean; defaultPrepMinutes: number };
  openingHours: { open: string; close: string };
  rating: number;
  totalRatings: number;
  isSetupComplete: boolean;
  suggestedPrepMinutes: number;
  busyExtraMinutes: number;
}

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  isVeg: boolean;
  image: string;
  inStock: boolean;
}

export type OrderStatus = "new" | "preparing" | "ready" | "picked_up" | "delivered" | "rejected" | "cancelled";

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  note: string;
  isVeg: boolean;
}

export interface DeliveryInfo {
  bookingId: string;
  status: string;
  pickupOtp: string | null;
  driver: { name: string; mobile: string; vehicleNumber: string; vehicleType: string; rating?: number } | null;
}

export interface MerchantOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  deliveryAddress: {
    houseBuilding: string;
    addressLine: string;
    area: string;
    city: string;
    landmark: string;
    latitude: number;
    longitude: number;
  };
  items: OrderItem[];
  note: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  distanceKm: number;
  paymentMethod: "online" | "cod";
  paymentStatus: "pending" | "paid";
  status: OrderStatus;
  prepMinutes: number | null;
  acceptedAt: string | null;
  readyAt: string | null;
  rejectReason: string;
  createdAt: string;
  delivery: DeliveryInfo | null;
}

export interface OrderCounts {
  new: number;
  preparing: number;
  ready: number;
}

export interface TodaySummary {
  salesToday: number;
  ordersToday: number;
  avgPrepMinutes: number | null;
}

export interface Insights {
  week: { total: number; changePct: number | null; days: { date: string; label: string; sales: number; orders: number }[] };
  rating: { value: number | null; count: number };
  acceptance: { pct: number | null; declined: number };
  settlement: { amount: number; orders: number; date: string };
  topItems: { name: string; sold: number; revenue: number }[];
}
