# 📁 SmartWaste Pro — Full Codebase Structure & Documentation

> **Author:** Keshan D. Adhikari  
> **Project Type:** Final Year Project — IoT-Based Intelligent Waste Management & Recycling Marketplace  
> **Last Updated:** 2026-07-04

---

## 🧭 Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Full Directory Tree](#3-full-directory-tree)
4. [Technology Stack](#4-technology-stack)
5. [Mobile App — Deep Dive](#5-mobile-app--deep-dive)
6. [Admin Panel — Deep Dive](#6-admin-panel--deep-dive)
7. [Firebase & Backend Services](#7-firebase--backend-services)
8. [Data Models (Firestore)](#8-data-models-firestore)
9. [Feature Breakdown by Role](#9-feature-breakdown-by-role)
10. [IoT Integration](#10-iot-integration)
11. [Screens & Navigation Map](#11-screens--navigation-map)
12. [TypeScript Types](#12-typescript-types)
13. [Environment & Configuration](#13-environment--configuration)
14. [Screenshots](#14-screenshots)

---

## 1. Project Overview

**SmartWaste Pro** is an end-to-end IoT-based intelligent waste management and recycling marketplace platform. It bridges the gap between **waste producers (Sellers)** and **recycling companies (Buyers)** using smart bin hardware, a mobile application, and a cloud backend.

### Core Concept

```
[ESP32 Smart Bin + Sensors]
         |
         | (Firebase Realtime/Firestore)
         v
[Firebase Cloud (Auth, Firestore, Storage)]
         |
    +----+----+
    v          v
[Mobile App] [Admin Panel]
(Seller/Buyer) (Web Dashboard)
```

---

## 2. System Architecture

The platform is composed of **3 main sub-systems**:

| Sub-System | Technology | Purpose |
|---|---|---|
| Mobile App | React Native + Expo | Seller & Buyer user-facing app |
| Admin Panel | React + Vite | Web dashboard for administrators |
| IoT Device | ESP32 + Ultrasonic/Moisture Sensors | Smart bin level/weight/moisture monitoring |
| Cloud Backend | Firebase (Auth, Firestore, Storage) | Authentication, data persistence, file storage |
| Node.js Backend (referenced) | Node.js + Express + MongoDB | REST API layer (referenced in requirements) |

---

## 3. Full Directory Tree

```
wast-pro/                               <- Project Root
|
+-- README.md                           <- Project overview & screenshots
+-- reqament.txt                        <- Backend requirements & env config guide
+-- .gitignore                          <- Root-level git ignore
|
+-- screenshots/                        <- UI Screenshots for documentation
|   +-- Add_wast.PNG
|   +-- Login_page.PNG
|   +-- My_oder.PNG
|   +-- Seller_profile.PNG
|   +-- buyer_dashboard.PNG
|   +-- buyer_profile.PNG
|   +-- create_account.PNG
|   +-- seller_dashboard.PNG
|
+-- admin/                              <- Admin Web Panel (React + Vite)
|   +-- package.json                    <- Admin dependencies
|   +-- vite.config.js                  <- Vite bundler config
|   +-- eslint.config.js                <- ESLint configuration
|   +-- index.html                      <- HTML entry point
|   +-- .gitignore
|   +-- README.md
|   +-- public/                         <- Static public assets
|   +-- src/                            <- Admin React source
|       +-- main.jsx                    <- React DOM entry point
|       +-- App.jsx                     <- Root App component (currently scaffold)
|       +-- App.css                     <- App-level styles
|       +-- index.css                   <- Global styles
|       +-- assets/                     <- Admin static assets
|           +-- react.svg
|
+-- mobile/                             <- Mobile App (React Native + Expo)
    +-- package.json                    <- Mobile dependencies
    +-- app.json                        <- Expo app configuration
    +-- tsconfig.json                   <- TypeScript config
    +-- eslint.config.js                <- ESLint config
    +-- expo-env.d.ts                   <- Expo environment type declarations
    +-- firebaseConfig.js               <- Firebase SDK initialization
    +-- types.ts                        <- Global TypeScript interfaces
    +-- .gitignore
    +-- README.md
    |
    +-- app/                            <- Expo Router file-based routes
    |   +-- _layout.tsx                 <- Root Stack layout (ThemeProvider, StatusBar)
    |   +-- (tabs)/                     <- Tab group (main navigation)
    |       +-- _layout.tsx             <- Tab Stack layout (slide animations)
    |       +-- index.tsx               <- Default redirect screen
    |       +-- Welcome.tsx             <- Welcome/onboarding screen
    |       +-- Login.tsx               <- Login screen (Firebase Auth)
    |       +-- CreateAccount.tsx       <- Registration screen (Seller/Buyer)
    |       |
    |       +-- seller/                 <- Seller role screens
    |       |   +-- SellerDashboard.tsx <- Main seller screen (IoT bins, charts, map)
    |       |   +-- SellerProfile.tsx   <- Seller profile & stats
    |       |   +-- SellerOrders.tsx    <- Incoming orders management
    |       |   +-- AddWaste.tsx        <- Create marketplace listing
    |       |   +-- EditProfile.tsx     <- Edit seller profile
    |       |
    |       +-- buyer/                  <- Buyer role screens
    |           +-- BuyerDashboard.tsx  <- Marketplace listing, map, payment
    |           +-- BuyerOrders.tsx     <- Order tracking & history
    |           +-- BuyerProfile.tsx    <- Buyer profile
    |           +-- EditProfile.tsx     <- Edit buyer profile
    |
    +-- components/                     <- Reusable UI components
    |   +-- external-link.tsx           <- External link component
    |   +-- haptic-tab.tsx              <- Haptic feedback tab component
    |   +-- hello-wave.tsx              <- Animated wave component
    |   +-- parallax-scroll-view.tsx    <- Parallax scrolling component
    |   +-- themed-text.tsx             <- Theme-aware Text component
    |   +-- themed-view.tsx             <- Theme-aware View component
    |   +-- ui/                         <- Core UI sub-components
    |       +-- collapsible.tsx         <- Collapsible/accordion component
    |       +-- icon-symbol.tsx         <- Icon wrapper (cross-platform)
    |       +-- icon-symbol.ios.tsx     <- iOS-specific icon implementation
    |
    +-- constants/
    |   +-- theme.ts                    <- App theme (colors, typography, spacing)
    |
    +-- hooks/                          <- Custom React hooks
    |   +-- use-color-scheme.ts         <- Color scheme hook (native)
    |   +-- use-color-scheme.web.ts     <- Color scheme hook (web)
    |   +-- use-theme-color.ts          <- Theme color resolver hook
    |
    +-- assets/
    |   +-- images/                     <- App images (logo, backgrounds, icons)
    |
    +-- backend/                        <- (Empty - reserved for backend integration)
    |
    +-- scripts/
    |   +-- reset-project.js            <- Dev utility: reset Expo project
    |
    +-- .expo/                          <- Expo internal config (auto-generated)
    +-- .vscode/                        <- VS Code workspace settings
```

---

## 4. Technology Stack

### Mobile Application

| Category | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React Native | 0.81.5 | Cross-platform mobile UI |
| Platform | Expo | ~54.0.33 | Development toolchain & build |
| Router | Expo Router | ~6.0.23 | File-based navigation |
| Language | TypeScript | ~5.9.2 | Type safety |
| UI Library | @expo/vector-icons | ^15.0.3 | Ionicons & more |
| Maps | react-native-maps | 1.20.1 | Google Maps integration |
| Charts | react-native-chart-kit | ^6.12.0 | PieChart for waste analytics |
| Animation | react-native-reanimated | ~4.1.1 | Smooth animations |
| Gestures | react-native-gesture-handler | ~2.28.0 | Swipe & tap gestures |
| Storage | @react-native-async-storage | 2.2.0 | Persistent local storage |
| Location | expo-location | ~19.0.8 | GPS & geolocation |
| Image Picker | expo-image-picker | ~17.0.10 | Profile photo upload |
| Firebase | firebase | ^12.11.0 | Auth, Firestore, Storage |
| Safe Area | react-native-safe-area-context | ~5.6.0 | Notch-safe layouts |
| SVG | react-native-svg | ^15.12.1 | Vector graphics |
| Navigation | @react-navigation/native + bottom-tabs | ^7.x | Navigation stack |

### Admin Panel

| Category | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React | ^19.2.0 | UI component library |
| Bundler | Vite | ^7.2.4 | Fast dev server & bundler |
| Plugin | @vitejs/plugin-react | ^5.1.1 | React HMR support |
| Language | JavaScript (JSX) | — | Admin UI scripting |
| Linter | ESLint | ^9.39.1 | Code quality |

### Cloud Services (Firebase)

| Service | Usage |
|---|---|
| Firebase Auth | Email/password authentication for Sellers & Buyers |
| Cloud Firestore | Real-time NoSQL database (users, bins, marketplace, orders, notifications) |
| Firebase Storage | Profile images, waste listing photos |
| AsyncStorage Persistence | Auth session persists across app restarts |

### IoT Hardware

| Component | Role |
|---|---|
| ESP32 Microcontroller | Main IoT controller in smart bin |
| Ultrasonic Sensor (HC-SR04) | Measures bin fill level (%) |
| Load Cell / Weight Sensor | Measures waste weight (kg) |
| Moisture Sensor | Detects moisture % in food waste compartment |
| Firebase Firestore | ESP32 writes sensor data → mobile app reads in real-time |

### Backend Server (referenced in requirements)

| Technology | Purpose |
|---|---|
| Node.js >= 18.x | Runtime |
| Express.js | REST API framework |
| MongoDB (Atlas or Local) | Data persistence |
| Mongoose | MongoDB ODM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT-based auth |
| cors | Cross-origin resource sharing |
| dotenv | Environment variable management |

---

## 5. Mobile App — Deep Dive

### Navigation Architecture

The app uses **Expo Router** with file-based routing:

```
/                  -> index.tsx (redirect)
/(tabs)/Welcome    -> Onboarding
/(tabs)/Login      -> Login (Firebase Auth)
/(tabs)/CreateAccount -> Registration (role selection)

/(tabs)/seller/SellerDashboard  -> Seller home
/(tabs)/seller/AddWaste         -> Create listing
/(tabs)/seller/SellerOrders     -> Manage orders
/(tabs)/seller/SellerProfile    -> Profile view
/(tabs)/seller/EditProfile      -> Edit profile

/(tabs)/buyer/BuyerDashboard    -> Marketplace browsing
/(tabs)/buyer/BuyerOrders       -> Order history
/(tabs)/buyer/BuyerProfile      -> Profile view
/(tabs)/buyer/EditProfile       -> Edit profile
```

### Key Screen Details

#### Login.tsx
- Firebase `signInWithEmailAndPassword`
- Reads user role from `Firestore users/{uid}.role`
- Routes to `SellerDashboard` or `BuyerDashboard` based on role
- Background image with overlay card UI, green brand color (#4F772D)

#### CreateAccount.tsx
- Role selection: Seller / Buyer
- Fields: fullName, email, password, location (GPS)
- Creates Firebase Auth user + Firestore `users` document
- Initializes `bins` document for Sellers

#### SellerDashboard.tsx (Most Feature-Rich Screen)
- **Real-time IoT Bin Monitoring**: Listens to `bins/{uid}` Firestore doc
  - 3 compartments: Plastic, Food, Metal
  - Fill level %, weight (kg), moisture % (food only)
  - Visual progress bar per bin
- **Automated Notifications**: Auto-triggers when any bin >80% full
- **PieChart**: Waste weight distribution (react-native-chart-kit)
- **Google Maps**: Shows seller's bin location via green Marker
- **Report Issue Modal**: Submit maintenance issues
- **Notifications Modal**: In-app notification center with unread badge counter
- **Reward Points**: Displays seller's accumulated eco-points (gold badge)

#### BuyerDashboard.tsx (Marketplace Engine)
- **Live Marketplace Listing**: Queries Firestore `marketplace` where `status == available`
- **Search Filter**: Filter listings by waste type keyword
- **Distance Calculation**: Haversine formula for buyer-to-seller straight-line distance
- **Map Modal**: Full-screen Google Maps with:
  - Buyer location (blue dot)
  - Seller location (green pin marker)
  - Polyline route between them (dashed blue line)
  - Distance display panel
- **Payment Modal**:
  - Cash on Delivery option
  - Card Payment with form validation:
    - 16-digit card number
    - 3-digit CVV
    - MM/YY expiry
    - Auto-detects VISA / Mastercard from first digit
- **Order Creation**: Writes to `orders` collection & marks listing as `sold`
- **Notification to Seller**: Sends notification doc to seller on purchase

#### AddWaste.tsx
- Sellers create marketplace listings
- Fields: waste type, weight (kg), price per kg → auto-calculate total
- Captures seller's GPS coordinates
- Writes to `marketplace` Firestore collection

#### SellerOrders.tsx
- Lists all incoming orders from buyers
- Can confirm, complete, or cancel orders
- Sends notification to buyer on status change

---

## 6. Admin Panel — Deep Dive

> Current Status: Scaffold / Work in Progress

The admin panel is built with **React + Vite** and is intended as a web dashboard for platform administrators.

### Files

| File | Description |
|---|---|
| src/main.jsx | ReactDOM.createRoot entry point |
| src/App.jsx | Root component (currently Vite default scaffold) |
| src/App.css | Component-level styles |
| src/index.css | Global CSS reset & base styles |
| vite.config.js | Vite config with React plugin |

### Planned Admin Features (inferred from project scope)
- View all registered users (sellers & buyers)
- Monitor all smart bins across the platform
- Review & moderate marketplace listings
- Order analytics & reports
- Notification broadcasts

---

## 7. Firebase & Backend Services

### Firebase Project
- **Project ID:** wast-pro
- **Auth Domain:** wast-pro.firebaseapp.com
- **Storage Bucket:** wast-pro.firebasestorage.app

### Firebase Initialization (firebaseConfig.js)

```javascript
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Auth persists via AsyncStorage (survives app restarts)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### Node.js REST API (reqament.txt)

```
POST /api/auth/login     -> Login endpoint
POST /api/auth/register  -> Register endpoint
```

Environment Variables required:
```env
MONGO_URI=mongodb://localhost:27017/smartwaste
JWT_SECRET=your_jwt_secret
PORT=5000
```

---

## 8. Data Models (Firestore)

### Collection: users
```typescript
{
  uid: string,           // Firebase Auth UID (document ID)
  fullName: string,
  email: string,
  role: 'seller' | 'buyer',
  points: number,        // Eco-reward points (sellers)
  location: {
    latitude: number,
    longitude: number
  },
  profileImage?: string  // Firebase Storage URL
}
```

### Collection: bins
```typescript
{
  // Document ID = seller's Firebase Auth UID
  plastic: {
    level: number,   // 0-100 (fill %)
    weight: number   // kg
  },
  food: {
    level: number,
    weight: number,
    moisture: number // 0-100 (humidity %)
  },
  metal: {
    level: number,
    weight: number
  }
}
```

### Collection: marketplace
```typescript
{
  id: string,              // Auto-generated doc ID
  wasteType: string,       // e.g. "Plastic", "Metal", "Paper"
  weightKg: number,
  totalPrice: number,      // Rs (Sri Lankan Rupees)
  sellerUid: string,
  sellerName: string,
  location: {
    latitude: number,
    longitude: number
  },
  status: 'available' | 'sold',
  createdAt: Timestamp
}
```

### Collection: orders
```typescript
{
  id: string,
  listingId: string,
  buyerUid: string,
  buyerName: string,
  sellerUid: string,
  sellerName: string,
  wasteType: string,
  weightKg: number,
  totalPrice: number,
  paymentMethod: 'cash' | 'card',
  paymentStatus: 'paid' | 'pending',
  paymentLast4: string | null,     // Last 4 digits of card
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  location: {
    latitude: number,
    longitude: number
  },
  createdAt: Timestamp,
  cancelledAt: Timestamp | null
}
```

### Collection: notifications
```typescript
{
  id: string,
  toUid: string,          // Target user's UID
  type: 'bin_full' | 'order_placed' | 'order_cancelled' | string,
  message: string,
  read: boolean,
  createdAt: Timestamp
}
```

---

## 9. Feature Breakdown by Role

### Seller (Waste Provider)

| Feature | Screen | Firestore Collection |
|---|---|---|
| Login / Register | Login.tsx / CreateAccount.tsx | users |
| View IoT bin fill levels | SellerDashboard.tsx | bins |
| View bin weight (kg) | SellerDashboard.tsx | bins |
| View food moisture % | SellerDashboard.tsx | bins |
| High moisture warning alert | SellerDashboard.tsx | bins |
| Waste weight pie chart | SellerDashboard.tsx | bins |
| View bin location on map | SellerDashboard.tsx | users |
| Auto bin-full notifications | SellerDashboard.tsx | notifications |
| Report maintenance issue | SellerDashboard.tsx | — |
| Add waste listing | AddWaste.tsx | marketplace |
| View incoming orders | SellerOrders.tsx | orders |
| Confirm/Complete/Cancel orders | SellerOrders.tsx | orders |
| View eco-reward points | SellerDashboard.tsx | users |
| Edit profile | EditProfile.tsx (seller) | users |

### Buyer (Recycling Company)

| Feature | Screen | Firestore Collection |
|---|---|---|
| Login / Register | Login.tsx / CreateAccount.tsx | users |
| Browse available waste listings | BuyerDashboard.tsx | marketplace |
| Search by waste type | BuyerDashboard.tsx | marketplace |
| View distance to seller | BuyerDashboard.tsx | — (Haversine) |
| View seller location on map | BuyerDashboard.tsx | marketplace |
| Full-screen route map | BuyerDashboard.tsx | — |
| Buy waste (Cash on Delivery) | BuyerDashboard.tsx | orders |
| Buy waste (Card Payment) | BuyerDashboard.tsx | orders |
| Card type detection (VISA/MC) | BuyerDashboard.tsx | — |
| Track order status | BuyerOrders.tsx | orders |
| Cancel orders | BuyerOrders.tsx | orders, notifications |
| Edit profile | EditProfile.tsx (buyer) | users |

---

## 10. IoT Integration

### Smart Bin Hardware Layout

```
+-------------------------------------------+
|          Smart Bin (ESP32-based)          |
|                                           |
|  Compartment 1: Plastic                   |
|    +-- Ultrasonic Sensor -> fill level %  |
|    +-- Load Cell         -> weight kg     |
|                                           |
|  Compartment 2: Food                      |
|    +-- Ultrasonic Sensor -> fill level %  |
|    +-- Load Cell         -> weight kg     |
|    +-- Moisture Sensor   -> humidity %    |
|                                           |
|  Compartment 3: Metal                     |
|    +-- Ultrasonic Sensor -> fill level %  |
|    +-- Load Cell         -> weight kg     |
|                                           |
|  ESP32 -> WiFi -> Firebase Firestore      |
|       (writes to bins/{seller_uid})       |
+-------------------------------------------+
```

### Real-time Data Flow
1. ESP32 reads sensor values periodically
2. ESP32 sends data to `Firestore bins/{sellerUid}` via REST or Firebase SDK
3. Mobile app uses `onSnapshot()` for **real-time** streaming updates
4. If any compartment > 80% full -> app auto-creates notification in `notifications` collection
5. Seller sees notification badge and notification list in-app

---

## 11. Screens & Navigation Map

```
App Start
    |
    v
Welcome Screen
    |
    +---> Login Screen
    |         |
    |         +--[role=seller]--> Seller Dashboard
    |         |                       +--> Add Waste
    |         |                       +--> Seller Orders
    |         |                       +--> Seller Profile --> Edit Profile
    |         |
    |         +--[role=buyer]--> Buyer Dashboard
    |                               +--> [Map Modal]
    |                               +--> [Payment Modal]
    |                               +--> Buyer Orders
    |                               +--> Buyer Profile --> Edit Profile
    |
    +---> Create Account Screen
              |
              +--[role=seller]--> Seller Dashboard
              +--[role=buyer]--> Buyer Dashboard
```

---

## 12. TypeScript Types

Defined in `mobile/types.ts`:

```typescript
// Marketplace listing item
interface MarketplaceItem {
  id: string;
  wasteType: string;
  weightKg: number;
  totalPrice: number;
  sellerUid: string;
  sellerName: string;
  location: { latitude: number; longitude: number };
  status: 'available' | 'sold';
  createdAt?: any;
}

// Purchase order
interface Order {
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
  location: { latitude: number; longitude: number };
  createdAt: any;
  cancelledAt: any | null;
}

// User geolocation
interface UserLocation {
  latitude: number;
  longitude: number;
}
```

---

## 13. Environment & Configuration

### Mobile App (app.json)
- Expo SDK configuration
- App name, version, icon, splash screen
- Platform-specific permissions (location, camera, storage)

### Backend Server (.env — not committed to git)
```env
MONGO_URI=mongodb://localhost:27017/smartwaste
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

### Firebase Config (firebaseConfig.js)
> WARNING: API keys are currently hardcoded. For production, move to environment variables using Expo Constants or @expo/config-plugins.

---

## 14. Screenshots

| Screenshot | Screen |
|---|---|
| Login_page.PNG | Firebase email/password login |
| create_account.PNG | Role-based registration (Seller/Buyer) |
| seller_dashboard.PNG | IoT bin monitoring, pie chart, map |
| Seller_profile.PNG | Seller profile with stats |
| Add_wast.PNG | Create recyclable waste listing |
| My_oder.PNG | Seller order management |
| buyer_dashboard.PNG | Marketplace listing with map & purchase |
| buyer_profile.PNG | Buyer profile screen |

---

## Codebase Stats

| Area | Files | Approx Lines |
|---|---|---|
| Mobile Screens — Seller | 5 | ~900 |
| Mobile Screens — Buyer | 4 | ~1,100 |
| Mobile Auth Screens | 3 | ~600 |
| Mobile Components | 9 | ~250 |
| Mobile Hooks | 3 | ~50 |
| Admin Panel | 4 | ~100 |
| Config & Types | 5 | ~150 |
| **Total** | **~33** | **~3,150** |

---

*Generated by Antigravity AI — SmartWaste Pro Final Year Project Documentation*
