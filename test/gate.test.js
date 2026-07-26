// gate.test.js — the passphrase gate's hash-and-compare is pure (uses WebCrypto, present in node v24).
// HONEST: the gate is a speed-bump, not real security. This just proves the compare works.
import { sha256hex, checkPassphrase } from "../app/gate.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

// Fixed known digest (SHA-256 of "test-pass"), independent of the app's real PASSPHRASE_DIGEST.
const TEST_DIGEST = "661ea2edce1d4894ab62edb966f83c890f6c90399109e3826193461ce333b5e1";

(async () => {
  ok("sha256hex('test-pass') matches the known digest", (await sha256hex("test-pass")) === TEST_DIGEST);
  ok("sha256hex returns 64 hex chars", /^[0-9a-f]{64}$/.test(await sha256hex("anything")));
  ok("checkPassphrase accepts the right passphrase", (await checkPassphrase("test-pass", TEST_DIGEST)) === true);
  ok("checkPassphrase rejects a wrong passphrase", (await checkPassphrase("wrong", TEST_DIGEST)) === false);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})();
