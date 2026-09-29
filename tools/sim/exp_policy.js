const { run } = require("./sim.js");
const N = parseInt(process.argv[2]||"200");
const base = { bino:"mid", snacks:1 };
const configs = [
  ["restBelow45 (Flagging ok)", {...base, restBelow:45}],
  ["restBelow70 (stay Fresh)", {...base, restBelow:70}],
  ["restBelow60", {...base, restBelow:60}],
  ["restBelow30", {...base, restBelow:30}],
  ["moveBias1.3 stickier", {...base, restBelow:60, moveBias:1.3}],
  ["moveBias0.8 restless", {...base, restBelow:60, moveBias:0.8}],
  ["loopPref short", {...base, restBelow:60, loopPref:"short"}],
  ["offTrail", {...base, restBelow:60, offTrail:true}],
  ["useHide", {...base, restBelow:60, useHide:true}],
  ["no keepLooking", {...base, restBelow:60, keepLooking:false}],
  ["maxAttempts 3", {...base, restBelow:60, maxAttempts:3}],
  ["wake 6am", {...base, restBelow:60, wakeIdx:2}],
  ["wake 5am", {...base, restBelow:60, wakeIdx:1}],
  ["campEarly", {...base, restBelow:60, campEarly:true}],
];
for(const [label, o] of configs){
  const r = run(label, o, N);
  const s = r.s;
  console.log(label.padEnd(28), "mean", s.mean.toFixed(2), "±", s.se.toFixed(2), "win", (s.winRate*100).toFixed(0)+"%", "maxRival", s.maxRival.toFixed(1), "teas", s.teas.toFixed(1), "snk", s.snacks.toFixed(1), "drv", s.drives.toFixed(1), "drvMin", s.driveMin.toFixed(0), "loopMin", s.loopMin.toFixed(0), "tiers", Object.values(s.tiers).map(x=>x.toFixed(1)).join("/"), "E", Object.values(s.energyTiers).map(x=>x.toFixed(0)).join("/"));
}
