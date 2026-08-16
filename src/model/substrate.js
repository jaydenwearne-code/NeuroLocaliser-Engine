// substrate.js — WHAT TISSUE a disease attacks, and where that tissue exists.
//
// This replaced the "lesion pattern" axis after measurement (spec 2026-08-15 §4). Patterns described the
// SHAPE of a lesion set ("two masses", "two territories"), phrased as "every site is X" — which meant a
// mixed CNS+PNS picture could satisfy none of them. 74% of silent site pairs were mixed, and `cord + L5
// root` returned an empty card.
//
// The structural fix, and the owner's insight: vasculitis crosses the CNS/PNS boundary because its
// substrate — BLOOD VESSELS — exists on both sides of it. Metastases do not, because theirs does not.
// Distribution is a property of the target tissue, not of the disease's "shape". Giving vasculitis a
// `mass` pattern to make the mechanics work would have been attributing a non-vascular attribute to a
// vascular disease: fitting the disease to the model rather than modelling the disease.
//
// Substrates are DERIVED from the tables already authored (compartments, topography) rather than being a
// third hand-maintained list — so a newly added site inherits its substrates automatically.
//
// Spec: docs/superpowers/specs/2026-08-15-multifocal-pattern-axis-design.md §4
import { compartmentOf } from "./compartments.js";
import { topographyOf } from "./topography.js";

export const SUBSTRATES = [
  "vessel", "parenchyma", "leptomeninges", "myelin_cns", "schwann", "neuron_population", "motor_neuron",
];

const CNS_COMPARTMENTS = new Set(["brain", "brainstem", "cerebellum", "cord", "optic"]);
// `skull_base` belongs here: the cranial nerves running through those corridors are PERIPHERAL nerves,
// myelinated by Schwann cells — a vestibular schwannoma at the IAM is literally a Schwann-cell tumour.
// Leaving it out made NF2 unable to fire at all (its `sites` clause needs a skull-base site, and its
// substrate needs Schwann cells at every site), which the fire-rate measurement caught at 0.0%.
// The optic nerve is NOT affected: it is a CNS tract myelinated by oligodendrocytes, and the three optic
// skull-base parts are re-mapped to the `optic` compartment by COMPARTMENT_OVERRIDE in compartments.js.
const SCHWANN_COMPARTMENTS = new Set(["nerve", "root", "plexus", "skull_base"]);

// Which substrates exist AT this site. `motor_neuron` is deliberately absent: it is a property of the
// observed findings (upper + lower motor neurone signs), not of a place, so it is resolved by
// umnLmnPattern() in the engine rather than looked up here.
export function substratesAt(site) {
  const cmp = compartmentOf(site);
  const topo = topographyOf(site);
  const out = new Set();

  // Vessels run everywhere — this single line is why systemic vasculitis can reach the CNS and the PNS
  // in one illness, and it is a structural statement rather than a per-disease exception.
  out.add("vessel");

  if (CNS_COMPARTMENTS.has(cmp)) {
    out.add("myelin_cns");
    if (topo && topo.surface === false) out.add("parenchyma");
  }
  if (topo && topo.surface === true) out.add("leptomeninges");
  if (SCHWANN_COMPARTMENTS.has(cmp)) out.add("schwann");
  if (topo && topo.system) out.add("neuron_population");

  return out;
}

// The compartments a substrate naturally reaches, used to assert that an entity's `compartments`
// allow-list is strictly NARROWER than its substrate's footprint — an allow-list that merely restates its
// substrate looks meaningful but is not, and the two could later drift apart.
export function substrateFootprint(substrate, allSites) {
  const out = new Set();
  for (const s of allSites) if (substratesAt(s).has(substrate)) out.add(compartmentOf(s));
  return out;
}
