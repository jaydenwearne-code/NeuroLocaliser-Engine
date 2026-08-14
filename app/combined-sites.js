// combined-sites.js — resolves what the cross-site ("Together") card should show: the user's pinned pair,
// if two-plus pins are still present among the CURRENT candidate list, else the engine's own minimal cover
// (`r.multi`). Pure/DOM-free (no `S`, no `document`) so it is directly testable in node; app.js owns the
// pinned-id Set and passes it in.
//
// `source` tells the caller which one it is looking at — "pinned" | "cover" | null. A pinned id that has
// fallen out of the current candidate list (e.g. a finding changed and that site no longer fits) must NOT
// be reported as "pinned" — that would show a pair the differential no longer actually contains as if it
// were still live. It falls back to the engine's cover instead, same as if nothing were pinned.

export function combinedSites(r, list, pinned) {
  if (pinned && pinned.size >= 2) {
    const sites = list.filter(c => pinned.has(c.site.id)).map(c => c.site);
    if (sites.length >= 2) return { sites, source: "pinned" };
  }
  if (r.multi && r.multi.sites.length > 1) return { sites: r.multi.sites, source: "cover" };
  return { sites: [], source: null };
}
