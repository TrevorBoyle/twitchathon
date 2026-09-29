// Render the Activity tab (fresh game at the hub) with the game's own CSS into a standalone page for a look.
const { T } = require("./sim.js"); const fs=require("fs");
const html = fs.readFileSync(process.env.TW_HTML,"utf8");
const css = html.match(/<style>\n\n([\s\S]*?)<\/style>/)[1];
T.state=null; T.regDraft=null; const gen=T.generateTravel();
T.regDraft={teamName:"Tarred and Feathered",costs:T.rollCosts(),travel:gen.travel,positions:gen.positions,skill:"backroads",binoculars:"premium",snackPacks:1,snackBars:0,scope:true,fieldGuide:false,weatherproof:false,parabolicMic:false,headTorch:false,thermos:true,trailMap:false,alarmClock:false,campStove:false,weather:T.WEATHER[3]};
T.startGame();
const body = T.renderActivityTab();
fs.writeFileSync(process.argv[2], "<title>HUD preview</title><style>"+css+"body{background:var(--paper)}</style><div id='app'>"+body+"</div>");
console.log("wrote", process.argv[2]);
