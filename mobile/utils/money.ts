// Money helpers. Prices are in Sri Lankan rupees (Rs).
// Example: 7.199999999 becomes 7.2 (2 decimals, avoids floating point noise).
/** Round an amount of rupees to cents so float noise (7.199999999) never gets stored. */
export function roundMoney(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

/** "Rs 120" for whole amounts, "Rs 7.20" otherwise. Also cleans up amounts already stored with float noise. */
// Example: 120 gives 'Rs 120', 7.2 gives 'Rs 7.20', null gives 'Rs 0'.
export function formatRs(value: number | null | undefined): string {
  const v = roundMoney(value ?? 0);
  return `Rs ${Number.isInteger(v) ? v : v.toFixed(2)}`;
}
