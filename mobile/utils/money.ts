/** Round an amount of rupees to cents so float noise (7.199999999) never gets stored. */
export function roundMoney(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

/** "Rs 120" for whole amounts, "Rs 7.20" otherwise. Also cleans up amounts already stored with float noise. */
export function formatRs(value: number | null | undefined): string {
  const v = roundMoney(value ?? 0);
  return `Rs ${Number.isInteger(v) ? v : v.toFixed(2)}`;
}
