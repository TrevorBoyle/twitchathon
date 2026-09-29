// Run the real render functions against a minimal fake DOM and look for errors / "undefined" / "NaN" in the output HTML.
const fs = require("fs");
const file = process.argv[2] || process.env.TW_HTML || require("path").resolve(__dirname, "../../index.html");
const html = fs.readFileSync(file, "utf8");
const start = html.indexOf("<script>\n(function(){"); const end = html.indexOf("})();\n</script>", start);
let src = html.slice(start + "<script>\n".length, end);
src = src.replace("\nboot();\n", "\n").replace("initTheme();", "");
src = src.replace("function revealAndRender(){", "function revealAndRender(){ render(); return; }\nfunction __rar_orig(){");
src = src.replace("function scrollLogToBottom(){", "function scrollLogToBottom(){ return; }\nfunction __sltb_orig(){");
src += `
globalThis.__T = { get state(){return state;}, set state(v){state=v;}, get regDraft(){return regDraft;}, set regDraft(v){regDraft=v;},
  render, renderRegistration, startGame, startWatch, doTeaBreak, eatSnack, enterCamp, chooseSleep, wakeOptions, endGame, travelHop, resolveKeepLooking, CONFIG, SITES, SITE_IDS, WEATHER, SKILL_DEFS, maybeTriggerEvent, fireEvent, energyTier, distinctConfirmedCount };
})();`;
const renders = [];
const rootEl = { _html:"", set innerHTML(v){ this._html=v; renders.push(v); }, get innerHTML(){ return this._html; }, querySelectorAll(){ return []; }, querySelector(){ return null; }, style:{}, addEventListener(){} };
const stubEl = () => ({ addEventListener(){}, setAttribute(){}, getAttribute(){ return null; }, style:{}, innerHTML:"", classList:{ toggle(){}, add(){}, remove(){} }, querySelectorAll(){ return []; }, querySelector(){ return null; }, getBoundingClientRect(){ return {height:0,top:0,bottom:0}; } });
const mem = {};
const sandbox = {
  document: { getElementById(id){ return id==="app" ? rootEl : stubEl(); }, querySelector(){ return null; }, querySelectorAll(){ return []; }, documentElement: stubEl(), body: stubEl() },
  window: { matchMedia(){ return { matches:false, addEventListener(){} }; }, scrollBy(){}, scrollTo(){}, innerHeight:800, scrollY:0 },
  localStorage: { getItem(k){ return k in mem ? mem[k] : null; }, setItem(k,v){ mem[k]=String(v); } },
  setTimeout(fn){ return 0; }, clearTimeout(){}, Math, Object, Array, String, Number, JSON, Date, Infinity, NaN, parseInt, parseFloat, isNaN, console, globalThis
};
new Function(...Object.keys(sandbox), src)(...Object.values(sandbox));
const T = globalThis.__T;
function check(label){
  const h = renders[renders.length-1] || "";
  const bad = /undefined|NaN|\[object Object\]/.test(h);
  console.log((bad ? "!! " : "ok ") + label.padEnd(34), h.length, "chars", bad ? ("  <-- suspicious: " + h.match(/.{0,60}(undefined|NaN|\[object Object\]).{0,40}/)[0]) : "");
}
T.render(); check("registration");
// pick every item
const rd = T.regDraft; rd.binoculars="mid"; rd.snackPacks=1; rd.snackBars=2; rd.scope=true; rd.fieldGuide=true; rd.weatherproof=true; rd.parabolicMic=true; rd.headTorch=true; rd.thermos=true; rd.trailMap=true; rd.alarmClock=true; rd.campStove=true; rd.skill="ironConstitution";
T.renderRegistration(); check("registration (all items)");
console.log("   forecast shown:", /Saturday forecast: <b>[^<]+<\/b>/.test(renders[renders.length-1]), "| loose bars:", /2 bars \(4 pts ea\)/.test(renders[renders.length-1]), "| head torch card:", /Head torch/.test(renders[renders.length-1]));
T.startGame(); check("play: activity tab");
const s = T.state;
console.log("   snackBars:", s.snackBars, "weather:", s.weatherLabel, "energyTier@65 (iron):", T.energyTier(65).name, "rivals:", Object.keys(s.rivals.counts).length);
console.log("   standings fuzzy:", /Standings \(word of mouth\)/.test(renders[renders.length-1]) && /<b>~\d+<\/b>/.test(renders[renders.length-1]));
s.tab="travel"; T.render(); check("play: travel tab");
s.tab="checklist"; T.render(); check("play: checklist tab");
s.tab="activity"; s.sheet="watch"; T.render(); check("play: watch panel");
// force every event once and render alerts
for(const t of T.CONFIG.eventPool){ s.clock += 0; const ok = T.fireEvent(t, t==="servoSpecial"?"road":"site"); if(!ok){ /* try at a suitable time */ } }
T.render(); check("play: after all events fired");
// force ambiguous: loop through watches until state.ambiguous
let guard=0; while(!s.ambiguous && guard++<60 && s.phase==="play"){ T.startWatch("walk", 45, 1.0, 0, false); if(s.energy<30) T.doTeaBreak(); }
if(s.ambiguous){ T.render(); check("play: ambiguous panel"); console.log("   ", (renders[renders.length-1].match(/Next look:[^<]*/)||[""])[0]); T.resolveKeepLooking(); check("play: after keep looking"); }
T.doTeaBreak(); check("play: after tea"); T.doTeaBreak(); check("play: second tea (cooldown)");
console.log("   ", (renders[renders.length-1].match(/Another tea break within three hours[^<]*/)||["(no cooldown msg — fine if energy was full)"])[0]);
// travel closed-site guard
const closed = s.activeEffects.filter(e=>e.type==="trackClosed")[0];
if(closed){ const r = T.travelHop(closed.siteId); console.log("   travel into closed site refused:", r===false); }
// camp
s.clock = Math.max(s.clock, 1090); T.enterCamp(); check("camp screen");
console.log("   wake options:", T.wakeOptions().map(o=>Math.round(o.hours*10)/10+"h/r"+o.rate+"/+"+o.ceilingBonus).join(" "));
console.log("   ", (renders[renders.length-1].match(/Wake at [^<]*<span class="mono energy-note">[^<]*/g)||[]).map(x=>x.replace(/<[^>]+>/g," ")).join(" | "));
T.chooseSleep(T.wakeOptions()[0].wakeClock); check("sunday: activity");
console.log("   energy:", Math.round(s.energy), "ceiling:", s.energyCeiling, "day:", s.day, "clock:", s.clock);
s.clock = 2000; T.endGame(true, "test"); check("end screen");
console.log("   leaderboard rows:", (renders[renders.length-1].match(/lb-row/g)||[]).length, "rivals at deadline:", JSON.stringify(s.rivals.counts));
