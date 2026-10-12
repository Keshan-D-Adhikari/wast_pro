// CLOUD FUNCTIONS (SERVER CODE)
// This code runs on Google's servers, NOT on the phone. It is used for card
// payments with Stripe, because the Stripe secret key must never be inside the
// app (anyone could extract it). The app calls these functions by name:
//   1. createCheckoutSession: makes a Stripe payment page for an order.
//   2. verifyCheckoutSession: confirms on the server that the payment was really made.
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const Stripe = require('stripe');
const { initializeApp } = require('firebase-admin/app');

// Start the Firebase Admin SDK, which gives server code its own access to Firebase.
initializeApp();

// Set once with:
//   firebase functions:secrets:set STRIPE_SECRET_KEY
// Use a Stripe *test mode* secret key (starts with sk_test_) — this project
// never needs to touch real money.
// defineSecret says "this value comes from Firebase's secret storage". It is not
// written in the code or in git.
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');

/**
 * Creates a Stripe Checkout Session for a marketplace order and returns its
 * hosted payment page URL. The mobile app opens that URL in a browser
 * (expo-web-browser), which redirects back into the app via a custom-scheme
 * success/cancel URL — no native Stripe SDK, so this works in Expo Go too.
 */
// onCall makes a "callable" function: the app calls it with httpsCallable(functions, name).
// Firebase automatically attaches the logged-in user to "request.auth". The
// "secrets" option makes the Stripe key available to this function only.
exports.createCheckoutSession = onCall({ secrets: [stripeSecretKey] }, async (request) => {
  // 1. Only signed-in users may start a payment.
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }

  // 2. Read and check the data the app sent. Never trust the client blindly.
  // "|| {}" avoids a crash if no data was sent.
  const { amount, wasteType, listingId } = request.data || {};
  if (typeof amount !== 'number' || amount <= 0) {
    throw new HttpsError('invalid-argument', 'A positive amount is required.');
  }

  // 3. Create the Stripe client with the secret key.
  const stripe = Stripe(stripeSecretKey.value());

  // 4. Ask Stripe for a Checkout Session (a hosted payment page).
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',               // one-off payment, not a subscription
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'lkr',
          product_data: { name: `${wasteType || 'Waste'} pickup` },
          // Stripe wants the smallest currency unit (cents), so multiply by 100.
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    // Custom URL schemes are supported by Stripe Checkout specifically for
    // mobile app redirects — see Stripe's docs on returning to your app.
    success_url: 'mobile://payment-complete?status=success&session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'mobile://payment-complete?status=cancel',
    // Extra info stored on the session. We use buyerUid later to check who paid.
    metadata: {
      buyerUid: request.auth.uid,
      listingId: listingId || '',
    },
  });

  // 5. Send the payment page URL back to the app, which opens it in a browser.
  return { url: session.url, sessionId: session.id };
});

/**
 * Confirms server-side (never trusting the client alone) that a Checkout
 * Session was actually paid, and returns the card's last 4 digits for
 * display/receipt purposes.
 */
// The app calls this after the browser returns to the app, before it marks the
// order as paid.
exports.verifyCheckoutSession = onCall({ secrets: [stripeSecretKey] }, async (request) => {
  // 1. Only signed-in users.
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }

  // 2. A session id is required.
  const { sessionId } = request.data || {};
  if (!sessionId) {
    throw new HttpsError('invalid-argument', 'sessionId is required.');
  }

  // 3. Ask Stripe (not the app) for the real state of this session.
  // "expand" also loads the payment method so we can read the card details.
  const stripe = Stripe(stripeSecretKey.value());
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent.payment_method'],
  });

  // 4. Security check: the session must belong to the user who is asking.
  // Without this, someone could verify another person's payment.
  if (session.metadata?.buyerUid !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'This checkout session does not belong to you.');
  }

  // 5. Work out the result. last4 stays null if card details are missing.
  const paid = session.payment_status === 'paid';
  const paymentMethod = session.payment_intent?.payment_method;
  const last4 = paymentMethod && paymentMethod.card ? paymentMethod.card.last4 : null;

  // amount_total is in cents, so divide by 100 to get back the normal amount.
  return { paid, last4, amountTotal: (session.amount_total || 0) / 100 };
});
