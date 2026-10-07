import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { setLogLevel, doc, setDoc, getDoc, updateDoc, writeBatch, deleteField, runTransaction } from 'firebase/firestore';

// Expected permission-denied rejections are logged by the SDK; keep test output readable.
setLogLevel('silent');

const env = await initializeTestEnvironment({
  projectId: 'demo-wastpro3',
  firestore: { rules: readFileSync(fileURLToPath(new URL('../../firestore.rules', import.meta.url)), 'utf8') },
});
const as = (uid) => env.authenticatedContext(uid).firestore();
const res = [];
async function t(name, fn) { try { await fn(); res.push('PASS  ' + name); } catch (e) { res.push('FAIL  ' + name + ': ' + e.message); } }

async function seed(listing = {}) {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const u of ['seller1', 'buyer1', 'buyer2']) await setDoc(doc(db, 'users/' + u), { role: u.startsWith('s') ? 'seller' : 'buyer' });
    await setDoc(doc(db, 'marketplace/L1'), { sellerUid: 'seller1', status: 'available', totalPrice: 100, ...listing });
  });
}
const order = (buyerUid, extra = {}) => ({
  listingId: 'L1', buyerUid, sellerUid: 'seller1', totalPrice: 100, weightKg: 2,
  paymentMethod: 'cash', paymentStatus: 'pending', status: 'pending', cancelledAt: null, ...extra,
});
const buy = (db, buyerUid, orderId) => {
  const b = writeBatch(db);
  b.set(doc(db, 'orders/' + orderId), order(buyerUid));
  b.update(doc(db, 'marketplace/L1'), { status: 'sold', soldOrderId: orderId });
  return b.commit();
};

await seed();
await t('buyer buys: order + listing sold in one batch', () => assertSucceeds(buy(as('buyer1'), 'buyer1', 'O1')));
await t('a second buyer is rejected once it is sold (no double sale)', () => assertFails(buy(as('buyer2'), 'buyer2', 'O2')));

await seed();
await t('buyer cannot flip a listing to sold with no order', () =>
  assertFails(updateDoc(doc(as('buyer1'), 'marketplace/L1'), { status: 'sold' })));
await t('buyer cannot flip to sold pointing at a nonexistent order', () =>
  assertFails(updateDoc(doc(as('buyer1'), 'marketplace/L1'), { status: 'sold', soldOrderId: 'nope' })));
await t("buyer cannot sell the listing via someone else's order id", () => {
  const db = as('buyer1'); const b = writeBatch(db);
  b.set(doc(db, 'orders/OX'), order('buyer2'));
  b.update(doc(db, 'marketplace/L1'), { status: 'sold', soldOrderId: 'OX' });
  return assertFails(b.commit());
});
await t('buyer cannot change the price while buying', () => {
  const db = as('buyer1'); const b = writeBatch(db);
  b.set(doc(db, 'orders/O1'), order('buyer1'));
  b.update(doc(db, 'marketplace/L1'), { status: 'sold', soldOrderId: 'O1', totalPrice: 1 });
  return assertFails(b.commit());
});
await t('seller can still edit own listing', () => assertSucceeds(updateDoc(doc(as('seller1'), 'marketplace/L1'), { totalPrice: 120 })));

// cancel / restore
await seed();
await buy(as('buyer1'), 'buyer1', 'O1');
await t('buyer cancels order and restores listing in one batch', () => {
  const db = as('buyer1'); const b = writeBatch(db);
  b.update(doc(db, 'orders/O1'), { status: 'cancelled', cancelledAt: new Date() });
  b.update(doc(db, 'marketplace/L1'), { status: 'available', soldOrderId: deleteField() });
  return assertSucceeds(b.commit());
});
await seed();
await buy(as('buyer1'), 'buyer1', 'O1');
await t('another buyer cannot restore a listing they did not buy', () =>
  assertFails(updateDoc(doc(as('buyer2'), 'marketplace/L1'), { status: 'available', soldOrderId: deleteField() })));
await t('buyer cannot restore without cancelling the order', () =>
  assertFails(updateDoc(doc(as('buyer1'), 'marketplace/L1'), { status: 'available', soldOrderId: deleteField() })));

// offer acceptance still works with soldOrderId
await seed();
await env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), 'offers/OF1'), { listingId: 'L1', buyerUid: 'buyer1', sellerUid: 'seller1', offeredPrice: 80, status: 'pending' });
});
await t('seller accepts offer (listing sold with soldOrderId)', () => {
  const db = as('seller1');
  return assertSucceeds(runTransaction(db, async (tx) => {
    await tx.get(doc(db, 'marketplace/L1')); await tx.get(doc(db, 'offers/OF1'));
    tx.update(doc(db, 'offers/OF1'), { status: 'accepted' });
    tx.update(doc(db, 'marketplace/L1'), { status: 'sold', soldOrderId: 'ORD9' });
    tx.set(doc(db, 'orders/ORD9'), { ...order('buyer1', { totalPrice: 80, status: 'confirmed', offerId: 'OF1' }) });
  }));
});
await t('buyer then cancels that offer order and restores the listing', () => {
  const db = as('buyer1'); const b = writeBatch(db);
  b.update(doc(db, 'orders/ORD9'), { status: 'cancelled', cancelledAt: new Date() });
  b.update(doc(db, 'marketplace/L1'), { status: 'available', soldOrderId: deleteField() });
  return assertSucceeds(b.commit());
});

console.log(res.join('\n'));
await env.cleanup();
process.exit(res.some((r) => r.startsWith('FAIL')) ? 1 : 0);
