# SmartWaste Pro — Codebase Structure & Technical Reference

> IoT-based waste monitoring and recycling marketplace.
> Final-year BIT project, Horizon Campus (Faculty of IT).
> Mobile app, admin site and Firebase backend: Keshan D. Adhikari (ITBIN-2211-0137).
> Smart bin hardware and firmware: W. Thilan Avishka (ITBNM-2211-0199).
> Supervisor: Ms. Yasara Fernando. Co-supervisor: Mr. Daminda Herath.
>
> This file describes the code **as it is in the repository** (branch `keshan-dev`, commit `4ab6c12`):
> every folder and file, the tools and technologies, the data model, the security rules, the tests
> and how the parts fit together. For setup steps see `README.md`, `mobile/README.md` and
> `admin/README.md`. For a function-by-function walkthrough see `CODE_GUIDE.md`.

---

## Contents

1. [What the system is](#1-what-the-system-is)
2. [Architecture](#2-architecture)
3. [Repository layout](#3-repository-layout)
4. [Technology stack](#4-technology-stack)
5. [Mobile app](#5-mobile-app)
6. [Admin website](#6-admin-website)
7. [Firebase backend](#7-firebase-backend)
8. [Firestore data model](#8-firestore-data-model)
9. [Security rules](#9-security-rules)
10. [IoT smart bin](#10-iot-smart-bin)
11. [Cloud Functions and card payments](#11-cloud-functions-and-card-payments)
12. [Main user flows](#12-main-user-flows)
13. [Design system](#13-design-system)
14. [External services](#14-external-services)
15. [Tests](#15-tests)
16. [CI](#16-ci)
17. [Environment variables](#17-environment-variables)
18. [Commands](#18-commands)
19. [Git workflow](#19-git-workflow)
20. [Known limitations and open items](#20-known-limitations-and-open-items)
21. [Deeper analysis: how the code behaves](#21-deeper-analysis-how-the-code-behaves)

---

## 1. What the system is

SmartWaste Pro connects people who produce sorted waste (**sellers**) with recyclers (**buyers**), and
gives each seller a smart bin that reports how full and how heavy it is.

| Part | What it is | Users |
|------|-----------|-------|
| **Smart bin** | ESP32 with three compartments (plastic, food, metal). Each has an ultrasonic sensor (fill level) and a load cell with HX711 (weight), plus LEDs, a buzzer and buttons. Uploads readings over Wi-Fi. | Hardware (partner's firmware, not in this repo) |
| **Mobile app** | Expo / React Native / TypeScript app. Sellers watch their bin and list waste; buyers browse, buy or make offers. | Sellers, buyers |
| **Admin website** | React + Vite site to oversee users, bins, listings and orders. Live at https://wast-pro.web.app | Admins |

There is **no custom server**. The apps talk to Firebase directly and Firestore security rules protect the data.

---

## 2. Architecture

```
                    ┌──────────────────────────┐
                    │  ESP32 smart bin (bin001)│
                    │  ultrasonic + load cells │
                    └────────────┬─────────────┘
                                 │ Wi-Fi, writes every few seconds
                                 ▼
                ┌──────────────────────────────────────┐
                │ Firebase project "smartwastepro-1085e"│
                │ Realtime Database (IoT data only)     │
                │ bins/bin001/compartments/...          │
                └───────┬─────────────────┬────────────┘
              read (onValue)        read (onValue)
              anonymous sign-in     anonymous sign-in
                        │                 │
        ┌───────────────▼──────┐   ┌──────▼───────────────┐
        │ Mobile app (Expo)    │   │ Admin website        │
        │ seller / buyer       │   │ (React + Vite)       │
        └──────┬────────┬──────┘   └──────────┬───────────┘
               │        │ Auth, Firestore,    │ Auth, Firestore
               │        │ Storage, Functions  │
               │        ▼                     ▼
               │   ┌──────────────────────────────────────────┐
               │   │ Firebase project "wast-pro"              │
               │   │  Authentication   (email + password)     │
               │   │  Cloud Firestore  (users, marketplace,   │
               │   │                    orders, offers,       │
               │   │                    notifications)        │
               │   │  Storage          (profile photos)       │
               │   │  Cloud Functions  (Stripe, not deployed) │
               │   │  Hosting          (admin website)        │
               │   └──────────────────────────────────────────┘
               ▼
   Photon (place search) and OSRM (road route) — free OpenStreetMap services
```

Key decisions:

- **No custom server.** Clients talk to Firebase directly; **Firestore security rules** are the access control.
- **Two Firebase projects.** `wast-pro` holds accounts and marketplace data. `smartwastepro-1085e` holds only live sensor data in the Realtime Database, so the firmware never touches user data.
- **Live data by listeners.** Screens subscribe with `onSnapshot` (Firestore) and `onValue` (Realtime Database), so changes appear without refreshing.
- **Atomic writes for money and stock.** Buying, cancelling and accepting an offer use a `writeBatch` or a transaction, and the rules check the whole batch (`getAfter` / `existsAfter`).

---

## 3. Repository layout

```
wast-pro/
├── README.md                    Project overview, setup, features, test counts
├── structure.md                 This file
├── CODE_GUIDE.md                Function-by-function walkthrough (untracked)
├── SmartWaste_Pro_Code_Guide.pdf  PDF of the code guide (untracked)
├── reqament.txt                 Backend requirements notes (Firebase, not Node/MongoDB)
├── thesis_code_segments.md      Code excerpts used in the thesis
├── .easignore                   Files not uploaded to EAS Build
├── .gitignore                   node_modules, .expo, *.env, service-account and google-services keys, logs
├── .github/workflows/ci.yml     CI: admin, mobile, Firestore rules jobs
├── screenshots/                 8 app screenshots used in the README
│
├── mobile/                      Expo (React Native) app + Firebase config
│   ├── app/                     Screens (Expo Router, file-based routing)
│   │   ├── _layout.tsx          Root: SafeAreaProvider, light navigation theme, Stack
│   │   └── (tabs)/
│   │       ├── _layout.tsx      Stack with swipe-back and slide animation
│   │       ├── index.tsx        Splash
│   │       ├── Welcome.tsx, Login.tsx, CreateAccount.tsx
│   │       ├── seller/          SellerDashboard, AddWaste, SellerOrders, SellerOffers,
│   │       │                    SellerProfile, EditProfile
│   │       └── buyer/           BuyerDashboard, BuyerOrders, BuyerOffers,
│   │                            BuyerProfile, EditProfile
│   ├── components/              platform-map (+ .web), profile-editor
│   │   └── ui/                  Shared UI kit (16 components, 2 test files)
│   ├── constants/               design.ts (tokens), bin-status.ts (+ tests)
│   ├── hooks/useAuthUser.ts     Signed-in user hook
│   ├── utils/                   12 pure helper modules, each with a test file
│   ├── functions/               Firebase Cloud Functions (Stripe Checkout)
│   ├── tests/rules/             Firestore rules tests (5 files + run.mjs)
│   ├── scripts/                 seedMockData.js, reset-project.js
│   ├── docs/analysis_report.md  Earlier analysis report
│   ├── assets/images/           Logo, icons, splash, backgrounds
│   ├── firebaseConfig.js        Main Firebase project (native)
│   ├── firebaseConfig.web.js    Main Firebase project (web build)
│   ├── iotConfig.js             IoT Firebase project + mock data
│   ├── firestore.rules          Security rules (454 lines)
│   ├── firestore.indexes.json   Composite indexes
│   ├── firebase.json            Firebase CLI config (rules, indexes, functions)
│   ├── types.ts                 Shared TypeScript types
│   ├── app.json                 Expo config
│   ├── eas.json                 EAS Build profile (Android APK)
│   ├── package.json, tsconfig.json, eslint.config.js
│   ├── .vscode/                 Editor settings
│   └── .env.example             Environment variable template
│
└── admin/                       Admin website (React + Vite)
    ├── src/
    │   ├── main.jsx, App.jsx    Entry point, routes and the sign-in gate
    │   ├── AuthContext.jsx, useAuth.js, authContextInstance.js
    │   ├── firebaseConfig.js, iotConfig.js
    │   ├── pages/               Login, NotAdmin, Layout, Overview, BinStatus, Users,
    │   │                        Marketplace, Orders
    │   ├── lib/                 binTelemetry, filters, shortId, userEdit (each tested),
    │   │                        usePaginatedCollection
    │   ├── components/Icons.jsx Inline SVG icons
    │   └── App.css, index.css   Styles
    ├── public/logo.png
    ├── firebase.json            Firebase Hosting config (serves dist/, SPA rewrite)
    ├── index.html, vite.config.js, vitest.config.js, eslint.config.js
    ├── package.json
    └── .env.example
```

Size: 163 files tracked in git. About 8,600 lines of mobile source and 2,650 lines of admin
JavaScript (plus 1,370 lines of CSS), with about 1,050 lines of mobile tests.

Not in git (local only): `node_modules/`, `.env` files, `admin/dist/`, `mobile/.expo/`,
`mobile/backend/`, `firestore-debug.log`, service-account keys. The firmware project is not in the
repo yet.

---

## 4. Technology stack

### Mobile app (`mobile/`)

| Area | Technology |
|------|-----------|
| Framework | **Expo SDK 57**, **React Native 0.86.3**, **React 19.2** (React Compiler on), new architecture on |
| Language | **TypeScript 6** (strict, `@/*` path alias); config files in plain JS |
| Routing | **Expo Router 57** (file-based, typed routes), React Navigation 7 underneath |
| Backend SDK | **Firebase JS SDK 12**: Auth, Firestore, Storage, Functions, Realtime Database |
| Local storage | `@react-native-async-storage/async-storage` (keeps the sign-in session) |
| Maps and location | `react-native-maps` 1.27 (Google provider on Android), `expo-location` |
| Graphics | `react-native-svg` (donut chart), `@expo/vector-icons` (Ionicons) |
| Media | `expo-image`, `expo-image-picker` (profile photo from camera or gallery) |
| Payments | `expo-web-browser` + `expo-linking` (opens Stripe Checkout; no native Stripe SDK, so Expo Go works) |
| Animation / gestures | `react-native-reanimated` 4, `react-native-gesture-handler`, `react-native-worklets`, `react-native-screens`, `react-native-safe-area-context` |
| Other Expo modules | `expo-constants`, `expo-font`, `expo-haptics`, `expo-splash-screen`, `expo-status-bar`, `expo-symbols`, `expo-system-ui`, `expo-file-system` |
| Web target | `react-native-web` (the map has a placeholder on web) |
| Testing | **Jest 29** + `jest-expo`, `@testing-library/react-native` 14, `@firebase/rules-unit-testing` 5 |
| Lint | ESLint 9 + `eslint-config-expo` |

### Admin website (`admin/`)

| Area | Technology |
|------|-----------|
| Framework | **React 19**, **Vite 7** (plain JavaScript / JSX, ES modules) |
| Routing | `react-router-dom` 7 (`BrowserRouter`) |
| Backend SDK | Firebase JS SDK 12 (Auth, Firestore, Realtime Database) |
| Styling | Hand-written CSS (`App.css`, `index.css`), no UI library |
| Testing | **Vitest 5**, Testing Library, jsdom |
| Lint | ESLint 9 (`react-hooks`, `react-refresh` plugins) |
| Hosting | Firebase Hosting (free plan) |

### Backend and services

| Service | Use |
|---------|-----|
| Firebase Authentication | Email + password; anonymous sign-in on the IoT project |
| Cloud Firestore | Users, marketplace listings, orders, offers, notifications |
| Firebase Realtime Database | Live smart-bin readings (separate project) |
| Firebase Storage | Profile photos (`profilePhotos/<uid>.jpg`) |
| Cloud Functions (Node 20, `firebase-functions` 6, `firebase-admin` 12, `stripe` 17) | Stripe Checkout create + verify (written, **not deployed**) |
| Stripe (test mode) | Card payments |
| Firebase Hosting | Admin website |
| Photon (komoot) | Place-name suggestions from OpenStreetMap data, no API key |
| OSRM public server | Road route between buyer and pickup point, no API key |

### Tooling

Node 22 (CI; Vitest 5 needs it), npm, Git + GitHub, GitHub Actions, Firebase CLI and Emulator Suite,
Java 21 (Firestore emulator), VS Code. Development is on Windows with Git Bash and PowerShell.

---

## 5. Mobile app

### 5.1 Navigation (`mobile/app/`)

Expo Router maps files to screens. `app/_layout.tsx` wraps everything in `SafeAreaProvider` and a
light-only navigation theme; `app/(tabs)/_layout.tsx` is a stack with swipe-back. There is no tab
navigator: every main screen draws its own floating `BottomNav`.

| Route file | Screen | What it does |
|-----------|--------|--------------|
| `(tabs)/index.tsx` | Splash | Animated logo, then `router.replace` to Welcome |
| `(tabs)/Welcome.tsx` | Welcome | "Get Started" opens Login |
| `(tabs)/Login.tsx` | Login | Email + password; reads `users/{uid}`; a `disabled` account is signed out again; seller goes to SellerDashboard, anyone else to BuyerDashboard; **Forgot password** sends a reset email |
| `(tabs)/CreateAccount.tsx` | Sign up | Role picker (seller or buyer), name, email, password + confirm; creates the Auth user and `users/{uid}` |
| `(tabs)/seller/SellerDashboard.tsx` | Seller home | Reward points and total weight summary, live bin cards (level, status, weight, overweight), Bin ON/OFF, donut chart of weights, bin location with type-ahead place search and map, notifications sheet, "Report an issue" sheet |
| `(tabs)/seller/AddWaste.tsx` | List waste | Choose compartments, enter weight (cannot exceed what the bin measures), fixed price per kg, creates one listing per waste type |
| `(tabs)/seller/SellerOrders.tsx` | Seller orders | Tabs Ongoing / Completed / Cancelled; Confirm, Decline, Mark completed; shows the buyer's rating |
| `(tabs)/seller/SellerOffers.tsx` | Seller offers | Accept (transaction) or reject; highest offer is marked |
| `(tabs)/seller/SellerProfile.tsx` | Seller profile | Stats from completed orders (earned, weight), short user ID, links, log out |
| `(tabs)/buyer/BuyerDashboard.tsx` | Marketplace | Search by waste type, type filter chips, straight-line distance, road-route map, Buy Now (cash or card), Make an Offer, notification bell |
| `(tabs)/buyer/BuyerOrders.tsx` | My purchases | Tabs, cancel (pending orders), pay a confirmed accepted-offer order by card, pickup map with a straight dashed line, star rating |
| `(tabs)/buyer/BuyerOffers.tsx` | Buyer offers | Offers made; after the seller accepts, **Buy** or **Decline** |
| `(tabs)/buyer/BuyerProfile.tsx` | Buyer profile | Order stats, short user ID, links, log out |
| `(tabs)/seller/EditProfile.tsx`, `(tabs)/buyer/EditProfile.tsx` | Edit profile | Thin wrappers around `components/profile-editor.tsx` |

Bottom navigation: sellers get Home, Market (AddWaste), Orders, Profile; buyers get Marketplace,
Purchases, Profile.

Fixed prices in `AddWaste.tsx`: plastic Rs 45/kg, food Rs 20/kg, metal Rs 120/kg.

### 5.2 Components (`mobile/components/`)

| File | Purpose |
|------|---------|
| `platform-map.tsx` | Re-exports `react-native-maps` (`MapView`, `Marker`, `Polyline`, `Callout`); Google provider on Android, default on iOS |
| `platform-map.web.tsx` | Web placeholder ("Map view isn't available in the web preview") |
| `profile-editor.tsx` | Shared profile form: name, Sri Lankan phone (normalised to `+947XXXXXXXX`), Sri Lanka location list, photo from camera or gallery uploaded to Storage |
| `ui/screen.tsx` | `Screen` (safe areas, padding, scroll, `withBottomNav`, `keyboardAware`) and `ScreenHeader` |
| `ui/card.tsx` | `Card`, `SectionTitle`, `Divider`, `DetailRow` |
| `ui/button.tsx` | Button variants: primary, secondary, danger, ghost; loading state |
| `ui/text-field.tsx` | Labelled input with icon and show/hide password toggle |
| `ui/badge.tsx` | `Badge`, `Notice`; `statusTone` / `statusLabel` map an order status to a colour and label |
| `ui/chip.tsx` | `ChipGroup` filter pills |
| `ui/sheet.tsx` | Bottom-sheet modal used for every dialog (`scrollable`, `avoidKeyboard`) |
| `ui/bottom-nav.tsx` | Floating bottom navigation for sellers and buyers |
| `ui/empty-state.tsx` | `EmptyState` and `LoadingState` |
| `ui/list-option.tsx` | `ListOption` rows and `StatTile` |
| `ui/donut-chart.tsx` | SVG donut chart with the total in the centre and a legend; "Bin is empty" state |
| `ui/order-tabs.tsx` | Ongoing / Completed / Cancelled tabs with counts |
| `ui/star-rating.tsx` | 1–5 stars, read-only or tappable |
| `ui/id-badge.tsx` | Shows a short support ID such as `USR-7K3F9A` |
| `ui/notification-bell.tsx` | Bell with unread badge and a notifications sheet; tapping a notification opens the matching screen |

### 5.3 Hooks, constants, utils, types

| File | Purpose |
|------|---------|
| `hooks/useAuthUser.ts` | Returns the signed-in user only after Firebase has restored the session **and** `reload()` confirms the account still exists. A deleted or disabled account is signed out; nobody signed in is sent to Login. Prevents "Missing or insufficient permissions" at start-up. |
| `constants/design.ts` | Design tokens: `Palette`, `Space`, `Radius`, `Shadow`, `Type`, `BOTTOM_NAV_HEIGHT`, `wasteAccent()` |
| `constants/bin-status.ts` | Maps a status (EMPTY, LOW, HALF, 75%, FULL, ERROR) to a tone, label and colour; `isBinFull()` |
| `utils/binTelemetry.ts` | Turns raw firmware data into clean values: `parseLevel`, `parseWeightKg` (grams → kg), `parseOverweight`, `normalizeBin`, `toEpochMs`, `describeFreshness` (2-minute rule), `formatAge` |
| `utils/distance.ts` | Haversine distance in km |
| `utils/donut.ts` | Donut slice geometry; `formatKg` (up to 3 decimals), `formatKgTotal` (2 decimals) |
| `utils/money.ts` | `roundMoney` (2 decimals) and `formatRs` (`Rs 120`, `Rs 7.20`) |
| `utils/orderActions.ts` | Which actions a seller may take per order state; whether completing collects cash |
| `utils/orderTabs.ts` | Which tab an order belongs to and counts per tab |
| `utils/orderNotifications.ts` | Type and message of the notification a seller's action sends to the buyer |
| `utils/notificationRoute.ts` | Which screen a notification opens (`order_*` → Orders, `offer_*` → Offers, per role) |
| `utils/passwordReset.ts` | Message for the reset-email result (same message for an unknown email, so accounts cannot be probed) |
| `utils/placeSearch.ts` | Type-ahead place suggestions from Photon, limited to Sri Lanka, at least 3 characters |
| `utils/route.ts` | Road route from OSRM (`points`, `distanceKm`, `durationMin`); the map falls back to a straight line |
| `utils/shortId.ts` | Short support IDs from the document id: `USR-XXXXXX` and `ORD-XXXXXX` (first 6 characters, upper case) |
| `types.ts` | `WasteType`, `BinCompartment`, `BinData`, `AppNotification`, `UserProfile`, `MarketplaceItem`, `Order`, `UserLocation`, `Offer` |

### 5.4 Firebase configuration

- `firebaseConfig.js` — main project with AsyncStorage persistence; exports `auth`, `db`, `storage`, `functions`.
- `firebaseConfig.web.js` — web build; exports `auth`, `db`, `storage` (no `functions`).
- `iotConfig.js` — a second Firebase app named `iot`: Realtime Database `iotDb`, anonymous sign-in with persistence, `DEFAULT_BIN_ID = 'bin001'`, and mock data (`USE_MOCK_IOT` is `__DEV__ && EXPO_PUBLIC_USE_MOCK_IOT === 'true'`, so a production build never shows fake data).

### 5.5 Expo configuration (`app.json`)

Name `SmartWaste Pro`, slug `mobile`, Android package `com.keshan.smartwastepro`, URL scheme `mobile`
(used for the Stripe return link), portrait, new
architecture, edge-to-edge on Android, typed routes and React Compiler experiments. Plugins:
`expo-router`, `expo-splash-screen`, `expo-image-picker` (photo and camera permission text),
`expo-font`, `expo-web-browser`, `expo-image`, `expo-status-bar`. The app icon, Android adaptive icon and
splash image are made from the leaf logo (`assets/images/logo.png`).

### 5.7 Android APK build (EAS Build)

- `mobile/eas.json` — the `preview` profile builds an installable APK for real phones
  (`arm64-v8a` and `armeabi-v7a`) and sets `EXPO_PUBLIC_DISABLE_MAPS=true`.
- There is no Google Maps API key yet. With that flag `components/platform-map.tsx` shows a
  placeholder instead of a map, so the installed app does not crash. In Expo Go the real map is used.
- `.easignore` (repo root) — what is not uploaded to the build. `mobile/.env` is uploaded on purpose,
  because the build needs the `EXPO_PUBLIC_` Firebase values.
- Build: `npx eas-cli build --platform android --profile preview` from `mobile/`.

### 5.6 Scripts

- `scripts/seedMockData.js` — seeds demo data with a service-account key (the key is never committed).
- `scripts/reset-project.js` — Expo template reset script.

---

## 6. Admin website

`src/App.jsx` has a gate: Loading, then **Login** when signed out, **NotAdmin** when the profile's
role is not `admin`, otherwise the layout with these pages. Unknown URLs go back to `/`.

| Route | Page | Content |
|-------|------|---------|
| `/` | `Overview.jsx` | KPI cards from server-side counts: total users, sellers, buyers, available listings, total / pending-or-confirmed / completed orders, completed revenue (read capped at 500 orders). Refreshes every 30 seconds. |
| `/bins` | `BinStatus.jsx` | List of every bin under `bins/` in the IoT database: search by bin ID, location or owner; filter All / ON / OFF / Needs attention. Selecting a bin opens its live readings, ON/OFF and freshness. |
| `/users` | `Users.jsx` | Paginated list (25 per page) with admins shown first; search by name, email or `USR-` ID; role filter; edit name, phone, location and points; set which `binId` a seller sees. There is no disable button. |
| `/marketplace` | `Marketplace.jsx` | Sellers list (listings, available, sold, total value); selecting a seller opens their listings with type and status filters and a Remove button |
| `/orders` | `Orders.jsx` | Users list (buyers and sellers with order counts and completed value), searchable by name, `USR-` or `ORD-` ID; selecting one opens their orders with a status filter and a status dropdown |

Other files:

- `AuthContext.jsx`, `useAuth.js`, `authContextInstance.js` — auth state, the profile and `isAdmin`.
- `lib/usePaginatedCollection.js` — live listener with a growing `limit` (25 per page).
- `lib/filters.js` — `filterUsers`, `filterListings`, `filterOrders`, `filterBins`, `filterSellers`, `filterPeople`, `groupListingsBySeller`, `groupOrdersByUser`, `orderUsersAdminsFirst`.
- `lib/binTelemetry.js` — same parsing as the mobile app, plus `normalizeBins` and `summarizeBin` (live, fullest level, needs attention = FULL or overweight).
- `lib/shortId.js` — same ID rule as mobile, plus `matchesCode` for searching.
- `lib/userEdit.js` — `validateUserEdit`, with the same limits as the Firestore rules.
- `iotConfig.js` — IoT connection; mock data only in dev (`VITE_USE_MOCK_IOT` or a `use_mock_iot` localStorage flag).
- `pages/Layout.jsx` — sidebar, top bar, sign out.

Admin accounts are created **by hand** in the Firebase console (`role: "admin"`); sign-up cannot create one.

---

## 7. Firebase backend

Project `wast-pro`:

| Service | Details |
|---------|---------|
| Authentication | Email + password |
| Firestore | Rules in `mobile/firestore.rules`, indexes in `mobile/firestore.indexes.json`; both deployed |
| Storage | Profile photos |
| Functions | `mobile/functions` (not deployed; needs the Blaze plan and a Stripe key) |
| Hosting | Admin website from `admin/dist` |

Project `smartwastepro-1085e`: Realtime Database for the bin, anonymous sign-in.

Composite indexes:

| Collection | Fields |
|-----------|--------|
| `orders` | `sellerUid` ascending, `createdAt` descending |
| `orders` | `buyerUid` ascending, `createdAt` descending |
| `offers` | `buyerUid` ascending, `createdAt` descending |

---

## 8. Firestore data model

### `users/{uid}`
`fullName`, `email`, `role` (`seller` | `buyer` | `admin`), `createdAt`, `phone`, `location` (text),
`photoURL`, `points`, `updatedAt`, `disabled` (admin only), `binId` (admin only; which bin the seller
sees, default `bin001`), `binLocation { latitude, longitude }` and `binPlaceName` (set by the seller).

### `marketplace/{listingId}` — waste listings
`sellerUid`, `sellerName`, `wasteType` (`plastic` | `food` | `metal`), `weightKg`, `pricePerKg`,
`totalPrice`, `location { latitude, longitude }`, `status` (`available` | `sold`),
`soldOrderId` (set while sold; ties a cancel back to the order), `createdAt`.

### `orders/{orderId}`
`listingId`, `buyerUid`, `buyerName`, `sellerUid`, `sellerName`, `wasteType`, `weightKg`, `totalPrice`,
`paymentMethod` (`cash` | `card`), `paymentStatus` (`pending` | `paid`), `paymentLast4`,
`status` (`pending` → `confirmed` → `completed`, or `cancelled`), `location`, `createdAt`, `cancelledAt`,
`offerId` (set when created from an accepted offer), `awaitingBuyer` (true from the seller's accept
until the buyer buys or declines), `rating` (1–5, set once by the buyer after completion).

### `offers/{offerId}`
`listingId`, `buyerUid`, `buyerName`, `sellerUid`, `sellerName`, `wasteType`, `weightKg`, `askingPrice`,
`offeredPrice`, `status` (`pending` | `accepted` | `rejected` | `withdrawn`), `createdAt`, `updatedAt`.

### `notifications/{id}`
`toUid`, `type`, `message`, `read`, `createdAt`, plus `orderId` or `offerId` so the rules can verify the sender.
Types: `order_placed`, `order_cancelled`, `order_confirmed`, `order_completed`, `offer_received`,
`offer_accepted`, `offer_rejected`. (`bin_full` is still allowed by the rules but the app no longer
shows it: bin full and overweight appear on the dashboard instead.)

### `bins/{uid}`
Legacy per-seller document (owner read/write). Live readings come from the Realtime Database.

---

## 9. Security rules

`mobile/firestore.rules` is the main protection, because clients talk to Firestore directly.
Helper functions: `isSignedIn`, `isOwner`, `isAdmin`, `isOrderParty`, `isOfferParty`,
`isAcceptedOfferOrder`, `isDirectPurchaseOfListing`, `isBuyingListing`, `isRestoringListing`,
`isPositiveNumber`, `isValidNewListing`, `isValidListingEdit`, `isValidBinLocation`,
`isValidAdminProfileEdit`.

| Collection | Who may do what |
|-----------|-----------------|
| `users` | **Read:** owner or admin only (profiles are private). **Create:** owner, role must be seller or buyer, no `disabled` or `points`. **Update:** owner may change only `fullName`, `phone`, `location`, `photoURL`, `updatedAt`, `binLocation`, `binPlaceName` (valid coordinates, name up to 120 characters); admin may change only `disabled`, `binId` (1–32 letters, digits, `-`, `_`), `fullName` (1–80), `phone` (≤20), `location` (≤80), `points` (0–1,000,000), `updatedAt`. Nobody can change `role` or `email`. **Delete:** never. |
| `marketplace` | **Read:** any signed-in user. **Create:** the seller, with a valid listing (known type, weight ≤ 10,000 kg, price ≤ 10,000,000, starts `available`). **Update:** the seller (valid edit), or a buyer **only** as part of buying (available → sold, in the same batch that creates their order) or cancelling (sold → available, in the same batch that cancels that order). **Delete:** seller or admin. |
| `orders` | **Read:** buyer, seller or admin. **Create:** a buyer's direct purchase that matches the real listing (seller, price, still available), or a seller creating the order in the transaction that accepts an offer (must be `pending`, `awaitingBuyer: true`, price = offered price). **Update:** buyer cancels an unpaid order; buyer confirms an accepted-offer order (`awaitingBuyer` → false, status `confirmed`); buyer pays an accepted-offer order by card (payment fields only); seller moves the status forward or cancels, but only cancels while `awaitingBuyer` is true; seller marks a cash order paid; buyer rates a completed order once; admin changes `status` only. **Delete:** never. |
| `offers` | **Read:** buyer, seller, admin. **Create:** the buyer, `pending`, positive price, for a listing that is still available. **Update:** the seller accepts or rejects a pending offer (`status`, `updatedAt` only); admin. A buyer cannot withdraw a pending offer. **Delete:** never. |
| `notifications` | **Read:** recipient or admin. **Create:** required fields, unread, recipient exists, and the type decides who may send: `bin_full` only to yourself; `order_confirmed` / `order_completed` only from the order's seller; `order_placed` / `order_cancelled` only between the two parties of that order; offer types only between the two parties of that offer. **Update, delete:** recipient. |
| `bins` | Owner read/write; admin read. |

### Realtime Database (IoT project)
Currently `.read: true, .write: true` so the prototype works. The plan is to lock it (read for
signed-in users, no client writes) once the bin is verified, and to regenerate the old database secret.

---

## 10. IoT smart bin

- **Hardware:** ESP32; per compartment an ultrasonic sensor (fill level) and a load cell with HX711 (weight); LEDs, buzzer, buttons. Firmware is a PlatformIO project by the hardware partner (not in this repo).
- **Data shape** the firmware writes:

```
bins/bin001/
  lastUpdated            epoch time
  location               "Horizon Campus"   (text, not GPS)
  owner
  compartments/
    plastic/ { level: "EMPTY" | "50%" | "75%" | "FULL", weight: grams, overweight: boolean }
    food/    { ... }
    metal/   { ... }
```

- **Parsing:** `utils/binTelemetry.ts` (mobile) and `lib/binTelemetry.js` (admin) turn level text into a percentage and a status, grams into kg (`WEIGHT_UNIT_DIVISOR = 1000`), and work out freshness. Unknown level text becomes `ERROR`; negative weights become 0.
- **Bin ON / OFF:** ON if `lastUpdated` is within 2 minutes (`STALE_AFTER_MS`). When OFF the app shows the last readings and raises no new alerts.
- **Overweight:** the firmware sets `overweight: true` (at 150 g or more); the app only reads the flag and shows a warning.
- **Auth:** the apps sign in to the IoT project anonymously.
- **Linking a seller to a bin:** an admin sets `users/{uid}.binId`; the app reads `binId || 'bin001'`.
- **Bin location:** the firmware has no GPS. The seller types a company or place name on the dashboard and picks a suggestion; it is saved as `binLocation` and `binPlaceName`. The dashboard then moves the seller's available listings to that location (one batch). New listings use `binLocation`, or the phone's GPS when none is set.
- **Mock mode:** `EXPO_PUBLIC_USE_MOCK_IOT=true` (dev builds only) shows simulated data with Normal and Alert presets.

---

## 11. Cloud Functions and card payments

`mobile/functions/index.js` (v2 callable functions, secret `STRIPE_SECRET_KEY`):

- `createCheckoutSession({ amount, wasteType, listingId })` — creates a Stripe Checkout session in LKR and returns its URL. Success and cancel redirect to `mobile://payment-complete`.
- `verifyCheckoutSession({ sessionId })` — checks on the server that the session belongs to the caller and is paid; returns the card's last 4 digits.

The app opens the Checkout URL with `expo-web-browser`, then calls verify, then writes the order as
`confirmed` and `paid`. **Status: written but not deployed.** The demo uses cash on delivery.

---

## 12. Main user flows

### Seller
1. Sign up as seller, sign in.
2. Dashboard shows the three compartments live and a donut chart of weights. Set the bin location by searching a place name.
3. **Add Waste:** choose compartments and weights; fixed price per kg gives the total; one listing per type.
4. **Orders:** a purchase appears under Ongoing. **Confirm** or **Decline** (decline cancels the order and relists the waste in one batch), then **Mark completed** (a cash order is marked paid at hand-over). Each action notifies the buyer.
5. **Offers:** **Accept** runs a transaction: offer `accepted`, listing `sold`, order created as `pending` with `awaitingBuyer: true`; other pending offers on that listing are rejected. Or **Reject**.

### Buyer
1. Browse the marketplace (search, type filter, distance, road-route map).
2. **Buy Now** creates the order and marks the listing sold in one batch, or **Make an Offer**.
3. After the seller accepts an offer: **Buy** (order `confirmed`) or **Decline** (order cancelled, listing relisted).
4. **Orders** tabs: cancel an unpaid order (listing relisted); view the pickup map.
5. After completion, give 1–5 stars, once.
6. The bell shows notifications; tapping one opens the right screen.

### Admin
Sign in on the website, watch the bins, edit user details, assign bins, remove listings, change an order's status.

### Order state machine

```
direct purchase ─► pending ──seller confirm──► confirmed ──seller complete──► completed ──► rating
accepted offer  ─► pending (awaitingBuyer) ──buyer Buy──► confirmed
                       │                                      │
                       └── buyer cancel / decline, seller decline ──► cancelled (waste relisted)
```

---

## 13. Design system

`mobile/constants/design.ts` holds the tokens; screens use them instead of hard-coded values.

- **Colours:** brand green (`brand` 50–900, primary `#4F772D`), `ink` neutrals, page background `#F4F8F2`; waste accents — **plastic blue, food green, metal orange**; status tones (success, warning, danger, info, neutral); gold for ratings.
- **Type:** larger text scale (`h1` 30, `h2` 23, `h3` 20, `body` 18, `small` 16, `caption` 14, `metric` 26).
- **Layout:** `Space` (4–40), `Radius` (12–28, pill), three `Shadow` levels; light theme only; floating bottom navigation; bottom-sheet dialogs.
- **Keyboard:** `Screen keyboardAware` and `Sheet avoidKeyboard` keep inputs visible.
- **Accessibility:** text colours meet WCAG AA contrast (4.5:1), checked by `design.test.ts`.
- **Formatting:** prices to 2 decimals (`Rs 7.20`); bin weights up to 3 decimals; profile totals 2 decimals.

The admin site uses its own CSS with the same green brand.

---

## 14. External services

| Service | URL | Used for | If it fails |
|---------|-----|----------|-------------|
| Photon | `photon.komoot.io/api` | Place suggestions (Sri Lanka bounding box, 6 results, 450 ms typing pause) | An error line is shown under the search box |
| OSRM | `router.project-osrm.org` | Driving route, distance and time | Straight dashed line between the two points |
| Stripe Checkout | via Cloud Functions | Card payment (test mode) | Not deployed; cash on delivery is used |

---

## 15. Tests

| Suite | Tool | Count | What it covers |
|-------|------|-------|----------------|
| Mobile unit | Jest + jest-expo | 74 in 16 files | bin status and telemetry, distance, donut maths, money, order actions / tabs / notifications, notification routes, password-reset messages, place search and route parsing, short IDs, colour contrast, badge, password field |
| Admin unit | Vitest | 41 in 4 files | filters and grouping, telemetry parsing, short IDs, user-edit validation |
| Firestore rules | Firebase emulator + `@firebase/rules-unit-testing` | 127 | every collection: who can read/create/update/delete, buy and cancel atomicity, offers, validation, seller order actions, ratings, notification spoofing |

Rules tests live in `mobile/tests/rules/` (`offers`, `users-and-orders`, `listings`, `validation`,
`seller-orders`), run in sequence by `run.mjs` against project `demo-wastpro`. They need Java 21.

Last check for this document: Jest 74 of 74 passed and Vitest 41 of 41 passed. The rules suite was
not run again for this document (127 is the count from the last run).

---

## 16. CI

`.github/workflows/ci.yml` runs on pushes to `main`, `development`, `keshan-dev` and on pull requests
to `main` / `development`. Node 22, Ubuntu. Three jobs:

1. **admin** — `npm ci`, lint, test, build.
2. **mobile** — `npm ci`, lint, Jest (`--ci`).
3. **firestore-rules** — Java 21 (Temurin), `npm run test:rules` on the emulator.

---

## 17. Environment variables

Real values live in untracked `.env` files; `.env.example` shows the names.

**Mobile (`mobile/.env`)** — `EXPO_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`,
`_MESSAGING_SENDER_ID`, `_APP_ID`, `_MEASUREMENT_ID`; IoT: `EXPO_PUBLIC_IOT_FIREBASE_API_KEY`,
`_PROJECT_ID`, `_DATABASE_URL`; `EXPO_PUBLIC_USE_MOCK_IOT`.

**Admin (`admin/.env`)** — the same set with the `VITE_` prefix.

**Functions** — secret `STRIPE_SECRET_KEY`, set with `firebase functions:secrets:set`.

Never committed: `.env`, `serviceAccountKey.json`, `google-services.json`. No database secret is kept in the apps.

---

## 18. Commands

```bash
# Mobile (from mobile/)
npm install
npx expo start            # run in Expo Go
npx tsc --noEmit          # type-check
npx expo lint
npx jest
npm run test:rules        # Firestore rules on the emulator (needs Java 21)

# Admin (from admin/)
npm install
npm run dev               # http://localhost:5173
npm run lint
npm test                  # Vitest
npm run build

# Deploy
firebase deploy --only firestore:rules --project wast-pro     # from mobile/
firebase deploy --only firestore:indexes --project wast-pro   # from mobile/
firebase deploy --only hosting --project wast-pro             # from admin/, after npm run build
```

In Git Bash on Windows, prefix Firebase CLI commands that take document paths with `MSYS_NO_PATHCONV=1`.

---

## 19. Git workflow

`keshan-dev` (daily work) → `development` → `main`, by fast-forward once checked. CI runs on all
three. Remote: GitHub `Keshan-D-Adhikari/wast_pro`.

---

## 20. Known limitations and open items

- Card payment is built but not deployed; the demo uses cash on delivery. Payment status is written by the client (a real system would confirm it from a Stripe webhook).
- `firebaseConfig.web.js` does not export `functions`, so card payment would not work in the web build.
- The IoT Realtime Database rules are open until the bin is verified; then they should be locked and the old database secret regenerated.
- Weight unit (grams) and load-cell tare still need a check with a known weight.
- The seller's "Report an issue" form shows a confirmation but does not save anywhere.
- The profile editor shows an email field that is not saved.
- Login and Sign-up show errors as alerts, not as messages under the text boxes.
- The `offers` update rule lets an admin change any field.
- The admin site has no disable button, although the rules and the Login screen support `disabled`.
- An admin who signs in to the mobile app is sent to the buyer screens.
- The pickup route uses the free OSRM public server (light use only, no live traffic).
- One bin per seller; a listing is a single lot (no partial quantity).
- No email verification, App Check or rate limiting.
- The APK is built without a Google Maps API key, so maps show a placeholder in the installed app (they work in Expo Go).
- The firmware project is not in the repository yet.
- Tests cover logic, rules and two components; there are no end-to-end screen tests or Cloud Function tests.
- The admin site has no CSV/PDF export.

---

## 21. Deeper analysis: how the code behaves

These points come from reading every screen and the rules line by line. They are observations about
the current code, not changes.

### 21.1 Where each piece of data is read and written

| Screen | Reads | Writes |
|--------|-------|--------|
| Login | `users/{uid}` once | none (Auth sign-in, reset email) |
| CreateAccount | none | `users/{uid}` (`fullName`, `email`, `role`, `createdAt` as ISO text) |
| SellerDashboard | `users/{uid}` live; `notifications` where `toUid` live; RTDB `bins/{binId}` live | `users/{uid}.binLocation`, `binPlaceName`; batch update of own available listings' `location`; `notifications.read` |
| AddWaste | `users/{uid}` once; RTDB `bins/{binId}` live; phone GPS | `marketplace` (one `addDoc` per type) |
| SellerOrders | `orders` where `sellerUid`, newest first, live | `orders.status`, `paymentStatus`; decline batch (order + listing); `notifications` |
| SellerOffers | `offers` where `sellerUid` live | accept transaction (offer, listing, new order); other offers rejected; `notifications` |
| SellerProfile | `users/{uid}` once; completed `orders` once | none (sign out) |
| BuyerDashboard | `marketplace` where `status == available` live; phone GPS; OSRM | buy batch (new order + listing sold); `offers`; `notifications` |
| BuyerOrders | `orders` where `buyerUid`, newest first, live | cancel batch (order + listing); card payment fields; `rating`; `notifications` |
| BuyerOffers | `offers` where `buyerUid` live; `orders` where `buyerUid` live | order `confirmed` + `awaitingBuyer: false`; decline batch; `notifications` |
| BuyerProfile | `users/{uid}` once; own `orders` once | none (sign out) |
| Profile editor | `users/{uid}` once | `fullName`, `phone`, `location`, `updatedAt`; `photoURL`; Storage upload |
| Admin Overview | count queries on `users`, `marketplace`, `orders`; up to 500 completed orders | none |
| Admin Bins | RTDB `bins` and `bins/{id}` live | none |
| Admin Users | `users` paginated live; admins live | `fullName`, `phone`, `location`, `points`, `updatedAt`; `binId` |
| Admin Marketplace | up to 500 listings live; one seller's listings live | `deleteDoc` on a listing |
| Admin Orders | up to 500 orders live; one user's orders (buyer OR seller) live | `orders.status` |

### 21.2 What is atomic and what is not

- **Atomic:** direct purchase (order + listing sold, `writeBatch`); buyer cancel, buyer decline and seller decline (order cancelled + listing relisted, `writeBatch`); offer accept (offer + listing + order, `runTransaction`).
- **Not atomic:** notifications are written after the batch or transaction. In the buyer's purchase and offer flows a failed notification shows an error alert although the order or offer was saved. In the seller's order actions a failed notification is only logged.
- **Not atomic:** after accepting an offer, the other pending offers on that listing are rejected one by one, each with its own notification.
- **Not atomic:** completing a cash order is two updates (`paymentStatus: paid`, then `status: completed`), because the rules allow each change only on its own.

### 21.3 Behaviour that is easy to miss

- A relist only happens when the listing's `soldOrderId` equals the order being cancelled, so an old order can never relist a listing that was sold again.
- An accepted-offer order is created with `paymentMethod: 'cash'`; after the buyer taps Buy it can be paid by card from My Purchases (when Functions are deployed) or in cash at hand-over.
- A card purchase from the marketplace is saved as `confirmed` and `paid` at once; a cash purchase is `pending` and unpaid.
- In My Purchases the Cancel button shows only for `pending` orders; the rules would also allow cancelling a `confirmed` unpaid order.
- The road route (OSRM) is drawn on the marketplace map only. The My Purchases map draws a straight dashed line.
- Marketplace search matches the waste type text only, not the seller name.
- Maps fall back to Colombo (6.9271, 79.8612) when there is no location.
- Moisture is shown only in mock mode: the mock data has `moisture`, but `normalizeBin` does not carry it from real firmware data, and the firmware does not send it.
- Mock data uses the older shape (numeric level, weight already in kg, a `status` field) and is used directly, without `normalizeBin`.
- Reward points are displayed on the seller dashboard and can be edited by an admin; no code awards them automatically.
- The seller dashboard has its own notifications sheet (it hides `bin_full`); buyers use the shared `NotificationBell`. Opening either marks all unread notifications as read.
- Buyer "total spent" counts every order that is not cancelled; seller "earned" counts completed orders only.
- Admin Users search keeps loading further pages while a search term is typed, so the search covers all users.
- Admin "Remove listing" asks for confirmation; the admin status dropdown changes `status` only and does not relist the waste.

### 21.4 Rule observations

The rules block the main abuse cases (changing a price, buying a sold listing, reading another
user's profile, spoofing a notification, making yourself an admin). A careful reader will also see
these gaps, all reachable only by a signed-in user who bypasses the app:

- The order **create** rule checks the listing's seller, price and availability, but not the new order's `status`, `paymentStatus`, `weightKg` or `wasteType`, and it does not require the listing to be marked sold in the same batch (that link is enforced on the listing side only).
- The seller's status rule allows any of `confirmed`, `completed`, `cancelled` from any state that is not `cancelled`, so the order of steps (pending, then confirmed, then completed) is kept by the app, not by the rules.
- A seller cancelling through the rules is not forced to relist the listing; the app does it in the same batch.
- Offers have no upper price limit, and one buyer may send several offers for the same listing.
- An admin may update any field of an offer, and may set any order status.
- Payment fields are trusted from the client until a Stripe webhook is added.
