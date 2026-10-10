import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { setLogLevel, doc, getDoc, setDoc, updateDoc, getDocs, collection, addDoc } from 'firebase/firestore';

// Expected permission-denied rejections are logged by the SDK; keep test output readable.
setLogLevel('silent');

const env = await initializeTestEnvironment({
  projectId: 'demo-wastpro2',
  firestore: { rules: readFileSync(fileURLToPath(new URL('../../firestore.rules', import.meta.url)), 'utf8') },
});

const order = (o = {}) => ({
  listingId: 'L1', buyerUid: 'buyer1', sellerUid: 'seller1', totalPrice: 100, weightKg: 2,
  paymentMethod: 'cash', paymentStatus: 'pending', paymentLast4: null, status: 'pending', cancelledAt: null, ...o,
});

async function seed(orderDoc = order()) {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/seller1'), { role: 'seller', email: 's@x.com', phone: '071', points: 5, fullName: 'S' });
    await setDoc(doc(db, 'users/buyer1'), { role: 'buyer', email: 'b@x.com', phone: '072', fullName: 'B' });
    await setDoc(doc(db, 'users/admin1'), { role: 'admin' });
    await setDoc(doc(db, 'marketplace/L1'), { sellerUid: 'seller1', status: 'available', totalPrice: 100 });
    await setDoc(doc(db, 'orders/O1'), orderDoc);
  });
}
const as = (uid) => env.authenticatedContext(uid).firestore();
const res = [];
async function t(name, fn) { try { await fn(); res.push('PASS  ' + name); } catch (e) { res.push('FAIL  ' + name + ': ' + e.message); } }

// ---- users ----
await seed();
await t('owner reads own profile', () => assertSucceeds(getDoc(doc(as('buyer1'), 'users/buyer1'))));
await t("other user cannot read someone's profile", () => assertFails(getDoc(doc(as('buyer1'), 'users/seller1'))));
await t('other user cannot list users', () => assertFails(getDocs(collection(as('buyer1'), 'users'))));
await t('admin reads any profile', () => assertSucceeds(getDoc(doc(as('admin1'), 'users/seller1'))));
await t('admin lists users', () => assertSucceeds(getDocs(collection(as('admin1'), 'users'))));
await t('sign-up as seller allowed', () => assertSucceeds(setDoc(doc(as('new1'), 'users/new1'), { fullName: 'N', email: 'n@x.com', role: 'seller', createdAt: 'x' })));
await t('sign-up as admin blocked', () => assertFails(setDoc(doc(as('new2'), 'users/new2'), { fullName: 'N', email: 'n@x.com', role: 'admin', createdAt: 'x' })));
await t('owner edits contact details', () => assertSucceeds(updateDoc(doc(as('seller1'), 'users/seller1'), { fullName: 'New', phone: '075', location: 'Colombo' })));
await t('owner cannot raise own points', () => assertFails(updateDoc(doc(as('seller1'), 'users/seller1'), { points: 9999 })));
await t('owner cannot change own role', () => assertFails(updateDoc(doc(as('seller1'), 'users/seller1'), { role: 'admin' })));
await t('owner cannot clear disabled flag', () => assertFails(updateDoc(doc(as('seller1'), 'users/seller1'), { disabled: false })));
await t('admin can disable a user', () => assertSucceeds(updateDoc(doc(as('admin1'), 'users/buyer1'), { disabled: true })));
await t('admin can assign a seller a smart bin', () => assertSucceeds(updateDoc(doc(as('admin1'), 'users/seller1'), { binId: 'bin001' })));
await t('admin cannot assign a malformed bin id', () => assertFails(updateDoc(doc(as('admin1'), 'users/seller1'), { binId: '../secrets' })));
await t('admin cannot assign a non-text bin id', () => assertFails(updateDoc(doc(as('admin1'), 'users/seller1'), { binId: 123 })));
await t('a seller cannot assign themselves a bin', () => assertFails(updateDoc(doc(as('seller1'), 'users/seller1'), { binId: 'bin002' })));
await t('a buyer cannot assign someone a bin', () => assertFails(updateDoc(doc(as('buyer1'), 'users/seller1'), { binId: 'bin002' })));

// ---- orders: create ----
await seed();
await t('buyer direct purchase at listing price', () => assertSucceeds(addDoc(collection(as('buyer1'), 'orders'), order())));
await t('buyer cannot buy at a lower price', () => assertFails(addDoc(collection(as('buyer1'), 'orders'), order({ totalPrice: 1 }))));
await t('buyer cannot name a different seller', () => assertFails(addDoc(collection(as('buyer1'), 'orders'), order({ sellerUid: 'buyer1' }))));

// ---- orders: update ----
await seed();
await t('buyer cannot lower totalPrice', () => assertFails(updateDoc(doc(as('buyer1'), 'orders/O1'), { totalPrice: 1 })));
await t('buyer cannot mark a cash order paid', () => assertFails(updateDoc(doc(as('buyer1'), 'orders/O1'), { paymentStatus: 'paid' })));
await t('buyer cannot reassign sellerUid', () => assertFails(updateDoc(doc(as('buyer1'), 'orders/O1'), { sellerUid: 'buyer1' })));
await t('buyer cannot mark own order completed', () => assertFails(updateDoc(doc(as('buyer1'), 'orders/O1'), { status: 'completed' })));
await t('buyer cancels unpaid pending order', () => assertSucceeds(updateDoc(doc(as('buyer1'), 'orders/O1'), { status: 'cancelled', cancelledAt: new Date() })));
await seed(order({ paymentStatus: 'paid', paymentMethod: 'card', status: 'confirmed' }));
await t('buyer cannot cancel an already-paid order', () => assertFails(updateDoc(doc(as('buyer1'), 'orders/O1'), { status: 'cancelled' })));
await seed(order({ offerId: 'OF1', status: 'confirmed' }));
await t('buyer pays accepted-offer order by card', () => assertSucceeds(updateDoc(doc(as('buyer1'), 'orders/O1'), { paymentMethod: 'card', paymentStatus: 'paid', paymentLast4: '4242' })));
await seed(order({ offerId: 'OF1', status: 'confirmed' }));
await t('pay update cannot also change price', () => assertFails(updateDoc(doc(as('buyer1'), 'orders/O1'), { paymentMethod: 'card', paymentStatus: 'paid', totalPrice: 1 })));
await seed();
await t('seller confirms order', () => assertSucceeds(updateDoc(doc(as('seller1'), 'orders/O1'), { status: 'confirmed' })));
await t('seller marks cash order paid on collection', () => assertSucceeds(updateDoc(doc(as('seller1'), 'orders/O1'), { paymentStatus: 'paid' })));
await seed();
await t('seller cannot change price', () => assertFails(updateDoc(doc(as('seller1'), 'orders/O1'), { totalPrice: 999 })));
await t('admin changes status', () => assertSucceeds(updateDoc(doc(as('admin1'), 'orders/O1'), { status: 'completed' })));
await t('admin cannot change price', () => assertFails(updateDoc(doc(as('admin1'), 'orders/O1'), { totalPrice: 5 })));

console.log(res.join('\n'));
await env.cleanup();
process.exit(res.some((r) => r.startsWith('FAIL')) ? 1 : 0);
