import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { setLogLevel, doc, setDoc, updateDoc, writeBatch, deleteField } from 'firebase/firestore';

// Expected permission-denied rejections are logged by the SDK; keep test output readable.
setLogLevel('silent');

const env = await initializeTestEnvironment({
  projectId: 'demo-wastpro5',
  firestore: { rules: readFileSync(fileURLToPath(new URL('../../firestore.rules', import.meta.url)), 'utf8') },
});
const as = (uid) => env.authenticatedContext(uid).firestore();
const res = [];
async function t(name, fn) { try { await fn(); res.push('PASS  ' + name); } catch (e) { res.push('FAIL  ' + name + ': ' + e.message); } }

const order = (o = {}) => ({
  listingId: 'L1', buyerUid: 'buyer1', sellerUid: 'seller1', totalPrice: 100, weightKg: 2, wasteType: 'plastic',
  paymentMethod: 'cash', paymentStatus: 'pending', paymentLast4: null, status: 'pending', cancelledAt: null, ...o,
});

async function seed(orderDoc, listing = { status: 'sold', soldOrderId: 'O1' }) {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const u of ['seller1', 'seller2', 'buyer1']) await setDoc(doc(db, 'users/' + u), { role: u.startsWith('s') ? 'seller' : 'buyer' });
    await setDoc(doc(db, 'marketplace/L1'), { sellerUid: 'seller1', sellerName: 'S', wasteType: 'plastic', weightKg: 2, totalPrice: 100, location: { latitude: 1, longitude: 1 }, ...listing });
    await setDoc(doc(db, 'orders/O1'), orderDoc);
  });
}

// The exact writes SellerOrders.tsx makes -------------------------------------
await seed(order());
await t('seller confirms a pending order', () => assertSucceeds(updateDoc(doc(as('seller1'), 'orders/O1'), { status: 'confirmed' })));
await t('seller marks cash received, then completes (two writes, as the app does)', async () => {
  const db = as('seller1');
  await assertSucceeds(updateDoc(doc(db, 'orders/O1'), { paymentStatus: 'paid' }));
  await assertSucceeds(updateDoc(doc(db, 'orders/O1'), { status: 'completed' }));
});

await seed(order({ paymentMethod: 'card', paymentStatus: 'paid', status: 'confirmed' }));
await t('seller completes an already-paid card order', () => assertSucceeds(updateDoc(doc(as('seller1'), 'orders/O1'), { status: 'completed' })));

await seed(order());
await t('seller declines: cancels the order and relists the waste in one batch', () => {
  const db = as('seller1'); const b = writeBatch(db);
  b.update(doc(db, 'orders/O1'), { status: 'cancelled', cancelledAt: new Date() });
  b.update(doc(db, 'marketplace/L1'), { status: 'available', soldOrderId: deleteField() });
  return assertSucceeds(b.commit());
});

// And what a seller must NOT be able to do ------------------------------------
await seed(order());
await t("another seller cannot touch someone else's order", () => assertFails(updateDoc(doc(as('seller2'), 'orders/O1'), { status: 'confirmed' })));
await t('seller cannot change the price while confirming', () => assertFails(updateDoc(doc(as('seller1'), 'orders/O1'), { status: 'confirmed', totalPrice: 999 })));
await t('seller cannot mark a card order paid by hand', async () => {
  await seed(order({ paymentMethod: 'card', paymentStatus: 'pending' }));
  await assertFails(updateDoc(doc(as('seller1'), 'orders/O1'), { paymentStatus: 'paid' }));
});
await t('a buyer cannot confirm or complete the order', async () => {
  await seed(order());
  await assertFails(updateDoc(doc(as('buyer1'), 'orders/O1'), { status: 'confirmed' }));
  await assertFails(updateDoc(doc(as('buyer1'), 'orders/O1'), { status: 'completed' }));
});
await t('a cancelled order cannot be revived by the seller', async () => {
  await seed(order({ status: 'cancelled' }));
  await assertFails(updateDoc(doc(as('seller1'), 'orders/O1'), { status: 'confirmed' }));
});

console.log(res.join('\n'));
// Ratings --------------------------------------------------------------------
await seed(order({ status: 'completed' }));
await t('buyer rates a completed order 1-5', () => assertSucceeds(updateDoc(doc(as('buyer1'), 'orders/O1'), { rating: 4 })));
await t('buyer cannot rate with 0, 6 or a decimal', async () => {
  for (const r of [0, 6, 3.5]) await assertFails(updateDoc(doc(as('buyer1'), 'orders/O1'), { rating: r }));
});
await t('seller cannot rate their own order', () => assertFails(updateDoc(doc(as('seller1'), 'orders/O1'), { rating: 5 })));
await t('buyer cannot change a rating once given', async () => {
  await seed(order({ status: 'completed', rating: 2 }));
  await assertFails(updateDoc(doc(as('buyer1'), 'orders/O1'), { rating: 5 }));
});
await t('buyer cannot rate an order that is not completed', async () => {
  await seed(order({ status: 'confirmed' }));
  await assertFails(updateDoc(doc(as('buyer1'), 'orders/O1'), { rating: 5 }));
});
await t('rating cannot be combined with other changes', async () => {
  await seed(order({ status: 'completed' }));
  await assertFails(updateDoc(doc(as('buyer1'), 'orders/O1'), { rating: 5, totalPrice: 1 }));
});

// Notifications to the buyer ---------------------------------------------------
const notif = (type, extra = {}) => ({ toUid: 'buyer1', type, message: 'm', read: false, createdAt: new Date(), orderId: 'O1', ...extra });
await seed(order());
await t('seller notifies the buyer: confirmed, completed, declined', async () => {
  const db = as('seller1');
  for (const type of ['order_confirmed', 'order_completed', 'order_cancelled'])
    await assertSucceeds(setDoc(doc(db, 'notifications/' + type), notif(type)));
});
await t('buyer cannot send a "confirmed" or "completed" notice to the seller', async () => {
  const db = as('buyer1');
  for (const type of ['order_confirmed', 'order_completed'])
    await assertFails(setDoc(doc(db, 'notifications/x' + type), notif(type, { toUid: 'seller1' })));
});
await t("another seller cannot send a confirmed notice about someone else's order", () =>
  assertFails(setDoc(doc(as('seller2'), 'notifications/y'), notif('order_confirmed'))));
await t('a confirmed notice must point at an order, and at its buyer', async () => {
  const { orderId, ...noOrder } = notif('order_confirmed');
  await assertFails(setDoc(doc(as('seller1'), 'notifications/z'), noOrder));
  await assertFails(setDoc(doc(as('seller1'), 'notifications/w'), notif('order_confirmed', { toUid: 'seller2' })));
});

console.log(res.join(String.fromCharCode(10)));
await env.cleanup();
process.exit(res.some((r) => r.startsWith('FAIL')) ? 1 : 0);
