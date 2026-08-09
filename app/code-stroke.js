// code-stroke.js — the code-stroke worksheet (a clinician's cognitive aid). Pure consumer of stroke-data,
// stroke-logic, and the localiser. Educational only — never a treat/don't-treat verdict. See the spec.
import { NIHSS_ITEMS, MIMICS, GUIDELINE_CITE, THROMBOLYSIS_CRITERIA, THROMBECTOMY_CRITERIA, THROMBECTOMY_CONSIDERATIONS, ACUTE_MGMT } from "./stroke-data.js";
import { nihssTotal, nihssToFindings, timeWindows, lvoScreen, evalAuto, eligibilitySummary, buildHandover } from "./stroke-logic.js";

const WIN_LABELS = { ivtStandard:"IV thrombolysis ≤4.5 h", ivtExtended:"IVT extended 4.5–9 h / wake-up", evtEarly:"Thrombectomy ≤6 h", evtExtended:"Thrombectomy 6–24 h (selected)" };

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
        ${field("glucose","Glucose (mmol/L)","number",st.glucose)}
        <div class="cs-field"><label>Affected side</label><select data-fld="affectedSide">${
          [["","auto (from motor)"],["left","left"],["right","right"]].map(([v,l])=>`<option value="${v}"${st.affectedSide===v?" selected":""}>${l}</option>`).join("")
        }</select></div>
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

function paintHeader(ctx){
  const { S, app } = ctx; const st = S.stroke; const h = app.querySelector("#csHeader"); if (!h) return;
  const tw = timeWindows(st.lkw ? new Date(st.lkw).toISOString() : null, Date.now());
  const total = nihssTotal(st.nihss); const lvo = lvoScreen(st.nihss);
  const clk = tw.elapsedMin == null ? "—:—<small> enter last-known-well</small>" : `${String(Math.floor(tw.elapsedMin/60)).padStart(2,"0")}:${String(tw.elapsedMin%60).padStart(2,"0")}<small> since LKW</small>`;
  h.innerHTML = `<span class="cs-clock">${clk}</span><span class="cs-stat">NIHSS <b>${total}</b></span><span class="cs-lvo ${lvo.likely?"pos":"neg"}">${lvo.likely?"LVO screen +":"LVO screen –"}</span>`;
}

function recompute(ctx){
  const { S, app, esc, siteName, solve } = ctx; const st = S.stroke;
  paintHeader(ctx);
  const total = nihssTotal(st.nihss);
  const tw = timeWindows(st.lkw ? new Date(st.lkw).toISOString() : null, Date.now());
  const lvo = lvoScreen(st.nihss);

  // localisation via the existing engine
  let topSite = "";
  try {
    const findings = nihssToFindings(st.nihss, S.dominant, st.affectedSide);
    if (findings.size) { const r = solve(findings, { dominantSide: S.dominant }); topSite = r.display[0] ? siteName(r.display[0].site) : "";
      app.querySelector("#csLoc").innerHTML = `<div class="cs-summary"><b>Likely:</b> ${esc(topSite||"—")}${lvo.likely?` · <span style="color:var(--contra);font-weight:700">LVO likely — activate stroke team / thrombectomy centre</span>`:""}</div><p class="derived" style="margin-top:4px">A low NIHSS does not exclude a posterior-circulation (basilar) LVO. Screen, not a diagnosis.</p>`; }
    else {
      // Items 3/4/7/8/11 (visual/facial/sensory/ataxia/gaze/extinction) carry no side in the NIHSS, so the
      // bridge can only place them once a motor score anchors the affected side. Say so, rather than reading
      // as "nothing found".
      const sideless = ["visual","facial","sensory","ataxia","gaze","extinction"].some(k => Number(S.stroke.nihss[k]) > 0);
      app.querySelector("#csLoc").innerHTML = sideless
        ? `<div class="empty">Lateralised deficits entered, but no side to place them — add a motor score or set <b>Affected side</b> above to localise. (LVO screen + windows still apply.)</div>`
        : `<div class="empty">Enter NIHSS to estimate localisation.</div>`;
    }
  } catch { app.querySelector("#csLoc").innerHTML = `<div class="empty">—</div>`; }

  // time windows
  app.querySelector("#csWin").innerHTML = Object.keys(WIN_LABELS).map(k => {
    const w = tw[k]; const txt = w.status === "unknown" ? "enter LKW" : w.status === "closed" ? "closed" : `${w.status} · ${w.minsLeft} min left`;
    return `<div class="cs-win"><span>${esc(WIN_LABELS[k])}</span><span class="${w.status}">${esc(txt)}</span></div>`;
  }).join("") + `<p class="derived" style="margin-top:6px">Targets: door-to-needle ≤60 min; door-to-groin as fast as possible.</p>`;

  // eligibility — derived inputs
  const num = v => v === "" || v == null ? null : Number(v);
  const derived = { age:num(st.age), mrs:num(st.mrs), nihssTotal:total, sbp:num(st.sbp), dbp:num(st.dbp), glucose:num(st.glucose),
    windowIVT: tw.ivtStandard.status==="unknown"?null:(tw.ivtStandard.status!=="closed"||tw.ivtExtended.status!=="closed"),
    windowEVT: tw.evtEarly.status==="unknown"?null:(tw.evtEarly.status!=="closed"||tw.evtExtended.status!=="closed") };
  app.querySelector("#csIvt").innerHTML = critPanel(THROMBOLYSIS_CRITERIA, derived, st.thrombolysisTicks, ctx);
  app.querySelector("#csEvt").innerHTML = critPanel(THROMBECTOMY_CRITERIA, derived, st.thrombectomyTicks, ctx)
    + `<div class="cs-consider"><h4 class="ns-h">Considerations / expanded indications</h4>${
        THROMBECTOMY_CONSIDERATIONS.map(x => `<div class="cs-summary">${esc(x.label)} <span class="cite">${esc(x.cite)}</span></div>`).join("")
      }</div>`;
  wireTicks(app.querySelector("#csIvt"), st.thrombolysisTicks, ctx);
  wireTicks(app.querySelector("#csEvt"), st.thrombectomyTicks, ctx);

  // reference cards
  app.querySelector("#csMgmt").innerHTML = ACUTE_MGMT.map(m => `<div class="cs-summary"><b>${esc(m.title)}.</b> ${esc(m.body)} <span class="cite" style="display:block;font-size:10px;color:var(--faint)">${esc(m.cite)}</span></div>`).join("<hr style='border:0;border-top:1px solid var(--line);margin:8px 0'>");

  // handover
  const ivtS = eligibilitySummary(THROMBOLYSIS_CRITERIA, derived, st.thrombolysisTicks);
  const evtS = eligibilitySummary(THROMBECTOMY_CRITERIA, derived, st.thrombectomyTicks);
  const summ = s => `${s.met} met / ${s.notMet} not-met / ${s.needInfo} need-info${s.contraPresent.length?` · ${s.contraPresent.length} contraindication(s) present`:""}`;
  app.querySelector("#csHandover").value = buildHandover(
    { lkw:st.lkw, age:st.age, mrs:st.mrs, sbp:st.sbp, dbp:st.dbp, glucose:st.glucose },
    { elapsedMin:tw.elapsedMin, nihssTotal:total, topSite, lvo:lvo.likely, ivtSummary:summ(ivtS), evtSummary:summ(evtS) });
}

function critPanel(criteria, derived, ticks, ctx){
  const { esc } = ctx;
  const rows = criteria.map(c => {
    if (c.kind === "contra") { const on = ticks.has(c.id);
      return `<label class="cs-crit"><input type="checkbox" data-tick="${c.id}"${on?" checked":""}><span class="mark">${on?"⚠":""}</span><span>${esc(c.label)} <span class="cite">${esc(c.cite)}</span></span></label>`; }
    const v = c.auto ? evalAuto(c.auto, derived) : (ticks.has(c.id) ? true : null);
    const mark = v === true ? "✓" : v === false ? "✗" : "?";
    const manualBox = c.auto ? "" : `<input type="checkbox" data-tick="${c.id}"${ticks.has(c.id)?" checked":""}>`;
    return `<label class="cs-crit">${manualBox}<span class="mark">${mark}</span><span>${esc(c.label)} <span class="cite">${esc(c.cite)}</span></span></label>`;
  }).join("");
  const s = eligibilitySummary(criteria, derived, ticks);
  return rows + `<div class="cs-summary"><b>${s.met}</b> met · <b>${s.notMet}</b> not-met · <b>${s.needInfo}</b> need-info${s.contraPresent.length?` · <span style="color:var(--contra)"><b>${s.contraPresent.length}</b> contraindication(s) present</span>`:""}. <span class="derived">Not a verdict — confirm against the guideline + local protocol.</span></div>`;
}

function wireTicks(container, ticks, ctx){
  container.querySelectorAll("[data-tick]").forEach(el => el.onchange = e => {
    const id = e.target.dataset.tick; e.target.checked ? ticks.add(id) : ticks.delete(id); recompute(ctx);
  });
}
