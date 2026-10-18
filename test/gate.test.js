// gate.test.js — the passphrase gate's hash-and-compare is pure (uses WebCrypto, present in node v24).
// HONEST: the gate is a speed-bump, not real security. This just proves the compare works.
import { readFileSync } from "node:fs";
import { sha256hex, checkPassphrase, isUnlocked, rememberUnlock, GATE_STORAGE_KEY } from "../app/gate.js";

let pass = 0, fail = 0;
const ok = (l, c) => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l); };

// Fixed known digest (SHA-256 of "test-pass"), independent of the app's real PASSPHRASE_DIGEST.
const TEST_DIGEST = "661ea2edce1d4894ab62edb966f83c890f6c90399109e3826193461ce333b5e1";

// A Storage stand-in whose METHODS throw when asked (private browsing, disabled storage).
const memStore = (throws = false) => {
  const m = new Map();
  return {
    getItem: k => { if (throws) throw new Error("storage disabled"); return m.has(k) ? m.get(k) : null; },
    setItem: (k, v) => { if (throws) throw new Error("storage disabled"); m.set(k, String(v)); },
    _map: m,
  };
};
// Safari with "Block all cookies": the PROPERTY ACCESS `localStorage` itself throws. In node the global is
// simply undefined, which is why an unguarded `localStorage.getItem` in startGate() passed every suite.
const withGlobal = (name, desc, fn) => {
  const saved = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, ...desc });
  try { return fn(); }
  finally { saved ? Object.defineProperty(globalThis, name, saved) : delete globalThis[name]; }
};
const throwingAccessor = { get() { const e = new Error("The operation is insecure."); e.name = "SecurityError"; throw e; } };

(async () => {
  ok("sha256hex('test-pass') matches the known digest", (await sha256hex("test-pass")) === TEST_DIGEST);
  ok("sha256hex returns 64 hex chars", /^[0-9a-f]{64}$/.test(await sha256hex("anything")));
  ok("checkPassphrase accepts the right passphrase", (await checkPassphrase("test-pass", TEST_DIGEST)) === true);
  ok("checkPassphrase rejects a wrong passphrase", (await checkPassphrase("wrong", TEST_DIGEST)) === false);

  // --- the unlock flag: storage can fail, and the gate must fall back to the passphrase screen ---------
  // startGate() read the flag with a bare `localStorage.getItem` BEFORE the gate was shown. Both #gate and
  // #app-shell are display:none until a class is added, so a throw there left a blank page — no gate, no app.
  const unlocked = memStore(); unlocked.setItem(GATE_STORAGE_KEY, "ok");
  ok("a stored 'ok' flag reads as unlocked", isUnlocked(unlocked) === true);
  ok("an empty store reads as locked", isUnlocked(memStore()) === false);
  const other = memStore(); other.setItem(GATE_STORAGE_KEY, "yes");
  ok("only the exact 'ok' value unlocks", isUnlocked(other) === false);
  ok("a store whose getItem THROWS reads as locked", isUnlocked(memStore(true)) === false);
  ok("no store at all reads as locked", isUnlocked(null) === false);

  let threw = false, read;
  try { read = withGlobal("localStorage", throwingAccessor, () => isUnlocked()); } catch { threw = true; }
  ok("a THROWING `localStorage` accessor does not propagate from isUnlocked()", !threw);
  ok("...and falls back to locked, so the passphrase screen is shown", read === false);
  ok("the default really reads the global store (not a constant false)",
     withGlobal("localStorage", { value: unlocked }, () => isUnlocked()) === true);

  const fresh = memStore();
  rememberUnlock(fresh);
  ok("rememberUnlock writes the 'ok' flag", fresh._map.get(GATE_STORAGE_KEY) === "ok");
  ok("...which isUnlocked then reads back", isUnlocked(fresh) === true);
  threw = false;
  try { rememberUnlock(memStore(true)); } catch { threw = true; }
  ok("a store whose setItem THROWS does not propagate from rememberUnlock()", !threw);
  threw = false;
  try { withGlobal("localStorage", throwingAccessor, () => rememberUnlock()); } catch { threw = true; }
  ok("a THROWING `localStorage` accessor does not propagate from rememberUnlock()", !threw);
  const viaGlobal = memStore();
  withGlobal("localStorage", { value: viaGlobal }, () => rememberUnlock());
  ok("rememberUnlock's default writes to the global store", viaGlobal._map.get(GATE_STORAGE_KEY) === "ok");

  // app.js is DOM-bound and no suite can import it, so the wiring is checked as text — the same shape as
  // usage.test.js §7. Every store app.js needs is resolved inside a guard in a pure module; naming
  // `localStorage.` / `sessionStorage.` directly in app.js is how the blank page got there.
  const APP = readFileSync(new URL("../app/app.js", import.meta.url), "utf8");
  const direct = APP.split("\n").map((l, i) => [i + 1, l]).filter(([, l]) => /\b(?:local|session)Storage\s*[.[]/.test(l));
  ok(`app.js never touches localStorage/sessionStorage directly${direct.length ? ` (lines ${direct.map(([n]) => n).join(", ")})` : ""}`,
     direct.length === 0);
  ok("startGate() decides the gate with isUnlocked()", /if\s*\(\s*isUnlocked\(\)\s*\)/.test(APP));
  ok("the passphrase submit remembers the unlock with rememberUnlock()", /rememberUnlock\(\)/.test(APP));

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})();
