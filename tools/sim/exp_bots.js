const { T, C } = require("./sim.js");
// Drive only the bots: start a game, then simulate rivals hour by hour and record site visits
T.state=null; T.regDraft=null;
const gen=T.generateTravel();
T.regDraft={teamName:"x",costs:T.rollCosts(),travel:gen.travel,positions:gen.positions,skill:"youngEyes",binoculars:"none",snackPacks:0,scope:false,fieldGuide:false,weatherproof:false,parabolicMic:false};
T.startGame();
const hist={}; T.RIVAL_DEFS.forEach(r=>hist[r.key]=[]);
for(let clock=60; clock<=C.deadline; clock+=60){
  T.simulateRivals(clock);
  T.RIVAL_DEFS.forEach(r=>{ const b=T.state.rivals.smart[r.key]; hist[r.key].push(b.siteId.slice(0,6)+":"+Object.keys(b.confirmedNames).length+":"+Math.round(b.energy)); });
}
T.RIVAL_DEFS.forEach(r=>{ console.log(r.key, "gear", JSON.stringify(T.state.rivals.gear[r.key]), "skill", T.state.rivals.skills[r.key]); console.log("  ", hist[r.key].filter((x,i)=>i%2===0).join(" ")); });
// distinct sites visited
T.RIVAL_DEFS.forEach(r=>{ const s=new Set(hist[r.key].map(x=>x.split(":")[0])); console.log(r.key, "distinct sites", s.size); });
