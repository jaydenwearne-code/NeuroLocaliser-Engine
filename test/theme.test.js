// theme.test.js — the reader's light/dark preference. Everything here is pure: the storage round trip, the
// three-step cycle, the resolve matrix and the attribute write, plus one guard on the storage key, which is
// the single string that has to agree between app/theme.js and the inline script in app/index.html.
import { readFileSync } from "node:fs";
import {
  THEME_STORAGE_KEY, THEMES, readTheme, writeTheme, nextTheme, resolveTheme, applyTheme,
  themeGlyph, themeLabel,
} from "../app/theme.js";

let pass = 0, fail = 0;
const log = [];
const ok = (label, cond, detail) => { log.push({ label, ok: !!cond, detail }); cond ? pass++ : fail++; };

// A localStorage stand-in. `memStore()` behaves; `deadStore()` throws on both sides, which is what Safari
// private browsing does — the app must survive it, because this runs on the path that reveals the app.
const memStore = (seed = {}) => ({
  data: { ...seed },
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.data, k) ? this.data[k] : null; },
  setItem(k, v) { this.data[k] = String(v); },
});
const deadStore = () => ({
  getItem() { throw new Error("storage disabled"); },
  setItem() { throw new Error("storage disabled"); },
});

// --- 1: the key and the vocabulary ----------------------------------------------------------------
ok("the key follows the nl_*_v1 convention", /^nl_[a-z_]+_v\d+$/.test(THEME_STORAGE_KEY), THEME_STORAGE_KEY);
ok("the key is exactly nl_theme_v1", THEME_STORAGE_KEY === "nl_theme_v1", THEME_STORAGE_KEY);
ok("there are three states", THEMES.length === 3, THEMES.join(","));
ok("system is first — it is the default and the state the cycle returns to", THEMES[0] === "system");
ok("the three states are system/light/dark", THEMES.join(",") === "system,light,dark");

// --- 2: the storage round trip --------------------------------------------------------------------
for (const v of THEMES) {
  const store = memStore();
  writeTheme(v, store);
  ok(`"${v}" survives a write/read round trip`, readTheme(store) === v, readTheme(store));
}
ok("a store with no key at all reads system", readTheme(memStore()) === "system");
{
  const s = memStore();
  writeTheme("system", s);
  ok("writeTheme stores the literal choice, system included", s.data[THEME_STORAGE_KEY] === "system",
     String(s.data[THEME_STORAGE_KEY]));
}
for (const junk of ["blue", "", "SYSTEM", "0", "null"]) {
  ok(`garbage (${JSON.stringify(junk)}) reads as system`,
     readTheme(memStore({ [THEME_STORAGE_KEY]: junk })) === "system");
}
{
  const s = memStore();
  writeTheme("chartreuse", s);
  ok("writeTheme refuses to store a value outside THEMES", s.data[THEME_STORAGE_KEY] === "system",
     String(s.data[THEME_STORAGE_KEY]));
}
ok("writeTheme reports what it actually stored", writeTheme("chartreuse", memStore()) === "system");

// --- 3: a hostile store must never throw ----------------------------------------------------------
// Not politeness: a cosmetic preference must never be able to stop a clinician getting into the tool.
{
  let threw = null;
  let got;
  try { got = readTheme(deadStore()); } catch (e) { threw = e; }
  ok("readTheme survives a throwing store", !threw, threw && threw.message);
  ok("...and falls back to system", got === "system", got);
  threw = null;
  try { writeTheme("dark", deadStore()); } catch (e) { threw = e; }
  ok("writeTheme survives a throwing store", !threw, threw && threw.message);
  threw = null;
  try { readTheme(); writeTheme("dark"); } catch (e) { threw = e; }
  ok("neither throws when called with no store at all", !threw, threw && threw.message);
  ok("...and the no-store read still yields a usable state", readTheme() === "system");
}

// --- 4: the cycle closes on itself ----------------------------------------------------------------
ok("system -> light", nextTheme("system") === "light");
ok("light -> dark", nextTheme("light") === "dark");
ok("dark -> system", nextTheme("dark") === "system");
for (const v of THEMES) {
  ok(`three clicks from "${v}" return to "${v}"`, nextTheme(nextTheme(nextTheme(v))) === v);
}
ok("an unrecognised current value enters the cycle at light", nextTheme("chartreuse") === "light");
ok("every cycle output is a real state", THEMES.every(v => THEMES.includes(nextTheme(v))));

// --- 5: the resolve matrix ------------------------------------------------------------------------
// The point of an explicit override is that it IGNORES the OS. If these four lines ever pass while the
// explicit states track prefersDark, the toggle has silently become a no-op.
ok("system + OS dark  -> dark", resolveTheme("system", true) === "dark");
ok("system + OS light -> light", resolveTheme("system", false) === "light");
ok("light ignores an OS that wants dark", resolveTheme("light", true) === "light");
ok("light stays light on a light OS", resolveTheme("light", false) === "light");
ok("dark ignores an OS that wants light", resolveTheme("dark", false) === "dark");
ok("dark stays dark on a dark OS", resolveTheme("dark", true) === "dark");
ok("an unrecognised choice behaves as system", resolveTheme("chartreuse", true) === "dark");
ok("prefersDark defaults to false rather than undefined-ing", resolveTheme("system") === "light");

// --- 6: applyTheme writes the attribute the CSS actually reads -------------------------------------
// There is no :root[data-theme="system"] block and there must not be one — following the OS IS the absence
// of an override, so system must DELETE the attribute and let the media query resume.
{
  const root = { dataset: {} };
  applyTheme("dark", root);
  ok("dark sets data-theme=dark", root.dataset.theme === "dark", String(root.dataset.theme));
  applyTheme("light", root);
  ok("light sets data-theme=light", root.dataset.theme === "light", String(root.dataset.theme));
  applyTheme("system", root);
  ok("system REMOVES the attribute entirely",
     !("theme" in root.dataset), JSON.stringify(root.dataset));
  applyTheme("chartreuse", root);
  ok("an unrecognised choice also removes it (falls back to system)", !("theme" in root.dataset));
  ok("applyTheme reports the state it applied", applyTheme("dark", { dataset: {} }) === "dark");
  let threw = null;
  try { applyTheme("dark", null); } catch (e) { threw = e; }
  ok("applyTheme survives having no root (node)", !threw, threw && threw.message);
}

// --- 7: the button's strings ----------------------------------------------------------------------
// The glyph shows the state you are IN, not the one you would move to. That is ambiguous on its own —
// "light" on a light OS and "system" on a light OS look identical — so the label carries both in words.
{
  const glyphs = THEMES.map(themeGlyph);
  ok("every state has a glyph", glyphs.every(g => typeof g === "string" && g.length > 0));
  ok("the three glyphs are distinct", new Set(glyphs).size === 3, glyphs.join(" "));
  ok("an unrecognised choice still yields a glyph", themeGlyph("chartreuse") === themeGlyph("system"));
  for (const v of THEMES) {
    const label = themeLabel(v);
    ok(`the "${v}" label names the state it is in`, /theme/i.test(label) && label.length > 8, label);
    ok(`the "${v}" label says what the next click does`, /click/i.test(label), label);
  }
  ok("the three labels are distinct", new Set(THEMES.map(themeLabel)).size === 3);
}

// --- 8: the one duplicated string -----------------------------------------------------------------
// The stored choice is applied by a blocking script in index.html's <head>, because app.js is a deferred
// module that imports the whole engine graph — applying it there would repaint after first paint, a visible
// flash on a cold Pages load. The cost is that the key literal lives in two files. This is the guard.
{
  const HTML = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");
  // Scoped to the SCRIPT's own source, not the whole head — the explanatory comment beside it discusses
  // the "system" state in prose, which would defeat the "never writes system" assertion below.
  const head = HTML.slice(0, HTML.indexOf("<style>"));
  const script = (head.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || "";
  ok("an inline boot script sits in <head> ABOVE <style>", script.length > 0, head.slice(-160));
  ok("it names the storage key", script.includes(THEME_STORAGE_KEY), THEME_STORAGE_KEY);
  ok("it writes data-theme", /dataset\.theme|setAttribute\(\s*["']data-theme/.test(script), script);
  ok("it only ever applies an explicit override, never the literal system",
     /['"]light['"]/.test(script) && /['"]dark['"]/.test(script) && !/['"]system['"]/.test(script), script);
  ok("it is wrapped in try/catch — a throwing localStorage must not break the page",
     /try\s*{/.test(script), script);
  ok("the header carries the toggle button", /id="theme-toggle"/.test(HTML));
}

console.log("\nNeuroLocaliser — THEME\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}${r.detail ? "  → " + r.detail : ""}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
