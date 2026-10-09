// Runs every rules test file in sequence against the Firestore emulator.
// Use `npm run test:rules` (it starts the emulator and sets FIRESTORE_EMULATOR_HOST).
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const files = ['offers.test.mjs', 'users-and-orders.test.mjs', 'listings.test.mjs', 'validation.test.mjs', 'seller-orders.test.mjs'];
let failed = false;

for (const f of files) {
  console.log(`\n=== ${f}`);
  const r = spawnSync(process.execPath, [fileURLToPath(new URL(f, import.meta.url))], { stdio: 'inherit' });
  if (r.status !== 0) failed = true;
}

console.log(failed ? '\nRULES TESTS FAILED' : '\nAll rules tests passed');
process.exit(failed ? 1 : 0);
