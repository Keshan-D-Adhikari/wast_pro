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
await env.cleanup();
process.exit(res.some((r) => r.startsWith('FAIL')) ? 1 : 0);
