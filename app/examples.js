// examples.js — four worked cases, as pure data. Content lives here rather than in app.js so it can be
// unit-tested and clinically reviewed without reading UI code (same split as exam-map.js).
//
// CHOSEN SO EACH DEMONSTRATES A DIFFERENT OUTPUT CARD, not to be the four commonest presentations:
// where / the narrowing / next steps / together.
//
// The tokens are DERIVED from each site's own expectedFindings and then trimmed to a realistic bedside
// subset — hand-typing them produced a Wallenberg that resolved to Marie-Foix explaining 2 of 5 findings.
// test/examples.test.js asserts each one still teaches its point; do not edit tokens without running it.
export const EXAMPLES = [
  {
    id: "wallenberg",
    label: "Wallenberg",
    teaches: "one lesion, an eponym",
    // The full syndrome is 13 findings, which nobody records at the bedside. This is the clinically
    // representative six and still resolves 6/6.
    tokens: ["cn8_vertigo@left", "face_pain_loss@left", "spinothalamic@right",
             "ptosis@left", "miosis@left", "limb_ataxia@left"],
    onset: "hyperacute",
  },
  {
    id: "footdrop",
    label: "Foot drop",
    teaches: "narrow it down",
    // DELIBERATELY only the findings L5 and peroneal SHARE, so three candidates appear and none wins.
    // Adding weak hip abduction pins the root; adding deep peroneal sensory loss pins the nerve.
    tokens: ["weak_ankle_dorsiflexion@left", "weak_great_toe_extension@left", "weak_foot_eversion@left"],
  },
  {
    id: "cauda",
    label: "Cauda equina",
    teaches: "an emergency",
    tokens: ["saddle_anaesthesia@midline", "sphincter_dysfunction@midline",
             "radicular_pain@midline", "anal_wink_loss@midline"],
    onset: "acute",
  },
  {
    id: "twolesions",
    label: "Two lesions",
    teaches: "one disease, two places",
    tokens: ["weak_arm@right", "weak_leg@left"],
    onset: "subacute",
    course: "relapsing",
  },
];
