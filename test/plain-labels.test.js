// plain-labels.test.js — every finding in plain words (spec 2026-09-27 §5.1). The labels are clinical content
// for the owner's review; this suite holds the mechanical floor under them.
import { PLAIN, plainLabel } from "../app/plain-labels.js";
import { FINDINGS } from "../src/model/findings.js";
import { EXAM_TREE } from "../app/exam-map.js";

let pass = 0, fail = 0;
const ok = (l, c, d = "") => { c ? pass++ : fail++; console.log((c ? "PASS  " : "FAIL  ") + l + (c ? "" : `  ${d}`)); };

const ids = Object.keys(FINDINGS);
const missing = ids.filter(f => !PLAIN[f]);
const extra = Object.keys(PLAIN).filter(f => !FINDINGS[f]);
ok(`every finding has a plain label (${ids.length})`, missing.length === 0, missing.join(", "));
ok("no label names a finding that does not exist", extra.length === 0, extra.join(", "));

// It reads mid-sentence after a side word ("right body pain loss"), so: no ids, no full stops, and short.
const CAP = 40;
const bad = Object.entries(PLAIN).filter(([, p]) =>
  typeof p.label !== "string" || !p.label.trim() || p.label.includes("_") || p.label.includes(",") || p.label.endsWith(".") || p.label.length > CAP);
// No commas: the "Less common" summary lists labels comma-separated, and "taste loss, front of tongue" read as two.
ok(`every label is plain, comma-free, unpunctuated and at most ${CAP} characters`, bad.length === 0, bad.map(([f, p]) => `${f}: "${p.label}"`).join(" | "));
const badNote = Object.entries(PLAIN).filter(([, p]) => p.note !== undefined && (typeof p.note !== "string" || !p.note.trim() || p.note.includes("_") || p.note.length > CAP));
ok("every note is plain and short", badNote.length === 0, badNote.map(([f]) => f).join(", "));
ok("less is a boolean where present", Object.values(PLAIN).every(p => p.less === undefined || p.less === true));

// Two findings sharing a label would make two chips read the same.
const seen = new Map(), dups = [];
for (const [f, p] of Object.entries(PLAIN)) {
  const k = p.label.toLowerCase();
  if (seen.has(k)) dups.push(`${seen.get(k)} / ${f}: "${p.label}"`); else seen.set(k, f);
}
ok("no two findings share a label", dups.length === 0, dups.join(" | "));

// "Less common" must never empty a group: every leaf group keeps at least one row on show.
const leaves = [];
const walk = (n, path) => { if (n.findings) leaves.push({ path: path + n.label, findings: n.findings }); (n.groups || []).forEach(g => walk(g, path + n.label + " › ")); };
EXAM_TREE.forEach(n => walk(n, ""));
const empty = leaves.filter(g => g.findings.every(f => PLAIN[f] && PLAIN[f].less)).map(g => g.path);
ok(`every exam group keeps a common finding on show (${leaves.length} groups)`, empty.length === 0, empty.join(", "));

// The strict vocabulary (owner, 2026-09-25) is carried by the row note, not the label.
ok("arm and leg weakness are marked upper motor neuron on the row",
   PLAIN.weak_arm.note === "upper motor neuron pattern" && PLAIN.weak_leg.note === "upper motor neuron pattern");
ok("floppy weakness is marked lower motor neuron on the row", PLAIN.lmn_weakness.note === "lower motor neuron pattern");
ok("the Why line's labels stay short (arm weakness, face pain loss, swallowing difficulty)",
   plainLabel("weak_arm") === "arm weakness" && plainLabel("face_pain_loss") === "face pain loss" && plainLabel("dysphagia") === "swallowing difficulty");
ok("an unlabelled id degrades to readable words", plainLabel("zz_not_a_finding") === "zz not a finding");

console.log(`\nplain labels: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
