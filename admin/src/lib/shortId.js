/**
 * Short, readable IDs for support, derived from the Firestore document id
 * (first 6 characters, upper case). Same rule as the mobile app
 * (mobile/utils/shortId.ts), so a code a user reads out from the app matches
 * the one shown here.
 */
// Codes are 6 characters long, for example USR-A1B2C3.
const CODE_LENGTH = 6;

// Removes non-letters/digits from the id, takes the first 6, upper-cases them.
// Example: shortCode("ORD", "ab12cd34ef") -> "ORD-AB12CD". An empty id gives "ORD-??????".
function shortCode(prefix, id) {
  const clean = String(id ?? "").replace(/[^A-Za-z0-9]/g, "");
  return `${prefix}-${clean.slice(0, CODE_LENGTH).toUpperCase() || "??????"}`;
}

// userCode and orderCode only choose the prefix (USR or ORD).
export const userCode = (uid) => shortCode("USR", uid);
export const orderCode = (orderId) => shortCode("ORD", orderId);

// Example: matchesCode("USR-A1B2C3", "a1b") -> true; also "usr-a1b" or "usr a1b".
/** True when what the admin typed is (part of) this code; the "USR-" prefix and spacing are optional. */
export function matchesCode(code, term) {
  const t = String(term ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!t) return false;
  return code.replace("-", "").includes(t.replace("-", ""));
}
