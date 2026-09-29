const { T, C, playGame } = require("./sim.js");
const N = 80;
const camp = {}, wake = {}; let spCamp=0, eCamp=0, eWake=0, campClock=0;
T.RIVAL_DEFS.forEach(r=>{camp[r.key]=0; wake[r.key]=0;});
for(let g=0;g<N;g++){
  const r = playGame({ bino:"mid", snacks:2, restBelow:70 });
  T.RIVAL_DEFS.forEach(x=>{ camp[x.key]+=r.stats.rivalsAtCamp[x.key]; wake[x.key]+=r.stats.rivalsAtWake[x.key]; });
  spCamp += r.stats.speciesAtCamp; eCamp += r.stats.energyAtCamp; eWake += r.stats.energyAtWake; campClock += r.stats.campClock||C.saturdayEnd;
}
console.log("player species at camp", (spCamp/N).toFixed(1), "energy at camp", (eCamp/N).toFixed(0), "at wake", (eWake/N).toFixed(0), "campClock", (campClock/N).toFixed(0));
T.RIVAL_DEFS.forEach(x=>console.log(x.key.padEnd(12), "at camp", (camp[x.key]/N).toFixed(1), "at wake", (wake[x.key]/N).toFixed(1), "overnight gain", ((wake[x.key]-camp[x.key])/N).toFixed(1)));
