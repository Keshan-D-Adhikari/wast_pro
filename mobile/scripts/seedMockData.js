const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
// Make sure to place your serviceAccountKey.json in the same directory as this script
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Real UIDs from the project
const REAL_SELLER_UID = "AiRDgNw5LpaJma1RWpz6tLTpw872";
const REAL_BUYER_UID = "g4jKaCNEn0NOkZ1pQ2MOC4v7Ynt2";

async function deleteCollection(collectionPath) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();
  
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Cleared collection: ${collectionPath}`);
}

const seedData = async () => {
  try {
    console.log('--- Starting Seeding Process ---');

    // 0. CLEAR OLD DATA
    console.log('Clearing old collections...');
    await deleteCollection('marketplace');
    await deleteCollection('orders');
    await deleteCollection('bins');
    await deleteCollection('notifications');
    // Note: Not deleting 'users' to avoid losing auth profile links if already existing, 
    // but the script will overwrite them by UID anyway.

    const now = admin.firestore.Timestamp.now();
    const getPastDate = (daysAgo) => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return admin.firestore.Timestamp.fromDate(date);
    };
    const getFutureDate = (daysAhead) => {
      const date = new Date();
      date.setDate(date.getDate() + daysAhead);
      return admin.firestore.Timestamp.fromDate(date);
    };

    // 1. SEED USERS
    const users = [
      {
        uid: REAL_SELLER_UID,
        fullName: "Keshan Adhikari",
        email: "keshan@gmail.com",
        role: "seller",
        phone: "071-3256156",
        location: "Colombo 05, Sri Lanka",
        totalEarned: 0,
        totalKgSold: 0,
        createdAt: now
      },
      {
        uid: "seller_002",
        fullName: "Nuwan Perera",
        email: "nuwan@gmail.com",
        role: "seller",
        phone: "077-1234567",
        location: "Nugegoda, Sri Lanka",
        totalEarned: 0,
        totalKgSold: 0,
        createdAt: now
      },
      {
        uid: REAL_BUYER_UID,
        fullName: "Green Recycling Lanka",
        email: "green@recycling.lk",
        role: "buyer",
        phone: "011-2345678",
        location: "Dehiwala, Sri Lanka",
        createdAt: now
      },
      {
        uid: "buyer_002",
        fullName: "Eco Lanka Pvt Ltd",
        email: "eco@lanka.lk",
        role: "buyer",
        phone: "011-9876543",
        location: "Maharagama, Sri Lanka",
        createdAt: now
      }
    ];

    console.log('Seeding users...');
    for (const user of users) {
      await db.collection('users').doc(user.uid).set(user);
    }

    // 2. SEED BINS (nested structure matches SellerDashboard state shape)
    const bins = [
      {
        id: REAL_SELLER_UID, // Use REAL_SELLER_UID as doc ID for dashboard loading
        sellerUid: REAL_SELLER_UID,
        plastic: { level: 78, weight: 12.5 },
        food: { level: 45, weight: 8.2, moisture: 72 }, // foodMoisture: 72 — simulates moisture sensor [cite: research proposal]
        metal: { level: 62, weight: 15.0 },
        lastUpdated: now,
        location: new admin.firestore.GeoPoint(6.9271, 79.8612) // Colombo Fort
      },
      {
        id: "seller_002",
        sellerUid: "seller_002",
        plastic: { level: 91, weight: 18.0 },
        food: { level: 30, weight: 5.5, moisture: 55 },
        metal: { level: 55, weight: 11.0 },
        lastUpdated: now,
        location: new admin.firestore.GeoPoint(6.8670, 79.8997) // Nugegoda
      }
    ];

    console.log('Seeding bins...');
    for (const bin of bins) {
      const { id, ...binData } = bin;
      await db.collection('bins').doc(id).set(binData);
    }

    // 3. SEED MARKETPLACE LISTINGS
    const listings = [
      {
        id: "listing_001",
        sellerUid: REAL_SELLER_UID,
        sellerName: "Keshan Adhikari",
        wasteType: "plastic",
        weightKg: 10.0,
        pricePerKg: 45,
        totalPrice: 450,
        status: "available",
        location: new admin.firestore.GeoPoint(6.9271, 79.8612),
        createdAt: getPastDate(2)
      },
      {
        id: "listing_002",
        sellerUid: REAL_SELLER_UID,
        sellerName: "Keshan Adhikari",
        wasteType: "metal",
        weightKg: 8.0,
        pricePerKg: 120,
        totalPrice: 960,
        status: "available",
        location: new admin.firestore.GeoPoint(6.9271, 79.8612),
        createdAt: getPastDate(1)
      },
      {
        id: "listing_003",
        sellerUid: "seller_002",
        sellerName: "Nuwan Perera",
        wasteType: "plastic",
        weightKg: 15.0,
        pricePerKg: 40,
        totalPrice: 600,
        status: "available",
        location: new admin.firestore.GeoPoint(6.8670, 79.8997),
        createdAt: getPastDate(3)
      },
      {
        id: "listing_004",
        sellerUid: "seller_002",
        sellerName: "Nuwan Perera",
        wasteType: "food",
        weightKg: 5.0,
        pricePerKg: 20,
        totalPrice: 100,
        status: "sold",
        location: new admin.firestore.GeoPoint(6.8670, 79.8997),
        createdAt: getPastDate(5)
      },
      {
        id: "listing_005",
        sellerUid: REAL_SELLER_UID,
        sellerName: "Keshan Adhikari",
        wasteType: "metal",
        weightKg: 12.0,
        pricePerKg: 115,
        totalPrice: 1380,
        status: "sold",
        location: new admin.firestore.GeoPoint(6.9271, 79.8612),
        createdAt: getPastDate(7)
      }
    ];

    console.log('Seeding marketplace listings...');
    for (const listing of listings) {
      const { id, ...listingData } = listing;
      await db.collection('marketplace').doc(id).set(listingData);
    }

    // 4. SEED ORDERS
    const orders = [
      {
        listingId: "listing_004",
        buyerUid: REAL_BUYER_UID,
        buyerName: "Green Recycling Lanka",
        sellerUid: "seller_002",
        sellerName: "Nuwan Perera",
        wasteType: "food",
        weightKg: 5.0,
        totalPrice: 100,
        status: "completed",
        pickupDate: getPastDate(3),
        createdAt: getPastDate(5)
      },
      {
        listingId: "listing_005",
        buyerUid: "buyer_002",
        buyerName: "Eco Lanka Pvt Ltd",
        sellerUid: REAL_SELLER_UID,
        sellerName: "Keshan Adhikari",
        wasteType: "metal",
        weightKg: 12.0,
        totalPrice: 1380,
        status: "completed",
        pickupDate: getPastDate(4),
        createdAt: getPastDate(7)
      },
      {
        listingId: "listing_003",
        buyerUid: REAL_BUYER_UID,
        buyerName: "Green Recycling Lanka",
        sellerUid: "seller_002",
        sellerName: "Nuwan Perera",
        wasteType: "plastic",
        weightKg: 15.0,
        totalPrice: 600,
        status: "pending",
        pickupDate: null,
        createdAt: now
      },
      {
        listingId: "listing_002",
        buyerUid: "buyer_002",
        buyerName: "Eco Lanka Pvt Ltd",
        sellerUid: REAL_SELLER_UID,
        sellerName: "Keshan Adhikari",
        wasteType: "metal",
        weightKg: 8.0,
        totalPrice: 960,
        status: "confirmed",
        pickupDate: getFutureDate(1),
        createdAt: getPastDate(1)
      }
    ];

    console.log('Seeding orders...');
    for (const order of orders) {
      await db.collection('orders').add(order);
    }

    // 5. SEED NOTIFICATIONS
    const notifications = [
      {
        toUid: REAL_SELLER_UID,
        type: "order_placed",
        message: "New order for your plastic waste from Green Recycling Lanka",
        read: false,
        createdAt: now
      },
      {
        toUid: REAL_SELLER_UID,
        type: "bin_full",
        message: "Plastic bin is over 80% full",
        read: false,
        createdAt: getPastDate(0.04) // ~1 hour ago
      },
      {
        toUid: "seller_002",
        type: "bin_full",
        message: "Plastic bin is over 80% full - currently at 91%",
        read: false,
        createdAt: getPastDate(0.08) // ~2 hours ago
      },
      {
        toUid: REAL_BUYER_UID,
        type: "order_confirmed",
        message: "Your order for plastic waste has been confirmed by Keshan Adhikari",
        read: true,
        createdAt: getPastDate(1)
      }
    ];

    console.log('Seeding notifications...');
    for (const notif of notifications) {
      await db.collection('notifications').add(notif);
    }

    console.log('\n--- Seeding Completed Successfully! ---');
    
    // VERIFICATION CHECK
    const availableListings = await db.collection('marketplace')
      .where('status', '==', 'available')
      .get();
    
    console.log(`Verification: Found ${availableListings.size} documents with status 'available' in marketplace.`);
    if (availableListings.size === 0) {
      console.warn('WARNING: No available listings found! Check if the status field matches the query filter.');
    }
    
    // Log summary
    const counts = {
      users: (await db.collection('users').get()).size,
      bins: (await db.collection('bins').get()).size,
      marketplace: (await db.collection('marketplace').get()).size,
      orders: (await db.collection('orders').get()).size,
      notifications: (await db.collection('notifications').get()).size
    };

    console.log('Final Document Counts in Firestore:');
    console.table(counts);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    process.exit();
  }
};

seedData();
