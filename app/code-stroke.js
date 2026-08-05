// code-stroke.js — the code-stroke worksheet (a clinician's cognitive aid). Pure consumer of stroke-data,
// stroke-logic, and the localiser. Educational only — never a treat/don't-treat verdict. See the spec.
import { NIHSS_ITEMS, MIMICS, GUIDELINE_CITE } from "./stroke-data.js";
import { nihssTotal, nihssToFindings, timeWindows, lvoScreen } from "./stroke-logic.js";

let clockTimer = null;
export function stopStrokeClock(){ if (clockTimer){ clearInterval(clockTimer); clockTimer = null; } }

export function renderCodeStroke(ctx) {
  const { S, app, esc } = ctx;
  const st = S.stroke;
  app.innerHTML = `
    <div class="cs-banner"><b>Educational cognitive aid</b> — not a medical device, and not a substitute for clinical judgement or your local stroke protocol. Criteria from the ${esc(GUIDELINE_CITE)}; verify before acting. Nothing you enter leaves this browser.</div>
    <div class="cs-header" id="csHeader"></div>
    <div class="cs-sec"><h3>Intake</h3>
      <div class="cs-grid">
        ${field("age","Age","number",st.age)}
        ${field("lkw","Last known well","datetime-local",st.lkw)}
        ${field("mrs","Pre-stroke mRS (0–5)","number",st.mrs)}
        ${field("sbp","Systolic BP","number",st.sbp)}
        ${field("dbp","Diastolic BP","number",st.dbp)}
        ${field("glucose","Glucose (mg/dL)","number",st.glucose)}
      </div>
    </div>
    <div class="cs-sec"><h3>Before you commit — mimics</h3><ul class="cs-mimic">${MIMICS.map(m=>`<li>${esc(m)}</li>`).join("")}</ul></div>
    <div class="cs-sec"><h3>NIHSS</h3><div id="csNihss">${NIHSS_ITEMS.map(nihssRow).join("")}</div></div>
    <div class="cs-sec"><h3>Likely syndrome / LVO</h3><div id="csLoc"></div></div>
    <div class="cs-sec"><h3>Time windows</h3><div id="csWin"></div></div>
    <div class="cs-sec"><h3>Thrombolysis eligibility</h3><div id="csIvt"></div></div>
    <div class="cs-sec"><h3>Thrombectomy eligibility</h3><div id="csEvt"></div></div>
    <div class="cs-sec"><h3>Acute management (reference)</h3><div id="csMgmt"></div></div>
    <div class="cs-sec"><h3>Handover summary</h3><textarea class="cs-handover" id="csHandover" readonly></textarea><button class="report-btn" id="csCopy" style="margin-top:6px">Copy</button></div>`;

  function field(id,label,type,val){ return `<div class="cs-field"><label>${esc(label)}</label><input data-fld="${id}" type="${type}" value="${esc(val??"")}"></div>`; }
  function nihssRow(item){
    if (item.side) return `<div class="cs-nihss-row"><span class="lbl">${esc(item.label)}</span>${sel(item.id+"L","L",item)}${sel(item.id+"R","R",item)}</div>`;
    return `<div class="cs-nihss-row"><span class="lbl">${esc(item.label)}</span>${sel(item.id,"",item)}</div>`;
  }
  function sel(key,tag,item){ const cur=S.stroke.nihss[key]??0;
    return `<label style="font-size:10px;color:var(--muted)">${tag}<select data-nihss="${key}">${item.options.map(o=>`<option value="${o.score}"${o.score===cur?" selected":""}>${o.score} · ${esc(o.label)}</option>`).join("")}</select></label>`; }

  // wire inputs
  app.querySelectorAll("[data-fld]").forEach(el => el.oninput = e => { S.stroke[e.target.dataset.fld] = e.target.value; recompute(ctx); });
  app.querySelectorAll("[data-nihss]").forEach(el => el.onchange = e => { S.stroke.nihss[e.target.dataset.nihss] = Number(e.target.value); recompute(ctx); });
  app.querySelector("#csCopy").onclick = () => { navigator.clipboard?.writeText(app.querySelector("#csHandover").value); };

  stopStrokeClock();
  clockTimer = setInterval(() => paintHeader(ctx), 1000);
  recompute(ctx); // fills header + all output panels (Task 7)
}
