# UK species re-tier (Sept 2026)

One-off scripts behind the UK rarity pass, kept for provenance.

- `uk_status.js` — British status (common / uncommon / rare / mega / drop) for every species that was in
  `index-uk.html` before the pass. Edit this if you disagree with a tier.
- `uk_plan.js` — builds the per-site keep / cut / add plan from that table (targets: 18 common, 24 uncommon,
  11 rare, up to 2 mega per site). `node uk_plan.js summary` prints the outcome; run with
  `TW_HTML=../../../index-uk.html`. The additions (`RARE_ADDS`, `COASTAL_ADDS`) are species with a record
  history at that hotspot to the author's knowledge and should be checked against an eBird pull.
- `uk_apply.js` — rewrites the `SITES` species arrays in place from the plan (already applied; re-running
  against the current file will not find the old lists).
