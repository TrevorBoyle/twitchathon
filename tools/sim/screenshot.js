// Render one game screen with the game's own CSS to a standalone page: node screenshot.js <screen> out.html
// screens: registration | activity | watch | ambiguous | travel | checklist | camp | end
const { T } = require("./sim.js"); const fs=require("fs");
const html = fs.readFileSync(process.env.TW_HTML,"utf8");
const css = html.match(/<style>\n\n([\s\S]*?)<\/style>/)[1];
const which = process.argv[2]||"activity"; globalThis.__CAPTURE = true;
T.state=null; T.regDraft=null;
let body="";
const cap = () => T.__lastHtml;
if(which==="registration"){ T.renderRegistration(); body = T.__lastHtml; }
else {
  const gen=T.generateTravel();
  T.regDraft={teamName:"Tarred and Feathered",costs:T.rollCosts(),travel:gen.travel,positions:gen.positions,skill:"backroads",binoculars:"premium",snackPacks:1,snackBars:0,scope:true,fieldGuide:false,weatherproof:false,parabolicMic:false,headTorch:false,thermos:true,trailMap:false,alarmClock:false,campStove:false,weather:T.WEATHER[0]};
  T.startGame(); const s=T.state;
  // play a bit so there is a log
  for(let i=0;i<3;i++){ T.startWatch("walk",45,1,0,false); while(s.ambiguous && which!=="ambiguous") T.logItAndMoveOn(); if(s.ambiguous) break; }
  if(which==="watch") s.sheet="watch";
  if(which==="travel") s.tab="travel";
  if(which==="checklist") s.tab="checklist";
  if(which==="camp"){ s.clock=Math.max(s.clock,1100); T.enterCamp(); body=T.__lastHtml; }
  else if(which==="end"){ s.clock=2000; T.endGame(true,"3:00pm Sunday. Time's up!"); body=T.__lastHtml; }
  else { T.__render(); body=T.__lastHtml; }
}
fs.writeFileSync(process.argv[3], '<meta charset="utf-8"><title>'+which+' preview</title><style>'+css+'body{background:var(--paper)}</style><div id="app">'+body+"</div>");
console.log("wrote", process.argv[3]);
