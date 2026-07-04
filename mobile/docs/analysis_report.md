# SmartWaste Pro — Full Application Analysis Report

**Project**: SmartWaste Pro  
**Author**: Keshan D. Adhikari  
**Date**: 2026-07-05
**Version**: 2.0 (Updated)

---

## 1. Project Overview
- **What the app does**: SmartWaste Pro is an IoT-integrated mobile platform that connects waste producers (Sellers) with recyclers (Buyers). It allows sellers to monitor their smart bins in real-time, auto-list full bins to a marketplace, and allows buyers to purchase the waste and view pickup locations via map integration.
- **Two user types**: 
  - **Seller**: Monitors smart bin levels (Plastic, Food, Metal), lists waste on the marketplace, and tracks earnings.
  - **Buyer**: Browses available waste in the marketplace, purchases it (via Card or Cash on Delivery), and picks it up using map routing.
- **Technology stack summary**: React Native (Expo), TypeScript, Firebase (Auth, Firestore, Storage), React Navigation, Expo Location, React Native Maps.
- **Current development status**: Core functionality (auth, dashboards, marketplace, orders, maps, notifications) is implemented with mock/simulated IoT data. Hardcoded data exists for sensor inputs, pending actual ESP32 hardware integration.

---

## 2. Architecture & Directory Structure
Based on the current filesystem:

```
mobile/
├── .expo/
├── .vscode/
├── app/
│   ├── (tabs)/
│   │   ├── buyer/
│   │   │   ├── BuyerDashboard.tsx
│   │   │   ├── BuyerOrders.tsx
│   │   │   ├── BuyerProfile.tsx
│   │   │   └── EditProfile.tsx
│   │   ├── seller/
│   │   │   ├── AddWaste.tsx
│   │   │   ├── EditProfile.tsx
│   │   │   ├── SellerDashboard.tsx
│   │   │   ├── SellerOrders.tsx
│   │   │   └── SellerProfile.tsx
│   │   ├── CreateAccount.tsx
│   │   ├── Login.tsx
│   │   ├── Welcome.tsx
│   │   ├── _layout.tsx
│   │   └── index.tsx (Splash Screen)
│   └── _layout.tsx
├── assets/
├── backend/
├── components/
├── constants/
├── hooks/
├── node_modules/
├── scripts/
│   ├── reset-project.js
│   └── seedMockData.js
├── services/
├── app.json
├── eslint.config.js
├── expo-env.d.ts
├── firebaseConfig.js
├── package-lock.json
├── package.json
├── tsconfig.json
└── types.ts
```

---

## 3. Technology Stack Analysis
Based on `package.json`:

- **Framework**: React (`19.1.0`), React Native (`0.81.5`), Expo (`~54.0.35`)
- **Navigation**: `expo-router` (`~6.0.24`), `@react-navigation/bottom-tabs` (`^7.4.0`), `@react-navigation/native` (`^7.1.8`)
- **Firebase**: `firebase` (`^12.11.0`)
- **Maps**: `react-native-maps` (`1.20.1`)
- **UI components**: `@expo/vector-icons` (`^15.0.3`), `expo-image` (`~3.0.11`), `react-native-chart-kit` (`^6.12.0`), `react-native-safe-area-context` (`~5.6.0`)
- **Location**: `expo-location` (`~19.0.8`)
- **Storage/Persistence**: `@react-native-async-storage/async-storage` (`2.2.0`), `expo-image-picker` (`~17.0.11`)

---

## 4. Screen-by-Screen Analysis

### Splash Screen (`index.tsx`)
- **Features**: Displays logo and app name, auto-redirects after 2 seconds.
- **State variables**: None (uses `setTimeout`).
- **Functions**: `useEffect` timer.

### Welcome Screen (`Welcome.tsx`)
- **Features**: Landing page with background image, title, subtitle, and a "Get Started" button routing to Login.
- **State variables**: None.

### Login Screen (`Login.tsx`)
- **Features**: Email/password authentication, role-based routing (Buyer vs. Seller).
- **Firebase integration**: `signInWithEmailAndPassword` (Auth), `getDoc(doc(db, "users", uid))` (Firestore).
- **State variables**: `email`, `password`, `loading`.
- **Functions**: `handleLogin`.

### Create Account (`CreateAccount.tsx`)
- **Features**: Registration with Name, Email, Password, and Role selection.
- **Firebase integration**: `createUserWithEmailAndPassword` (Auth), `setDoc(doc(db, "users", uid))` (Firestore).
- **State variables**: `loading`, `role`, `name`, `email`, `password`, `confirmPassword`.
- **Functions**: `handleContinue`.

### Seller Screens:

#### `SellerDashboard.tsx`
- **Features**: Real-time IoT bin monitoring (Plastic, Food, Metal), auto-notification generation at 80% capacity, pie chart analytics, bin location map, issue reporting, notification viewer, unread badge.
- **Firebase integration**: `users` (reads profile), `bins` (reads real-time levels), `notifications` (reads real-time, writes bin full alerts, updates `read` status).
- **State variables**: `loading`, `reportModalVisible`, `issueDescription`, `sellerData`, `binData`, `unreadCount`, `notifications`, `notifModalVisible`, `notifiedBins`.
- **Functions**: `checkAndNotify`, `handleReportSubmit`, `markAllAsRead`.

#### `AddWaste.tsx`
- **Features**: Lists waste to marketplace, waste type cards (Plastic, Food, Metal), auto price calculation based on weight, bin capacity validation, order summary card.
- **Firebase integration**: `users` (reads name), `bins` (reads bin capacity/location), `marketplace` (adds new listing).
- **State variables**: `loading`, `binData`, `sellerName`, `sellerBinLocation`, `wasteItems` (weights, totals, selections).
- **Functions**: `handleWeightChange`, `handleSubmit`.

#### `SellerOrders.tsx`
- **Features**: View received orders sorted by date, payment badges, status indicators.
- **Firebase integration**: `orders` (reads real-time where `sellerUid` == current user).
- **State variables**: `orders`, `loading`.
- **Functions**: Firestore snapshot listener.

#### `SellerProfile.tsx`
- **Features**: View profile info, stats (total earned, waste sold), environmental impact calculator (trees, CO2, energy).
- **Firebase integration**: `users` (reads profile), `orders` (reads completed orders for stats).
- **State variables**: `loading`, `userData`, `stats` (totalEarned, totalWeight).
- **Functions**: `handleLogout`, `fetchProfileData`.

#### `EditProfile.tsx` (Seller)
- **Features**: Edit name, phone, location, upload profile photo to Firebase Storage.
- **Firebase integration**: `users` (reads/updates profile), Firebase Storage (uploads image).
- **State variables**: `name`, `email`, `phone`, `location`, `loading`, `uploading`, `photoURL`.
- **Functions**: `handlePickImage`, `uploadImage`, `handleSave`.

### Buyer Screens:

#### `BuyerDashboard.tsx`
- **Features**: Searchable marketplace listings, Haversine distance calculation, Map modal showing straight-line route from buyer to seller, Payment modal (Cash or Card).
- **Firebase integration**: `marketplace` (reads real-time available listings, updates to `sold`), `users` (reads buyer info), `orders` (creates new order), `notifications` (creates order notification for seller).
- **State variables**: `loading`, `items`, `filteredItems`, `searchText`, `userLocation`, `selectedItem`, `buyingItem`, `purchaseLoading`, `mapModalVisible`, `paymentModalVisible`, `paymentMethod`, `cardDetails`, `routeDistance`.
- **Functions**: `calculateDistance`, `getDistance`, `handleBuyNow`, `confirmPurchase`, `handleCardPayment`, `handleConfirmOrder`.

#### `BuyerOrders.tsx`
- **Features**: View placed orders, Cancel order (removes doc, restores marketplace listing, notifies seller), View Map location modal showing route. Payment status badges.
- **Firebase integration**: `orders` (reads real-time, deletes on cancel), `marketplace` (updates status back to `available`), `notifications` (creates cancel notification).
- **State variables**: `orders`, `loading`, `orderMapVisible`, `buyerLocation`, `sellerLocation`, `selectedOrder`, `routeDistance`.
- **Functions**: `calculateDistance`, `handleCancelOrder`, `handleOrderMap`.

#### `BuyerProfile.tsx`
- **Features**: View profile info, purchase stats.
- **Firebase integration**: `users` (reads profile), `orders` (reads stats).
- **State variables**: `loading`, `userData`, `stats` (totalPurchases, totalWeight).
- **Functions**: `handleLogout`, `fetchProfileData`.

#### `EditProfile.tsx` (Buyer)
- **Features**: Edit company/name, phone, location, profile photo upload.
- **Firebase integration**: `users` (reads/updates profile), Firebase Storage.
- **State variables**: `name`, `email`, `phone`, `location`, `loading`, `uploading`, `photoURL`.
- **Functions**: `handlePickImage`, `uploadImage`, `handleSave`.

---

## 5. Firebase Integration Assessment

### Collections Currently Used:
1. **users**:
   - **Fields**: `fullName`, `email`, `role`, `phone`, `location`, `photoURL`, `createdAt`, `updatedAt`, `points`.
   - **Readers**: Seller/Buyer Dashboard, Profile, Edit Profile, Marketplace creation.
   - **Writers**: Registration, Edit Profile.
   - **Fetch**: Real-time (`onSnapshot` in Dashboard) & One-time (`getDoc` in Profile/Checkout).

2. **bins**:
   - **Fields**: `plastic` (level), `plasticWeight`, `food` (level, moisture), `foodWeight`, `metal` (level), `metalWeight`, `location`.
   - **Readers**: Seller Dashboard, AddWaste.
   - **Writers**: Currently manual/mock data (hardware missing).
   - **Fetch**: Real-time (`onSnapshot`).

3. **marketplace**:
   - **Fields**: `sellerUid`, `sellerName`, `wasteType`, `weightKg`, `pricePerKg`, `totalPrice`, `status`, `location`, `createdAt`.
   - **Readers**: Buyer Dashboard.
   - **Writers**: Seller AddWaste (creates), Buyer Dashboard (updates to `sold`), Buyer Orders (restores to `available`).
   - **Fetch**: Real-time (`onSnapshot`).

4. **orders**:
   - **Fields**: `listingId`, `buyerUid`, `buyerName`, `sellerUid`, `sellerName`, `wasteType`, `weightKg`, `totalPrice`, `paymentMethod`, `paymentStatus`, `paymentLast4`, `status`, `location`, `createdAt`.
   - **Readers**: Seller Orders, Buyer Orders, Profiles (for stats).
   - **Writers**: Buyer Dashboard (creates), Buyer Orders (deletes on cancel).
   - **Fetch**: Real-time (`onSnapshot`).

5. **notifications**:
   - **Fields**: `toUid`, `type` (`bin_full`, `order_placed`, `order_cancelled`), `message`, `read`, `createdAt`.
   - **Readers**: Seller Dashboard.
   - **Writers**: Seller Dashboard (auto bin alerts), Buyer Dashboard (order placed), Buyer Orders (order cancelled).
   - **Fetch**: Real-time (`onSnapshot`).

### What is Connected:
- Authentication (Email/Password)
- Firestore Database (all collections functioning as structured)
- Firebase Storage (Profile photos)
- AsyncStorage for auth persistence

### What is NOT Connected:
- Real ESP32 IoT sensor data (Bins collection is currently relying on mock database data)
- Actual Payment Gateway processing (Stripe/PayHere is simulated)

---

## 6. Key Features Implemented

### Auto Listing Feature
- Not directly automated in the current code. The user prompt mentioned "auto list at 70%", but `SellerDashboard.tsx` checks for `> 80%` to send a *notification*. The actual listing is done manually in `AddWaste.tsx` via user interaction, although bin capacity validations exist.

### Payment System
- **Cash on Delivery flow**: Simulated in BuyerDashboard. Status set to pending payment.
- **Card Payment flow**: UI implemented in BuyerDashboard. Validates 16-digit card and 3-digit CVV, extracts last 4 digits.
- **Payment badges in orders**: Displayed correctly in `BuyerOrders.tsx` and `SellerOrders.tsx` showing "Paid" or "Cash on Delivery".

### Order Management
- **Place order flow**: Handled in `BuyerDashboard.tsx` with modal.
- **Cancel order flow (`deleteDoc`)**: Implemented in `BuyerOrders.tsx` (`deleteDoc(doc(db, 'orders', order.id))`).
- **Listing restored on cancel**: Implemented. Updates marketplace status back to `available`.
- **Seller notification on cancel**: Implemented.

### Notification System
- **Bin full alerts**: Implemented in `SellerDashboard.tsx` using an effect checking if level `> 80`.
- **Order placed/cancelled notifications**: Handled at the respective action points.
- **Mark as read / mark all read**: Implemented in `SellerDashboard.tsx` via `updateDoc`.

### Map & Location
- **Buyer current GPS location**: Fetched using `expo-location`.
- **Seller bin location marker**: Displayed accurately.
- **Polyline distance line**: Drawn on map using `react-native-maps`.
- **Haversine distance calculation**: Implemented via custom `calculateDistance` function.

---

## 7. Code Quality Assessment

### Strengths
- Good componentization and folder structure following Expo Router paradigms.
- Solid real-time database usage with `onSnapshot` and cleanup functions.
- Attractive and responsive UI with functional modals and clear states.
- Clean use of contextual alerts and activity indicators for async actions.

### Weaknesses  
- Frequent use of `any` type in TypeScript (e.g., `(err: any)`, `wasteItems: any`, `[key: string]: any`), bypassing strong typing.
- Routing utilizes `as any` (e.g., `router.replace('/(tabs)/seller/SellerDashboard' as any)`), which breaks Expo Router's type safety.
- Hardcoded base coordinates (e.g., Colombo `6.9271`, `79.8612`) used as fallbacks.
- Some logic duplication (e.g., `calculateDistance` exists in both BuyerDashboard and BuyerOrders).

---

## 8. Firebase Collections Schema

### `users` collection
```json
{
  "fullName": "String",
  "email": "String",
  "role": "String (seller|buyer)",
  "phone": "String",
  "location": "String",
  "photoURL": "String",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp",
  "points": "Number"
}
```

### `bins` collection
```json
{
  "plastic": { "level": "Number", "weight": "Number" },
  "food": { "level": "Number", "weight": "Number", "moisture": "Number" },
  "metal": { "level": "Number", "weight": "Number" },
  "plasticWeight": "Number",
  "foodWeight": "Number",
  "metalWeight": "Number",
  "location": { "latitude": "Number", "longitude": "Number" }
}
```

### `marketplace` collection
```json
{
  "sellerUid": "String",
  "sellerName": "String",
  "wasteType": "String",
  "weightKg": "Number",
  "pricePerKg": "Number",
  "totalPrice": "Number",
  "status": "String (available|sold)",
  "location": { "latitude": "Number", "longitude": "Number" },
  "createdAt": "Timestamp"
}
```

### `orders` collection
```json
{
  "listingId": "String",
  "buyerUid": "String",
  "buyerName": "String",
  "sellerUid": "String",
  "sellerName": "String",
  "wasteType": "String",
  "weightKg": "Number",
  "totalPrice": "Number",
  "paymentMethod": "String (cash|card)",
  "paymentStatus": "String (pending|paid)",
  "paymentLast4": "String | null",
  "status": "String (pending|confirmed|completed|cancelled)",
  "location": { "latitude": "Number", "longitude": "Number" },
  "createdAt": "Timestamp",
  "cancelledAt": "Timestamp | null"
}
```

### `notifications` collection
```json
{
  "toUid": "String",
  "type": "String (bin_full|order_placed|order_cancelled)",
  "message": "String",
  "read": "Boolean",
  "createdAt": "Timestamp"
}
```

---

## 9. Recent Changes Log

Based on the prompt and current code structure, the following changes were verified:

1. **BuyerOrders.tsx changes**:
   - Added `deleteDoc` for cancel order logic.
   - Added `Polyline` map for pickup routes.
   - Added detailed payment badges (Cash vs Card).
2. **BuyerDashboard.tsx changes**:
   - Added comprehensive payment modal.
   - Added map modal with routing.
   - Added Haversine distance formula implementation.
3. **SellerDashboard.tsx changes**:
   - Added notification bell and unread tracker.
   - Added bin alert logic for `> 80%` capacity.
   - Added earnings and environmental impact UI.
4. **AddWaste.tsx changes**:
   - Dynamic waste type cards (Plastic, Food, Metal).
   - Auto price calculation (`pricePerKg * weight`).
   - Individual weight inputs with capacity validations.
   - Price summary card.
5. **firebaseConfig.js changes**:
   - Added `AsyncStorage` persistence for `initializeAuth`.

---

## 10. Recommendations

### Critical (Still needed)
- **ESP32 hardware connection**: Connect real sensors to update the `bins` collection.
- **Firestore Security Rules**: Currently missing; needed to restrict user data read/writes.
- **Type Safety**: Remove `as any` from `expo-router` calls and properly define interfaces for state objects.

### Important
- **Image optimization**: Consider compressing profile photos before Firebase Storage upload.
- **Shared Utilities**: Move `calculateDistance` to a shared `/scripts` or `/utils` folder to prevent code duplication.
- **Admin panel development**: Necessary for managing user disputes and platform metrics.

### Nice to Have
- **Push notifications**: Migrate in-app Firestore notifications to Expo Push Notifications.
- **Real Payment Gateway**: Integrate Stripe or PayHere for actual transactions instead of simulation.
- **Unit tests**: Implement Jest tests for core logic (e.g., price calculation, haversine distance).

---

## 11. Summary Scorecard

| Category | Score | Notes |
|----------|-------|-------|
| UI/UX Design | ⭐⭐⭐⭐ | Clean, responsive, and uses modals well. Good color palette. |
| Firebase Integration | ⭐⭐⭐⭐ | Comprehensive use of Auth, Firestore real-time listeners, and Storage. |
| Code Quality | ⭐⭐⭐ | Good structure, but heavy reliance on TypeScript `any` type reduces robustness. |
| Feature Completeness | ⭐⭐⭐⭐ | Meets majority of core requirements (Market, Maps, Orders). |
| Security | ⭐⭐ | Lacks Firestore rules; client-side validations exist but server-side needed. |
| Performance | ⭐⭐⭐ | Real-time listeners are cleaned up properly, but map rendering could be optimized. |
| **Overall** | ⭐⭐⭐½ | A very solid foundation. Needs hardware integration and typing polish. |

---
