Here are the required code segments extracted directly from the current implementation on the `keshan-dev` branch.

## CODE SEGMENT 5.8

`mobile/app/(tabs)/CreateAccount.tsx`
```javascript
      // 2.Creating a User via Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Saving additional user details in the Firestore Database
      await setDoc(doc(db, "users", user.uid), {
        fullName: name,
        email: email,
        role: role,
        createdAt: new Date().toISOString(),
      });
```
Purpose: Demonstrates creating a new user account through Firebase Auth and storing the chosen role within a dedicated Firestore user document.

`mobile/app/(tabs)/CreateAccount.tsx`
```javascript
      // 4. Sending to the relevant Dashboard according to the role
      if (role === 'seller') {
        router.replace('/(tabs)/seller/SellerDashboard');
      } else {
        router.replace('/(tabs)/buyer/BuyerDashboard');
      }
```
Purpose: Directs the newly registered user to the appropriate navigation route based on their selected role.

`mobile/app/(tabs)/Login.tsx`
```javascript
      // 1. Login via Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Reading this User's Role (Seller/Buyer) from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;

        // 3. Sending to the relevant Dashboard according to the role
        if (userRole === 'seller') {
          router.replace('/(tabs)/seller/SellerDashboard');
        } else {
          router.replace('/(tabs)/buyer/BuyerDashboard');
        }
      }
```
Purpose: Retrieves the user's role from Firestore during sign-in and conditionally navigates them to the correct role-specific dashboard.

## CODE SEGMENT 5.9

`mobile/app/(tabs)/seller/SellerDashboard.tsx`
```javascript
    // 2. Sensor data (Fill Level, Weight, Moisture)
    const binNodeRef = dbRef(iotDb, `bins/${BIN_ID}`);
    const unsubscribeBins = onValue(binNodeRef, (snapshot) => {
      if (snapshot.exists()) {
        setBinData(snapshot.val() as BinData);
      }
      setLoading(false);
    });
```
Purpose: Listens to live smart bin sensor data from the separate IoT Realtime Database.

`mobile/app/(tabs)/seller/SellerDashboard.tsx`
```javascript
    const checkAndNotify = async (
      type: WasteType,
      status: string | undefined,
      overweight: boolean | undefined
    ) => {
      const shouldAlert = isBinFull(status) || !!overweight;

      if (shouldAlert && !notifiedBinsRef.current.includes(type)) {
        try {
          const reason = overweight ? 'is overweight' : 'is full';
          await addDoc(collection(db, "notifications"), {
            toUid: user.uid,
            type: "bin_full",
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} bin ${reason}`,
            read: false,
            createdAt: serverTimestamp(),
          });
          notifiedBinsRef.current = [...notifiedBinsRef.current, type];
        } catch (error) {
          console.error("Error sending bin notification:", error);
        }
      } 
    };
```
Purpose: Evaluates the firmware-reported bin statuses to trigger full or overweight alert notifications.

`mobile/app/(tabs)/seller/AddWaste.tsx`
```javascript
  const handleWeightChange = (type: WasteType, value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const price = priceConfig[type].pricePerKg;
    const total = parseFloat(cleaned) * price;

    setWasteItems(prev => ({
      ...prev,
      [type]: {
        weight: cleaned,
        total: isNaN(total) ? 0 : total,
        selected: cleaned.length > 0
      }
    }));
  };
```
Purpose: Calculates the marketplace price dynamically based on the waste type and seller-entered weight.

`mobile/app/(tabs)/seller/AddWaste.tsx`
```javascript
    // Validation check for all selected items against the weight
    // currently measured in each bin compartment
    for (const [type, item] of selectedItems) {
      const maxWeight = availableKg(type);
      if (parseFloat(item.weight) > maxWeight) {
        Alert.alert(
          'Error',
          `Capacity exceeded for ${priceConfig[type].label}. Available in bin: ${maxWeight} kg`
        );
        return;
      }
    }
```
Purpose: Validates that the seller does not list more waste than is physically detected by the bin sensors.

`mobile/app/(tabs)/seller/AddWaste.tsx`
```javascript
      const listingLocation = {
        latitude: sellerBinLocation.latitude,
        longitude: sellerBinLocation.longitude,
      };

      for (const [type, item] of selectedItems) {
        await addDoc(collection(db, 'marketplace'), {
          sellerUid: auth.currentUser!.uid,
          sellerName: sellerName || "Unknown Seller",
          wasteType: type,
          weightKg: parseFloat(item.weight),
          pricePerKg: priceConfig[type].pricePerKg,
          totalPrice: item.total,
          status: 'available',
          location: listingLocation,
          createdAt: serverTimestamp()
        });
      }
```
Purpose: Creates individual marketplace listings in Firestore containing the captured location and calculated prices.

## CODE SEGMENT 5.10

`mobile/app/(tabs)/buyer/BuyerDashboard.tsx`
```javascript
      const q = query(collection(db, "marketplace"), where("status", "==", "available"));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const itemList = snapshot.docs.map(doc => {
          const data = doc.data() as Omit<MarketplaceItem, 'id'>;
          return { id: doc.id, ...data } as MarketplaceItem;
        });
        setItems(itemList);
        setLoading(false);
      });
```
Purpose: Retrieves all available waste listings from the marketplace in real time.

`mobile/app/(tabs)/buyer/BuyerDashboard.tsx`
```javascript
  const filteredItems = items.filter(item => {
    const type = (item.wasteType || '').toLowerCase();
    const matchesFilter = typeFilter === 'all' || type === typeFilter;
    const matchesSearch = type.includes(searchText.toLowerCase());
    return matchesFilter && matchesSearch;
  });
```
Purpose: Applies text search and waste-type filters locally to the fetched marketplace items.

`mobile/app/(tabs)/buyer/BuyerDashboard.tsx`
```javascript
  const getDistance = (sellerLoc: { latitude: number; longitude: number }) => {
    if (!userLocation || !sellerLoc) return "N/A";
    return calculateDistance(
      userLocation.latitude, userLocation.longitude,
      sellerLoc.latitude, sellerLoc.longitude
    ).toFixed(1);
  };
```
Purpose: Calculates the geographic distance between the buyer and the seller's bin.

`mobile/app/(tabs)/buyer/BuyerDashboard.tsx`
```javascript
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const { data } = await createCheckoutSession({
        amount: buyingItem.totalPrice,
        wasteType: buyingItem.wasteType,
        listingId: buyingItem.id,
      }) as { data: { url: string; sessionId: string } };

      const redirectUrl = Linking.createURL('payment-complete');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
```
Purpose: Calls the Firebase Cloud Function to initiate a secure Stripe Checkout session and opens it via an in-app browser.

`mobile/app/(tabs)/buyer/BuyerDashboard.tsx`
```javascript
      const verifyCheckoutSession = httpsCallable(functions, 'verifyCheckoutSession');
      const { data: verification } = await verifyCheckoutSession({
        sessionId: queryParams.session_id,
      }) as { data: { paid: boolean; last4: string | null } };

      if (!verification.paid) {
        Alert.alert('Payment not confirmed', 'Please try again.');
        return;
      }
```
Purpose: Verifies the payment outcome server-side before officially confirming the buyer's order in the app.

`mobile/app/(tabs)/buyer/BuyerOrders.tsx`
```javascript
              // Mark cancelled rather than deleting the order doc
              await updateDoc(
                doc(db, 'orders', order.id), {
                status: 'cancelled',
                cancelledAt: serverTimestamp(),
              });

              // Restore listing to marketplace
              if (order.listingId) {
                await updateDoc(
                  doc(db, 'marketplace',
                    order.listingId), {
                  status: 'available'
                });
              }

              // Notify seller
              await addDoc(
                collection(db, 'notifications'), {
                toUid: order.sellerUid,
                type: 'order_cancelled',
                message: (order.buyerName || 'Buyer')
                  + ' cancelled the order for '
                  + order.wasteType + ' waste.',
                read: false,
                createdAt: serverTimestamp(),
                orderId: order.id,
              });
```
Purpose: Cancels an existing order, automatically restores the item to the marketplace, and dispatches a notification to the seller.

## CODE SEGMENT 5.11

`mobile/firebaseConfig.js`
```javascript
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
```
Purpose: Initializes the main Firebase project and sets up core services (Auth, Firestore, Storage, Functions) with persistent state support for React Native.

`mobile/iotConfig.js`
```javascript
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const iotApp = getApps().find(app => app.name === 'iot')
  ?? initializeApp(iotFirebaseConfig, 'iot');

export const iotDb = getDatabase(iotApp);

const iotAuth = getAuth(iotApp);
signInAnonymously(iotAuth).catch(error => {
  console.warn('IoT project anonymous sign-in failed:', error);
});
```
Purpose: Configures the separate IoT Firebase project and explicitly performs an anonymous sign-in to securely read the Realtime Database.
