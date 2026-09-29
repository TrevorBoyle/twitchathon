// Render the current edition's map (with the player at the hub) to a standalone HTML file for a look.
const { T } = require("./sim.js");
const fs = require("fs");
T.state=null; T.regDraft=null; const gen=T.generateTravel();
T.regDraft={teamName:"x",costs:T.rollCosts(),travel:gen.travel,positions:gen.positions,skill:"backroads",binoculars:"none",snackPacks:0,snackBars:0,scope:false,fieldGuide:false,weatherproof:false,parabolicMic:false,headTorch:false,thermos:false,trailMap:false,alarmClock:false,campStove:false,weather:T.WEATHER[0]};
T.startGame();
const svg = T.renderMapSvg(T.state.positions, T.state.travel, T.state.currentSite, {}, T.siteRemainingCounts());
fs.writeFileSync(process.argv[2], "<title>Map preview</title><style>body{margin:0;background:#141d17}svg{width:100%;height:auto;display:block}</style>"+svg);
console.log("wrote", process.argv[2]);
