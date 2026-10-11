/**
 * Short, readable IDs for support. A user can read "USR-7K3F9A" out over the
 * phone and an admin can search for it. They are derived from the Firestore
 * document id (first 6 characters, upper case), so nothing extra is stored and
 * the same id always gives the same code. The admin site uses the same rule.
 */
const CODE_LENGTH = 6;

function shortCode(prefix: string, id: string | undefined | null): string {
  const clean = String(id ?? '').replace(/[^A-Za-z0-9]/g, '');
  return `${prefix}-${clean.slice(0, CODE_LENGTH).toUpperCase() || '??????'}`;
}

export const userCode = (uid: string | undefined | null) => shortCode('USR', uid);
export const orderCode = (orderId: string | undefined | null) => shortCode('ORD', orderId);
