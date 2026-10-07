import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { setLogLevel, doc, setDoc, runTransaction, collection, addDoc } from 'firebase/firestore';

// Expected permission-denied rejections are logged by the SDK; keep test output readable.
setLogLevel('silent');

const env = await initializeTestEnvironment({
  projectId: 'demo-wastpro',
  firestore: { rules: readFileSync(fileURLToPath(new URL('../../firestore.rules', import.meta.url)), 'utf8') },
});

async function seed() {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/seller1'), { role: 'seller' });
    await setDoc(doc(db, 'users/buyer1'), { role: 'buyer' });
    await setDoc(doc(db, 'users/buyer2'), { role: 'buyer' });
    await setDoc(doc(db, 'marketplace/L1'), { sellerUid: 'seller1', status: 'available', totalPrice: 100 });
    await setDoc(doc(db, 'offers/O1'), {
      listingId: 'L1', buyerUid: 'buyer1', sellerUid: 'seller1', offeredPrice: 80, status: 'pending',
    });
  });
}

const baseOrder = {
  listingId: 'L1', buyerUid: 'buyer1', sellerUid: 'seller1', totalPrice: 80,
  paymentMethod: 'cash', paymentStatus: 'pending', status: 'confirmed', offerId: 'O1',
};

function accept(db, order) {
  return runTransaction(db, async (tx) => {
    await tx.get(doc(db, 'marketplace/L1'));
    await tx.get(doc(db, 'offers/O1'));
    tx.update(doc(db, 'offers/O1'), { status: 'accepted' });
    tx.update(doc(db, 'marketplace/L1'), { status: 'sold' });
    tx.set(doc(db, 'orders/ORD1'), order);
  });
}

const results = [];
async function check(name, fn) {
  try { await fn(); results.push(`PASS  ${name}`); }
  catch (e) { results.push(`FAIL  ${name}: ${e.message}`); }
}

const seller = () => env.authenticatedContext('seller1').firestore();
const buyer = (id = 'buyer1') => env.authenticatedContext(id).firestore();

await seed();
await check('seller accepts offer (transaction creates order)', () => assertSucceeds(accept(seller(), baseOrder)));

await seed();
await check('seller cannot change price vs offer', () => assertFails(accept(seller(), { ...baseOrder, totalPrice: 10 })));

await seed();
await check('seller cannot target a different buyer', () => assertFails(accept(seller(), { ...baseOrder, buyerUid: 'buyer2' })));

await seed();
await check('seller cannot mark it paid', () => assertFails(accept(seller(), { ...baseOrder, paymentStatus: 'paid' })));

await seed();
await check('seller cannot create offer-order without accepting the offer', () =>
  assertFails(setDoc(doc(seller(), 'orders/ORD2'), baseOrder)));

await seed();
await check('buyer direct purchase still allowed', () =>
  assertSucceeds(addDoc(collection(buyer(), 'orders'), {
    listingId: 'L1', buyerUid: 'buyer1', sellerUid: 'seller1', totalPrice: 100, paymentStatus: 'pending', status: 'pending',
  })));

await seed();
await check('buyer offer with correct seller allowed', () =>
  assertSucceeds(addDoc(collection(buyer(), 'offers'), { listingId: 'L1', buyerUid: 'buyer1', sellerUid: 'seller1', offeredPrice: 90, status: 'pending' })));

await seed();
await check('buyer offer naming wrong seller rejected', () =>
  assertFails(addDoc(collection(buyer(), 'offers'), { listingId: 'L1', buyerUid: 'buyer1', sellerUid: 'buyer2', offeredPrice: 90, status: 'pending' })));

await seed();
await check('buyer offer with non-number price rejected', () =>
  assertFails(addDoc(collection(buyer(), 'offers'), { listingId: 'L1', buyerUid: 'buyer1', sellerUid: 'seller1', offeredPrice: '90', status: 'pending' })));

console.log(results.join('\n'));
await env.cleanup();
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
