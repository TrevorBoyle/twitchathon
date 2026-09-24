# Twitchathon

A browser-based birding competition game. It's Friday evening registration through the deadline at 3pm Sunday: pick a specialist skill and some gear, then race a handful of rival teams to confirm more distinct bird species than anyone else across twelve sites on a fictionalized South Australian map.

## Playing it

`index.html` is fully self-contained — no build step, no dependencies. Open it directly in a browser, or serve the folder with anything static (e.g. `npx serve .`, or GitHub Pages once this is pushed).

## Project layout

```
twitchathon/
├── index.html            the game
├── tools/
│   └── map-editor.html   a companion tool for editing the map layout
└── README.md
```

## The map editor

`tools/map-editor.html` is a standalone visual editor for the game's map: drag sites around, add or remove roads between them, and rescale travel times. It doesn't touch the game directly — it exports two ready-to-paste blocks of JavaScript:

- `SITE_POSITIONS`
- `MANUAL_ROADS`

Copy both blocks from the editor into `index.html`, replacing the existing `SITE_POSITIONS` and `MANUAL_ROADS` declarations (search for those names — they're grouped together, just above `generateTravel()`). Site names and IDs are shared between both files, so nothing else needs to change.

## Notes on the site data

Each site's `name` field is a short, casual label (e.g. "Sewage Ponds", "Granite Outcrop") rather than its formal name, so the map and UI read a bit more like a fictional gazetteer. The original real-world/eBird hotspot name for each site is preserved in an inline comment next to its entry in the `SITES` object in `index.html`, in case it's ever useful to trace a site back to its source location.


## License

MIT + Commons Clause — see [LICENSE](./LICENSE). In short: free to use, copy, modify, and share (including non-commercial hosting or forks), but not to sell, or to offer a paid product or service substantially derived from it, without permission from the copyright holder.
