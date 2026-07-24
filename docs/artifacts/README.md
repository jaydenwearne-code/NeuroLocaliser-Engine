# Published artefacts (source of truth)

Two Claude Artifacts visualise the engine. Their HTML lives **here** (durable, versioned with the
code) — edit these files, then republish to the **same URL** so the link is preserved. They were
previously kept only in a session scratchpad, which is transient; keep editing them here.

| File | What it is | Favicon | URL (republish in place) |
|---|---|---|---|
| `architecture.html` | Flow diagram — input → `solve()` pipeline → output, worked Brown-Séquard example, coverage strip | 🧠 | https://claude.ai/code/artifact/4ea6afce-05fb-45a9-aba5-9ff8571c0ecc |
| `anatomy-model.html` | Anatomy model — every structure with its finding, crossing (IPSI/CONTRA/BILAT/MIDLINE/NONE) and territory; doubles as the neuroanatomist review sheet | 🩻 | https://claude.ai/code/artifact/6f9562ec-b5a8-453f-a650-e5db4d43a541 |

## How to update (from any session)

1. Edit the file here.
2. Republish with the **Artifact** tool, passing the matching `url` above so it updates in place
   rather than minting a new URL:
   - `file_path`: this file, `url`: its URL, `favicon`: the emoji above.
3. Keep the favicon **stable** — the user finds the tab by its icon.

The in-app browser cannot render `file://`, `localhost` or `claude.ai`, so you generally can't
preview locally — verify statically (tag balance; cross-check structure ids against
`src/model/structures.js`) before publishing, and ask the user to eyeball the result.

## Keep in sync after every region increment

Both are living docs. After adding a region: add its structures to `anatomy-model.html` (a region
section + any new laterality badges), and update the coverage strip + test count in
`architecture.html`. Current coverage: brainstem, spinal cord (core four / sensory level / central /
cauda-conus), and the cerebral cortex.
