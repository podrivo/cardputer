---
name: add-installer
description: >-
  Add or update Cardputer ADV firmware installers in this catalog (index.html,
  catalog-extra.js, bins/, catalog-keys.js, README). Use when adding a new
  installer, game, pet, tool, or firmware entry, wiring a .bin into the catalog,
  or reviewing a new catalog item before commit/PR.
---

# Add installer

Checklist for every new catalog entry. Do not skip items.

## Required checks

- description doesnt include —
- we have the source linked
- the icon is not repeated in many places
- it is supposed to work with cardputer adv
- add shortcuts if found in the source
- if it needs a tag like many other installers already has

## How to apply each check

1. **Description / no —**  
   `desc` must not contain an em dash (`—`) or en dash (`–`). Use a comma, period, colon, or hyphen `-` instead.

2. **Source linked**  
   Set `repo` to the upstream GitHub (or docs) URL. The UI shows it as **Source**.

3. **Unique icon**  
   Pick an `emoji` that is not already used by another catalog item in `index.html` or `catalog-extra.js`. Search before choosing.

4. **Cardputer ADV**  
   Only ship firmwares that work on Cardputer ADV (TCA8418 keyboard and/or an explicit ADV build/readme). Reject original-Cardputer-only GPIO-matrix bins that boot with dead keys. Prefer bins that contain `TCA8418` or clear ADV targeting in docs/releases.

5. **Shortcuts (Keys)**  
   If the upstream README (or in-repo docs/source) documents controls, add them:
   - Prefer `catalog-keys.js` via `node scripts/fetch-catalog-keys.mjs`, or
   - Hand-add a `KEYS[id]` entry, or
   - Set inline `keys: { rows: [["Key", "Action"], ...], source: "…" }` on the item.
   Skip only when no controls are documented anywhere.

6. **Tags**  
   Match existing warn tags when the app needs extras, e.g.:
   - `["warn", "Requires SD"]`
   - `["warn", "Requires game"]` / `["warn", "Requires ROM + SD"]`
   - `["warn", "Requires LoRa cap"]` / LoRa + SD / LoRa / BLE
   - `["warn", "Requires samples"]` / stations / DB / extra screen
   - `["warn", "Use responsibly"]` for offensive/security toolkits  
   Omit the tag when nothing special is required.

## Wiring a new entry

1. Download the release `.bin` into `bins/` (prefer merged/full flash; app-only is OK — installer remaps `0x0` → `0x10000` when there is no partition table).
2. Add the object to the right list in `index.html` (`PETS`, `GAMES`, `TOOLS`, …) or `catalog-extra.js`.
3. Use `parts: [{ file: bin("….bin"), address: 0x0 }]` (or the `file: "bins/…"` form in extras).
4. Update the README catalog examples row if the section’s highlighted apps changed.
5. Refresh Open Graph share metadata: `npm run export-meta` (writes `catalog-meta.json` for Netlify edge OG tags on `?i=<id>` links).
6. Re-run the checklist above before committing.

## Done when

- [ ] All six required checks pass
- [ ] Bin is in `bins/` and referenced by the entry
- [ ] ADV suitability verified (TCA8418 and/or ADV docs)
- [ ] Keys added when controls exist upstream
- [ ] Tag added only if needed, matching existing wording
- [ ] `catalog-meta.json` regenerated (`npm run export-meta`)
