# SmartWaste Pro 🌿

> **IoT-Based Intelligent Waste Management & Recycling Marketplace**  
> Final Year Project — Horizon Campus, Faculty of Information Technology  
> **Author:** Keshan D. Adhikari | **Year:** 2026

---

## What is SmartWaste Pro?

SmartWaste Pro bridges the gap between **waste producers** and **recycling companies** using smart bin hardware, a mobile marketplace, and a real-time cloud backend.

- **Sellers** (waste providers) monitor their smart bins and list recyclable waste
- **Buyers** (recycling companies) browse available waste, navigate to pickup locations, and purchase directly through the app

---

## Features

### Seller Features
- 📊 Real-time IoT bin monitoring (Plastic, Food, Metal compartments)
- ⚠️ Automatic alerts when bin exceeds 80% capacity
- ⚡ Add waste to marketplace with one tap once a bin is nearly full (planned: fully automatic listing at 70%)
- 💰 Earnings tracker (Total earned, This month, kg sold)
- 🔔 In-app notification center with unread badge
- ♻️ Add waste listings with auto price calculation
- 📦 Manage incoming buyer orders
- 🌍 Environmental impact stats (Trees saved, CO2 reduced)
- 👤 Edit profile (saves to Firebase)

### Buyer Features
- 🛒 Browse live marketplace with real-time listings
- 🔍 Search waste by type (Plastic, Food, Metal)
- 📍 GPS distance calculation to seller bin (Haversine formula)
- 🗺️ Map view showing seller bin location with route line
- 💳 Two payment options: Cash on Delivery or Card Payment
- 🏦 VISA / Mastercard auto-detection
- 📋 Order tracking with status badges
- ❌ Cancel pending orders (listing auto-returns to marketplace)
- 👤 Edit profile (saves to Firebase)

---

## System Architecture

```
[ESP32 Smart Bin + Sensors]
         |
         | WiFi → Firebase Firestore
         v
[Firebase Cloud Backend]
(Auth + Firestore + Storage)
         |
    +----+----+
    v          v
[Mobile App] [Admin Panel]
(Seller/Buyer) (Web Dashboard)
```

---

## Technology Stack

### Mobile Application
| Technology | Version | Purpose |
|-----------|---------|---------|
| React Native | 0.81.5 | Cross-platform mobile UI |
| Expo SDK | ~54.0.33 | Development platform |
| Expo Router | ~6.0.23 | File-based navigation |
| TypeScript | ~5.9.2 | Type safety |
| Firebase | ^12.11.0 | Auth, Firestore, Storage |
| react-native-maps | 1.20.1 | Google Maps |
| expo-location | ~19.0.8 | GPS coordinates |
| react-native-chart-kit | ^6.12.0 | Pie charts |
| AsyncStorage | 2.2.0 | Auth session persistence |
| expo-image-picker | ~17.0.10 | Profile photos |

### Cloud Backend (Firebase)
| Service | Usage |
|---------|-------|
| Firebase Auth | Email/password login, role-based routing |
| Cloud Firestore | Real-time database (5 collections) |
| Firebase Storage | Profile image upload |
| AsyncStorage | Auth session persists across restarts |

### IoT Hardware
| Component | Role |
|-----------|------|
| ESP32 Microcontroller | Main IoT controller |
| Ultrasonic Sensor | Bin fill level (%) |
| Load Cell | Waste weight (kg) |
| Moisture Sensor | Food compartment humidity (%) |

---

## Firestore Collections

| Collection | Purpose |
|-----------|---------|
| `users` | User profiles and roles |
| `bins` | Real-time IoT sensor data |
| `marketplace` | Waste listings |
| `orders` | Purchase transactions |
| `notifications` | In-app alerts |

---

## App Screens

```
Welcome Screen
    |
    +---> Login / Create Account
              |
    +---------+---------+
    v                   v
Seller Dashboard    Buyer Dashboard
    |                   |
    +-- Add Waste       +-- [Map Modal]
    +-- Seller Orders   +-- [Payment Modal]
    +-- Seller Profile  +-- Buyer Orders
        |                   |
        +-- Edit Profile    +-- Buyer Profile
                                |
                                +-- Edit Profile
```

---

## Order Flow

```
Buyer taps Buy Now
        ↓
Payment Selection (Cash / Card)
        ↓
Order created in Firestore
        ↓
Listing marked as sold
        ↓
Seller notified instantly
        ↓
Buyer tracks in My Purchases
        ↓
[Cancel] → Order deleted → Listing restored
```

---

## Listing Flow (current implementation)

1. Seller opens the bin's live sensor readings and taps **Add to Marketplace**
2. Price is calculated automatically: `weight (kg) × price per kg`
3. Listing appears instantly for buyers to browse

> **Note:** Listing a bin's contents is currently a manual, one-tap action by the seller.
> A bin exceeding 80% capacity triggers a notification/warning, but does **not** yet auto-create
> a listing at 70% — that is planned future work, not implemented in the current build.

---

## Installation

### Prerequisites
- Node.js >= 18.x
- Expo CLI
- Firebase project (wast-pro)
- Android/iOS device or emulator

### Mobile App Setup

```bash
# Clone the repository
git clone https://github.com/Keshan-D-Adhikari/wast_pro.git
cd wast_pro/mobile

# Install dependencies
npm install

# Start development server
npx expo start
```

### Seed Mock Data

```bash
# Place serviceAccountKey.json in mobile/scripts/
cd mobile
node scripts/seedMockData.js
```

### Firebase Configuration

`mobile/firebaseConfig.js` (native) and `mobile/firebaseConfig.web.js` (web) already read their
credentials from environment variables — copy `mobile/.env.example` to `mobile/.env` and fill in
your own Firebase project's values:

```bash
cp mobile/.env.example mobile/.env
```

```
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

`.env` is gitignored — never commit it. Then deploy the Firestore rules for your project:

```bash
cd mobile
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

---

## Screenshots

| Screen | Description |
|--------|-------------|
| ![Login](screenshots/Login_page.PNG) | Firebase email/password login |
| ![Seller Dashboard](screenshots/seller_dashboard.PNG) | IoT bin monitoring, pie chart, earnings |
| ![Add Waste](screenshots/Add_wast.PNG) | Waste type cards with auto price |
| ![Seller Orders](screenshots/My_oder.PNG) | Incoming order management |
| ![Seller Profile](screenshots/Seller_profile.PNG) | Dynamic stats and profile |
| ![Buyer Dashboard](screenshots/buyer_dashboard.PNG) | Live marketplace with map |
| ![Buyer Profile](screenshots/buyer_profile.PNG) | Purchase history and stats |

---

## Research Objectives

| Objective | Status |
|-----------|--------|
| 3-compartment bin with fill, weight, moisture sensors | ✅ Partial (Firestore simulation) |
| Mobile platform for sellers, buyers, alerts, tracking | ✅ Complete |
| Energy-efficient IoT data transmission (EGANT) | ⚠️ Planned |

---

## Project Structure

```
wast-pro/
├── mobile/                    # React Native mobile app
│   ├── app/(tabs)/
│   │   ├── seller/            # Seller screens (5)
│   │   └── buyer/             # Buyer screens (4)
│   ├── firebaseConfig.js      # Firebase setup
│   ├── types.ts               # TypeScript interfaces
│   └── scripts/
│       └── seedMockData.js    # Mock data seeder
├── admin/                     # Web admin panel (WIP)
└── screenshots/               # App screenshots
```

---

## Security Notes

> - ✅ Firebase config now reads from `EXPO_PUBLIC_*` environment variables (see `mobile/.env.example`) instead of hardcoded keys
> - ✅ Firestore Security Rules drafted at `mobile/firestore.rules` (role-scoped access per collection) — **must still be deployed** with `firebase deploy --only firestore:rules` (requires `firebase login` with the project owner's account)
> - ⚠️ Before deploying to production, still needed:
>   - Enable email verification
>   - Set up Firebase App Check

---

## Author

**Keshan D. Adhikari**  
Registration: ITBIN-2211-0137  
Horizon Campus — Faculty of Information Technology  
BIT (Hons) Networking and Mobile Computing  
Final Year Project — SmartWaste Pro | 2026

**Supervisor:** Ms. A.A.P.W. Athukorala  
**Co-supervisor:** Mr. Daminda Herath