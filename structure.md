# SmartWaste Pro — Codebase Structure & Technical Reference

> IoT-based waste management and recycling marketplace.
> Final-year project, Horizon Campus (Faculty of IT). Author: Keshan D. Adhikari (ITBIN-2211-0137).
>
> This file describes the code **as it is on the `main` branch**: what each folder and file does, the
> tools and technologies used, the data model, the security rules, the tests and how everything fits
> together. For setup steps see `README.md`, `mobile/README.md` and `admin/README.md`.

---

## Contents

1. [What the system is](#1-what-the-system-is)
2. [Architecture](#2-architecture)
3. [Repository layout](#3-repository-layout)
4. [Technology stack](#4-technology-stack)
5. [Mobile app](#5-mobile-app)
6. [Admin dashboard](#6-admin-dashboard)
7. [Firebase backend](#7-firebase-backend)
8. [Firestore data model](#8-firestore-data-model)
9. [Security rules](#9-security-rules)
10. [IoT smart bin](#10-iot-smart-bin)
11. [Cloud Functions and card payments](#11-cloud-functions-and-card-payments)
12. [Main user flows](#12-main-user-flows)
13. [Design system](#13-design-system)
14. [Tests](#14-tests)
15. [CI](#15-ci)
16. [Environment variables](#16-environment-variables)
17. [Commands](#17-commands)
18. [Git workflow](#18-git-workflow)
19. [Known limitations](#19-known-limitations)

---

## 1. What the system is

SmartWaste Pro connects people who produce sorted waste (**sellers**) with recyclers (**buyers**), and
gives sellers a smart bin that reports how full it is.

Three parts:

| Part | What it is | Users |
|------|-----------|-------|
| **Smart bin** | ESP32 with ultrasonic (fill level) and load-cell (weight) sensors, three compartments: plastic, food, metal. Uploads readings over Wi-Fi. | Hardware (partner-built firmware) |
| **Mobile app** | Expo / React Native app for sellers and buyers. | Sellers, buyers |
| **Admin dashboard** | React web app to oversee users, listings, orders and bins. | Admins |

Everything shares one Firebase backend (plus a second Firebase project that only holds the live bin data).

---

## 2. Architecture

```
                    ┌──────────────────────────┐
                    │  ESP32 smart bin (bin001)│
                    │  ultrasonic + load cells │
                    └────────────┬─────────────┘
                                 │ Wi-Fi, writes every few seconds
                                 ▼
                ┌──────────────────────────────────┐
                │ Firebase project "smartwastepro" │
                │ Realtime Database (IoT data)     │
                │ bins/bin001/compartments/...     │
                └───────┬─────────────────┬────────┘
              read (onValue)        read (onValue)
                        │                 │
        ┌───────────────▼──────┐   ┌──────▼───────────────┐
        │ Mobile app (Expo)    │   │ Admin dashboard      │
        │ seller / buyer       │   │ (React + Vite)       │
        └───────────┬──────────┘   └──────────┬───────────┘
                    │  Auth, Firestore,       │  Auth, Firestore
                    │  Storage, Functions     │
                    ▼                         ▼
          ┌──────────────────────────────────────────┐
          │ Firebase project "wast-pro"              │
          │  Authentication   (email + password)     │
          │  Cloud Firestore  (users, marketplace,   │
          │                    orders, offers,       │
          │                    notifications)        │
          │  Storage          (profile photos)       │
          │  Cloud Functions  (Stripe Checkout)      │
          └──────────────────────────────────────────┘
```

Key decisions:

- **No custom server.** Clients talk to Firebase directly; **Firestore security rules** are the access control.
- **Two Firebase projects.** The main project (`wast-pro`) holds accounts and marketplace data. The IoT project (`smartwastepro-1085e`) holds only live sensor data in the Realtime Database, so the firmware never touches user data.
- **Live data by listeners.** Screens subscribe with `onSnapshot` / `onValue`, so changes appear without refreshing.

---

## 3. Repository layout

```
wast-pro/
├── README.md                    Project overview, setup, features, test counts
├── structure.md                 This file
├── reqament.txt                 Requirements notes
├── thesis_code_segments.md      Code excerpts used in the thesis
├── .gitignore
├── .github/workflows/ci.yml     CI: admin, mobile, Firestore rules jobs
├── screenshots/                 App screenshots used in the README
│
├── mobile/                      Expo (React Native) app + Firebase config
│   ├── app/                     Screens (Expo Router, file-based routing)
│   ├── components/              Shared UI components
│   ├── constants/               Design tokens and bin-status helpers
│   ├── hooks/                   Custom hooks
│   ├── utils/                   Pure helper functions (each has a test)
│   ├── functions/               Firebase Cloud Functions (Stripe)
│   ├── tests/rules/             Firestore rules tests (emulator)
│   ├── scripts/                 One-off scripts (seed data, project reset)
│   ├── docs/analysis_report.md  Earlier analysis report
│   ├── assets/images/           Logo, icons, splash, backgrounds
│   ├── firebaseConfig.js        Main Firebase project (native)
│   ├── firebaseConfig.web.js    Main Firebase project (web build)
│   ├── iotConfig.js             IoT Firebase project + mock data
│   ├── firestore.rules          Security rules
│   ├── firestore.indexes.json   Composite indexes
│   ├── firebase.json            Firebase CLI config (rules, indexes, functions)
│   ├── types.ts                 Shared TypeScript types
│   ├── app.json                 Expo config
│   ├── package.json, tsconfig.json, eslint.config.js
│   └── .env.example             Environment variable template
│
└── admin/                       Admin dashboard (React + Vite)
    ├── src/
    │   ├── main.jsx, App.jsx    Entry point and routes
    │   ├── AuthContext.jsx, useAuth.js, authContextInstance.js
    │   ├── firebaseConfig.js, iotConfig.js
    │   ├── pages/               One file per screen
    │   ├── lib/                 Pure helpers + paginated listener hook
    │   ├── components/Icons.jsx
    │   └── App.css, index.css
    ├── public/logo.png
    ├── index.html, vite.config.js, vitest.config.js, eslint.config.js
    ├── package.json
    └── .env.example
```

About 150 files are tracked in git; roughly 8,400 lines of application source (TypeScript/JavaScript) plus tests.

---

## 4. Technology stack

### Mobile app (`mobile/`)

| Area | Technology |
|------|-----------|
| Framework | **Expo SDK 57**, **React Native 0.86**, **React 19** (React Compiler enabled), new architecture on |
| Language | **TypeScript 6** (strict), some plain JS config files |
| Routing | **Expo Router 57** (file-based, typed routes), React Navigation 7 under the hood |
| Backend SDK | **Firebase JS SDK 12**: Auth, Firestore, Storage, Functions, Realtime Database |
| Local storage | `@react-native-async-storage/async-storage` (keeps the sign-in session) |
| Maps and location | `react-native-maps`, `expo-location` |
| Graphics | `react-native-svg` (donut chart), `@expo/vector-icons` (Ionicons) |
| Media | `expo-image`, `expo-image-picker` (profile photo) |
| Payments | `expo-web-browser` (opens Stripe Checkout; no native Stripe SDK, so Expo Go works) |
| Animation / gestures | `react-native-reanimated`, `react-native-gesture-handler`, `react-native-worklets` |
| Other Expo modules | `expo-constants`, `expo-font`, `expo-haptics`, `expo-linking`, `expo-splash-screen`, `expo-status-bar`, `expo-symbols`, `expo-system-ui`, `expo-file-system` |
| Web target | `react-native-web` (a web build exists; the map has a web fallback) |
| Testing | **Jest 29** + `jest-expo`, `@testing-library/react-native` 14, `@firebase/rules-unit-testing` 5 |
| Lint | ESLint 9 + `eslint-config-expo` |

### Admin dashboard (`admin/`)

| Area | Technology |
|------|-----------|
| Framework | **React 19**, **Vite 7** (plain JavaScript / JSX) |
| Routing | `react-router-dom` 7 |
| Backend SDK | Firebase JS SDK 12 (Auth, Firestore, Realtime Database) |
| Testing | **Vitest 5**, Testing Library, jsdom |
| Lint | ESLint 9 (react-hooks, react-refresh plugins) |

### Backend and services

| Service | Use |
|---------|-----|
| Firebase Authentication | Email + password sign-in (Google sign-in was tried and removed) |
| Cloud Firestore | Users, marketplace listings, orders, offers, notifications |
| Firebase Realtime Database | Live smart-bin readings (separate project) |
| Firebase Storage | Profile photos |
| Cloud Functions (Node, `firebase-functions` 6, `firebase-admin` 12) | Stripe Checkout session create + verify (written, not deployed) |
| Stripe (test mode) | Card payments |
| Firebase CLI / Emulator Suite | Deploying rules and indexes; running rules tests |

### Tooling

Node 22 (required by Vitest 5), npm, Git + GitHub, GitHub Actions, Java 21 (Firestore emulator),
VS Code settings in `mobile/.vscode`.

---

## 5. Mobile app

### 5.1 Navigation (`mobile/app/`)

Expo Router maps files to screens. `app/_layout.tsx` wraps everything in `SafeAreaProvider` and a
light-only navigation theme; `app/(tabs)/_layout.tsx` is a stack with swipe-back. Every screen draws its
own bottom navigation (`BottomNav`).

| Route file | Screen | Notes |
|-----------|--------|-------|
| `(tabs)/index.tsx` | Splash | Animated logo, then goes to Welcome |
| `(tabs)/Welcome.tsx` | Welcome | "Get Started" goes to Login |
| `(tabs)/Login.tsx` | Login | Email + password, role-based redirect, disabled-account check, **Forgot password** (sends a reset email) |
| `(tabs)/CreateAccount.tsx` | Sign up | Creates the Auth user and `users/{uid}` profile (role seller or buyer) |
| `(tabs)/seller/SellerDashboard.tsx` | Seller home | Live bin cards, Bin ON/OFF, donut chart, bin map, set-bin-location, notifications, issue report |
| `(tabs)/seller/AddWaste.tsx` | List waste | Pick compartments, enter weight, priced per kg, creates marketplace listings |
| `(tabs)/seller/SellerOrders.tsx` | Seller orders | Tabs Ongoing / Completed / Cancelled; Confirm, Decline, Mark completed; shows buyer rating |
| `(tabs)/seller/SellerOffers.tsx` | Seller offers | Accept (creates an order in a transaction) or reject offers |
| `(tabs)/seller/SellerProfile.tsx`, `EditProfile.tsx` | Profile | Stats (earned, weight) and profile editor |
| `(tabs)/buyer/BuyerDashboard.tsx` | Marketplace | Search, type filter, distance, route map, Buy Now (cash or card), Make an Offer, notification bell |
| `(tabs)/buyer/BuyerOrders.tsx` | Buyer orders | Tabs, cancel, pay accepted-offer order by card, route map, star rating |
| `(tabs)/buyer/BuyerOffers.tsx` | Buyer offers | Offers made, withdraw |
| `(tabs)/buyer/BuyerProfile.tsx`, `EditProfile.tsx` | Profile | Profile and editor |

The two `EditProfile.tsx` files are 5-line wrappers around `components/profile-editor.tsx`.

### 5.2 Components (`mobile/components/`)

| File | Purpose |
|------|---------|
| `platform-map.tsx` / `platform-map.web.tsx` | Map wrapper: `react-native-maps` on devices, a simple fallback on web |
| `profile-editor.tsx` | Shared profile form: name, phone, Sri Lanka location list, photo upload to Storage |
| `ui/screen.tsx` | `Screen` (safe areas, padding, scroll) and `ScreenHeader` |
| `ui/card.tsx` | `Card`, `SectionTitle`, `Divider`, `DetailRow` |
| `ui/button.tsx` | Button variants (primary, secondary, danger), loading state |
| `ui/text-field.tsx` | Labelled input with icon and **show/hide password** toggle |
| `ui/badge.tsx` | Status badges and `Notice`; maps order status to tone and label |
| `ui/chip.tsx` | `ChipGroup` filter pills |
| `ui/sheet.tsx` | Bottom-sheet modal used for every dialog |
| `ui/bottom-nav.tsx` | Floating bottom navigation for sellers and buyers (with a solid strip under it) |
| `ui/empty-state.tsx` | `EmptyState` and `LoadingState` |
| `ui/list-option.tsx` | Selectable list rows |
| `ui/donut-chart.tsx` | SVG donut chart with total in the centre and a legend; "Bin is empty" state |
| `ui/order-tabs.tsx` | Ongoing / Completed / Cancelled tabs with counts |
| `ui/star-rating.tsx` | 1–5 stars, read-only or tappable |
| `ui/notification-bell.tsx` | Bell with unread badge and notifications sheet (used for buyers) |

### 5.3 Hooks, constants, utils

| File | Purpose |
|------|---------|
| `hooks/useAuthUser.ts` | Returns the signed-in user only after Firebase has restored the session **and** `reload()` confirms the account still exists. A deleted or disabled account is signed out; nobody signed in is sent to Login. Prevents "Missing or insufficient permissions" on start-up. |
| `constants/design.ts` | Design tokens (colours, spacing, radius, shadows, type) |
| `constants/bin-status.ts` | Maps firmware status (EMPTY, LOW, HALF, 75%, FULL, ERROR) to colour and label |
| `utils/binTelemetry.ts` | Turns raw firmware data into numbers: parses level text and weight (grams → kg), computes live/offline by 2-minute staleness (`STALE_AFTER_MS`) |
| `utils/distance.ts` | Haversine distance in km |
| `utils/orderActions.ts` | Which actions a seller may take per order status; whether completing collects cash |
| `utils/orderTabs.ts` | Which tab an order belongs to (pending/confirmed = Ongoing) and counts per tab |
| `utils/orderNotifications.ts` | Message and type of the notification a seller's action sends to the buyer |
| `utils/passwordReset.ts` | Messages for the reset-email result (same message for unknown email, so accounts cannot be probed) |
| `utils/donut.ts` | Donut slice geometry and `formatKg` (up to 3 decimals) |
| `utils/money.ts` | `roundMoney` and `formatRs` (`Rs 120`, `Rs 7.20`) |
| `types.ts` | Shared types: `UserProfile`, `MarketplaceItem`, `Order`, `Offer`, `AppNotification`, `BinData`, `BinCompartment`, `UserLocation`, `WasteType` |

### 5.4 Firebase configuration

- `firebaseConfig.js` — initialises the main project with AsyncStorage persistence; exports `auth`, `db`, `storage`, `functions`.
- `firebaseConfig.web.js` — same for the web build.
- `iotConfig.js` — a second, named Firebase app for the IoT project: Realtime Database `iotDb`, anonymous sign-in with persistence, `DEFAULT_BIN_ID = 'bin001'`, and development-only mock data (`USE_MOCK_IOT` is `__DEV__ && env flag`, so production never shows fake data).

### 5.5 Scripts

- `scripts/seedMockData.js` — seeds demo data with a service-account key (never committed).
- `scripts/reset-project.js` — Expo template reset script.

---

## 6. Admin dashboard

Routes (`src/App.jsx`): a gate shows Login when signed out, "Not an admin" when the user's role is not
`admin`, and otherwise the layout with these pages.

| Route | Page | Content |
|-------|------|---------|
| `/` | `Overview.jsx` | KPI cards: total users, sellers, buyers, available listings, total / pending-or-confirmed / completed orders, completed revenue (bounded read, capped at 500 orders) |
| `/bins` | `BinStatus.jsx` | Live readings of the default bin (`bin001`), Bin ON/OFF and freshness |
| `/users` | `Users.jsx` | Search and filter, enable/disable accounts, set which `binId` a seller sees (via a prompt) |
| `/marketplace` | `Marketplace.jsx` | All listings with filters, delete a listing |
| `/orders` | `Orders.jsx` | All orders with filters, change order status |

Other files:

- `AuthContext.jsx`, `useAuth.js`, `authContextInstance.js` — auth state and `isAdmin` (reads `users/{uid}.role`).
- `lib/usePaginatedCollection.js` — live listener with a growing `limit` (25 per page) instead of streaming everything.
- `lib/filters.js` — search/filter functions for users, listings and orders (unit tested).
- `lib/binTelemetry.js` — same parsing as the mobile app (unit tested).
- `iotConfig.js` — IoT Realtime Database connection; `BIN_ID = "bin001"`; mock data only in dev.
- `pages/Layout.jsx` — sidebar and outlet; `pages/Login.jsx`, `pages/NotAdmin.jsx`.
- `components/Icons.jsx` — inline SVG icons. `App.css` / `index.css` — styles.

Admin accounts are created **by hand** in the Firebase console (set `role: "admin"`); the app's sign-up cannot create one.

---

## 7. Firebase backend

Project `wast-pro`:

| Service | Details |
|---------|---------|
| Authentication | Email + password |
| Firestore | Rules in `mobile/firestore.rules`, indexes in `mobile/firestore.indexes.json`, both deployed with the Firebase CLI |
| Storage | Profile photos |
| Functions | `mobile/functions` (not deployed; needs the Blaze plan and a Stripe key) |

Composite indexes (needed by the app's queries, all built):

| Collection | Fields |
|-----------|--------|
| `orders` | `sellerUid` ascending, `createdAt` descending |
| `orders` | `buyerUid` ascending, `createdAt` descending |
| `offers` | `buyerUid` ascending, `createdAt` descending |

Deploy: `firebase deploy --only firestore:rules` (and `firestore:indexes`) from `mobile/`.

---

## 8. Firestore data model

### `users/{uid}`
`fullName`, `email`, `role` (`seller` | `buyer` | `admin`), `phone`, `location` (text), `photoURL`,
`points`, `createdAt`, `updatedAt`, `disabled` (admin only), `binId` (admin only, which bin the seller sees),
`binLocation { latitude, longitude }` (set by the seller from the dashboard).

### `marketplace/{listingId}` — waste listings
`sellerUid`, `sellerName`, `wasteType` (`plastic` | `food` | `metal`), `weightKg`, `pricePerKg`,
`totalPrice` (rounded to 2 decimals), `location {latitude, longitude}`, `status` (`available` | `sold`),
`soldOrderId` (set while sold; ties a cancel back to the order), `createdAt`.

### `orders/{orderId}`
`listingId`, `buyerUid`, `buyerName`, `sellerUid`, `sellerName`, `wasteType`, `weightKg`, `totalPrice`,
`paymentMethod` (`cash` | `card`), `paymentStatus` (`pending` | `paid`), `paymentLast4`,
`status` (`pending` → `confirmed` → `completed`, or `cancelled`), `location`, `createdAt`, `cancelledAt`,
`offerId` (set when created from an accepted offer), `rating` (1–5, set once by the buyer after completion).

### `offers/{offerId}`
`listingId`, `buyerUid`, `buyerName`, `sellerUid`, `sellerName`, `wasteType`, `weightKg`, `askingPrice`,
`offeredPrice`, `status` (`pending` | `accepted` | `rejected` | `withdrawn`), `createdAt`, `updatedAt`.

### `notifications/{id}`
`toUid`, `type`, `message`, `read`, `createdAt`, plus `orderId` or `offerId` so rules can verify the sender.
Types: `bin_full`, `order_placed`, `order_cancelled`, `order_confirmed`, `order_completed`,
`offer_received`, `offer_accepted`, `offer_rejected`.

### `bins/{uid}`
Legacy per-seller bin document (owner read/write). Live readings come from the Realtime Database instead.

### Realtime Database (IoT project) — see section 10.

---

## 9. Security rules

`mobile/firestore.rules` is the main protection, because clients talk to Firestore directly.
Helper functions: `isSignedIn`, `isOwner`, `isAdmin`, `isOrderParty`, `isOfferParty`,
`isAcceptedOfferOrder`, `isBuyingListing`, `isRestoringListing`, `isValidNewListing`,
`isValidListingEdit`, `isValidBinLocation`, `isDirectPurchaseOfListing`.

| Collection | Who may do what |
|-----------|-----------------|
| `users` | Read: owner or admin only (profiles are private). Create: owner, role must be seller or buyer, no `disabled`/`points`. Update: owner may change only `fullName`, `phone`, `location`, `photoURL`, `updatedAt` and a **valid** `binLocation`; admin may change only `disabled` and `binId` (checked with a regex). Delete: never. |
| `marketplace` | Read: any signed-in user. Create: the seller, with a valid listing (known type, positive weight and price within limits, starts `available`). Update: the seller (valid edit), or a buyer **only** as part of buying (available → sold, in the same batch that creates their order) or cancelling (sold → available, in the same batch that cancels the order). Delete: seller or admin. |
| `orders` | Read: buyer, seller or admin. Create: a buyer direct purchase that matches the real listing (seller, price, still available), or a seller creating the order while accepting an offer. Update: buyer cancels an unpaid order; buyer pays an accepted-offer order by card (payment fields only); seller moves status forward or marks a cash order paid; buyer rates a completed order once (1–5, `rating` only); admin changes `status` only. Delete: never. |
| `offers` | Read: buyer, seller, admin. Buyer creates own pending offers and may withdraw; seller accepts or rejects offers on their listings. |
| `notifications` | Read, update, delete: the recipient (admin may read). Create: the recipient must exist, and the type decides who may send: `bin_full` only to yourself; order types only between the two parties of that order; `order_confirmed` / `order_completed` **only from the order's seller**; offer types only between the two parties of that offer. |
| `bins` | Owner read/write; admin read. |

### Realtime Database (IoT project)
Currently `.read: true, .write: true` so the prototype works. The plan is to restrict it (read for
signed-in users, write only by the device) once the hardware is verified, and to regenerate the legacy
database secret that was shared during development.

---

## 10. IoT smart bin

- **Hardware:** ESP32, ultrasonic sensor per compartment (fill level), load cell (weight), moisture sensor (food). Firmware is written by the hardware partner.
- **Firebase project:** `smartwastepro-1085e` (separate from the main one), Realtime Database.
- **Data shape** (firmware):

```
bins/bin001/
  lastUpdated            epoch milliseconds
  location               "Horizon Campus"   (text, not GPS)
  owner
  compartments/
    plastic/ { level: "text", weight: grams }
    food/    { level: "text", weight: grams }
    metal/   { level: "text", weight: grams }
```

- **Parsing:** `utils/binTelemetry.ts` (mobile) and `lib/binTelemetry.js` (admin) convert level text to a percentage and a status, weight in grams to kg (`WEIGHT_UNIT_DIVISOR = 1000`), and compute freshness.
- **Bin ON / OFF:** a bin is ON if `lastUpdated` is within the last 2 minutes. When OFF the app shows the last known readings and raises **no new alerts**.
- **Auth:** the app signs in to the IoT project anonymously; this keeps working after the rules are tightened.
- **Linking a seller to a bin:** an admin sets `users/{uid}.binId`; the seller app reads `binId || 'bin001'`.
- **Bin location:** the firmware sends no GPS, so the seller taps "Set bin location" on the dashboard; the phone's position is saved as `binLocation`.
- **Mock mode:** `EXPO_PUBLIC_USE_MOCK_IOT=true` (dev builds only) shows simulated data with Normal and Alert presets.

---

## 11. Cloud Functions and card payments

`mobile/functions/index.js` (Node, v2 callable functions, secret `STRIPE_SECRET_KEY`):

- `createCheckoutSession({ amount, wasteType, listingId })` — creates a Stripe Checkout session in LKR and returns its URL. Success/cancel redirect to the app's `mobile://payment-complete` scheme.
- `verifyCheckoutSession({ sessionId })` — checks on the server that the session belongs to the caller and is paid, returns the card's last 4 digits.

The app opens the Checkout URL with `expo-web-browser`, then calls verify. **Status: written but not
deployed** (needs the Firebase Blaze plan and a Stripe test key). Until then the demo uses cash on delivery.

---

## 12. Main user flows

### Seller
1. Sign up as seller, sign in.
2. Dashboard shows the three compartments live (level %, status, weight) and a donut chart of weights. Bin ON/OFF shows whether the bin is reporting.
3. **Add Waste:** choose compartments, enter weights; the price per kg gives the total; listings are created on the marketplace.
4. **Orders:** a buyer's purchase appears under Ongoing. Seller **Confirms** or **Declines** (decline cancels the order and relists the waste in one atomic batch), then **Marks completed** (cash orders are marked paid at hand-over).
5. **Offers:** accept (creates a confirmed order in a transaction and rejects other offers) or reject.

### Buyer
1. Browse the marketplace (search, type filter, distance, route map).
2. **Buy Now** (cash or card) — creates the order and marks the listing sold in one batch — or **Make an Offer**.
3. **Orders** tabs: Ongoing / Completed / Cancelled; cancel an unpaid order (listing is relisted); pay an accepted-offer order by card.
4. After completion, give 1–5 stars.
5. A bell shows notifications when the seller confirms, completes or declines an order.

### Admin
Sign in on the web dashboard, watch the bin, enable/disable users, assign bins, review listings and orders.

### Order state machine

```
pending ──seller confirm──► confirmed ──seller complete──► completed ──buyer rates──► (rating)
   │                            │
   └── buyer cancel / seller decline (relists the waste) ──► cancelled
```

---

## 13. Design system

`mobile/constants/design.ts` holds the tokens; screens use them instead of hard-coded values.

- **Colours:** brand green (`brand` 50–900), neutral `ink` greys, per-waste accents (plastic blue, food orange, metal grey), status tones (success, warning, danger, info, neutral).
- **Accessibility:** text colours meet WCAG AA contrast (4.5:1); `design.test.ts` checks this. Interactive elements carry accessibility roles and labels.
- **Layout:** `Space`, `Radius`, `Shadow` scales; light theme only; floating bottom navigation; bottom-sheet modals.

---

## 14. Tests

| Suite | Tool | Count | What it covers |
|-------|------|-------|----------------|
| Mobile unit | Jest + jest-expo | 54 | distance, bin status and telemetry, order actions, order tabs, order notifications, password-reset messages, donut maths and `formatKg`, money formatting, colour contrast, password field |
| Admin unit | Vitest | 19 | filters, telemetry parsing |
| Firestore rules | Firebase emulator + `@firebase/rules-unit-testing` | 103 | every collection: who can read/create/update/delete, buy and cancel atomicity, offers, validation, seller order actions, ratings, notification spoofing |

Rules tests live in `mobile/tests/rules/` (`offers`, `users-and-orders`, `listings`, `validation`,
`seller-orders`) and run through `run.mjs`. They need Java 21.

---

## 15. CI

`.github/workflows/ci.yml` runs on pushes to `main`, `development`, `keshan-dev` and on pull requests
to `main` / `development`. Node 22. Three jobs:

1. **admin** — `npm ci`, lint, test, build.
2. **mobile** — `npm ci`, lint, Jest.
3. **firestore-rules** — Java 21, `npm run test:rules` on the emulator.

---

## 16. Environment variables

Real values live in untracked `.env` files; `.env.example` shows the names.

**Mobile (`mobile/.env`)** — `EXPO_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`,
`_MESSAGING_SENDER_ID`, `_APP_ID`, `_MEASUREMENT_ID`; IoT: `EXPO_PUBLIC_IOT_FIREBASE_API_KEY`,
`_PROJECT_ID`, `_DATABASE_URL`; `EXPO_PUBLIC_USE_MOCK_IOT`.

**Admin (`admin/.env`)** — the same set with the `VITE_` prefix.

**Functions** — secret `STRIPE_SECRET_KEY` set with `firebase functions:secrets:set`.

Never committed: `.env`, `serviceAccountKey.json`, `google-services.json`. No database secret is kept in the app.

---

## 17. Commands

```bash
# Mobile (from mobile/)
npm install
npx expo start            # run in Expo Go
npm run lint
npm test                  # Jest
npm run test:rules        # Firestore rules on the emulator (needs Java 21)
npx tsc --noEmit          # type-check

# Admin (from admin/)
npm install
npm run dev               # http://localhost:5173
npm run lint
npm test                  # Vitest
npm run build

# Firebase (from mobile/)
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## 18. Git workflow

`keshan-dev` (daily work) → `development` → `main`. Changes are pushed to `keshan-dev` first, then
fast-forwarded to `development` and `main` once checked. CI runs on all three.

---

## 19. Known limitations

- Card payment is built but not deployed; the demo uses cash on delivery. Payment status is still written by the client (a real system would confirm it from a Stripe webhook).
- The IoT Realtime Database rules are open until the hardware is verified, then they should be locked.
- Weight unit (grams vs kg) and load-cell zeroing (tare) still need a check with a known weight.
- Routing on the map is a straight line, not road routing.
- One bin per seller; listings are whole compartments (no partial quantity).
- No email verification, App Check or rate limiting.
- Tests cover logic, rules and components; there are no end-to-end screen tests or Cloud Function tests.
- Admin has no CSV/PDF export, and the Bin Status page shows only the default bin.
