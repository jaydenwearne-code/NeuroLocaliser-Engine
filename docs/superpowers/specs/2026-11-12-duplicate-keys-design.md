# Duplicate keys and the non-dominant names — design

**Status: RULED and IMPLEMENTED (2026-11-12) on `fix/card-follows-cause`** — the owner: *"approve as proposed, fix the
nondominant labelling error for wernickes and brocas"*. Commits:
- `56aff33` (rows D1–D7);
- `3d195f0` (the non-dominant names, row D9);
- `b173e7e` (the hemisphere pins read the card's red line, so they hold once the card follows its cause).

Row D8 amends the card-follows-cause plan (§5). Not pushed.

## 1. The defect

A JavaScript object literal keeps the LAST definition of a repeated key, without a word. The earlier definition is dead
content that still reads as reviewed. While prototyping "the card follows its cause", a content-move script found three
duplicated phonebook keys. A scan of every object table in `src/` and `app/` (138 tables, the scan checked against each
table's runtime keys) found exactly **four**, all on `main` as well:

| Key | Dead copy (never read) | Live copy | What the reader saw |
|---|---|---|---|
| `BY_SITE.cortex_temporoparietal` | the cortex-mapping round's (2026-07-12): dominant AND non-dominant variants | the aphasia round's (2026-07-19): one entry, though its spec said "keep any existing non-dominant naming" | a non-dominant lesion (sensory aprosodia alone) titled *"Wernicke's aphasia"*, with the jargon-aphasia stroke flag |
| `BY_SITE.cortex_medial_pfc` | "Medial frontal (ACA) behavioural syndrome" | "…(abulic) syndrome" | nothing lost: the dead clues (labelled depression, NPH) are in the cause list |
| `BY_SITE.cortex_orbitofrontal` | "Orbitofrontal syndrome" | "…disinhibition syndrome" | nothing lost: the anosmia clue is the olfactory-groove meningioma's feature |
| `NEXT.subcortex_internal_capsule` | **region B's signed-off plan** (`0b38bc3`, 2026-08-10): emergency, hyperacute pathway, three authored tiers | the initial commit's one-line entry: urgent, *"Stroke team / TIA clinic."* | a pure motor hemiparesis badged urgent and sent to the TIA clinic; at hyperacute onset the badge escalated to emergency while the Next line still said TIA clinic |

Region B was signed off on 2026-08-11 — a review of content that never rendered. The pathology plans were clean: 820
definitions read across the ten category files and their families, 820 in `PATHOLOGY_NEXT`.

Asked to fix the non-dominant labelling, the same error turned up with no duplicate behind it: the non-dominant operculum
(motor aprosodia alone) was titled *"Broca's aphasia"*, read *"Right frontal operculum (Broca's area)"* and carried
*"…is a dominant MCA stroke — time-critical."* The phonebook, `PART_LABEL` and the territory strings are keyed by PLACE, so a
name written for one hemisphere shows on both unless the entry names each one.

## 2. The rows (all ruled "approve as proposed", 2026-11-12)

| Row | Ruling |
|---|---|
| D1 | The non-dominant temporoparietal cortex takes the dead copy's variant: *"Non-dominant temporoparietal syndrome (sensory aprosodia)"*, red flag *"Subtle; the deficit is in emotional communication rather than words."* |
| D2 | The dominant side keeps the aphasia round's entry (*"Wernicke's aphasia (fluent; …)"* and its flag); the dead dominant copy goes. |
| D3 | The medial prefrontal cortex keeps its live entry; the dead copy goes. |
| D4 | The orbitofrontal cortex keeps its live entry; the dead copy goes. |
| D5 | The internal capsule's one-line workup goes, so region B's plan is read: emergency; *"Acute stroke team — hyperacute pathway; a stuttering or crescendo deficit (capsular warning syndrome) needs admission, not reassurance."* |
| D6 | `accuracy-mechanisms` pinned the capsule's no-onset badge at "urgent" (the one-line entry's). Re-pinned to emergency; the onset gating it showed moves to the striatum, still curated urgent (+2 assertions). |
| D7 | `test/duplicate-keys.test.js`: no table defines a key twice, including a pathology plan in two files or families. |
| D8 | This lands BEFORE the card-follows-cause round is built; that round's plan is amended and its prototype re-run (§5). |
| D9 | (the owner's addition) A dominant-hemisphere name never labels the non-dominant hemisphere — Broca's and Wernicke's. |

## 3. Mechanics

- **The duplicate guard reads the SOURCE**, because a duplicate is invisible at runtime: a small tokenizer (strings, template
  literals, comments, regex literals, nesting) collects each table's top-level keys, so several keys on one line count. Every
  exported table's scan is compared with its runtime keys, so a scanner that stops seeing keys fails instead of passing.
- **D9, the names:**
  - `BY_SITE.cortex_operculum` names each hemisphere. The non-dominant side is *"Motor aprosodia (non-dominant frontal
    operculum)"*, with *"New flat, unmodulated speech is easily mistaken for depression — it is a focal sign that needs
    imaging."* It is not "…opercular syndrome", which reads as the bilateral (Foix–Chavany–Marie) opercular syndrome.
  - `NONDOMINANT_PART_LABEL` (`app/labels.js`): a one-sided site in the non-dominant hemisphere reads its `PART_LABEL` entry
    without the eponym. `siteLabel(site, opts)` takes the dominance by `nameForSite()`'s rule.
  - The two territory strings lose "/ Broca's area" and "/ Wernicke's area": a territory serves both hemispheres. The
    dominant side keeps the eponym in its label, so its subtitle no longer names it twice.
- **`test/hemisphere-names.test.js`:** a place whose picture depends on dominance must name each hemisphere, or carry a
  reviewed hemisphere-neutral name (the temporal lobe). No non-dominant title, place, subtitle or red flag may name Broca's or
  Wernicke's area or aphasia, with either hemisphere dominant. "Wernicke" alone is also the encephalopathy, which is right on
  either side.

## 4. Measured

- **Tests:** 90 suites / 7,676 → 92 / 7,756, all green. The one re-pin is D6. The audit is unchanged: 127/127 probes, 1,097/0.
- **Cards:** 5,317 in all (every site id on both sides, every onset with and without papilloedema, every selection).
  - Rows D1–D5 change 23. The 17 right-temporoparietal cards change their title and red flag. The 6 capsule cards change
    their Next line, and 4 of them badge urgent → emergency.
  - Row D9 changes 33. The 16 right-operculum cards change their title, Where line and red flag, and the same 17
    right-temporoparietal cards change their Where line.
  - That is 39 distinct cards. No Where, Why or What line changes elsewhere.
- **Together:** with no disease selected, every pairing that includes the capsule badges emergency (244 come up from urgent).
- **Labels:** of 768 site × dominance labels, only the intended ones change.
- **Browser-checked on port 8146:**
  - the non-dominant operculum and temporoparietal cards;
  - the dominant operculum, unchanged;
  - motor aprosodia with the right hemisphere dominant, which reads the LEFT operculum;
  - the internal capsule: emergency, the hyperacute pathway, and glucose first;
  - no console errors.

## 5. Interaction with the card follows its cause (row D8)

Both rounds edit the same phonebook entries. Now that the operculum and temporoparietal cortex name each hemisphere:

- **C11 and C25 become dominant-only.** C11 is the jargon-aphasia flag and C25 the "dominant MCA stroke" flag; both move onto
  their infarct. Without the restriction, each would return on the non-dominant card whenever the infarct leads.
- **Two new place flags join the reviewed snapshot (130 → 132):** the restored non-dominant temporoparietal flag and the new
  non-dominant operculum flag. Both are true whatever the cause.
- **The move script addresses both as `.dominant` variants.** It requires exactly one `red:` line per entry, and would now see
  two.
- **The guard's sweep and the dry run read both hemispheres.** Both had built one side per place, so neither could see a
  non-dominant card.
  - The sweep now reads both sides wherever the phonebook names each hemisphere. A full every-id sweep cost about 140s, and
    this one costs nothing extra.
  - The dry run reads every site id.
- **Re-running that round's prototype here caught one of this round's own pins.** D2 asserted where the jargon-aphasia flag is
  STORED (the phonebook), and C11 moves it. Since `b173e7e`, D2 reads the card's red line, and so do D1 and the operculum
  check. On the non-dominant cards they now also prove that C11 and C25 stay off, though the infarct leads. Mutation-checked:
  with the two flags unrestricted, both checks fail.

## 6. Found, not fixed

- **The shared lists still describe the aphasia on the non-dominant card.** The cause features and the four-tier workups at
  the operculum and the temporoparietal cortex are keyed by place, so the non-dominant card's What and Next cards describe the
  aphasia. Examples: *"Abrupt non-fluent aphasia with face/arm weakness…"*, *"Characterise the aphasia…"*, *"…especially
  common in Broca's aphasia"*, *"…unlike Wernicke's aphasia…"*. A fix needs causes and workups that follow the dominance — a
  design decision, not a label.
- **The aphasia composites' non-dominant copies.** The thalamic and striatocapsular aphasia composites are built on both
  sides. The non-dominant copy is the thalamus, or the striatum and capsule, without its aphasia, yet it is titled
  *"…(dominant thalamus / striatum…)"* with an aphasia red flag. Either name it, or stop offering it. Listed as OPEN in
  `test/hemisphere-names.test.js`.
