# Twitchathon

A browser-based birding competition game. It's Friday evening registration through the deadline at 3pm Sunday: pick a specialist skill and some gear, then race a handful of rival teams to confirm more distinct bird species than anyone else across twelve sites on a fictionalized South Australian map.

## Playing it

`index.html` is fully self-contained — no build step, no dependencies. Open it directly in a browser, or serve the folder with anything static (e.g. `npx serve .`, or GitHub Pages once this is pushed).

## Regional editions

`index.html` is the original South Australian game. `index-uk.html` and `index-usa.html` are regional copies of the same game engine. The UK edition has its own hotspot set (15 sites, ~355 species); the USA edition still carries the South Australian site set as a placeholder — populate it with a USA hotspot set using the two tools below (see "Swapping in a different region"). All three files are otherwise identical and fully independent; there's no shared state between them. Each edition tunes its rival difficulty separately (`SMART_DETECT_MULT`, see "The balance harness").

## Project layout

```
twitchathon/
├── index.html                 the game (South Australia)
├── index-uk.html               regional copy — UK (own site set: 15 sites, ~355 species)
├── index-usa.html              regional copy — USA (placeholder SA data until populated)
├── tools/
│   ├── location-editor.html   a companion tool for editing the site/species data
│   ├── map-editor.html        a companion tool for editing the map layout
│   └── sim/                   a headless balance harness (Node) — see tools/sim/README.md
└── README.md
```

## The balance harness

`tools/sim/` loads the real engine out of any edition's `index*.html` and plays
whole weekends with a scripted player, so item values, skill balance and rival
difficulty can be measured rather than guessed. `node tools/sim/exp_quick.js 40 a`
is the one-line check to run after changing an edition's site data; the
difficulty dials it tunes (`SMART_DETECT_MULT`, `SMART_MOVE_STICKINESS`,
`SMART_MOVE_NOISE`) live near the rival code in each `index*.html`.

## The location editor

`tools/location-editor.html` is a standalone editor for the game's `SITES` data: add, edit, or delete locations, and add, edit, or delete the species on offer at each one. It starts pre-loaded with the game's current South Australian site list (a straight machine-generated snapshot of `SITES` in `index.html`), which you can prune, rename, and reuse as a template — or clear out entirely and build a fresh set of locations for anywhere eBird has hotspots (Victoria, England, wherever), using the same fields and the same rules the game already runs on:

- `id`, display `name` (the short, casual, in-game label), and the real eBird hotspot name (kept as a source-tracing note, same as before)
- `size` (`pocket` / `standard` / `large`), `zone` (`inland` / `coastal`)
- `hide` (has a hide/blind — unlocks the watch-from-hide option), `hub` (the one camp/base site — exactly one location should have this set), `wet` (open water, so morning mist visibly hurts water-bird sightings there), `farGroups` (optional — species groups that need a spotting scope here or lose some ID chance, e.g. raptors soaring too far off to call without one)
- a flavor-text `blurb`
- optional per-site loop lengths, if you want some locations to offer different walk options than the default by-size menu
- the full species list for that site: `id`, `name`, `tier` (`common` / `uncommon` / `rare` / `mega`), `group` (`bush` / `water` / `raptor` / `nocturnal`), `idDiff` (0–1, roughly "how hard is this one to pin down"), and whether it's an audio-only ID (nocturnal specialists mostly)

It flags problems as you go — duplicate ids, more than one hub, missing species — and exports a ready-to-paste `var SITES = {...};` block (plus an optional `CONFIG.siteLoopOptions` snippet, only if you set custom loop lengths on any location). It can also import a `SITES` block back in, so you can pull an existing site list in to keep editing it, or hand a teammate an exported block to load.

### Pulling species straight from eBird

Each location has a "Pull species from eBird" panel so you don't have to type the species list by hand. It needs a free eBird API key (get one at [ebird.org/api/keygen](https://ebird.org/api/keygen)) pasted into the "eBird API key" panel near the top — it's saved only in this browser (`localStorage`) and sent only to eBird's own API; there's no server in this project to proxy it through, and eBird's API does allow calling it directly from a page like this.

Give a location its eBird hotspot id (the `L123456` in a hotspot's `ebird.org/hotspot/L123456` URL), either typed in directly or found via the built-in search (by region code, e.g. `GB-ENG` or `US-CA-085`, or by coordinates and a radius), then hit fetch. It pulls the hotspot's real name, its all-time species list, common names, and a rough starting guess at each species' tier, group, and audio-only status:

- **tier** — anything eBird's flagging as notable there recently becomes `rare`; anything seen in the last 30 days becomes `common`; everything else on the all-time list defaults to `uncommon`
- **group** — guessed from the species' family (owls/nightjars → `nocturnal`, hawks/falcons/vultures → `raptor`, waterbirds → `water`, everything else → `bush`)
- **idDiff** — a flat default per guessed tier
- **audio** — set for anything guessed as `nocturnal`
- the location's own `wet` flag gets a starting guess too, based on what fraction of the fetched species are `water`-group

None of this is real frequency data — eBird's bar-chart frequencies aren't part of the public API — so treat it as a fast first pass, not a finished list: skim the species table afterwards and adjust tier, group, and idDiff by hand where it matters, same as you would with any hand-entered site. Fetching again for a location that already has species tops it up with anything new rather than duplicating what's already there.

A real hotspot's all-time list can easily run to 200-300+ species — more than a weekend site needs, and a lot to review by hand. The "Cap species at" field (75 by default, 0 for no cap) keeps a fetch from ballooning past that: it only kicks in once the list is actually over the cap, keeps every mega no matter what, and spreads the rest across tiers roughly matching the game's own average site (about a quarter common, just under half uncommon, a bit over a quarter rare) rather than just keeping whichever species happened to come first in eBird's list.

## The map editor

`tools/map-editor.html` is a standalone visual editor for the game's map: drag sites around, add or remove roads between them, and rescale travel times. It doesn't touch the game directly — it exports two ready-to-paste blocks of JavaScript:

- `SITE_POSITIONS`
- `MANUAL_ROADS`

Copy both blocks from the editor into `index.html`, replacing the existing `SITE_POSITIONS` and `MANUAL_ROADS` declarations (search for those names — they're grouped together, just above `generateTravel()`). Site names and IDs are shared between both files, so nothing else needs to change.

It defaults to the same South Australian site set. To lay out a different region, open its "Load a different location set" panel and paste in the `SITES` export from the location editor (or straight out of `index.html`) — any location whose id already has a spot on the map keeps it, brand-new ones drop into a fresh circle for you to drag into place, and roads pointing at a location that's no longer in the set are removed.

## Swapping in a different region

Same steps whether you're editing `index.html`, `index-uk.html`, `index-usa.html`, or a new copy of your own — just target whichever file you're populating.

1. Open `tools/location-editor.html`, clear out (or prune/rename) the default South Australian set, and build up the new region's locations and species.
2. Copy its `SITES` export into the target file, replacing the existing `var SITES = {...};` block.
3. Paste that same export into `tools/map-editor.html`'s "Load a different location set" panel, drag the new locations into place, wire up roads, and copy its `SITE_POSITIONS` / `MANUAL_ROADS` export into the target file as usual.
4. If you set any custom per-site loop lengths in the location editor, paste its optional `CONFIG.siteLoopOptions` export in too (merge the keys into the existing object) — everything else (the starting/camp site, the "wet site" list for weather, which species only turn up at night) is derived automatically from each site's own flags, so there's nothing else to hunt down by hand.

`index-usa.html` has a comment right above its `SITES` declaration as a placeholder-data reminder — delete it once you've replaced the data.

## Notes on the site data

Each site's `name` field is a short, casual label (e.g. "Sewage Ponds", "Granite Outcrop") rather than its formal name, so the map and UI read a bit more like a fictional gazetteer. The original real-world/eBird hotspot name for each site is preserved in an inline comment next to its entry in the `SITES` object in `index.html`, in case it's ever useful to trace a site back to its source location.

A couple of small conveniences worth knowing about if you're editing `index.html` by hand rather than through the location editor: the starting/camp site (`state.currentSite`) is derived from whichever location has `hub:true`, and the "wet" sites used for the morning-mist weather penalty (`WET_SITE_IDS`) are derived from each site's own `wet` flag — neither is a separate list to keep in sync any more.

The spotting scope's distance-penalty removal works the same way: give a site an optional `farGroups` array (e.g. `farGroups:["raptor"]`) and species from that group lose some ID chance there unless the scope was brought — the shop screen's description text, and the "which sites need one" logic in the game itself, are both built from whichever sites actually have `farGroups` set, so nothing needs updating by hand when you swap in a different region's site list. Same for the "cold front" weather event's fallout site, which is now picked from the same wet-site list rather than a couple of hardcoded ids.


## License

MIT + Commons Clause — see [LICENSE](./LICENSE). In short: free to use, copy, modify, and share (including non-commercial hosting or forks), but not to sell, or to offer a paid product or service substantially derived from it, without permission from the copyright holder.
