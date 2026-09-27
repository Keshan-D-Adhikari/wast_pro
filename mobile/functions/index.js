const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const Stripe = require('stripe');
const { initializeApp } = require('firebase-admin/app');

initializeApp();

// Set once with:
//   firebase functions:secrets:set STRIPE_SECRET_KEY
// Use a Stripe *test mode* secret key (starts with sk_test_) — this project
// never needs to touch real money.
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');

/**
 * Creates a Stripe Checkout Session for a marketplace order and returns its
 * hosted payment page URL. The mobile app opens that URL in a browser
 * (expo-web-browser), which redirects back into the app via a custom-scheme
 * success/cancel URL — no native Stripe SDK, so this works in Expo Go too.
 */
exports.createCheckoutSession = onCall({ secrets: [stripeSecretKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }

  const { amount, wasteType, listingId } = request.data || {};
  if (typeof amount !== 'number' || amount <= 0) {
    throw new HttpsError('invalid-argument', 'A positive amount is required.');
  }

  const stripe = Stripe(stripeSecretKey.value());

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'lkr',
          product_data: { name: `${wasteType || 'Waste'} pickup` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    // Custom URL schemes are supported by Stripe Checkout specifically for
    // mobile app redirects — see Stripe's docs on returning to your app.
    success_url: 'mobile://payment-complete?status=success&session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'mobile://payment-complete?status=cancel',
    metadata: {
      buyerUid: request.auth.uid,
      listingId: listingId || '',
    },
  });

  return { url: session.url, sessionId: session.id };
});

/**
 * Confirms server-side (never trusting the client alone) that a Checkout
 * Session was actually paid, and returns the card's last 4 digits for
 * display/receipt purposes.
 */
exports.verifyCheckoutSession = onCall({ secrets: [stripeSecretKey] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }

  const { sessionId } = request.data || {};
  if (!sessionId) {
    throw new HttpsError('invalid-argument', 'sessionId is required.');
  }

  const stripe = Stripe(stripeSecretKey.value());
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent.payment_method'],
  });

  if (session.metadata?.buyerUid !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'This checkout session does not belong to you.');
  }

  const paid = session.payment_status === 'paid';
  const paymentMethod = session.payment_intent?.payment_method;
  const last4 = paymentMethod && paymentMethod.card ? paymentMethod.card.last4 : null;

  return { paid, last4, amountTotal: (session.amount_total || 0) / 100 };
});
