// Scripted "competent human" player driving the real engine.
const { loadEngine } = require("./engine.js");
const T = loadEngine(process.env.TW_HTML ? require("path").resolve(process.env.TW_HTML) : require("path").resolve(__dirname, "../../index.html"), process.env.TW_PATCHES ? require(require("path").resolve(process.env.TW_PATCHES)) : null);
const C = T.CONFIG;

const DEFAULT_OPTS = {
  skill: null,              // null = random (as in game)
  bino: "none", snacks: 0, scope: false, fieldGuide: false, weatherproof: false, parabolicMic: false,
  wakeIdx: 0,               // 0=4am 1=5am 2=6am
  restBelow: 45,            // rest when energy below this before committing to a loop
  snacksFirst: true,        // use snack before tea when resting
  maxAttempts: 6,           // keep-looking attempts before giving up
  keepLooking: true,
  offTrail: false,          // leave the trail whenever unseen rares/megas remain here
  useHide: false,
  campEarly: false,         // camp at 8pm if est. rate here is tiny
  loopPref: "long",         // "long" | "short"
  moveBias: 1.0,            // >1 = stickier
  callItAtNoon: false,      // exploit test: call it a weekend at noon Sunday
  freezeFix: false,         // simulate rivals to deadline on early call (proposed fix)
  hookAfterStart: null
};

function unseenHere(site){
  return site.species.filter(s => !T.state.confirmedThisVisit[s.id] && !T.isNameAlreadyKnown(s.name));
}

// expected new ticks over next `chunks` chunks at `site` starting from minutesOnSite=tos0, given bonus
function expectedTicks(site, cands, tos0, bonus, chunks){
  const st = T.state;
  const saveMin = st.minutesOnSite, saveClock = st.clock;
  let total = 0;
  for(const sp of cands){
    let miss = 1;
    for(let k=0;k<chunks;k++){
      st.minutesOnSite = tos0 + k*C.chunkMinutes;
      st.clock = saveClock + k*C.chunkMinutes;
      const d = T.detectionChance(site, sp, bonus);
      const i = T.idChance(sp, site, 0);
      // a failed ID has a 33% chance of an ambiguous chase that resolves ~50% -> treat p = d*(i + (1-i)*0.33*0.5)
      const p = d * (i + (1-i)*0.33*0.5);
      miss *= (1-p);
    }
    total += 1-miss;
  }
  st.minutesOnSite = saveMin; st.clock = saveClock;
  return total;
}

function siteObj(id){
  const b = T.SITES[id];
  return { id:b.id, zoneId:null, name:b.name, species:b.species, hide:b.hide, size:b.size, zone:b.zone };
}

function bestLoop(site, opts){
  const keys = T.getLoopOptions(site).slice();
  keys.sort((a,b)=> opts.loopPref==="long" ? C.loop[b].minutes-C.loop[a].minutes : C.loop[a].minutes-C.loop[b].minutes);
  for(const k of keys){ if(!T.wouldCrossCutoff(C.loop[k].minutes)) return k; }
  return null;
}

function decide(opts, stats){
  const st = T.state;
  const site = T.activeSite();
  const mod = T.minuteOfDay(st.clock);

  // --- movement decision ---
  const cands = unseenHere(site);
  const loopKey = bestLoop(site, opts);
  const bonusHere = loopKey ? C.loop[loopKey].bonus : 1;
  const stayHour = cands.length ? expectedTicks(site, cands, st.minutesOnSite, bonusHere, 4) : 0;
  const stayRate = stayHour/60;

  let best = null;
  for(const id of T.SITE_IDS){
    if(id===st.currentSite) continue;
    const path = T.shortestPath(st.currentSite, id);
    if(!path) continue;
    const mins = T.pathTotalMinutes(path);
    if(T.wouldCrossCutoff(mins + 20)) continue;
    const s2 = siteObj(id);
    const c2 = s2.species.filter(s => !T.isNameAlreadyKnown(s.name));
    if(!c2.length) continue;
    const lk = T.getLoopOptions(s2); const b2 = C.loop[lk[lk.length-1]].bonus;
    // evaluate at arrival time (shift clock)
    const saveClock = st.clock; st.clock += mins;
    const hour = expectedTicks(s2, c2, 0, b2, 4);
    st.clock = saveClock;
    const rate = hour/(mins+60);
    if(!best || rate>best.rate) best = { id, rate, mins, path };
  }

  const moving = best && best.rate > stayRate*opts.moveBias && (cands.length===0 || best.rate > 0);

  // Saturday: camp if nothing worthwhile and camp is allowed
  if(st.day==="Saturday" && mod>=C.campEarliestMinuteOfDay){
    const nothing = (!loopKey || stayRate<0.004) && (!best || best.rate<0.004);
    if(nothing || (opts.campEarly && stayRate<0.01 && (!best || best.rate<0.01))){ T.enterCamp(); stats.campClock = st.clock; return; }
  }
  if(st.day==="Sunday" && (opts.callItAtNoon && mod>=C.callItAWeekendEarliestMinuteOfDay)){
    T.attemptTextIn(); return;
  }

  if(moving){
    for(let i=1;i<best.path.length;i++){ if(st.ended||st.phase!=="play") break; if(st.ambiguous) break; if(!T.travelHop(best.path[i])) break; }
    stats.drives++; stats.driveMin += best.mins;
    return;
  }

  if(!loopKey){
    // nothing fits before cutoff
    if(st.day==="Saturday"){
      if(mod>=C.campEarliestMinuteOfDay){ T.enterCamp(); stats.campClock=st.clock; return; }
      T.doTeaBreak(); stats.teas++; stats.wastedTeas++; return;
    }
    if(mod>=C.callItAWeekendEarliestMinuteOfDay){ T.attemptTextIn(); return; }
    T.doTeaBreak(); stats.teas++; stats.wastedTeas++; return;
  }

  // --- energy management ---
  const loopMin = C.loop[loopKey].minutes;
  const offTrail = opts.offTrail && cands.some(s=>s.tier==="rare"||s.tier==="mega");
  const drain = C.energyRates.walk*(loopMin/60)*(offTrail?C.offTrail.energyMult:1)*(st.fatigueMult||1)*1.05;
  if(st.energy - drain < opts.restBelow - 15 || st.energy < opts.restBelow){
    if(st.snackBars>0 && opts.snacksFirst){ T.eatSnack(); stats.snacks++; return; }
    if(T.nextTeaBreakRestore() > 0 && st.energy < st.energyCeiling){
      if(T.wouldCrossCutoff(C.teaBreak.minutes)){ /* fallthrough to loop */ }
      else { T.doTeaBreak(); stats.teas++; return; }
    }
  }

  const useHide = opts.useHide && site.hide && !T.wouldCrossCutoff(C.hideSearch.minutes);
  if(useHide){ T.startWatch("hide", C.hideSearch.minutes, 1); stats.hides++; return; }
  T.startWatch("walk", loopMin, C.loop[loopKey].bonus, 0, offTrail);
  stats.loops++; stats.loopMin += loopMin;
}

function handleAmbiguous(opts, stats){
  const st = T.state; const amb = st.ambiguous;
  if(amb.altSpeciesId){
    const a = T.FLAT_SPECIES.find(f=>f.species.id===amb.speciesId).species;
    const b = T.FLAT_SPECIES.find(f=>f.species.id===amb.altSpeciesId).species;
    const rank = {mega:0,rare:1,uncommon:2,common:3};
    const ka = T.isNameAlreadyKnown(a.name), kb = T.isNameAlreadyKnown(b.name);
    let keep = "a";
    if(ka && !kb) keep = "b"; else if(!ka && kb) keep="a"; else keep = rank[a.tier]<=rank[b.tier] ? "a" : "b";
    T.resolveDoubleFlush(keep); return;
  }
  stats.ambiguous++;
  const cooked = T.energyTier(st.energy).name==="Cooked";
  if(cooked){ if(st.snackBars>0){ T.eatSnack(); stats.snacks++; } else { T.logItAndMoveOn(); stats.gaveUp++; } return; }
  if(opts.keepLooking && amb.attempts < opts.maxAttempts){ T.resolveKeepLooking(); stats.attempts++; return; }
  T.logItAndMoveOn(); stats.gaveUp++;
}

function playGame(userOpts){
  const opts = Object.assign({}, DEFAULT_OPTS, userOpts||{});
  T.state = null; T.regDraft = null;
  const gen = T.generateTravel();
  T.regDraft = { teamName:"Sim", costs:T.rollCosts(), travel:gen.travel, positions:gen.positions,
    skill: opts.skill || T.SKILL_DEFS[Math.floor(Math.random()*4)].key,
    binoculars: opts.bino, snackPacks: opts.snacks, snackBars: opts.snackBars||0, scope: opts.scope, fieldGuide: opts.fieldGuide, weatherproof: opts.weatherproof, parabolicMic: opts.parabolicMic,
    headTorch: !!opts.headTorch, thermos: !!opts.thermos, trailMap: !!opts.trailMap, alarmClock: !!opts.alarmClock, campStove: !!opts.campStove,
    weather: T.WEATHER[Math.floor(Math.random()*T.WEATHER.length)] };
  T.startGame();
  if(opts.hookAfterStart) opts.hookAfterStart(T);
  const stats = { loops:0, loopMin:0, hides:0, teas:0, wastedTeas:0, snacks:0, drives:0, driveMin:0, ambiguous:0, attempts:0, gaveUp:0, campClock:null, curve:[], energyTiers:{Fresh:0,Flagging:0,"Running on empty":0,Cooked:0} };
  let guard = 0;
  const st = () => T.state;
  let lastCurveHour = -1;
  while(st().phase!=="end" && guard++ < 5000){
    const s = st();
    if(s.phase==="camp"){
      stats.rivalsAtCamp = Object.assign({}, s.rivals.counts); stats.speciesAtCamp = T.distinctConfirmedCount(); stats.energyAtCamp = s.energy;
      T.chooseSleep(T.wakeOptions()[opts.wakeIdx].wakeClock);
      T.simulateRivals(s.clock); stats.rivalsAtWake = Object.assign({}, s.rivals.counts); stats.energyAtWake = s.energy;
      continue;
    }
    if(s.phase!=="play") break;
    const h = Math.floor(s.clock/60);
    if(h!==lastCurveHour){ lastCurveHour=h; stats.curve.push([s.clock, T.distinctConfirmedCount()]); stats.energyTiers[T.energyTier(s.energy).name]++; }
    if(s.ambiguous){ handleAmbiguous(opts, stats); continue; }
    decide(opts, stats);
  }
  if(opts.freezeFix && T.state.clock < C.deadline){ T.simulateRivals(C.deadline); }
  const s = T.state;
  const score = T.distinctConfirmedCount();
  const rivals = Object.assign({}, s.rivals.counts);
  const rivalVals = Object.values(rivals);
  const rank = 1 + rivalVals.filter(v=>v>score).length;
  const events = s.log.filter(e=>e.cls==="event").length;
  const tiers = {common:0,uncommon:0,rare:0,mega:0};
  const names = {};
  Object.values(s.confirmed).forEach(c=>{ if(!names[c.name]){ names[c.name]=1; tiers[c.tier]++; } });
  return { score, rank, rivals, maxRival: Math.max(...rivalVals), events, tiers, skill: s.loadout.skill, weather: s.weatherLabel, endClock: s.clock, stats, gotAway: s.gotAway.length };
}

function summarize(results){
  const n = results.length;
  const mean = a => a.reduce((x,y)=>x+y,0)/a.length;
  const sd = a => { const m=mean(a); return Math.sqrt(mean(a.map(x=>(x-m)*(x-m)))); };
  const scores = results.map(r=>r.score);
  const s = { n, mean: mean(scores), sd: sd(scores), se: sd(scores)/Math.sqrt(n), winRate: mean(results.map(r=>r.rank===1?1:0)), meanRank: mean(results.map(r=>r.rank)), maxRival: mean(results.map(r=>r.maxRival)) };
  s.tiers = { common: mean(results.map(r=>r.tiers.common)), uncommon: mean(results.map(r=>r.tiers.uncommon)), rare: mean(results.map(r=>r.tiers.rare)), mega: mean(results.map(r=>r.tiers.mega)) };
  s.teas = mean(results.map(r=>r.stats.teas)); s.snacks = mean(results.map(r=>r.stats.snacks)); s.drives = mean(results.map(r=>r.stats.drives)); s.driveMin = mean(results.map(r=>r.stats.driveMin)); s.loopMin = mean(results.map(r=>r.stats.loopMin));
  s.events = mean(results.map(r=>r.events)); s.ambiguous = mean(results.map(r=>r.stats.ambiguous)); s.attempts = mean(results.map(r=>r.stats.attempts));
  const rk = {}; T.RIVAL_DEFS.forEach(r=>{ rk[r.key] = mean(results.map(x=>x.rivals[r.key])); }); s.rivalMeans = rk;
  const et = {}; Object.keys(results[0].stats.energyTiers).forEach(k=>{ et[k] = mean(results.map(r=>r.stats.energyTiers[k])); }); s.energyTiers = et;
  return s;
}

function run(label, opts, n){
  const res = []; for(let i=0;i<n;i++) res.push(playGame(opts));
  const s = summarize(res);
  return { label, s, res };
}

module.exports = { T, C, playGame, summarize, run, DEFAULT_OPTS };

if(require.main===module){
  const r = run("smoke", { bino:"mid", snacks:1 }, 20);
  console.log(JSON.stringify(r.s, null, 1));
}
