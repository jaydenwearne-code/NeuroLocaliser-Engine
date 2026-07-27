// gate.js — client-side shared-passphrase check + safety acknowledgment. HONEST FRAMING: a speed-bump,
// NOT real security — the app files ship to the browser regardless. There is NO patient data behind it;
// it only keeps an unvalidated neuro tool off the open web casually. The DOM overlay lives in app.js.
//
// To change the passphrase, replace PASSPHRASE_DIGEST with the SHA-256 hex of the new phrase:
//   node -e "crypto.subtle.digest('SHA-256', new TextEncoder().encode('NEWPHRASE')).then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))"
// Choose a STRONG phrase: once the repo is public the digest is visible and a weak phrase is brute-forceable.

export const GATE_STORAGE_KEY = "nl_gate_v1"; // bump the suffix to force re-acknowledgment if copy changes

// SHA-256 of the shared tester passphrase (set 2026-07-27). The plaintext is never stored here.
export const PASSPHRASE_DIGEST = "c8084e435655fd2a12f606066174d57c5293ff5bef20ec1dd1c4596acf54c947";

export async function sha256hex(text) {
  const data = new TextEncoder().encode(String(text));
  const buf = await globalThis.crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function checkPassphrase(input, digest = PASSPHRASE_DIGEST) {
  return (await sha256hex(input)) === digest;
}
