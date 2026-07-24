# NeuroLocaliser — anatomical engine (proof of concept)

A lesion-localisation engine that **derives** syndromes from neuroanatomy, rather than
storing a hand-authored list of syndromes. This POC models the **brainstem**.

## Why this architecture

The earlier prototype matched observed findings against a fixed catalogue of named
syndromes. Every syndrome had to be written in by hand, so the engine could only ever
recognise what its author had pre-enumerated, and its notion of "location" was a handful
of coarse buckets.

This engine instead represents the anatomy itself:

- **structures** — nuclei, tracts, nerve fascicles: what function each carries, and whether
  that function is already crossed at brainstem level (so a lesion produces an ipsilateral
  vs contralateral deficit);
- **sites** — discrete anatomical locations (e.g. *left rostral midbrain, paramedian*), each
  containing a set of structures and belonging to a vascular territory;
- a **forward model** — given a lesion at a site, which findings would you expect?
- an **inverse solver** — given observed findings, which single site best explains them, and
  if no single site does, what is the smallest set of sites that does (multifocal)?

Named syndromes (Weber, Wallenberg, …) are **not** encoded as rules. They *emerge*: when the
solver localises to "left medial midbrain" it recognises the resulting deficit set as Weber
by looking it up in a thin descriptive layer. If a novel combination arises that has no
eponym, the engine still localises it correctly — it just won't have a name for it.

## Layers

```
src/
  model/
    findings.js      canonical list of examinable findings (the vocabulary)
    structures.js    anatomical structures: function carried, crossing status
    sites.js         anatomical sites: structures present + vascular territory
  engine/
    forward.js       site -> expected findings (lesion simulation)
    inverse.js       observed findings -> ranked single sites + minimal multi-site set
    score.js         fit scoring shared by forward/inverse
  data/
    syndromes.js     thin descriptive layer: deficit-signature -> eponym + clinical notes
test/
  engine.test.js     classic brainstem syndromes must emerge from lesion sites
```

## Running

```
node app/serve.mjs            # the prototype web app → http://localhost:8137/app/  (Where · Why · What + Atlas)
npm test                      # runs all three emergence suites, no dependencies
node test/engine.test.js      # brainstem syndromes
node test/cord.test.js        # spinal cord syndromes
node test/sensory-level.test.js  # dermatomal sensory-level mechanism
node test/central-cord.test.js   # central cord / syringomyelia
node test/cauda-conus.test.js    # cauda equina / conus medullaris
node test/cortex.test.js         # cerebral cortex (lobar map, dominance, Anton/Balint)
node test/subcortex.test.js      # subcortex (capsule/thalamus/optic radiation; lacunes)
node test/cranial-nerves.test.js # cranial nerves / skull base (foramina as sites)
node test/motor-unit.test.js     # motor unit (anterior horn / NMJ / muscle)
node test/pns.test.js            # PNS — roots (radiculopathy) & length-dependent polyneuropathy
node test/pns-nerves.test.js     # PNS — brachial/LS plexus & named peripheral nerves (movement-based)
node test/reflexes.test.js       # non-muscle reflexes — Babinski/Hoffmann, sacral, frontal release
node test/tone.test.js           # tone & wasting — the UMN-vs-LMN axis (spasticity / hypotonia / wasting)
node test/nerve-segments.test.js # complete nerve innervation + level segments (radial/ulnar/median/peroneal)
node test/visual-pathway.test.js # visual pathway (chiasm/tract/LGN) + afferent RAPD
node test/pupil-efferent.test.js # pupillary efferent — CN III pupil-involving/sparing, Adie, Argyll Robertson
node test/horner-axis.test.js    # sympathetic / Horner 3-order axis (central/preganglionic/postganglionic + Pancoast)
node test/basal-ganglia.test.js  # basal ganglia (nigra→parkinsonism, striatum→chorea, GP→dystonia, STN→hemiballismus)
node test/cerebellum.test.js     # cerebellum organ (hemisphere/vermis/flocculonodular + pancerebellar)
node test/nystagmus.test.js      # nystagmus taxonomy (peripheral/gaze-evoked/downbeat/upbeat, multi-source)
node test/parinaud.test.js       # dorsal midbrain / pretectal (Parinaud) — vertical gaze palsy, nesting
node test/consciousness.test.js  # reduced level of consciousness — ARAS / thalamus / diffuse / locked-in
node test/trigeminal.test.js     # trigeminal complex (pontine main-sensory + motor V; Marie-Foix union)
node test/trochlear.test.js      # trochlear nucleus (contralateral SO palsy + INO) vs peripheral nerve
node test/guillain-mollaret.test.js # Guillain-Mollaret triangle — palatal/oculopalatal tremor (broad + corners)
node test/aphasia.test.js        # aphasia taxonomy — 8 classic (feature-based) + subcortical
node test/frontal.test.js        # frontal lobe by region — premotor/SMA/paracentral (+ prefrontal trio)
node test/lobes.test.js          # parietal/temporal/occipital completeness — apraxias, deafness, Kluver-Bucy, fusiform
node test/thalamus-hypothalamus.test.js # thalamic nuclei (VA/VL, VPM, pulvinar, anterior/DM) + hypothalamus by region
node test/callosal.test.js       # corpus callosum — callosal disconnection (split-brain) syndrome
node test/tier1-completeness.test.js # CN I olfactory (anosmia/Foster-Kennedy), insula, basis-pontis lacunes (ataxic hemiparesis / dysarthria-clumsy-hand)
node test/vestibular-hints.test.js # vestibular HINTS — peripheral vs central AVS (head-impulse / skew), canal-specific BPPV
node test/tier2-brainstem.test.js # Tier 2 — pseudobulbar palsy + abducens nucleus (nuclear-VI gaze palsy)
node test/tier2-cord-combined.test.js # Tier 2 — SCD (B12) + Friedreich (tract-selective combined degenerations)
node test/tier2-lacunar.test.js  # Tier 2 — corona radiata (white-matter lacune)
node test/tier2-pns-depth.test.js # Tier 2 — C3/4+phrenic, middle trunk, thoracic/sacral roots, pudendal, saphenous/sural
node test/tier2-cortical.test.js # Tier 2 — cortical hand-knob (pseudo-peripheral hand)
node test/tier2-deferred.test.js # Tier 2 — brachial plexus cords, optic field geometry (AION/neuritis), cortical sensory hand
node test/causes.test.js         # aetiology layer — tempo-aware surgical-sieve causesFor(site, {onset})
node test/app-smoke.test.js      # exam-map integrity (every finding real; lobe/brainstem/fatiguability taxonomy)
node test/raw-observations.test.js # raw-observations refactor acceptance (clusters emerge from raw primitives)
node test/patterns.test.js       # cross-cutting synthesis — UMN vs LMN (mixed → MND) + functional (FND) flag
node test/relaxation.test.js     # drop-1 (non-localising) near-fit before declaring multifocal
node test/next-steps.test.js     # educational next-steps — investigations + urgency + referral
node test/differential.test.js   # narrowing differential + explainAll/display/defaultSite (engine-owned)
```

## Status

Proof of concept. Covers the **brainstem** (3 levels x 2 territories x 2 sides) and the
**spinal cord** core four — Brown-Séquard, anterior cord/ASA, posterior column/SCD and
transverse myelopathy — which emerge from two cord-specific mechanisms: per-structure crossing
(the corticospinal tract and dorsal columns are ipsilateral below their decussation, the
opposite of the brainstem) and bilateral/midline sites. The cord carries a dermatomal **sensory
level** (orthogonal to the cross-sectional pattern): given a stated sensory level the engine pins
the segment (e.g. Brown-Séquard at ~T10), otherwise it reports the level as undetermined. Central
cord / syringomyelia now emerges too — bilateral, suspended (cape-like) dissociated pain/temperature
loss with preserved dorsal columns and sacral sparing — from a commissural spinothalamic structure.
The below-cord region now emerges too — cauda equina (pure LMN roots:
flaccid weakness, saddle anaesthesia, sphincter loss, radicular pain) and conus medullaris (mixed
UMN+LMN with early symmetric saddle/sphincter), distinguished by a UMN-vs-LMN finding split.
The cerebral cortex now emerges too — organised by lobar subregion (motor/sensory somatotopy, the
dominant↔non-dominant mirror of Broca↔dysprosody, Wernicke↔dysprosody and Gerstmann↔neglect, plus
frontal behavioural and temporal limbic signs and the superior/inferior quadrantanopias), with
vascular territory kept as a separate annotation so ACA/MCA/PCA stroke syndromes emerge as composites
while focal-lobe syndromes localise on their own. Hemispheric dominance is a `solve()` option
(default left), and the bilateral occipital/parietal syndromes (Anton's, Balint's) emerge from
both-hemispheres sites.
The subcortex now emerges too — internal capsule, VPL thalamus, subthalamic nucleus and the deep
optic radiation. Its headline, the **cortical-vs-subcortical distinction** (a dense contralateral
face+arm+leg hemiparesis with *no* cortical signs → pure motor lacune in the internal capsule),
emerges from parsimony with **no new solver mechanism** — the first region added by anatomy tables
alone (a new `subcortex` level plus a deep-vascular composer for the sensorimotor lacune and the
anterior-choroidal hemiplegia/hemianaesthesia/hemianopia triad). Pure sensory loss localises to the
VPL thalamus, with central pain marking Déjerine–Roussy; hemiballismus localises to the subthalamic
nucleus.
The skull base now emerges too — the extra-axial cranial nerves, organised by the bony foramen or
compartment they thread (superior orbital fissure, cavernous sinus, orbital apex, jugular foramen,
hypoglossal canal, carotid space, cerebellopontine angle). This is *foramina-as-sites*, the peripheral
analogue of shared vascular territory: nerves sharing a canal fail together, and the nested syndromes
derive by union — the cavernous sinus is the superior-orbital-fissure set plus V2, the orbital apex is
that set plus the optic nerve, so V2 cheek numbness and monocular visual loss are exactly what tell the
three apart. The lower-cranial-nerve staircase (Vernet → Collet-Sicard → Villaret) and the
cerebellopontine-angle picture (VII + sensorineural hearing loss + corneal) emerge the same way, and an
isolated cranial-nerve palsy is disambiguated nuclear-vs-peripheral by the company it keeps.
Each nerve also has a *longitudinal* axis — sites along its own course, told apart by which branch is
spared (the same mechanism as the limb nerve-segments). A facial palsy localises down the temporal bone by
what drops out in turn: lacrimation (geniculate), then hyperacusis (stapedius), then taste (chorda), to a
pure-motor palsy at the stylomastoid foramen (Bell's) — with hearing loss placing it back at the internal
acoustic meatus. The trigeminal splits into its divisions (V1/V2/V3-ovale, or the whole Gasserian
ganglion), the abducens picks up a petrous-apex (Gradenigo) level, the vagus separates a palate-sparing
recurrent-laryngeal lesion from a high vagal one, the accessory an SCM-sparing posterior-triangle lesion,
and IX vs X fall out of the gag reflex (afferent IX, efferent X).
The pure-motor end of the motor unit now emerges too — anterior horn cell, the neuromuscular junction
(post- and pre-synaptic) and muscle. These are generalised, symmetric conditions, so each is a bilateral
site, and the localiser is the pattern: fasciculations + flaccid areflexic weakness point to the anterior
horn (modelled as pure lower motor neurone), fatigable weakness to myasthenia, post-exercise facilitation
plus autonomic features to Lambert-Eaton, and bare proximal weakness to a myopathy by parsimony. Two
deliberate modelling calls keep the anatomy honest: the anterior horn carries no upper-motor-neurone
signs (so ALS, a UMN+LMN pathology, is left for a future pathology layer rather than baked in as a site),
and fasciculations are treated as a general lower-motor-neurone sign that does not localise.
The sensory-bearing peripheral nervous system now begins to emerge — nerve roots (radiculopathy, C5–T1
and L2–S1) and length-dependent polyneuropathy. Roots are localised the way cortical subregions are: the
segment falls out of which dermatome, myotome and reflex are affected, so a C7 picture (middle finger,
triceps) localises to the C7 root and a dermatome–myotome mismatch instead surfaces as a two-root
(multifocal) hypothesis. Polyneuropathy brings the one genuinely new mechanism the peripheral chain
needs: an orthogonal axon-length axis (`nerveLength.js`, the twin of the cord sensory level) in which the
fingertips sit at the same axon length as the knees — so the stocking-and-glove pattern *emerges* (the
hands are recruited exactly when the ascending deficit reaches the knees), rather than being stored as a
rule. This increment also demoted `lmn_weakness` to a general, non-localising lower-motor-neurone sign,
so the specific sensory findings do the localising.
The focal peripheral nervous system completes the picture — the brachial and lumbosacral plexus and the
named upper- and lower-limb nerves. To make the discriminators emerge, the weakness vocabulary is
movement-based (`weak_ankle_dorsiflexion`, `weak_foot_inversion`, `weak_thumb_abduction`…), shared by
roots and nerves: an L5 root and a common peroneal nerve both cause foot drop, but only the root also
weakens inversion and hip abduction, so the peroneal nerve wins a foot-drop picture that spares them —
and the distinct cutaneous territory pins the nerve. The plexus trunks are plain composites of their
roots (Erb = C5∪C6, Klumpke = C8∪T1), so a two-adjacent-root pattern is explained by one trunk rather
than two separate roots. Fourteen named nerves are covered, from the axillary and musculocutaneous to
the common peroneal and tibial, including the pure-motor ones (long thoracic → winged scapula, superior
gluteal → Trendelenburg) that localise by their movement pattern alone.
Muscle tone and wasting now complete the upper- vs lower-motor-neurone axis. Spasticity (increased,
clasp-knife tone) is a corticospinal companion at every level the tract is modelled — non-localising,
crossing with the tract (contralateral in the brainstem, ipsilateral in the cord) exactly like the
Babinski/Hoffmann release signs. On the lower-motor side the two signs are deliberately given different
footprints: hypotonia (flaccidity) attaches only where reduced tone is a real bedside finding — the
generalised-flaccid sites (anterior horn, cauda equina, polyneuropathy) — whereas wasting attaches to
the whole lower-motor set including individual roots and named motor nerves, because a focal root or
nerve lesion classically wastes and areflexes without a detectable tone change. Wasting requires
innervated muscle, so it is absent from the pure-sensory lateral femoral cutaneous nerve, the
neuromuscular junction (weakness without wasting) and the UMN side entirely — so no single site
produces both spasticity and wasting, which is exactly why a mixed UMN+LMN picture (ALS) must span two
sites, the precursor the future pathology layer will name.
Each named nerve now carries its full motor innervation, and the four classically-segmented nerves are
split into level segments so the proximal-vs-distal lesion localises: radial (axilla with triceps →
spiral groove with the triceps spared → posterior interosseous with the wrist extension and sensation
spared), median (proximal → anterior interosseous, pure motor → carpal tunnel with palmar sparing),
ulnar (elbow → wrist/Guyon), and common peroneal (common → deep vs superficial). A proximal segment is
the superset of the distal one, so the spared muscle or cutaneous branch is the localiser — pure
parsimony, no new mechanism. The ulnar paradox falls out of the anatomy: because the wrist lesion spares
FDP 4/5, the intact long flexors claw the fingers harder, so the ulnar claw is emitted by the distal
(wrist) segment and the more distal lesion looks worse.
The visual pathway now emerges as a field-defect-geometry localiser: the chiasm (bitemporal hemianopia,
a parasellar/pituitary lesion), the optic tract and lateral geniculate (contralateral homonymous
hemianopia) join the existing optic nerve, radiations and occipital cortex. The organising sign is the
afferent RAPD: because the pupil fibres leave the pathway at the optic tract, an RAPD accompanies an
optic-nerve or optic-tract lesion but not an LGN, radiation or occipital one — so a homonymous hemianopia
WITH an RAPD localises to the optic tract, while macular sparing marks the occipital (PCA) terminus and a
bare featureless hemianopia stays retrochiasmal-unspecified. The pupillary efferent (parasympathetic) limb now localises too: because the light-reflex fibres run on
the surface of the third nerve, a CN III palsy WITH a fixed dilated pupil is compressive (aneurysm — a
surgical emergency) while a pupil-sparing one is ischaemic (microvascular); an isolated tonic dilated
pupil with light-near dissociation is an Adie (ciliary ganglion) pupil, and small bilateral pupils with
light-near dissociation are Argyll Robertson (dorsal midbrain). The sympathetic pathway now localises Horner's syndrome along its three neurons by the anhidrosis
distribution: a hemibody-anhidrosis Horner is central (lateral medulla, or — with a cervical sensory
level — the lateral cord), facial anhidrosis with the body spared is preganglionic (stellate ganglion),
and an isolated Horner with no anhidrosis is postganglionic (carotid dissection). The cord's
oculosympathetic is modelled as a level-gated finding — the first time the sensory level gates emission
rather than only annotating it — so a cervical Brown-Séquard produces a Horner while a thoracic one does
not, and Pancoast emerges as the union of the preganglionic sympathetic and the C8/T1 lower trunk.
The dorsal midbrain now completes the brainstem's vertical-gaze map — **Parinaud (pretectal) syndrome**
emerges by the same skull-base nesting the foramina use. A new tectal site carries the supranuclear
**vertical gaze palsy** (+ convergence-retraction nystagmus and Collier's lid retraction); the full
**Parinaud** picture is the *union* of that tectal site with the pre-existing pupillary pretectum relay
(light-near dissociation), so the pretectum's isolated Argyll Robertson pupil is the pupillary subset and
Parinaud is the superset — an isolated vertical gaze palsy localises to the tectum, an isolated light-near
dissociation still localises to Argyll Robertson, and the whole tetrad resolves to the single Parinaud
site rather than a two-site cover. No new solver mechanism (subset⊆superset parsimony).
**Reduced level of consciousness** now emerges too — a different *kind* of finding (arousal, not a
lateralised deficit). Coma localises to the ascending reticular activating system: the brainstem **ARAS**
(a single midline paramedian tegmental lesion, carrying decerebrate posturing), the **bilateral paramedian
thalamus** (artery of Percheron, with vertical gaze palsy), or **diffuse bihemispheric** cortex — while a
*unilateral* hemispheric or thalamic lesion impairs nothing, which falls straight out of the existing
`bilateralOnly` gate (a structure that emits only on a both-sides site). **Locked-in** is the emergent
ventral-vs-tegmental contrast: a bilateral basis-pontis lesion gives quadriplegia with *preserved*
consciousness (the dorsal ARAS is spared), pinned by a positive `preserved_vertical_gaze` hallmark. So
isolated impaired arousal reads as diffuse/metabolic, arousal + posturing as brainstem ARAS, arousal +
vertical gaze palsy as Percheron, and quadriplegia + preserved gaze as locked-in — no new solver mechanism.
Two brainstem gaps close the map: the **pontine trigeminal complex** (the main sensory nucleus → facial
*touch*, the motor nucleus → jaw weakness) emerges as its own site *and* as a union with the lateral pons
(Marie-Foix), giving the facial analogue of the cord's touch-vs-pain/temp dissociation (touch = pons main
sensory nucleus, pain/temperature = medullary spinal nucleus); and the **trochlear (CN IV) nucleus** — CN
IV fully decussates, so a *nuclear* lesion emits a **contralateral** superior oblique palsy (from a
per-structure crossing override) with an adjacent ipsilateral INO, distinguished from the ipsilateral
peripheral trochlear nerve (an isolated superior oblique palsy).
The **Guillain-Mollaret triangle** (dentato-rubro-olivary loop) now emerges too — **palatal / oculopalatal
tremor** is a *shared* finding across the loop, so an isolated palatal (± pendular) tremor localises
**broadly to the triangle** (hypertrophic olivary degeneration, commonest lesion the central tegmental
tract), while palatal tremor **with node-specific company** sharpens to the **red-nucleus (rubral) corner**
(+ contralateral rubral tremor) or the **dentate (cerebellar) corner** (+ ipsilateral cerebellar signs) —
the broad-default / sharp-with-company pattern, built from superset/subset parsimony with no new mechanism.
The **aphasia taxonomy** is now complete rather than just Broca/Wernicke: language is decomposed into four
examinable **features** — fluency, comprehension, repetition, naming — and the **8 classic aphasias** *emerge*
from which features co-occur at a site. **Repetition is the master discriminator** (perisylvian lesions
impair it; transcortical/watershed lesions spare it), so the transcortical syndromes win by parsimony when
`repetition_impaired` is absent from the input. Broca, Wernicke, conduction (arcuate fasciculus), global
(the perisylvian union), transcortical motor/sensory (the two watershed zones), mixed transcortical (both
watersheds), and anomic (angular gyrus) all fall out of the feature lattice; two **subcortical** aphasias
(thalamic, striatocapsular) emerge when the aphasia feature accompanies the subcortical company (contralateral
sensory loss or hemiparesis). No new solver mechanism.
The **frontal lobe** is now complete by region: alongside primary motor, Broca, the frontal eye field and
the prefrontal trio (DLPFC → dysexecutive, medial PFC / cingulate → abulia, orbitofrontal → disinhibition),
the motor-frontal tier now emerges — **premotor cortex** → limb (motor) apraxia, **supplementary motor area**
→ the SMA syndrome (alien limb) — as does the **superomedial frontal / paracentral** micturition-and-gait
region → cortical urinary incontinence + frontal gait apraxia (the parasagittal / NPH picture).
The **parietal, temporal and occipital** lobes are now filled to match: the parietal apraxias (dominant
ideomotor, non-dominant dressing); the bilateral temporal syndromes (cortical deafness at the primary
auditory cortex, Klüver-Bucy at the anterior temporal / amygdala); and a proper **fusiform / ventral
occipitotemporal "what" stream** — visual object agnosia and cerebral achromatopsia (bilateral),
prosopagnosia (non-dominant, relocated to its correct home) and alexia without agraphia / pure alexia
(dominant visual word form area). The bilateral syndromes reuse the Anton/Balint `bilateralOnly` mechanism;
the lateralised ones reuse dominance gating.
The **thalamus** is now mapped by nucleus — beyond the VPL sensory relay, the intralaminar/paramedian arousal
nuclei (Percheron) and the LGN, it adds the VPM (crossed facial sensory), the VA/VL motor relay (thalamic
tremor), the pulvinar (thalamic neglect) and the anterior/dorsomedial nuclei (diencephalic amnesia) — on a
dedicated `thalamus` level so the deep VPL relay is untouched. And the **hypothalamus** now exists as a
region by nucleus: supraoptic/paraventricular (diabetes insipidus), anterior/posterior (thermoregulation),
ventromedial (hyperphagia), lateral (narcolepsy), suprachiasmatic (circadian), mammillary bodies (amnesia,
Wernicke-Korsakoff) and tuberal/arcuate (endocrine) — built as midline sites.
**Disconnection syndromes** turn out to need no new machinery — a white-matter tract is just another site
and the disconnection deficit is the finding it emits, so conduction aphasia (arcuate), pure alexia
(splenium/VWFA), the transcortical/isolation aphasias (watershed) and INO (MLF) already emerge that way; the
**corpus callosum** now completes the set — the callosal disconnection (split-brain) syndrome, anterior
(left-hand apraxia/agraphia, alien hand) and splenial (left-hand tactile anomia), as midline tract sites. A
pathology layer (ALS and friends) and a non-organic (functional) layer are the remaining pieces.
The mechanism is complete; anatomical coverage is deliberately
narrow so the approach can be judged before committing to the full neuraxis. The anatomy tables
(`structures.js`, `sites.js`) still need review by a neuroanatomist/neurologist. Not a medical
device; not for clinical use.
