// Loads the real Twitchathon engine from index.html into Node with rendering neutered.
// Exposes internals via globalThis.__T so we can drive the game with a scripted player.
const fs = require("fs");
const path = require("path");

function loadEngine(htmlPath, patches){
  const html = fs.readFileSync(htmlPath, "utf8");
  const start = html.indexOf("<script>\n(function(){");
  const end = html.indexOf("})();\n</script>", start);
  let src = html.slice(start + "<script>\n".length, end);

  // neuter rendering / timers / scrolling
  src = src.replace("function render(){", "function render(){ if(globalThis.__CAPTURE){ __render_orig(); } return; }\nfunction __render_orig(){");
  src = src.replace("function revealAndRender(){", "function revealAndRender(){ return; }\nfunction __rar_orig(){");
  src = src.replace("function renderAnim(count){", "function renderAnim(count){ return; }\nfunction __ra_orig(count){");
  src = src.replace("function focusAmbiguousPanel(){", "function focusAmbiguousPanel(){ return; }\nfunction __fap_orig(){");
  src = src.replace("function focusWatchPanel(){", "function focusWatchPanel(){ return; }\nfunction __fwp_orig(){");
  src = src.replace("function scrollLogToBottom(){", "function scrollLogToBottom(){ return; }\nfunction __sltb_orig(){");
  src = src.replace("\nboot();\n", "\n");
  src = src.replace("initTheme();", "");

  const exports = `
  globalThis.__T = {
    get state(){ return state; }, set state(v){ state = v; },
    get regDraft(){ return regDraft; }, set regDraft(v){ regDraft = v; },
    CONFIG, SITES, SITE_IDS, ABUNDANCE, FLAT_SPECIES, SPECIES_ROSTER, SKILL_DEFS, RIVAL_DEFS, WEATHER, MANUAL_ROADS,
    WET_SITE_IDS, FAR_SITE_GROUPS, HUB_SITE_ID,
    freshState, generateTravel, rollCosts, rollWeather, startGame,
    detectionChance, idChance, energyTier, windowIndex, minuteOfDay, timeOnSiteMult, isConfusing,
    processChunk, startWatch, travelHop, doTravel, doTeaBreak, eatSnack, enterCamp, chooseSleep, wakeOptions,
    resolveKeepLooking, logItAndMoveOn, resolveDoubleFlush, handleDetection, maybeTriggerEvent,
    createSmartBot, smartBotChunk, advanceSmartBot, simulateRivals, smartBotDetectionChance, smartBotIdChance,
    getLoopOptions, activeSite, distinctConfirmedCount, isNameAlreadyKnown, shortestPath, pathTotalMinutes,
    checkAutoTransitions, endGame, attemptTextIn, nextTeaBreakRestore, keepLookingEnergyCost, roadsideRaptorChance,
    oddsSnapshot, cutoffClock, wouldCrossCutoff, renderMapSvg, siteRemainingCounts, renderActivityTab, renderRegistration,
    __render(){ __render_orig(); }, get __lastHtml(){ return globalThis.__lastHtml; }
  };
  `;
  (patches||[]).forEach(function(pr){ if(src.indexOf(pr[0])<0) throw new Error("patch not found: "+pr[0].slice(0,60)); src = src.split(pr[0]).join(pr[1]); });
  src = src + exports + "\n})();";

  // DOM / browser stubs
  const rootEl = { addEventListener(){}, setAttribute(){}, getAttribute(){ return null; }, style:{}, set innerHTML(v){ globalThis.__lastHtml = v; }, get innerHTML(){ return globalThis.__lastHtml||""; }, classList:{ toggle(){}, add(){}, remove(){} }, querySelectorAll(){ return []; }, querySelector(){ return null; }, getBoundingClientRect(){ return {height:0,top:0,bottom:0}; } };
  const stubEl = () => ({
    addEventListener(){}, setAttribute(){}, getAttribute(){ return null; }, style:{}, innerHTML:"",
    classList:{ toggle(){}, add(){}, remove(){} }, querySelectorAll(){ return []; }, querySelector(){ return null; },
    getBoundingClientRect(){ return {height:0,top:0,bottom:0}; }
  });
  const mem = {};
  const sandbox = {
    document: { getElementById(id){ return id==="app" ? rootEl : stubEl(); }, querySelector(){ return null; }, querySelectorAll(){ return []; },
      documentElement: stubEl(), body: stubEl() },
    window: { matchMedia(){ return { matches:false, addEventListener(){} }; }, scrollBy(){}, scrollTo(){}, innerHeight:800, scrollY:0 },
    localStorage: { getItem(k){ return k in mem ? mem[k] : null; }, setItem(k,v){ mem[k]=String(v); }, removeItem(k){ delete mem[k]; } },
    setTimeout, clearTimeout, Math, Object, Array, String, Number, JSON, Date, Infinity, NaN, parseInt, parseFloat, isNaN, console, globalThis
  };
  const fn = new Function(...Object.keys(sandbox), src);
  fn(...Object.values(sandbox));
  return globalThis.__T;
}

module.exports = { loadEngine };
