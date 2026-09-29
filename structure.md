# SmartWaste Pro — Complete Codebase Structure & Documentation

> **IoT-Based Intelligent Waste Management & Recycling Marketplace**  
> Final Year Project · Horizon Campus, Faculty of Information Technology  
> **Author:** Keshan D. Adhikari (ITBIN-2211-0137) · **Year:** 2026  
> **Supervisor:** Ms. A.A.P.W. Athukorala · **Co-supervisor:** Mr. Daminda Herath

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Full Directory Tree](#3-full-directory-tree)
4. [Technology Stack](#4-technology-stack)
5. [Mobile App — Deep Dive](#5-mobile-app--deep-dive)
6. [Admin Dashboard — Deep Dive](#6-admin-dashboard--deep-dive)
7. [Cloud Backend (Firebase)](#7-cloud-backend-firebase)
8. [Cloud Functions (Stripe Payments)](#8-cloud-functions-stripe-payments)
9. [IoT Hardware & Configuration](#9-iot-hardware--configuration)
10. [Firestore Data Model](#10-firestore-data-model)
11. [Firestore Security Rules](#11-firestore-security-rules)
12. [Design System (Mobile)](#12-design-system-mobile)
13. [TypeScript Types & Interfaces](#13-typescript-types--interfaces)
14. [Utility Functions & Constants](#14-utility-functions--constants)
15. [Testing Strategy](#15-testing-strategy)
16. [CI/CD Pipeline](#16-cicd-pipeline)
17. [Environment Variables](#17-environment-variables)
18. [App Screens & Navigation Flow](#18-app-screens--navigation-flow)
19. [Order & Payment Flow](#19-order--payment-flow)
20. [Research Objectives & Status](#20-research-objectives--status)

---

## 1. Project Overview

**SmartWaste Pro** bridges the gap between waste producers (Sellers) and recycling companies (Buyers) through:

- **ESP32 Smart Bins** — physical 3-compartment bins (Plastic / Food / Metal) with ultrasonic, load cell, and moisture sensors that push live readings to Firebase Realtime Database via WiFi.
- **React Native Mobile App** — cross-platform app for Sellers to monitor bins and list waste, and for Buyers to browse the marketplace, navigate to pickup locations, and pay.
- **React Web Admin Panel** — role-gated dashboard for administrators to monitor all bins, users, marketplace listings, and orders in real time.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  IoT Layer (Hardware)                       │
│  ESP32 + Ultrasonic + Load Cell + Moisture Sensor           │
│  ──── WiFi ──► Firebase Realtime Database (IoT Project)     │
└──────────────────────────┬──────────────────────────────────┘
                           │  Anonymous Auth read
                           ▼
┌─────────────────────────────────────────────────────────────┐
│             Firebase Cloud (Main Project)                   │
│  ┌─────────────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │  Firebase Auth  │  │  Firestore    │  │   Storage    │  │
│  │ (Email/Pass)    │  │ (5 collections)│  │ (profile img)│  │
│  └─────────────────┘  └───────────────┘  └──────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │     Firebase Cloud Functions (Node.js v2)            │   │
│  │  createCheckoutSession / verifyCheckoutSession       │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────┬───────────────────────────────┬─────────────────┘
            │                               │
            ▼                               ▼
┌──────────────────────┐       ┌────────────────────────┐
│  Mobile App          │       │  Admin Panel           │
│  React Native 0.86   │       │  React 19 + Vite 7     │
│  Expo SDK 57         │       │  react-router-dom 7    │
│  Expo Router (file)  │       │  Vanilla CSS           │
│  TypeScript 6        │       │  Firebase JS SDK 12    │
│  react-native-maps   │       └────────────────────────┘
│  Stripe (via browser)│
└──────────────────────┘
```

---

## 3. Full Directory Tree

```
wast-pro/                                   ← Monorepo root
├── .git/                                   ← Git repository
├── .github/
│   └── workflows/
│       └── ci.yml                          ← GitHub Actions CI (lint+test+build)
├── .gitignore
├── README.md                               ← Project overview & quickstart
├── Screenshot 2026-09-25 032101.png        ← Reference screenshot
├── SmartWastePro_Feature_Overview.pdf      ← Feature brief document
├── reqament.txt                            ← Requirements notes
│
├── screenshots/                            ← App screenshots (8 PNGs)
│   ├── Login_page.PNG
│   ├── create_account.PNG
│   ├── seller_dashboard.PNG
│   ├── Add_wast.PNG
│   ├── My_oder.PNG
│   ├── Seller_profile.PNG
│   ├── buyer_dashboard.PNG
│   └── buyer_profile.PNG
│
├── admin/                                  ← Web Admin Dashboard
│   ├── .claude/                            ← Claude AI project notes
│   ├── .env                                ← Firebase credentials (gitignored)
│   ├── .env.example                        ← Env template
│   ├── .gitignore
│   ├── README.md
│   ├── eslint.config.js                    ← ESLint 9 flat config
│   ├── index.html                          ← Vite HTML entry
│   ├── package.json                        ← Admin deps & scripts
│   ├── vite.config.js                      ← Vite + React plugin config
│   ├── vitest.config.js                    ← Vitest test runner config
│   ├── dist/                               ← Production build output
│   ├── public/                             ← Static assets
│   └── src/
│       ├── main.jsx                        ← React DOM entry point
│       ├── App.jsx                         ← Root router + auth gate
│       ├── App.css                         ← Global admin styles
│       ├── index.css                       ← Base CSS reset & variables
│       ├── AuthContext.jsx                 ← React context for Firebase auth
│       ├── authContextInstance.js          ← Shared context reference
│       ├── useAuth.js                      ← Auth hook (user, isAdmin, loading)
│       ├── firebaseConfig.js               ← Firebase SDK init (admin project)
│       ├── iotConfig.js                    ← Firebase Realtime DB (IoT project)
│       ├── assets/                         ← Admin static images/icons
│       ├── lib/
│       │   ├── filters.js                  ← Collection filter helpers
│       │   ├── filters.test.js             ← Unit tests for filters
│       │   └── usePaginatedCollection.js   ← Paginated Firestore hook
│       └── pages/
│           ├── Layout.jsx                  ← Shell with sidebar navigation
│           ├── Login.jsx                   ← Admin Firebase login page
│           ├── NotAdmin.jsx                ← Access-denied page
│           ├── Overview.jsx                ← Dashboard stats summary
│           ├── BinStatus.jsx               ← IoT bin readings monitor
│           ├── Users.jsx                   ← User management table
│           ├── Marketplace.jsx             ← Marketplace listings viewer
│           └── Orders.jsx                  ← Orders management table
│
└── mobile/                                 ← React Native Mobile App
    ├── .claude/                            ← Claude AI project notes
    ├── .env                                ← Env vars (gitignored)
    ├── .env.example                        ← Env template
    ├── .expo/                              ← Expo local state cache
    ├── .gitignore
    ├── .vscode/                            ← VS Code workspace settings
    ├── README.md
    ├── app.json                            ← Expo app config (name, scheme, icons)
    ├── eslint.config.js                    ← ESLint flat config
    ├── expo-env.d.ts                       ← Expo TypeScript globals
    ├── firebase.json                       ← Firebase project deploy config
    ├── firebaseConfig.js                   ← Main Firebase SDK init (native)
    ├── firebaseConfig.web.js               ← Main Firebase SDK init (web)
    ├── firestore.rules                     ← Firestore Security Rules
    ├── iotConfig.js                        ← IoT Firebase Realtime DB init
    ├── package.json                        ← Mobile deps & scripts
    ├── tsconfig.json                       ← TypeScript strict config
    ├── types.ts                            ← Shared TypeScript interfaces
    │
    ├── app/                                ← Expo Router file-based routes
    │   ├── _layout.tsx                     ← Root stack layout (theme, animations)
    │   └── (tabs)/                         ← Tab-group root
    │       ├── _layout.tsx                 ← Tab navigator config
    │       ├── index.tsx                   ← Redirect guard (role-based)
    │       ├── Welcome.tsx                 ← Welcome / landing screen
    │       ├── Login.tsx                   ← Firebase email/password login
    │       ├── CreateAccount.tsx           ← New user registration
    │       ├── buyer/
    │       │   ├── BuyerDashboard.tsx      ← Marketplace browse + map + buy modal
    │       │   ├── BuyerOrders.tsx         ← Purchase history + cancel orders
    │       │   ├── BuyerProfile.tsx        ← Buyer stats & profile
    │       │   └── EditProfile.tsx         ← Route stub → shared profile editor
    │       └── seller/
    │           ├── SellerDashboard.tsx     ← IoT bin monitor + pie chart + earnings
    │           ├── AddWaste.tsx            ← List waste to marketplace
    │           ├── SellerOrders.tsx        ← Incoming orders management
    │           ├── SellerProfile.tsx       ← Seller stats & profile
    │           └── EditProfile.tsx         ← Route stub → shared profile editor
    │
    ├── components/
    │   ├── platform-map.tsx                ← Native: delegates to react-native-maps
    │   ├── platform-map.web.tsx            ← Web: DOM-based map fallback
    │   ├── profile-editor.tsx              ← Shared profile edit form (buyer+seller)
    │   └── ui/                             ← Primitive UI component library
    │       ├── badge.tsx                   ← Status & category badges
    │       ├── badge.test.ts               ← Badge unit tests
    │       ├── bottom-nav.tsx              ← Custom animated bottom navigation bar
    │       ├── button.tsx                  ← Primary / ghost / danger buttons
    │       ├── card.tsx                    ← Elevated surface card
    │       ├── chip.tsx                    ← Pill filter chips
    │       ├── empty-state.tsx             ← Empty list placeholder
    │       ├── list-option.tsx             ← Tappable row list item
    │       ├── screen.tsx                  ← Safe-area screen wrapper
    │       ├── sheet.tsx                   ← Bottom sheet / modal panel
    │       └── text-field.tsx              ← Styled text input
    │
    ├── constants/
    │   ├── design.ts                       ← Design tokens (Palette, Space, Radius, Shadow, Type)
    │   ├── design.test.ts                  ← Design token tests
    │   ├── bin-status.ts                   ← Firmware bin-status enum helpers
    │   └── bin-status.test.ts              ← Bin status unit tests
    │
    ├── utils/
    │   ├── distance.ts                     ← Haversine great-circle formula
    │   └── distance.test.ts                ← Distance calculation tests
    │
    ├── scripts/
    │   ├── reset-project.js                ← Wipe & re-scaffold Expo project
    │   └── seedMockData.js                 ← Seed Firestore with mock data
    │
    ├── functions/                          ← Firebase Cloud Functions
    │   ├── package.json                    ← Functions deps (Stripe, firebase-admin)
    │   └── index.js                        ← createCheckoutSession + verifyCheckoutSession
    │
    ├── assets/
    │   └── images/                         ← App icon, splash, adaptive icons
    │
    └── docs/
        └── analysis_report.md              ← Codebase analysis report
```

---

## 4. Technology Stack

### 4.1 Mobile Application

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime** | React Native | 0.86.3 | Cross-platform mobile framework |
| **Platform** | Expo SDK | ^57.0.0 | Build, OTA updates, native modules |
| **Navigation** | Expo Router | ~57.0.21 | File-based routing (like Next.js) |
| **Language** | TypeScript | ~6.0.3 | Static typing across entire mobile app |
| **UI** | React | 19.2.3 | Component model |
| **State/Auth** | Firebase JS SDK | ^12.11.0 | Auth, Firestore, Storage, Realtime DB |
| **Maps** | react-native-maps | 1.27.2 | Google Maps with marker + route polyline |
| **Location** | expo-location | ~57.0.18 | GPS coordinates (buyer proximity) |
| **Charts** | react-native-chart-kit | ^6.12.0 | Pie charts for bin fill levels |
| **Animation** | react-native-reanimated | 4.5.1 | Smooth UI animations |
| **Gestures** | react-native-gesture-handler | ~2.32.0 | Swipe / gesture interactions |
| **Storage** | AsyncStorage | 2.2.0 | Persist auth session across restarts |
| **Images** | expo-image-picker | ~57.0.18 | Profile photo selection |
| **Images** | expo-image | ~57.0.5 | Optimised image rendering |
| **Payments** | expo-web-browser | ~57.0.3 | Opens Stripe Checkout in browser |
| **Icons** | @expo/vector-icons | ^15.0.3 | Ionicons, MaterialIcons, etc. |
| **SVG** | react-native-svg | 15.15.4 | SVG rendering for charts |

### 4.2 Admin Dashboard

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | React | ^19.2.0 | Web UI framework |
| **Build Tool** | Vite | ^7.2.4 | Dev server & production bundler |
| **Routing** | react-router-dom | ^7.18.4 | SPA client-side routing |
| **Language** | JavaScript (JSX) | ES2022 | No TypeScript in admin |
| **Styling** | Vanilla CSS | — | Custom CSS, no utility framework |
| **Backend** | Firebase JS SDK | ^12.19.0 | Auth, Firestore, Realtime DB |
| **Testing** | Vitest | ^5.0.1 | Unit testing |
| **Test Utils** | @testing-library/react | ^16.3.3 | Component testing |
| **Linting** | ESLint 9 | ^9.39.1 | Flat config linting |

### 4.3 Cloud Backend

| Service | Provider | Purpose |
|---|---|---|
| **Authentication** | Firebase Auth | Email/password login, role-based routing |
| **Primary Database** | Cloud Firestore | 5 collections: users, bins, marketplace, orders, notifications |
| **IoT Database** | Firebase Realtime Database | Live ESP32 sensor feeds (separate Firebase project) |
| **File Storage** | Firebase Storage | Profile photo uploads |
| **Serverless Functions** | Firebase Cloud Functions v2 | Node.js — Stripe payment server-side logic |
| **Security Rules** | Firestore Security Rules | Role-scoped, per-collection access control |

### 4.4 Payment Processing

| Technology | Purpose |
|---|---|
| **Stripe** | Card payment processing (LKR currency) |
| **Stripe Checkout** | Hosted payment page — no native SDK needed |
| **Firebase Functions** | Server-side session creation & verification |
| **expo-web-browser** | Opens Stripe URL, redirects back via `mobile://` scheme |

### 4.5 IoT Hardware

| Component | Role |
|---|---|
| **ESP32 Microcontroller** | Main IoT controller with WiFi |
| **Ultrasonic Sensor (HC-SR04)** | Measures bin fill level (%) |
| **Load Cell + HX711** | Measures waste weight (kg) |
| **Moisture Sensor** | Measures food compartment humidity (%) |
| **Firebase Realtime Database** | Receives firmware sensor pushes via WiFi |

### 4.6 Developer Tooling & CI/CD

| Tool | Purpose |
|---|---|
| **GitHub Actions** | Automated CI: lint + test + build on push/PR |
| **Jest + jest-expo** | Mobile unit testing |
| **Vitest** | Admin unit testing |
| **ESLint 9** | Lint (flat config in both projects) |
| **npm** | Package management |
| **Node.js 20** | CI runtime |

---

## 5. Mobile App — Deep Dive

### 5.1 Entry & Navigation

The app uses **Expo Router** (file-based routing, similar to Next.js App Router):

```
app/
├── _layout.tsx          Root Stack — pins theme, slide animations, SafeAreaProvider
└── (tabs)/
    ├── _layout.tsx      Tab navigator (Bottom tabs via Expo Router)
    ├── index.tsx        Role guard: routes seller→SellerDashboard, buyer→BuyerDashboard
    ├── Welcome.tsx      Landing screen with sign-in / create account buttons
    ├── Login.tsx        Firebase signInWithEmailAndPassword
    ├── CreateAccount.tsx Firebase createUserWithEmailAndPassword + Firestore user doc
    ├── buyer/           All buyer screens
    └── seller/          All seller screens
```

### 5.2 Seller Screens

| File | Size | What it does |
|---|---|---|
| `SellerDashboard.tsx` | 20 KB | Real-time IoT bin monitoring via Firebase Realtime DB. Shows fill % per compartment (Plastic/Food/Metal) as pie chart, weight, moisture, status badges. Earnings tracker, notification center, alert if bin >80%. |
| `AddWaste.tsx` | 13 KB | Waste listing form. Reads current bin sensor data, auto-calculates price (`weight × price/kg`). Creates `marketplace` doc + `notifications` doc (order_placed). |
| `SellerOrders.tsx` | 5 KB | Incoming buyer orders. Status management: pending → confirmed → completed. |
| `SellerProfile.tsx` | 7.6 KB | Dynamic stats (total earnings, kg sold, trees saved, CO₂ reduced). Shows profile + navigation to Edit Profile. |
| `EditProfile.tsx` | stub | Route stub that renders the shared `profile-editor.tsx` component. |

### 5.3 Buyer Screens

| File | Size | What it does |
|---|---|---|
| `BuyerDashboard.tsx` | 23 KB | Live marketplace feed from Firestore. Filter chips (All/Plastic/Food/Metal). GPS distance per listing (Haversine). Map modal showing seller pin + route polyline. Buy Now modal with payment selection (Cash / Stripe Card). VISA/Mastercard auto-detection by card prefix. |
| `BuyerOrders.tsx` | 15 KB | Order history with status badges. Cancel pending order → marks `orders` doc cancelled → restores `marketplace` listing to `available`. |
| `BuyerProfile.tsx` | 7.6 KB | Purchase stats (total spent, kg bought, environmental points). Profile + Edit. |
| `EditProfile.tsx` | stub | Route stub → shared `profile-editor.tsx`. |

### 5.4 Shared Components

#### UI Primitives (`components/ui/`)

| Component | Description |
|---|---|
| `badge.tsx` | Color-coded status badges (uses design tokens). Variants: success, warning, danger, info, neutral |
| `bottom-nav.tsx` | Custom animated bottom navigation bar with active indicator |
| `button.tsx` | Primary (filled green), ghost (outlined), danger (red) variants |
| `card.tsx` | Elevated surface card with optional press handling |
| `chip.tsx` | Pill-shaped filter chip for marketplace type filters |
| `empty-state.tsx` | Friendly empty list placeholder with icon |
| `list-option.tsx` | Tappable row list item with icon, label, chevron |
| `screen.tsx` | Safe-area aware screen wrapper with scroll support |
| `sheet.tsx` | Modal bottom sheet / overlay panel |
| `text-field.tsx` | Styled text input with label and error state |

#### Other Components

| Component | Description |
|---|---|
| `platform-map.tsx` | Native stub — delegates to `react-native-maps` |
| `platform-map.web.tsx` | Web fallback map using a DOM-based approach |
| `profile-editor.tsx` | Shared profile form (name, phone, location, photo) used by both buyer and seller EditProfile routes. Saves to Firestore + Firebase Storage. |

---

## 6. Admin Dashboard — Deep Dive

The admin panel is a **Vite + React SPA** with Firebase authentication and a role gate.

### 6.1 Auth Gate (`App.jsx`)

```
BrowserRouter
└── AuthProvider (AuthContext.jsx)
    └── Gate component
        ├── loading → spinner
        ├── !user  → <Login />
        ├── !isAdmin → <NotAdmin />
        └── admin  → <Layout /> (sidebar shell)
            ├── /             → <Overview />
            ├── /bins         → <BinStatus />
            ├── /users        → <Users />
            ├── /marketplace  → <Marketplace />
            └── /orders       → <Orders />
```

### 6.2 Admin Pages

| Page | Description |
|---|---|
| `Overview.jsx` | Aggregate stats: total users, active listings, orders, bin alerts |
| `BinStatus.jsx` | Reads IoT Firebase Realtime DB — shows live fill/weight/moisture per compartment |
| `Users.jsx` | Paginated user table. Admin can toggle `disabled` flag on accounts |
| `Marketplace.jsx` | Browse and filter all marketplace listings across all sellers |
| `Orders.jsx` | Full orders table with status filtering and admin status override |

### 6.3 Admin Utilities (`src/lib/`)

| File | Description |
|---|---|
| `filters.js` | Pure functions for filtering Firestore collection snapshots by field/value |
| `filters.test.js` | Unit tests for filter logic |
| `usePaginatedCollection.js` | React hook for cursor-based Firestore pagination |

---

## 7. Cloud Backend (Firebase)

### Firebase Projects Used

| Project | Purpose |
|---|---|
| **Main project** (`wast-pro`) | Auth + Firestore + Storage + Cloud Functions |
| **IoT project** (separate) | Realtime Database for live ESP32 sensor data only |

The two projects are intentionally kept separate — the IoT device only needs to write to Realtime DB, and the mobile app reads IoT data using anonymous auth with minimal permissions.

---

## 8. Cloud Functions (Stripe Payments)

**Location:** `mobile/functions/index.js`  
**Runtime:** Node.js (Firebase Functions v2)

### `createCheckoutSession`

- **Trigger:** Firebase callable function (requires auth)
- **Input:** `{ amount, wasteType, listingId }`
- **Logic:** Creates a Stripe Checkout Session in `payment` mode (LKR currency)
- **Output:** `{ url, sessionId }` — mobile app opens `url` in expo-web-browser
- **Return URL scheme:** `mobile://payment-complete?status=success|cancel`

### `verifyCheckoutSession`

- **Trigger:** Firebase callable function (requires auth)
- **Input:** `{ sessionId }`
- **Logic:** Retrieves session from Stripe, verifies `buyerUid` matches caller, checks `payment_status === 'paid'`
- **Output:** `{ paid, last4, amountTotal }` — `last4` is displayed as card receipt

> **Security:** Stripe secret key is stored as a Firebase Function secret (`STRIPE_SECRET_KEY`), never embedded in client code.

---

## 9. IoT Hardware & Configuration

### ESP32 Firmware Data Path

```
ESP32 → WiFi → Firebase Realtime Database
         bins/
         └── Bin001/
             ├── plastic/
             │   ├── level      (number: 0–100 %)
             │   ├── weight     (number: kg)
             │   ├── moisture   (number: %)
             │   ├── status     (string: EMPTY|LOW|HALF|75%|FULL|ERROR)
             │   ├── overweight (boolean)
             │   └── timestamp  (ISO string)
             ├── food/   (same schema)
             └── metal/  (same schema)
```

### IoT Firebase Config (`iotConfig.js`)

- Uses a **separate** Firebase project with Realtime Database
- Mobile app connects using **anonymous auth** (no admin secret in client)
- Exports `iotDb` (database instance) and `BIN_ID = 'Bin001'`

### Bin Status Enum (from firmware)

| Status | Meaning | UI Tone |
|---|---|---|
| `EMPTY` | 0–10% full | Neutral grey |
| `LOW` | ~25% full | Info blue |
| `HALF` | ~50% full | Warning amber |
| `75%` | 75% full | Warning amber |
| `FULL` | 100% full | Danger red |
| `ERROR` | Sensor fault | Danger red |

---

## 10. Firestore Data Model

### Collection: `users`

```typescript
{
  fullName: string,
  email: string,
  role: 'seller' | 'buyer' | 'admin',
  createdAt?: string,
  phone?: string,
  photoURL?: string,
  location?: string,
  points?: number,
  disabled?: boolean   // admin-only toggle
}
// Document ID = Firebase Auth UID
```

### Collection: `bins`

```typescript
{
  plastic: BinCompartment,
  food: BinCompartment,
  metal: BinCompartment
}
// BinCompartment shape:
{
  level?: number,       // fill % (0–100)
  weight?: number,      // kg
  moisture?: number,    // % (food only)
  status?: string,      // EMPTY|LOW|HALF|75%|FULL|ERROR
  overweight?: boolean,
  timestamp?: string
}
// Document ID = seller's Auth UID
```

### Collection: `marketplace`

```typescript
{
  wasteType: 'plastic' | 'food' | 'metal',
  weightKg: number,
  totalPrice: number,
  sellerUid: string,
  sellerName: string,
  location: { latitude: number, longitude: number },
  status: 'available' | 'sold',
  createdAt: Timestamp
}
```

### Collection: `orders`

```typescript
{
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
  paymentLast4: string | null,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  location: { latitude: number, longitude: number },
  createdAt: Timestamp,
  cancelledAt: Timestamp | null
}
```

### Collection: `notifications`

```typescript
{
  toUid: string,
  type: 'bin_full' | 'order_placed' | 'order_cancelled',
  message: string,
  read: boolean,
  createdAt: Timestamp,
  orderId?: string    // present for order_* types
}
```

---

## 11. Firestore Security Rules

**Location:** `mobile/firestore.rules`

| Collection | Rule Summary |
|---|---|
| `users/{uid}` | Any signed-in user can read. Only owner can create/update own doc. Role field is immutable after creation. Admin can toggle `disabled` only. Delete blocked. |
| `bins/{uid}` | Only the owner (seller) or admin can read/write. |
| `marketplace/{id}` | Any signed-in user can read. Only seller can create/delete. Buyer can only flip `status` field (available ↔ sold). |
| `orders/{id}` | Only the buyer or seller on that order can read/update. Buyer creates orders. Delete blocked — cancelled orders stay for history. |
| `notifications/{id}` | Only recipient can read/update/delete. Creation validates type, toUid exists, and for order events: caller must be buyer or seller on that order (anti-spoofing). |

**Helper functions in rules:**

| Function | Logic |
|---|---|
| `isSignedIn()` | `request.auth != null` |
| `isOwner(uid)` | signed in AND auth.uid == uid |
| `isAdmin()` | looks up `users/{uid}.role == 'admin'` |
| `isOrderParty(orderId, toUid)` | validates caller is buyer or seller on given order |

---

## 12. Design System (Mobile)

**Location:** `mobile/constants/design.ts`

All screens import from this single source of truth. No hardcoded values allowed.

### Palette

| Token | Value | Use |
|---|---|---|
| `brand.600` | `#4F772D` | Primary action buttons |
| `brand.900` | `#1B4332` | Deep brand, nav active |
| `ink.900` | `#14261A` | Headings |
| `ink.700` | `#33443A` | Body text |
| `ink.500` | `#5E6B60` | Muted labels |
| `surface` | `#FFFFFF` | Card backgrounds |
| `background` | `#F4F8F2` | Screen background |
| `waste.plastic` | `#2E7CD6` / `#E7F1FC` | Plastic type accent |
| `waste.food` | `#E8853B` / `#FDF0E4` | Food type accent |
| `waste.metal` | `#7B8794` / `#EEF1F4` | Metal type accent |
| `status.success` | `#2E7D32` | Confirmed/completed |
| `status.warning` | `#B45309` | Half/75% bin |
| `status.danger` | `#C2352F` | Full bin / cancel |

### Spacing (4pt rhythm)

```
xs=4  sm=8  md=12  lg=16  xl=20  2xl=24  3xl=32  4xl=40
```

### Border Radius

```
sm=12  md=16  lg=20  xl=28  pill=999
```

### Shadow Levels

- `1` — resting cards
- `2` — raised sheets
- `3` — floating modals

### Typography Scale

| Token | Size | Weight | Use |
|---|---|---|---|
| `h1` | 26px | 800 | Screen titles |
| `h2` | 19px | 700 | Card titles |
| `h3` | 16px | 700 | Section headings |
| `body` | 15px | 400 | Default copy |
| `bodyStrong` | 15px | 600 | Emphasized body |
| `small` | 13px | 400 | Metadata |
| `caption` | 11px | 600 | Labels, badges |
| `metric` | 22px | 800 | Prices, stats (brand green) |

---

## 13. TypeScript Types & Interfaces

**Location:** `mobile/types.ts`

| Type / Interface | Description |
|---|---|
| `WasteType` | `'plastic' \| 'food' \| 'metal'` |
| `BinCompartment` | IoT sensor readings per compartment (level, weight, moisture, status, overweight, timestamp) |
| `BinData` | `{ plastic, food, metal }` — all three BinCompartments |
| `AppNotification` | Firestore notification doc (id, toUid, type, message, read, createdAt) |
| `UserProfile` | User document shape (fullName, email, role, phone, photoURL, location, points) |
| `MarketplaceItem` | Marketplace listing (id, wasteType, weightKg, totalPrice, sellerUid, sellerName, location, status, createdAt) |
| `Order` | Full order document (all buyer/seller fields, payment, status, timestamps) |
| `UserLocation` | `{ latitude: number, longitude: number }` |

---

## 14. Utility Functions & Constants

### `utils/distance.ts` — Haversine Formula

```typescript
calculateDistance(lat1, lon1, lat2, lon2): number
// Returns great-circle distance in kilometres
// Used in BuyerDashboard to show distance to each seller's bin
```

### `constants/bin-status.ts` — Firmware Status Helpers

| Function | Description |
|---|---|
| `binStatusTone(status?)` | Maps firmware string → design `StatusTone` (neutral/info/warning/danger) |
| `binStatusLabel(status?)` | Human-readable label (e.g. `"75%"` → `"75% full"`) |
| `isBinFull(status?)` | Returns `true` if status is `'FULL'` |
| `binStatusColor(status?)` | Returns full Palette status colour object |

### `admin/src/lib/filters.js`

Pure helper functions filtering Firestore collection arrays by field/value — used in admin pages for client-side filtering without extra queries.

### `admin/src/lib/usePaginatedCollection.js`

React hook providing cursor-based Firestore pagination. Exposes `items`, `loadMore`, `hasMore`, and `loading` state.

---

## 15. Testing Strategy

### Mobile Tests (Jest + jest-expo)

| Test File | What is tested |
|---|---|
| `components/ui/badge.test.ts` | Badge variant rendering and token usage |
| `constants/design.test.ts` | Design token shape validation |
| `constants/bin-status.test.ts` | All firmware status → tone / label / color mappings |
| `utils/distance.test.ts` | Haversine formula correctness (known lat/lon pairs) |

**Run:** `npm test` inside `mobile/`

### Admin Tests (Vitest + Testing Library)

| Test File | What is tested |
|---|---|
| `src/lib/filters.test.js` | Filter helper edge cases |

**Run:** `npm run test` inside `admin/`

---

## 16. CI/CD Pipeline

**Location:** `.github/workflows/ci.yml`  
**Triggers:** Push to `main`, `development`, `keshan-dev`; PRs to `main` or `development`

```yaml
jobs:
  admin:
    runs-on: ubuntu-latest
    steps:
      - npm ci
      - npm run lint    # ESLint 9
      - npm run test    # Vitest
      - npm run build   # Vite production build

  mobile:
    runs-on: ubuntu-latest
    steps:
      - npm ci
      - npm run lint    # expo lint
      - npm run test -- --ci   # Jest
```

Both jobs use **Node.js 20** with npm cache keyed to the respective `package-lock.json`.

---

## 17. Environment Variables

### Mobile (`mobile/.env`)

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Main Firebase project API key |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firestore project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` | Analytics measurement ID |
| `EXPO_PUBLIC_IOT_FIREBASE_API_KEY` | IoT Firebase project API key |
| `EXPO_PUBLIC_IOT_FIREBASE_PROJECT_ID` | IoT Firebase project ID |
| `EXPO_PUBLIC_IOT_FIREBASE_DATABASE_URL` | Realtime Database URL |

### Admin (`admin/.env`)

Same Firebase credentials with `VITE_` prefix, pointing to the main project.

### Cloud Functions (Firebase Secrets)

| Secret | How to set |
|---|---|
| `STRIPE_SECRET_KEY` | `firebase functions:secrets:set STRIPE_SECRET_KEY` |

---

## 18. App Screens & Navigation Flow

```
App Launch
    │
    ▼
Welcome Screen (Welcome.tsx)
    │
    ├──► Login (Login.tsx)
    │         │  Firebase signInWithEmailAndPassword
    │         ▼
    │      index.tsx (role guard)
    │         ├── role=seller → SellerDashboard
    │         └── role=buyer  → BuyerDashboard
    │
    └──► CreateAccount (CreateAccount.tsx)
              │  Firebase createUser + Firestore users doc
              ▼
           index.tsx (role guard) → dashboard


SELLER TAB FLOW:
SellerDashboard ──► [+ Add to Marketplace] ──► AddWaste
      │
      └─── (Bottom Nav) ─── SellerOrders
                        ─── SellerProfile ──► EditProfile


BUYER TAB FLOW:
BuyerDashboard ──► [Map Modal] (react-native-maps + route line)
      │        ──► [Buy Now Modal] ──► Cash or Stripe Card
      │                                     │
      │                         expo-web-browser opens Stripe URL
      │                                     │
      │                         Return via mobile:// scheme
      │                                     │
      │                         verifyCheckoutSession (server)
      │
      └─── (Bottom Nav) ─── BuyerOrders (cancel → restore listing)
                        ─── BuyerProfile ──► EditProfile
```

---

## 19. Order & Payment Flow

```
Buyer taps "Buy Now"
        │
        ▼
Payment Modal opens
        │
   ┌────┴──────────────────────┐
   │                           │
Cash on Delivery          Card Payment
        │                      │
Create order doc           Call createCheckoutSession
immediately                (Firebase Cloud Function)
        │                      │
        │                 Stripe Checkout Session created
        │                      │
        │                 expo-web-browser opens Stripe URL
        │                      │
        │                 User enters card → Stripe processes
        │                      │
        │                 Redirect → mobile://payment-complete
        │                      │
        │                 Call verifyCheckoutSession (server-side)
        │                 confirms payment + returns last4 digits
        │
        └──────────┬────────────┘
                   ▼
        Create order doc in Firestore
        Mark marketplace listing as 'sold'
        Write notification to seller (order_placed)
                   │
                   ▼
        Buyer tracks in "My Purchases" (BuyerOrders)
                   │
           [Cancel Order]?
                   │
        Mark order.status = 'cancelled'
        Restore marketplace listing to 'available'
        Write cancellation notification to seller
```

---

## 20. Research Objectives & Status

| Objective | Status |
|---|---|
| 3-compartment IoT bin with fill, weight, moisture sensors | ⚠️ Partial — data model complete; ESP32 firmware is an external prototype |
| Mobile marketplace for sellers + buyers + real-time alerts + order tracking | ✅ Complete |
| Role-based admin dashboard (web) | ✅ Complete |
| Stripe card payment integration | ✅ Complete |
| Haversine GPS distance from buyer to seller | ✅ Complete |
| Map view with seller bin location + route line | ✅ Complete |
| Notification center with unread badge | ✅ Complete |
| Environmental impact stats (CO₂ reduced, trees saved) | ✅ Complete |
| Firestore Security Rules (role-scoped per collection) | ✅ Drafted — deploy with `firebase deploy --only firestore:rules` |
| Energy-efficient IoT transmission (EGANT protocol) | ❌ Planned — not yet implemented |
| Auto-listing at 70% bin capacity (no seller action needed) | ❌ Planned — currently manual one-tap by seller |
| Firebase App Check | ❌ Required before production |
| Email verification on signup | ❌ Required before production |

---

## Quick Reference — Key Files

| File | Path |
|---|---|
| Root README | `wast-pro/README.md` |
| Mobile entry | `mobile/app/_layout.tsx` |
| Role guard | `mobile/app/(tabs)/index.tsx` |
| Seller Dashboard | `mobile/app/(tabs)/seller/SellerDashboard.tsx` |
| Buyer Dashboard | `mobile/app/(tabs)/buyer/BuyerDashboard.tsx` |
| Add Waste | `mobile/app/(tabs)/seller/AddWaste.tsx` |
| Buyer Orders | `mobile/app/(tabs)/buyer/BuyerOrders.tsx` |
| Profile Editor | `mobile/components/profile-editor.tsx` |
| Design Tokens | `mobile/constants/design.ts` |
| TypeScript Types | `mobile/types.ts` |
| Firestore Rules | `mobile/firestore.rules` |
| IoT Config | `mobile/iotConfig.js` |
| Cloud Functions | `mobile/functions/index.js` |
| Admin App Root | `admin/src/App.jsx` |
| Admin Pages | `admin/src/pages/` |
| CI Workflow | `.github/workflows/ci.yml` |
| Seed Script | `mobile/scripts/seedMockData.js` |

---

*Generated: 2026-09-29 — SmartWaste Pro full codebase analysis*
