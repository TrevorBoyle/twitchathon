# Balance harness

A headless Node harness that loads the real game engine out of an edition's
`index*.html` (rendering neutered, nothing else changed) and drives it with a
scripted "competent player" for whole simulated weekends. Every number in the
balance review came from here. No dependencies beyond Node 18+.

```
node sim.js                         # 20 quick weekends on ../../index.html, summary as JSON
TW_HTML=../../index-uk.html node exp_quick.js 40 a    # any edition, via the env var
node exp_gear.js 250 gear           # marginal value of every shop item
node exp_gear.js 250 loadout        # a set of 100-point builds head to head
node exp_gear.js 400 skill          # the four skills at three gear levels
node exp_gear.js 300 exploit        # early "call it a weekend", sloppy energy play
node exp_policy.js 150              # what the scripted player's own choices are worth
node exp_misc.js 120                # event frequencies, hourly species curve, score percentiles
node exp_night.js                   # rival counts at camp vs. at wake
node exp_bots.js                    # one weekend of rival site histories (spots stuck bots)
node analytic.js                    # closed-form checks: keep-looking EV, stacking caps, weather EV
node ui_smoke.js [file]             # renders every screen against a fake DOM, flags undefined/NaN
```

Each experiment prints one line per configuration. A game takes ~90 ms on the
SA map and ~200 ms on the UK map; the standard error on a mean is about ±0.35
species at n=250, so treat differences under 0.8 as noise.

## Files

- `engine.js` — extracts the game's script from the HTML, stubs the DOM,
  neuters `render`/`revealAndRender`, and exposes the internals on
  `globalThis.__T`. Takes an optional list of `[from, to]` source patches so an
  experiment can test a rule change without editing the game
  (`TW_PATCHES=./my_patch.js`, a module exporting that array).
- `sim.js` — the scripted player and the `run(label, opts, n)` /
  `summarize(results)` helpers. `DEFAULT_OPTS` lists every knob: loadout
  (`bino`, `snacks`, `snackBars`, `scope`, `fieldGuide`, `weatherproof`,
  `parabolicMic`, `headTorch`, `thermos`, `trailMap`, `alarmClock`,
  `campStove`), `skill` (null = random, as in the game), and policy
  (`restBelow`, `maxAttempts`, `keepLooking`, `offTrail`, `useHide`,
  `loopPref`, `moveBias`, `wakeIdx`, `campEarly`, `callItAtNoon`).
- `exp_*.js`, `analytic.js` — the experiments above; copy one to add your own.
- `ui_smoke.js` — cheap pre-commit check that the render paths still work.

## How the scripted player decides

At each decision it estimates the expected new ticks over the next hour at the
current site against every other site (fresh odds, discounted by drive time),
takes the longest loop that fits before the cutoff, rests when energy would
drop below `restBelow` (snack first if it has one, else tea), keeps searching
on a "What was that?" prompt up to `maxAttempts` times, camps at midnight and
wakes at the first option. It scores about 90 species on the SA map with no
gear and about 101 with premium binoculars and two snack packs. It is good,
not perfect, so treat absolute scores as a species or two low and rely on
same-policy comparisons.

## Difficulty dials

Three constants in the game control how hard the rival field is, and each
edition sets its own values:

- `SMART_DETECT_MULT` — flat multiplier on every rival detection roll. 1.0 on
  the SA map; 0.60 on the UK map, whose 65–74-species sites otherwise let the
  bots' patient full-loop plan outscore any human.
- `SMART_MOVE_STICKINESS` — how much better a neighbouring site must look
  before a bot moves on (2.0 = twice as good).
- `SMART_MOVE_NOISE` — how noisy a bot's read of a distant site is (±40%).

After changing site data for an edition, run `exp_quick.js` against it: the
no-gear player should win somewhere around a third of weekends, a mid
binoculars + two packs build around two thirds, and the best build most of the
time but not all.
