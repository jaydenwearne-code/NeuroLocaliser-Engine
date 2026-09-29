// cauda-conus.test.js — the below-cord region: cauda equina vs conus medullaris.
// Both share saddle anaesthesia + sphincter dysfunction; the discriminator is UMN-vs-LMN —
// pure LMN (+ radicular pain) → cauda equina; UMN signs present → conus. Saddle numbness, sphincter dysfunction and
// anal wink are midline; the LIMB signs are on both sides, as a clinician enters them (spec 2026-09-29-conus-cauda-
// bilateral) — they used to be midline, and every "Both" entry of the classic pictures said two lesions.
// Run: node test/cauda-conus.test.js

import { solve } from "../src/engine/inverse.js";
import { nameForSite } from "../src/data/syndromes.js";
import { offersFor, currentTokens, tokensForRow } from "../app/sides.js";

let pass = 0, fail = 0;
const log = [];
function ok(label, cond) { log.push({ label, ok: !!cond }); cond ? pass++ : fail++; }

const B = f => [`${f}@left`, `${f}@right`];
const ces = [...B("lmn_weakness"), "saddle_anaesthesia@midline", "sphincter_dysfunction@midline", ...B("radicular_pain")];
const conus = [...B("babinski"), ...B("hyperreflexia"), "saddle_anaesthesia@midline", "sphincter_dysfunction@midline"];

// 1. Cauda equina emergence
{
  const { best } = solve(new Set(ces));
  ok("CES -> cauda_equina", best && best.site.id === "cauda_equina");
  ok("  named Cauda equina", best && /cauda equina/i.test(nameForSite(best.site).name));
}
// 2. Conus emergence
{
  const { best } = solve(new Set(conus));
  ok("conus -> conus_medullaris", best && best.site.id === "conus_medullaris");
  ok("  named Conus", best && /conus/i.test(nameForSite(best.site).name));
}
// 3. Discrimination — shared saddle + sphincter don't collapse them
{
  const cesBest = solve(new Set(ces)).best;
  const conusBest = solve(new Set(conus)).best;
  ok("CES is not conus", cesBest && cesBest.site.id !== "conus_medullaris");
  ok("conus is not cauda", conusBest && conusBest.site.id !== "cauda_equina");
}

// 4. Below-cord level note — a sacral/saddle picture, not a single below-the-level sensory level.
{
  const { level } = solve(new Set(ces));
  ok("CES level does not apply", level.applies === false);
  ok("  note flags below-cord / saddle", /below the cord|saddle/i.test(level.note));
}

// 5. The classic pictures, entered as a clinician enters them, are ONE lesion — each said "needs more than one
//    lesion" while the conus and cauda emitted their limb signs on midline.
{
  const opts = { dominantSide: "left" };
  const saddle = ["saddle_anaesthesia@midline", "sphincter_dysfunction@midline"];
  const one = (label, toks, id) => {
    const r = solve(new Set([...saddle, ...toks]), opts);
    ok(`${label} → one lesion, ${id}`, r.explainAll.length === 1 && r.display[0].site.id === id);
  };
  one("sciatica on both sides", B("radicular_pain"), "cauda_equina");
  one("sciatica on one side", ["radicular_pain@left"], "cauda_equina");
  one("both plantars up + brisk reflexes", [...B("babinski"), ...B("hyperreflexia")], "conus_medullaris");
  one("both legs flaccid-weak + wasting", [...B("lmn_weakness"), ...B("wasting")], "cauda_equina");
  one("one leg flaccid-weak + floppy", ["lmn_weakness@left", "hypotonia@left"], "cauda_equina");
}

// 6. None of the seven limb signs is offered on midline; every one is offered on the left and the right.
{
  const SEVEN = ["radicular_pain", "lmn_weakness", "hypotonia", "wasting", "babinski", "hyperreflexia", "spasticity"];
  const keys = f => offersFor(f).map(o => o.key);
  ok("no conus/cauda limb sign is offered on midline", SEVEN.every(f => !keys(f).includes("midline")));
  ok("  each is offered left and right", SEVEN.every(f => keys(f).includes("left") && keys(f).includes("right")));
  ok("  saddle numbness is still midline", keys("saddle_anaesthesia").join() === "midline");
}

// 7. A saved link from before the change still loads the right answer.
{
  ok("legacy midline sciatica becomes both sides",
     currentTokens(["radicular_pain@midline"]).join() === "radicular_pain@left,radicular_pain@right");
  ok("  an offered token passes through untouched", currentTokens(["saddle_anaesthesia@midline"]).join() === "saddle_anaesthesia@midline");
  ok("  a token that cannot be converted is dropped", currentTokens(["weak_arm@none"]).length === 0);
  const legacy = ["saddle_anaesthesia@midline", "sphincter_dysfunction@midline", "radicular_pain@midline", "anal_wink_loss@midline"];
  const r = solve(new Set(currentTokens(legacy)), { dominantSide: "left" });
  ok("  the old worked-example link loads the cauda, one lesion", r.explainAll.length === 1 && r.display[0].site.id === "cauda_equina");
}

// 8. Down-going plantars on both sides still count against the conus.
{
  const r = solve(new Set(["saddle_anaesthesia@midline", "sphincter_dysfunction@midline", ...B("hyperreflexia"),
                           "plantar_flexor@left", "plantar_flexor@right"]), { dominantSide: "left" });
  const c = r.differential.find(x => x.site.id === "conus_medullaris");
  ok("both plantars down demote the conus", !!c && !!c.against);
}

// 9. Bladder or bowel dysfunction is midline wherever it arises — the pudendal nerve's included (owner ruling
//    2026-09-29) — so a row tap enters it on midline whatever "Symptoms on" says. Found by the browser check: with
//    "Both" set, the tap entered it left + right and the cauda picture became "cauda + both pudendal nerves".
{
  ok("sphincter dysfunction is offered on midline only", offersFor("sphincter_dysfunction").map(o => o.key).join() === "midline");
  ok("  a row tap enters midline, whatever the side setting",
     ["both", "left", "right", ""].every(d => (tokensForRow("sphincter_dysfunction", d) || []).join() === "sphincter_dysfunction@midline"));
  const tapped = ["saddle_anaesthesia", "sphincter_dysfunction", "radicular_pain"].flatMap(f => tokensForRow(f, "both"));
  const r = solve(new Set(tapped), { dominantSide: "left" });
  ok("  the cauda picture entered by row taps on 'Both' is one lesion, the cauda",
     r.explainAll.length === 1 && r.display[0].site.id === "cauda_equina");
  ok("  a legacy one-sided sphincter token becomes midline",
     currentTokens(["sphincter_dysfunction@left"]).join() === "sphincter_dysfunction@midline");
}

// ---- report ----
console.log("\nNeuroLocaliser — CAUDA EQUINA / CONUS tests\n" + "=".repeat(52));
for (const r of log) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
console.log("=".repeat(52));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
