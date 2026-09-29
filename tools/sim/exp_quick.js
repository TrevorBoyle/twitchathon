const { run } = require("./sim.js");
const N = parseInt(process.argv[2]||"40"); const which=process.argv[3]||"a";
const P={restBelow:70};
const cfg = which==="a" ? [["nothing",{...P}],["mid+2snk",{...P,bino:"mid",snacks:2}],["premium+2snk",{...P,bino:"premium",snacks:2}]]
 : [["twitchersNose|mid+2",{...P,bino:"mid",snacks:2,skill:"twitchersNose"}],["youngEyes|mid+2",{...P,bino:"mid",snacks:2,skill:"youngEyes"}],["guide (20)",{...P,fieldGuide:true}],["scope (25)",{...P,scope:true}]];
for(const [label,o] of cfg){ const t=Date.now(); const s=run(label,o,N).s; console.log(label.padEnd(22),"mean",s.mean.toFixed(1),"±",s.se.toFixed(1),"win",(s.winRate*100).toFixed(0)+"%","rank",s.meanRank.toFixed(2),"maxRival",s.maxRival.toFixed(1),"teas",s.teas.toFixed(1),"drv",s.drives.toFixed(1),"tiers",Object.values(s.tiers).map(x=>x.toFixed(0)).join("/"),"riv",Object.values(s.rivalMeans).map(x=>x.toFixed(0)).join("/"),((Date.now()-t)/N).toFixed(0)+"ms/game"); }
