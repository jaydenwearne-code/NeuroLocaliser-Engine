// usage.test.js — the open-counter, and above all the invariant that keeps it honest.
//
// The load-bearing test here is "the payload cannot carry the case". The app deliberately keeps findings
// in the URL hash so they never reach a server log (see app/case-url.js), and a usage beacon is precisely
// the kind of code that undoes that by adding `url: location.href` one afternoon. Section 3 fails if it
// ever does.
import {
  USAGE, USAGE_INSTALL_KEY, USAGE_SESSION_KEY, PAYLOAD_KEYS, usagePayload, newId, stableId, recordOpen,
} from "../app/usage.js";
import { encodeCase } from "../app/case-url.js";
import { VERSION } from "../app/brand.js";

let pass = 0, fail = 0;
const ok = (label, cond, extra = "") => {
  if (cond) { pass++; console.log(`PASS  ${label}`); }
  else { fail++; console.log(`FAIL  ${label}${extra ? `  [${extra}]` : ""}`); }
};

// A Storage stand-in. `throws` models private-browsing / disabled-storage, which must never break a gate.
const memStore = (throws = false) => {
  const m = new Map();
  return {
    getItem: k => { if (throws) throw new Error("storage disabled"); return m.has(k) ? m.get(k) : null; },
    setItem: (k, v) => { if (throws) throw new Error("storage disabled"); m.set(k, String(v)); },
    _map: m,
  };
};
const capture = () => {
  const calls = [];
  const f = (url, init) => { calls.push({ url, init }); return Promise.resolve({ ok: true }); };
  return { calls, f };
};
const endpointCfg = { mode: "endpoint", endpoint: "https://script.google.com/macros/s/EXAMPLE/exec" };

// --- 1: the off switch, and the half-configured trap ----------------------------------------------
// Until 2026-08-22 this section asserted that the SHIPPED default was inert. That default has since been
// switched on deliberately, so asserting it again would be asserting a fact about configuration rather
// than about behaviour. What is worth pinning is the behaviour — "off" really sends nothing — plus a new
// invariant the switch-on made relevant: mode and endpoint must AGREE, because `mode: "endpoint"` with an
// empty endpoint is a silent no-op that looks switched on from the config and records nothing at all.
{
  const { calls, f } = capture();
  const sent = recordOpen({ cfg: { mode: "off", endpoint: "https://example.invalid/exec" },
                            fetchImpl: f, localStore: memStore(), sessionStore: memStore() });
  ok("mode 'off' sends nothing, even with an endpoint set", sent === null && calls.length === 0,
     `${calls.length} call(s)`);

  const half = recordOpen({ cfg: { mode: "endpoint", endpoint: "" }, fetchImpl: f,
                            localStore: memStore(), sessionStore: memStore() });
  ok("a configured mode with no endpoint still sends nothing", half === null && calls.length === 0);

  ok("USAGE.mode is one of the two known values", ["off", "endpoint"].includes(USAGE.mode), USAGE.mode);
  ok("the shipped config is COHERENT — mode 'endpoint' implies a non-empty endpoint",
     USAGE.mode !== "endpoint" || !!USAGE.endpoint,
     "mode says endpoint but none is set, so nothing would ever be recorded");
  ok("the shipped endpoint, when set, is an https Apps Script /exec URL",
     !USAGE.endpoint || (/^https:\/\//.test(USAGE.endpoint) && USAGE.endpoint.endsWith("/exec")),
     USAGE.endpoint);
}

// --- 2: the payload is exactly the allowlist ------------------------------------------------------
{
  const p = usagePayload({ install: "i1", session: "s1", first: true, now: Date.UTC(2026, 7, 21, 12) });
  const keys = Object.keys(p).sort();
  ok("payload keys are exactly PAYLOAD_KEYS", keys.join(",") === [...PAYLOAD_KEYS].sort().join(","),
     `got ${keys.join(",")}`);
  ok("payload carries the app version, so a report names a real build", p.v === String(VERSION));
  ok("payload timestamp is ISO", p.ts === "2026-08-21T12:00:00.000Z", p.ts);
  ok("`first` is a boolean, never a string", typeof p.first === "boolean");
  ok("every value is a primitive — no nested object can smuggle a field",
     Object.values(p).every(v => v === null || typeof v !== "object"));
}

// --- 3: THE INVARIANT — the beacon cannot carry the case ------------------------------------------
// Build a realistic case the way the app does, then assert that nothing about it reaches the wire. This
// is the test that would fail if someone added `url: location.href` to the payload.
{
  const caseHash = encodeCase({
    tokens: ["weak_arm@left", "weak_leg@left", "aphasia@left"],
    onset: "hyperacute", course: "single", selected: "left_subcortex_striatocapsular",
    selectedPathology: "MCA territory infarct", scope: "all", sensoryLevel: "T10",
  });
  ok("the fixture case is non-trivial", caseHash.includes("weak_arm") && caseHash.includes("sl=T10"), caseHash);

  const { calls, f } = capture();
  recordOpen({ cfg: endpointCfg, fetchImpl: f, first: false,
               localStore: memStore(), sessionStore: memStore(), now: Date.UTC(2026, 7, 21) });
  ok("a configured beacon does fire", calls.length === 1, `${calls.length} call(s)`);

  const body = String(calls[0].init.body);
  const leaks = ["weak_arm", "weak_leg", "aphasia", "striatocapsular", "MCA territory infarct",
                 "hyperacute", "T10", caseHash, "#", "location", "href"];
  for (const needle of leaks)
    ok(`the beacon body does not contain \`${needle}\``, !body.includes(needle));

  // And the same assertion structurally: whatever the payload is, it may only hold allowlisted keys.
  const parsed = JSON.parse(body);
  ok("the wire body parses to exactly the allowlisted keys",
     Object.keys(parsed).every(k => PAYLOAD_KEYS.includes(k)), Object.keys(parsed).join(","));
  ok("the beacon posts to the configured endpoint and nowhere else", calls[0].url === endpointCfg.endpoint);
  ok("the beacon is a POST", calls[0].init.method === "POST");
  ok("text/plain, so Apps Script is not asked to answer a CORS preflight it cannot",
     String(calls[0].init.headers["Content-Type"]).startsWith("text/plain"));
}

// --- 4: the ids separate repeat opens from repeat testers -----------------------------------------
{
  const local = memStore(), session = memStore();
  const seq = [0.11, 0.22, 0.33, 0.44, 0.55, 0.66];
  let i = 0; const rand = () => seq[i++ % seq.length];

  const { calls, f } = capture();
  const a = recordOpen({ cfg: endpointCfg, fetchImpl: f, localStore: local, sessionStore: session, rand });
  const b = recordOpen({ cfg: endpointCfg, fetchImpl: f, localStore: local, sessionStore: session, rand });
  ok("install id is STABLE across opens in one browser", a.install === b.install, `${a.install} vs ${b.install}`);
  ok("session id is STABLE within one tab session", a.session === b.session);
  ok("install and session are DIFFERENT ids", a.install !== a.session);

  // A second browser: fresh storage, so a different install id — which is what makes "how many testers"
  // answerable at all, rather than only "how many opens".
  const c = recordOpen({ cfg: endpointCfg, fetchImpl: f, localStore: memStore(), sessionStore: memStore(),
                         rand: () => 0.9 });
  ok("a fresh browser yields a different install id", c.install !== a.install);
  ok("ids are opaque — no dots, slashes or at-signs that could hint at an identity",
     /^[a-z0-9]+$/.test(a.install) && /^[a-z0-9]+$/.test(a.session), `${a.install} / ${a.session}`);
  // Not `a !== b || true`, which passes whatever happens. Drive newId with two DIFFERENT deterministic
  // sequences and require the outputs to differ — a real assertion about the generator.
  ok("newId maps different randomness to different ids",
     newId(() => 0.1) !== newId(() => 0.7), `${newId(() => 0.1)} vs ${newId(() => 0.7)}`);
}

// --- 5: it can never break the gate ---------------------------------------------------------------
// Everything here runs on the path that reveals the app. A counter that can stop a clinician getting in
// would be a bad trade for a number, so every failure mode must degrade to "no data".
{
  const boom = () => { throw new Error("network down"); };
  let threw = false;
  try {
    recordOpen({ cfg: endpointCfg, fetchImpl: boom, localStore: memStore(), sessionStore: memStore() });
  } catch { threw = true; }
  ok("a THROWING fetch does not propagate", !threw);

  threw = false;
  try {
    recordOpen({ cfg: endpointCfg, fetchImpl: () => Promise.reject(new Error("blocked")),
                 localStore: memStore(), sessionStore: memStore() });
  } catch { threw = true; }
  ok("a REJECTING fetch does not propagate (the rejection is swallowed, not unhandled)", !threw);

  threw = false;
  let sent = null;
  try {
    sent = recordOpen({ cfg: endpointCfg, fetchImpl: capture().f,
                        localStore: memStore(true), sessionStore: memStore(true) });
  } catch { threw = true; }
  ok("storage that THROWS (private browsing) does not propagate", !threw);
  ok("...and the open is still counted, with a throwaway id", sent && sent.install.length > 0);

  threw = false;
  try { recordOpen({ cfg: endpointCfg, fetchImpl: undefined, localStore: memStore(), sessionStore: memStore() }); }
  catch { threw = true; }
  ok("no fetch at all in the environment does not propagate", !threw);

  const id = stableId(memStore(true), "k");
  ok("stableId falls back to a fresh id when storage is unusable", typeof id === "string" && id.length > 0);
}

// --- 6: first-open vs returning -------------------------------------------------------------------
// The gate writes an "ok" flag to localStorage and skips the passphrase afterwards, so counting passphrase
// submissions would count FIRST unlocks, not opens. This flag is what keeps the two apart.
{
  const { calls, f } = capture();
  const first = recordOpen({ cfg: endpointCfg, fetchImpl: f, first: true,
                             localStore: memStore(), sessionStore: memStore() });
  const back = recordOpen({ cfg: endpointCfg, fetchImpl: f, first: false,
                            localStore: memStore(), sessionStore: memStore() });
  ok("a first unlock is flagged", first.first === true);
  ok("a returning open is not", back.first === false);
  ok("both are the same event type, so the total is simply the row count",
     first.event === "open" && back.event === "open");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
