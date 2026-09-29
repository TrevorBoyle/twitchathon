const { T, C } = require("./sim.js");
const A = T.ABUNDANCE;
console.log("=== Keep-looking: P(eventually confirm) if you keep searching until resolved, by base ID chance (no other mults) ===");
function keepLookingEV(idBase, maxAttempts){
  // per attempt k (1-based): flush chance, then ID with bonus
  let pConf=0, pAlive=1, minutes=0, energy=0;
  for(let k=1;k<=maxAttempts;k++){
    const idx=Math.min(k-1,2);
    const bonus=C.keepLooking[idx].bonus;
    const flush = k<=3 ? C.keepLooking[idx].flush : C.keepLooking[2].flush + 0.08*(k-3);
    const id = Math.min(0.97, Math.max(0.02, idBase*(1+bonus)));
    const pc = pAlive*(1-flush)*id;
    pConf += pc;
    minutes += pAlive*C.keepLookingTime; energy += pAlive*2;
    pAlive *= (1-flush)*(1-id);
  }
  return { pConf, pFlushOrGiveUp: 1-pConf, expMinutes: minutes, expEnergy: energy };
}
[0.3,0.4,0.5,0.6,0.75,0.9].forEach(id=>{ const r=keepLookingEV(id,6); const r1=keepLookingEV(id,1); console.log("idBase",id, "attempt1 P(conf)",r1.pConf.toFixed(3), "| until resolved: P(conf)", r.pConf.toFixed(3), "E[min]", r.expMinutes.toFixed(1), "E[energy]", r.expEnergy.toFixed(1), "=> ticks/hour-equivalent", (r.pConf/r.expMinutes*60).toFixed(2)); });

console.log("\n=== Per-chunk detection at a fresh site (tos=1), clear weather, Fresh energy ===");
const gearSets = { "basic":1.0, "mid":1.10, "premium":1.20, "premium+youngEyes":1.28 };
const wins = C.windows;
for(const [g,spot] of Object.entries(gearSets)){
  const row=[];
  for(const tier of ["common","uncommon","rare","mega"]){
    // bush at dawn chorus (1.3), extended loop 1.2
    const d = Math.min(0.95, A[tier]*1.3*spot*1.2);
    // bush at midday (0.5), short loop 1.0
    const d2 = Math.min(0.95, A[tier]*0.5*spot*1.0);
    row.push(tier+": dawn/ext "+d.toFixed(3)+" midday/short "+d2.toFixed(3));
  }
  console.log(g.padEnd(20), row.join(" | "));
}
console.log("\nP(common detected within first hour, 4 chunks, dawn, extended, premium+YE):", (1-[0,1,2,3].reduce((acc,k)=>acc*(1-Math.min(0.95,A.common*1.3*1.28*1.2*Math.pow(0.94,k))),1)).toFixed(4));
console.log("P(common detected within first hour, basic, short loop, morning 1.0):", (1-[0,1,2,3].reduce((acc,k)=>acc*(1-A.common*1.0*1.0*Math.pow(0.94,k)),1)).toFixed(4));
console.log("P(uncommon detected within first hour, basic, morning 1.0):", (1-[0,1,2,3].reduce((acc,k)=>acc*(1-A.uncommon*Math.pow(0.94,k)),1)).toFixed(4));
console.log("P(rare detected within first hour, basic, morning):", (1-[0,1,2,3].reduce((acc,k)=>acc*(1-A.rare*Math.pow(0.94,k)),1)).toFixed(4), "premium+YE+ext+nose+offtrail:", (1-[0,1,2,3].reduce((acc,k)=>acc*(1-A.rare*1.28*1.2*1.3*1.2*Math.pow(0.94,k)),1)).toFixed(4));

console.log("\n=== Max stacking: where does the 0.95 cap engage? ===");
const stack = { common_dawn: A.common*1.3*1.03*1.28*1.2*1.15, uncommon_dawn: A.uncommon*1.3*1.03*1.28*1.2*1.15, rare_dawn_full: A.rare*1.3*1.03*1.28*1.2*1.15*1.3*1.2, rare_rareAlert: A.rare*1.0*1.28*1.2*3*1.3*1.2, mega_rareAlert: A.mega*1.0*1.28*1.2*12*1.3*1.2, water_coldFront_uncommon: A.uncommon*1.0*1.28*1.2*2.5, water_coldFront_common: A.common*1.28*1.2*2.5 };
for(const k in stack) console.log(k.padEnd(26), "raw", stack[k].toFixed(3), "-> capped", Math.min(0.95,stack[k]).toFixed(3));

console.log("\n=== Weather EV ===");
const W = T.WEATHER; const mean = a=>a.reduce((x,y)=>x+y,0)/a.length;
console.log("E[weatherMult]", mean(W.map(w=>w.mult)).toFixed(4), " with weatherproof floor 0.95:", mean(W.map(w=>Math.max(w.mult,0.95))).toFixed(4), " => avg detection gain", ((mean(W.map(w=>Math.max(w.mult,0.95)))/mean(W.map(w=>w.mult))-1)*100).toFixed(1)+"%");
console.log("mid binos detection gain +10%, ID +5%  => combined rate x1.155; premium x1.32");

console.log("\n=== Energy budget (per-hour rates) ===");
console.log("walk 10/h (x1.02^chunk ramp: 120-min loop total =", (10*0.25*[0,1,2,3,4,5,6,7].reduce((a,k)=>a+Math.pow(1.02,k),0)).toFixed(2), "vs flat 20)", "hide 4/h drive 3/h keepLook", T.keepLookingEnergyCost(), "per 5 min");
console.log("tea: 30/25min = 1.2 energy/min; consecutive: 30,18,11,10. snack 20 instant, 4 pts each (20/5).");
console.log("Cooked (0.60) on both rolls => 0.36 combined; Flagging 0.81; RoE 0.5625");

console.log("\n=== Time budget ===");
console.log("Sat play 0..1170 =",1170,"min; camp 60; sleep to 4am => wake clock", 1410, "; Sunday 1410..2070 =",660,"min; total play", 1170+660, "min. Rivals never camp: 2070 min.");
console.log("event rolls: one per clock-hour bucket while awake ≈", Math.round((1170+660)/60), "hours x 0.20 =", ((1170+660)/60*0.2).toFixed(1), "events expected");

console.log("\n=== Roads ===");
const tr = T.MANUAL_ROADS; console.log("min", Math.min(...tr.map(e=>e[2])), "max", Math.max(...tr.map(e=>e[2])), "mean", (tr.reduce((a,e)=>a+e[2],0)/tr.length).toFixed(1), "backroads saves per drive", (tr.reduce((a,e)=>a+e[2],0)/tr.length*0.15).toFixed(1));
// species overlap: roster 157 of 416 listings; per-site unique names
let uniq=0; T.SITE_IDS.forEach(id=>{ const others=new Set(); T.SITE_IDS.forEach(o=>{ if(o!==id) T.SITES[o].species.forEach(s=>others.add(s.name)); }); const u=T.SITES[id].species.filter(s=>!others.has(s.name)).length; uniq+=u; console.log(id.padEnd(20), "species", T.SITES[id].species.length, "unique-to-site", u); });
