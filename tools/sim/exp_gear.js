const { run } = require("./sim.js");
const N = parseInt(process.argv[2]||"200");
const which = process.argv[3]||"gear";
const P = { restBelow:70 };
let configs;
if(which==="gear") configs = [
  ["nothing (0pts)", {...P}],
  ["mid binos (30)", {...P, bino:"mid"}],
  ["premium binos (60)", {...P, bino:"premium"}],
  ["scope (25)", {...P, scope:true}],
  ["field guide (20)", {...P, fieldGuide:true}],
  ["weatherproof (30)", {...P, weatherproof:true}],
  ["parabolic mic (15)", {...P, parabolicMic:true}],
  ["head torch (20)", {...P, headTorch:true}],
  ["thermos (15)", {...P, thermos:true}],
  ["trail map (15)", {...P, trailMap:true}],
  ["alarm clock (10)", {...P, alarmClock:true}],
  ["camp stove (10)", {...P, campStove:true}],
  ["1 loose bar (4)", {...P, snackBars:1}],
  ["1 snack pack (20)", {...P, snacks:1}],
  ["2 snack packs (40)", {...P, snacks:2}],
  ["3 snack packs (60)", {...P, snacks:3}],
  ["5 snack packs (100)", {...P, snacks:5}],
];
if(which==="loadout") configs = [
  ["premium + 2 packs (100)", {...P, bino:"premium", snacks:2}],
  ["premium + scope + thermos (100)", {...P, bino:"premium", scope:true, thermos:true}],
  ["premium + guide + torch (100)", {...P, bino:"premium", fieldGuide:true, headTorch:true}],
  ["premium + weatherproof + alarm (100)", {...P, bino:"premium", weatherproof:true, alarmClock:true}],
  ["mid + scope + guide + mic + alarm (100)", {...P, bino:"mid", scope:true, fieldGuide:true, parabolicMic:true, alarmClock:true}],
  ["mid + 2 packs + thermos + trail map (100)", {...P, bino:"mid", snacks:2, thermos:true, trailMap:true}],
  ["mid + guide + torch + 1 pack + 2 bars (98)", {...P, bino:"mid", fieldGuide:true, headTorch:true, snacks:1, snackBars:2}],
  ["scope + guide + mic + torch + thermos (95)", {...P, scope:true, fieldGuide:true, parabolicMic:true, headTorch:true, thermos:true}],
  ["5 packs (100)", {...P, snacks:5}],
];
if(which==="skill") configs = [
  ["youngEyes | mid+2snk", {...P, bino:"mid", snacks:2, skill:"youngEyes"}],
  ["twitchersNose | mid+2snk", {...P, bino:"mid", snacks:2, skill:"twitchersNose"}],
  ["ironConstitution | mid+2snk", {...P, bino:"mid", snacks:2, skill:"ironConstitution"}],
  ["backroads | mid+2snk", {...P, bino:"mid", snacks:2, skill:"backroads"}],
  ["youngEyes | nothing", {...P, skill:"youngEyes"}],
  ["twitchersNose | nothing", {...P, skill:"twitchersNose"}],
  ["ironConstitution | nothing", {...P, skill:"ironConstitution"}],
  ["backroads | nothing", {...P, skill:"backroads"}],
];
if(which==="exploit") configs = [
  ["baseline mid+2snk", {...P, bino:"mid", snacks:2}],
  ["call it at noon (rivals freeze)", {...P, bino:"mid", snacks:2, callItAtNoon:true}],
  ["call it at noon + freezeFix", {...P, bino:"mid", snacks:2, callItAtNoon:true, freezeFix:true}],
  ["nothing, restBelow30 (sloppy)", {...P, restBelow:30}],
  ["nothing, restBelow45", {...P, restBelow:45}],
];
for(const [label, o] of configs){
  const r = run(label, o, N);
  const s = r.s;
  console.log(label.padEnd(34), "mean", s.mean.toFixed(2), "±", s.se.toFixed(2), "win", (s.winRate*100).toFixed(0)+"%", "maxRival", s.maxRival.toFixed(1), "teas", s.teas.toFixed(1), "snk", s.snacks.toFixed(1), "drv", s.drives.toFixed(1), "drvMin", s.driveMin.toFixed(0), "loopMin", s.loopMin.toFixed(0), "tiers", Object.values(s.tiers).map(x=>x.toFixed(1)).join("/"), "E", Object.values(s.energyTiers).map(x=>x.toFixed(0)).join("/"), "riv", Object.values(s.rivalMeans).map(x=>x.toFixed(0)).join("/"));
}
