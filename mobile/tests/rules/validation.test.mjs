import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  setLogLevel, doc, setDoc, updateDoc, addDoc, collection, query, where, getDocs, getCountFromServer,
} from 'firebase/firestore';

// Expected permission-denied rejections are logged by the SDK; keep test output readable.
setLogLevel('silent');

const env = await initializeTestEnvironment({
  projectId: 'demo-wastpro4',
  firestore: { rules: readFileSync(fileURLToPath(new URL('../../firestore.rules', import.meta.url)), 'utf8') },
});
const as = (uid) => env.authenticatedContext(uid).firestore();
const res = [];
async function t(name, fn) { try { await fn(); res.push('PASS  ' + name); } catch (e) { res.push('FAIL  ' + name + ': ' + e.message); } }

async function seed() {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/seller1'), { role: 'seller' });
    await setDoc(doc(db, 'users/buyer1'), { role: 'buyer' });
    await setDoc(doc(db, 'users/admin1'), { role: 'admin' });
    await setDoc(doc(db, 'marketplace/L1'), { sellerUid: 'seller1', status: 'available', totalPrice: 100, weightKg: 2, wasteType: 'plastic' });
    await setDoc(doc(db, 'orders/O1'), { buyerUid: 'buyer1', sellerUid: 'seller1', status: 'completed', totalPrice: 100 });
  });
}

const listing = (o = {}) => ({
  sellerUid: 'seller1', sellerName: 'S', wasteType: 'plastic', weightKg: 2, pricePerKg: 45, totalPrice: 90,
  status: 'available', location: { latitude: 6.9, longitude: 79.8 }, ...o,
});
const create = (data) => addDoc(collection(as('seller1'), 'marketplace'), data);

await seed();
await t('seller creates a valid listing', () => assertSucceeds(create(listing())));
await t('rejects an unknown waste type', () => assertFails(create(listing({ wasteType: 'glass' }))));
await t('rejects zero / negative weight', () => assertFails(create(listing({ weightKg: 0 }))));
await t('rejects a negative price', () => assertFails(create(listing({ totalPrice: -5 }))));
await t('rejects a price that is not a number', () => assertFails(create(listing({ totalPrice: '90' }))));
await t('rejects an absurd weight', () => assertFails(create(listing({ weightKg: 999999 }))));
await t('rejects a listing created already sold', () => assertFails(create(listing({ status: 'sold' }))));
await t('rejects a missing location', () => { const l = listing(); delete l.location; return assertFails(create(l)); });
await t("rejects creating a listing as another seller", () => assertFails(create(listing({ sellerUid: 'buyer1' }))));

await t('seller edits own price to a sane value', () => assertSucceeds(updateDoc(doc(as('seller1'), 'marketplace/L1'), { totalPrice: 120 })));
await t('seller cannot set a negative price', () => assertFails(updateDoc(doc(as('seller1'), 'marketplace/L1'), { totalPrice: -1 })));
await t('seller cannot set an unknown status', () => assertFails(updateDoc(doc(as('seller1'), 'marketplace/L1'), { status: 'banana' })));
await t('seller cannot transfer the listing to someone else', () => assertFails(updateDoc(doc(as('seller1'), 'marketplace/L1'), { sellerUid: 'buyer1' })));

// Admin overview queries (counts + completed orders)
await t('admin can count users, orders, listings', async () => {
  const db = as('admin1');
  await assertSucceeds(getCountFromServer(collection(db, 'users')));
  await assertSucceeds(getCountFromServer(query(collection(db, 'users'), where('role', '==', 'seller'))));
  await assertSucceeds(getCountFromServer(query(collection(db, 'orders'), where('status', 'in', ['pending', 'confirmed']))));
  await assertSucceeds(getCountFromServer(query(collection(db, 'marketplace'), where('status', '==', 'available'))));
  await assertSucceeds(getDocs(query(collection(db, 'orders'), where('status', '==', 'completed'))));
});
await t('a normal user cannot count or list all users', async () => {
  const db = as('buyer1');
  await assertFails(getCountFromServer(collection(db, 'users')));
  await assertFails(getDocs(collection(db, 'users')));
});
await t('a normal user cannot list all orders', () => assertFails(getDocs(collection(as('buyer1'), 'orders'))));

console.log(res.join('\n'));
await env.cleanup();
process.exit(res.some((r) => r.startsWith('FAIL')) ? 1 : 0);
