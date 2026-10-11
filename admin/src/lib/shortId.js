/**
 * Short, readable IDs for support, derived from the Firestore document id
 * (first 6 characters, upper case). Same rule as the mobile app
 * (mobile/utils/shortId.ts), so a code a user reads out from the app matches
 * the one shown here.
 */
const CODE_LENGTH = 6;

function shortCode(prefix, id) {
  const clean = String(id ?? "").replace(/[^A-Za-z0-9]/g, "");
  return `${prefix}-${clean.slice(0, CODE_LENGTH).toUpperCase() || "??????"}`;
}

export const userCode = (uid) => shortCode("USR", uid);
export const orderCode = (orderId) => shortCode("ORD", orderId);

/** True when what the admin typed is (part of) this code; the "USR-" prefix and spacing are optional. */
export function matchesCode(code, term) {
  const t = String(term ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!t) return false;
  return code.replace("-", "").includes(t.replace("-", ""));
}
