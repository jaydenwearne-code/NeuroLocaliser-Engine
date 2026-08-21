# Wearne's NeuroLocaliser

**A neurological lesion-localisation engine that _derives_ syndromes from anatomy rather than storing
a list of them** — plus a teaching web app built on top of it that answers three questions about a
bedside picture: **where** is the lesion, **why** does that explain these findings, and **what** could
be causing it — then **what to do next**.

**Live (beta):** <https://jaydenwearne-code.github.io/NeuroLocaliser-Engine/app/> — passphrase
`NeuroLocaliser`. Not a medical device; not for clinical use.

| | |
|---|---|
| Anatomy | **528 structures** across 35 neuraxis levels → **377 candidate sites**, 233 findings |
| Pathology | **1294 causes** across 202 sites, tempo-aware, every one with a discriminating feature |
| Workup | **1294 / 1294 causes carry an authored, pathology-specific plan** (816 plans, 71 families) |
| Cross-site | **13 diseases** that explain a multifocal picture as one illness |
| Tests | 69 suites, **6425 assertions**, zero dependencies, no build step |

## The idea

The earlier prototype matched findings against a fixed catalogue of named syndromes. Every syndrome
had to be written in by hand, so the engine could only recognise what its author had pre-enumerated.

This one models the **anatomy** instead, and the syndromes fall out:

- **structures** — nuclei, tracts, fascicles: each carries exactly one finding, and knows whether that
  pathway has already crossed at this level;
- **sites** — a `(level, part, side)` location holding every structure that shares it, which is *why* a
  syndrome's features cluster: they share a blood supply or a canal;
- a **forward model** — lesion a site, get the findings you would expect;
- an **inverse solver** — given findings, which single site explains them, and if none does, what is
  the smallest set of sites that does.

**Weber, Wallenberg and Brown-Séquard are never encoded as rules.** They emerge from which structures
share a site, and are only *named* afterwards by a lookup. Delete that lookup and the engine still
localises — it just returns anatomy instead of an eponym.

> **The golden rule:** never write `if (hasX && hasY) return "someSyndrome"`. That belongs in the
> anatomy tables as structures sharing a site, not in logic. See `CONTRIBUTING.md`.

The payoff is that a novel combination with no eponym still localises correctly, and adding a region
means editing tables rather than writing solver code.

## Coverage

**The whole neuraxis.** Cortex (by lobar subregion, with hemispheric dominance), subcortex, thalamus by
nucleus, hypothalamus by nucleus, basal ganglia, brainstem at three levels, cerebellum, the cord and
below it (cauda equina / conus), the skull base modelled as *foramina-as-sites*, each cranial nerve
along its own longitudinal course, the visual and pupillary pathways, the sympathetic chain, the motor
unit, roots, plexus and 18 named peripheral nerves (25 sites, once the segmented ones are split so a
proximal-vs-distal lesion localises).

A few mechanisms are worth knowing because they recur:

- **Crossing is layered.** A finding has a default side; a structure may override it, because the same
  pathway crosses differently by location — corticospinal is contralateral in the brainstem and
  *ipsilateral* in the cord, below its decussation. Most localisation bugs are crossing bugs.
- **Orthogonal axes annotate, they never localise.** The cord's dermatomal sensory level says *where
  along* the cord; papilloedema says *inside the skull*; the axon-length axis makes stocking-and-glove
  emerge (the fingertips sit at the same axon length as the knees) rather than storing it as a rule.
- **Syndromes nest.** The cavernous sinus is the superior-orbital-fissure set plus V2; the orbital apex
  is that plus the optic nerve. So V2 numbness and monocular visual loss are exactly what tell the three
  apart — by subset/superset parsimony, with no extra machinery.

## The app

Three modes, all consuming the same engine:

- **Localise** — enter findings from a nested exam tree and watch the differential *narrow*. Findings
  are constraints, not scores: one finding gives many candidate sites and each further finding
  intersects. Output is four cards — **Where · Why · What · Next steps** — plus a **Together** card
  when a picture genuinely needs more than one lesion, which first tries to talk you out of it.
- **Atlas** — browse a site and run the model forwards.
- **Code stroke** — a single-scroll cognitive-aid worksheet (clock, NIHSS, eligibility checklists,
  handover). Educational only; it never returns a treat/don't-treat verdict.

Cases are shareable: the URL hash *is* the case, so a link restores findings, onset, course, the
selected site and the selected pathology.

## Running

No dependencies, no build step, no test framework.

```bash
npm test
```

```bash
node app/serve.mjs
```

then <http://localhost:8137/app/>. Each test file is a standalone Node script that asserts with a local
`ok()` helper and exits non-zero on failure; `npm test` runs all 69 in sequence. A new suite goes in
`test/` and into the `test` script in `package.json`.

> On the original development Mac there is no system Node — see the runtime note at the top of
> `CLAUDE.md`. In a fresh clone anywhere else, `npm` and `node` work as normal.

## Layout

```
src/model/     the declarative anatomy tables — edit these to add coverage
  findings · structures · sites · levels · tracts · prevalence
  compartments · course · vascular · topography · substrate
src/engine/    generic solver code, rarely touched when adding a region
  forward · inverse (the single localiser) · score · tracts · patterns · multifocal · space
src/data/      the clinical content layers, each reviewable on its own
  syndromes (a phonebook, not a brain) · causes · nextSteps
  pathology/   one file per surgical-sieve category — the per-disease workups
  multifocal · multifocalNextSteps  — the cross-site layer
app/           zero-build teaching web app, a pure consumer of the engine
docs/          dated design specs, implementation plans, and the two published artifacts
```

`CLAUDE.md` is the authoritative account of what exists and why. `CONTRIBUTING.md` has the modelling
notes and the roadmap. Every increment has a dated spec and plan under `docs/superpowers/`.

## Status

**Beta (v0.9.0), deployed, and in clinician stress-testing.** The engine is complete across the
neuraxis and the clinical layers are complete and reviewed:

- ✅ **The anatomy model is clinically reviewed** — all 528 structures, 16 regions (2026-08-21). This was
  the last standing correctness gate, and it earned its keep: reading the model against a review sheet
  exposed a live crossing bug (a midbrain superior cerebellar peduncle lesion was emitting ataxia
  ipsilaterally; the SCP decussates in the caudal midbrain, so it is contralateral).
- ✅ **Causes, workup, the multi-location layer and all three pathology tranches are signed off.**

Two published artifacts visualise the model — a flow diagram and the anatomy review sheet — with their
HTML source and update workflow in `docs/artifacts/`.

**Not a medical device. Not for clinical use.** It is a teaching and reasoning aid, and every screen
says so.
