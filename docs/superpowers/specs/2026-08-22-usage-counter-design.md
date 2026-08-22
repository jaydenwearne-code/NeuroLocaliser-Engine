# Usage counter — how many people actually open the app

**Status: implemented AND SWITCHED ON 2026-08-22.** `app/usage.js`, `test/usage.test.js`, wired into
`reveal()` in `app/app.js`. It shipped inert in the morning and went live the same day once the sink was
deployed; the setup section below is kept as the record of how, and as the recipe if the endpoint ever
needs replacing.

## The problem

The app went live for testers on 2026-07-27 and there was no way to tell whether anyone had opened it.

- GitHub Pages is a static host with **no accessible logs**.
- The repository traffic API covers the **repo page on github.com, not the Pages site** — and it reads `0`.
- The app carried **no analytics of any kind**.

As of 2026-08-21 there were also **zero feedback emails** in the four weeks since launch. That number is
uninterpretable without a denominator: nobody using it and everybody using it silently look identical.

## The constraint that shapes the design

`app/case-url.js` deliberately keeps the case in the URL **hash** rather than a query string, *"so it never
reaches a server log"*. The hash holds the findings entered (`f=`), the sensory level, the selected
pathology and site.

**A conventional analytics script would undo that in one line,** because the usual ones record
`location.href`. That would ship clinical findings to a third party from a tool being trialled on real
presentations. So:

- **no analytics vendor** — the beacon posts to a Google Apps Script the owner controls, and the data lands
  in the owner's own Sheet;
- **`app/usage.js` never touches `location`, never reads the DOM, and takes no free-text field** — every
  value in the payload is passed in as an argument;
- **`PAYLOAD_KEYS` is an explicit allowlist**, and `test/usage.test.js` §3 builds a realistic case with
  `encodeCase()` then asserts none of it — not the tokens, not the hash, not the strings `location` or
  `href` — can appear in the serialized body. **That test is the point of the module.** It is what fails
  when someone adds `url: location.href` some future afternoon.

## What is counted, and why it is the reveal rather than the passphrase

The gate writes `nl_gate_v1=ok` to `localStorage` and **skips the passphrase on every later visit**. So
instrumenting the passphrase submit would count *first unlocks*, not opens — a much less useful number.

`reveal({ first })` is called on both paths, so one row per open, with `first` separating a new browser
from a returning one.

Two opaque random ids, generated locally and stored locally:

| id | stored in | separates |
|---|---|---|
| `install` | `localStorage` | one tester opening twelve times **vs** twelve testers |
| `session` | `sessionStorage` | one visit **vs** several tabs across a day |

Neither is derived from anything about the browser or the person — they are not fingerprints, they say
nothing about who anyone is, and clearing site data resets them.

The whole payload:

```json
{"app":"neurolocaliser","v":"0.9.0","event":"open","install":"6dvpx7x1706b","session":"yzwqbo6271m2","first":true,"ts":"2026-08-22T03:42:10.511Z"}
```

## It can never break the gate

`recordOpen()` runs on the path that reveals the app, so every failure mode degrades to "no data" rather
than "no app": it never throws, never awaits the network, swallows a rejected fetch, and survives storage
that throws (private browsing), a missing `fetch`, and an unset endpoint. Asserted in `test/usage.test.js`
§5. A counter that could stop a clinician getting into the tool would be a bad trade for a number.

## Setup (two steps, both manual and both the owner's)

**1. Create the sink.** In a new Google Sheet → Extensions → Apps Script, paste:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) { d = {}; }
  if (sheet.getLastRow() === 0) sheet.appendRow(['received', 'app', 'version', 'event', 'install', 'session', 'first']);
  sheet.appendRow([new Date(), d.app, d.v, d.event, d.install, d.session, d.first]);
  return ContentService.createTextOutput('ok');
}
```

Deploy → New deployment → **Web app**, execute as **Me**, access **Anyone**. Copy the `/exec` URL.

**2. Switch it on.** In `app/usage.js`, set `USAGE.endpoint` to that URL and `USAGE.mode` to `"endpoint"`.
Commit and push; Pages redeploys. **Done 2026-08-22.**

> **Verifying the endpoint from a terminal is misleading — do not repeat this mistake.** A `curl -L` POST
> reports **HTTP 405** even when everything is correct, because curl re-POSTs to the redirect target and
> Apps Script rejects that; a browser follows the same redirect as a GET. The 302 with a `location:` to
> `script.googleusercontent.com/macros/echo` **is** the success path. The genuinely diagnostic probe is a
> plain **GET**: `Script function not found: doGet` with HTTP 200 proves the deployment is reachable,
> public (no login wall) and executing. Anything mentioning authorization means access is not "Anyone".

Then in the Sheet: total rows = opens, distinct `install` = browsers, `first = TRUE` = new testers.

## Known limits, stated rather than discovered later

- **No retrospective data.** Counting starts the day it is switched on; the weeks already elapsed are gone.
- **A shared passphrase cannot tell you *who*.** Per-tester passphrases or a name field at the gate would,
  at the cost of friction on a tool people are trialling.
- **Client-side counting undercounts** — blockers, offline, private windows, closed tabs.
- **`install` is per browser, not per person.** One tester on a phone and a workstation is two.
