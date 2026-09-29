const { T, C, playGame } = require("./sim.js");
const N = parseInt(process.argv[2]||"120");
// ---- 1. Event frequency & no-op rates (instrument maybeTriggerEvent by wrapping rnd? simpler: count log lines by keyword)
const keys = { rareAlert:"Group chat lights up", localTip:"A local birder tips", dewyOptics:"Morning mist fogs", magpieSwoop:"Swooped on the track", rivalEncounter:"Cross paths with", coldFront:"cold front", roadworks:"Word of roadworks", distantSilhouette:"A shape crosses high", goldenLight:"light turns perfect", luckyBreak:"Everything lines up", secondWind:"stashed drink", windPickup:"Wind picks up", gearFumble:"Dropped lens cap", chatWithLocal:"stops for a chat" };
const counts = {}; Object.keys(keys).forEach(k=>counts[k]=0);
let games=0, totalEvents=0, hoursPlayed=0, luckyBurnedOnKnown=0, luckyTotal=0;
const curveSum = {}, curveN = {}; const rivalCurve = {}; 
const nightGain = { player:0, rivals:0 };
const res = [];
for(let g=0; g<N; g++){
  const r = playGame({ bino:"mid", snacks:2, restBelow:70 });
  res.push(r);
  games++;
  const log = T.state.log;
  log.forEach(e=>{ if(e.cls==="event"){ totalEvents++; for(const k in keys){ if(e.txt.indexOf(keys[k])>=0){ counts[k]++; break; } } } });
  hoursPlayed += (r.stats.curve.length);
  r.stats.curve.forEach(([clock, sp])=>{ const h=Math.floor(clock/60); curveSum[h]=(curveSum[h]||0)+sp; curveN[h]=(curveN[h]||0)+1; });
}
console.log("games", games, "events/game", (totalEvents/games).toFixed(2), "hours sampled/game", (hoursPlayed/games).toFixed(1));
console.log("event counts per game:"); for(const k in counts) console.log("  ", k.padEnd(18), (counts[k]/games).toFixed(2));
console.log("player species curve by game-hour (clock/60):");
const hs = Object.keys(curveSum).map(Number).sort((a,b)=>a-b);
console.log(hs.map(h=>h+":"+(curveSum[h]/curveN[h]).toFixed(0)).join("  "));
// rank distribution
const ranks = {}; res.forEach(r=>ranks[r.rank]=(ranks[r.rank]||0)+1); console.log("rank dist", ranks);
// score distribution percentiles
const sc = res.map(r=>r.score).sort((a,b)=>a-b); const pct=p=>sc[Math.floor(p*(sc.length-1))];
console.log("score p5/p25/p50/p75/p95", pct(.05),pct(.25),pct(.5),pct(.75),pct(.95));
const mr = res.map(r=>r.maxRival).sort((a,b)=>a-b); const pct2=p=>mr[Math.floor(p*(mr.length-1))];
console.log("maxRival p5/p50/p95", pct2(.05),pct2(.5),pct2(.95));
console.log("gotAway/game", (res.reduce((a,r)=>a+r.gotAway,0)/N).toFixed(1));
