// Build the per-site re-tier / trim / add plan for the UK edition and print it as JSON.
const { T } = require("../sim.js");
const S = require("./uk_status.js");
const MAP = { c:"common", u:"uncommon", r:"rare", m:"mega", x:"drop" };
const TARGET = { common:18, uncommon:24, rare:11, megaCoastal:2, megaInland:2 };

// Megas to keep per site (real records at or beside that hotspot); everything else tiered mega is cut.
const KEEP_MEGA = {
  spurn: ["Great Snipe","Brown Shrike"],
  stmarys: ["Cream-colored Courser","Rose-breasted Grosbeak"],
  dungeness: ["Slender-billed Gull","Sardinian Warbler"],
  norfolk: ["Ross's Gull","Black-winged Pratincole"],
  flamborough: ["Pale-legged Leaf Warbler","Eurasian Crag-Martin"],
  stagnes: ["Red-footed Booby","Wood Thrush"],
  london: ["Eurasian Penduline-Tit","Aquatic Warbler"],
  rutland: ["Stilt Sandpiper","Black Stork"],
  kielder: [], pennines: [], peak: ["Least Sandpiper","Gray-hooded Gull"], alvecote: [], oxfordshire: ["American Pipit","Marsh Sandpiper"], dartmoor: [], shropshire: []
};

// Widespread British species to top a site up to 18 commons, in order of preference (habitat-neutral first).
const COMMON_POOL = [
  ["Eurasian Wren","bush",0.90],["European Robin","bush",0.92],["Eurasian Blackbird","bush",0.92],["Common Wood-Pigeon","bush",0.92],["Carrion Crow","bush",0.92],
  ["Eurasian Magpie","bush",0.92],["Eurasian Blue Tit","bush",0.90],["Great Tit","bush",0.90],["Dunnock","bush",0.80],["European Goldfinch","bush",0.88],
  ["European Starling","bush",0.90],["House Sparrow","bush",0.92],["Eurasian Linnet","bush",0.75],["Meadow Pipit","bush",0.75],["Eurasian Skylark","bush",0.80],
  ["European Herring Gull","water",0.85],["Black-headed Gull","water",0.85],["Great Black-backed Gull","water",0.85],["Great Cormorant","water",0.88],["Mallard","water",0.90],
  ["Eurasian Oystercatcher","water",0.90],["Eurasian Curlew","water",0.85],["Common Redshank","water",0.75],["Ruddy Turnstone","water",0.80],["Eurasian Kestrel","raptor",0.85],
  ["Common Buzzard","raptor",0.85],["Barn Swallow","bush",0.88],["European Stonechat","bush",0.85],["Common Chiffchaff","bush",0.70],["Willow Warbler","bush",0.65],
  ["Eurasian Coot","water",0.90],["Eurasian Moorhen","water",0.88],["Gray Heron","water",0.90],["Mute Swan","water",0.95],["Tufted Duck","water",0.85],
  ["Common Chaffinch","bush",0.85],["Eurasian Jackdaw","bush",0.90],["Rook","bush",0.85],["Song Thrush","bush",0.80],["Long-tailed Tit","bush",0.80]
];

// Rare (and a few uncommon) additions per inland site: species with an established record history at or
// around that hotspot, to verify against the eBird pull in the location editor before shipping.
const RARE_ADDS = {
  kielder: [["Eurasian Goshawk","raptor","r",0.45],["Black Grouse","bush","u",0.60],["Two-barred Crossbill","bush","m",0.40],["Great Gray Shrike","bush","r",0.55],["Bohemian Waxwing","bush","r",0.60],["Hawfinch","bush","r",0.45],["Common Loon","water","r",0.55],["Horned Grebe","water","r",0.50],["Smew","water","r",0.55],["Greater Scaup","water","r",0.50],["Red-throated Loon","water","r",0.55],["Eurasian Nightjar","nocturnal","u",0.55]],
  pennines: [["Black Grouse","bush","u",0.60],["Eurasian Dotterel","bush","r",0.45],["Great Gray Shrike","bush","r",0.55],["Snow Bunting","bush","r",0.55],["Twite","bush","r",0.45],["Lapland Longspur","bush","r",0.40],["Rough-legged Hawk","raptor","r",0.40],["Hen Harrier","raptor","r",0.50],["Temminck's Stint","water","r",0.40],["Eurasian Goshawk","raptor","r",0.45],["Pallid Harrier","raptor","m",0.35]],
  peak: [["Pectoral Sandpiper","water","r",0.40],["Temminck's Stint","water","r",0.40],["Black Tern","water","r",0.55],["Little Gull","water","r",0.55],["Caspian Gull","water","r",0.40],["Ring Ouzel","bush","u",0.55],["Short-eared Owl","nocturnal","r",0.50],["Great Gray Shrike","bush","r",0.55]],
  alvecote: [["Black-necked Grebe","water","r",0.50],["Smew","water","r",0.55],["Greater Scaup","water","r",0.50],["Black Tern","water","r",0.55],["Little Gull","water","r",0.55],["Western Cattle-Egret","water","r",0.60],["Glossy Ibis","water","r",0.55],["Green-winged Teal","water","r",0.40],["Ring-necked Duck","water","r",0.50],["Ferruginous Duck","water","r",0.40],["Lesser Spotted Woodpecker","bush","r",0.40],["Osprey","raptor","r",0.60],["Eurasian Bittern","water","r",0.40]],
  oxfordshire: [["Black-necked Grebe","water","r",0.50],["Horned Grebe","water","r",0.50],["Common Loon","water","r",0.55],["Arctic Loon","water","r",0.45],["Black Tern","water","r",0.55],["Red Phalarope","water","r",0.45],["Leach's Storm-Petrel","water","m",0.40],["Rock Pipit","bush","u",0.55]],
  dartmoor: [["Dartford Warbler","bush","u",0.50],["Eurasian Goshawk","raptor","r",0.45],["Hen Harrier","raptor","r",0.50],["Lesser Spotted Woodpecker","bush","r",0.40],["Hawfinch","bush","r",0.45],["Great Gray Shrike","bush","r",0.55],["Bohemian Waxwing","bush","r",0.60],["Eurasian Dotterel","bush","r",0.45],["Red Crossbill","bush","u",0.55],["European Honey-buzzard","raptor","m",0.35],["Merlin","raptor","u",0.55],["Short-eared Owl","nocturnal","r",0.50]],
  shropshire: [["Eurasian Dotterel","bush","r",0.45],["Snow Bunting","bush","r",0.55],["Lapland Longspur","bush","m",0.40],["Great Gray Shrike","bush","r",0.55],["Hen Harrier","raptor","r",0.50],["Eurasian Goshawk","raptor","r",0.45],["Short-eared Owl","nocturnal","r",0.50],["Twite","bush","r",0.45],["Ring Ouzel","bush","u",0.55],["European Pied Flycatcher","bush","u",0.60],["Wood Warbler","bush","u",0.55],["White-throated Dipper","water","u",0.70]],
  london: [["Little Ringed Plover","water","u",0.65],["Water Pipit","bush","r",0.45],["Iceland Gull","water","r",0.45],["Glaucous Gull","water","r",0.50],["Ring Ouzel","bush","r",0.55],["Temminck's Stint","water","r",0.40],["Pectoral Sandpiper","water","r",0.40]],
  rutland: [["Black-necked Grebe","water","r",0.50],["Black Tern","water","u",0.55],["Osprey","raptor","u",0.70],["Red-necked Grebe","water","r",0.50],["Great Egret","water","u",0.65]]
};

// Characteristic scarce migrants a birder expects at a good coastal site — these win a rare slot ahead of
// the one-record oddities when a site has more rares than the cap.
const PREFER = ["Yellow-browed Warbler","Pallas's Leaf Warbler","Barred Warbler","Eurasian Wryneck","Red-backed Shrike","Icterine Warbler","Red-breasted Flycatcher","Common Rosefinch","Pomarine Jaeger","Sabine's Gull","Long-tailed Jaeger","Richard's Pipit","Red-throated Pipit","Rosy Starling","Little Bunting","Rustic Bunting","Ortolan Bunting","Bluethroat","Melodious Warbler","Radde's Warbler","Dusky Warbler","Hume's Warbler","Red-flanked Bluetail","Olive-backed Pipit","Pectoral Sandpiper","White-rumped Sandpiper","Buff-breasted Sandpiper","Red-necked Grebe","Great Gray Shrike","Glaucous Gull","Iceland Gull","Caspian Tern","Black-winged Stilt","Kentish Plover","Glossy Ibis","Purple Heron","Black-crowned Night Heron","Eurasian Bittern","Black Redstart","Common Hoopoe","European Serin","Woodchat Shrike","Rough-legged Hawk","Pallid Swift","Gull-billed Tern","Broad-billed Sandpiper","Temminck's Stint","Red-footed Falcon","European Honey-buzzard","Black Kite","White-winged Tern","Ring-necked Duck","Lesser Scaup","American Wigeon","Green-winged Teal","Arctic Loon","Eared Grebe","Leach's Storm-Petrel","Cory's Shearwater","Balearic Shearwater","Roseate Tern","Eurasian Dotterel","Common Quail","Hawfinch","Bohemian Waxwing","Eurasian Goshawk","Short-eared Owl"];
const prefRank = n => { const i = PREFER.indexOf(n); return i < 0 ? 999 : i; };
const COASTAL_ADDS = {
  spurn: [["Yellow-browed Warbler","bush","r",0.55],["Pallas's Leaf Warbler","bush","r",0.50],["Red-backed Shrike","bush","r",0.60]],
  flamborough: [["Pallas's Leaf Warbler","bush","r",0.50],["Barred Warbler","bush","r",0.50],["Red-breasted Flycatcher","bush","r",0.55]],
  dungeness: [["Pomarine Jaeger","water","r",0.50],["Eurasian Wryneck","bush","r",0.55]],
  norfolk: [["Eurasian Wryneck","bush","r",0.55],["Red-backed Shrike","bush","r",0.60]],
  stmarys: [["Yellow-browed Warbler","bush","r",0.55],["Pallas's Leaf Warbler","bush","r",0.50],["Richard's Pipit","bush","r",0.45]],
  stagnes: [["Yellow-browed Warbler","bush","r",0.55],["Red-breasted Flycatcher","bush","r",0.55],["Eurasian Wryneck","bush","r",0.55]]
};
Object.keys(COASTAL_ADDS).forEach(k => { RARE_ADDS[k] = (RARE_ADDS[k]||[]).concat(COASTAL_ADDS[k]); });
RARE_ADDS.shropshire = RARE_ADDS.shropshire.concat([["Hawfinch","bush","r",0.45],["Bohemian Waxwing","bush","r",0.60],["Lesser Spotted Woodpecker","bush","r",0.40],["Black Redstart","bush","r",0.55],["Common Quail","bush","r",0.35,true]]);
RARE_ADDS.kielder = RARE_ADDS.kielder.concat([["Common Crane","water","r",0.60],["Ring-necked Duck","water","r",0.50]]);
RARE_ADDS.dartmoor = RARE_ADDS.dartmoor.concat([["Common Quail","bush","r",0.35,true],["Black Redstart","bush","r",0.55]]);
RARE_ADDS.pennines = RARE_ADDS.pennines.concat([["Common Quail","bush","r",0.35,true]]);

const siteCount = {}; T.SPECIES_ROSTER.forEach(r => siteCount[r.name] = r.sites.length);
const plan = {};
T.SITE_IDS.forEach(id => {
  const s = T.SITES[id];
  const coastal = s.zone === "coastal";
  const rows = s.species.map(sp => ({ name: sp.name, group: sp.group, idDiff: sp.idDiff, audio: sp.audio, old: sp.tier, tier: MAP[S[sp.name]] }));
  const by = t => rows.filter(r => r.tier === t);
  const keep = [], cut = [];
  by("drop").forEach(r => cut.push({ ...r, why: "escape-prone / not a wild vagrant" }));
  // commons and uncommons: keep the ones shared with the fewest other sites first (variety), cap at target
  const rank = arr => arr.slice().sort((a, b) => siteCount[a.name] - siteCount[b.name]);
  const commons = by("common").slice().sort((a, b) => siteCount[b.name] - siteCount[a.name]); commons.slice(0, TARGET.common).forEach(r => keep.push(r)); commons.slice(TARGET.common).forEach(r => cut.push({ ...r, why: "over the 18-common cap; shared with " + (siteCount[r.name]-1) + " other sites" }));
  const uncs = rank(by("uncommon")); uncs.slice(0, TARGET.uncommon).forEach(r => keep.push(r)); uncs.slice(TARGET.uncommon).forEach(r => cut.push({ ...r, why: "over the 24-uncommon cap; shared with " + (siteCount[r.name]-1) + " other sites" }));
  const rareAdds = (RARE_ADDS[id]||[]).filter(a => a[2]==="r" && !rows.some(r => r.name===a[0])).map(a => ({ name:a[0], group:a[1], tier:"rare", idDiff:a[3], audio:!!a[4], isAdd:true }));
  const rares = by("rare").concat(rareAdds).sort((a, b) => (prefRank(a.name) - prefRank(b.name)) || ((siteCount[a.name]||0) - (siteCount[b.name]||0)));
  rares.slice(0, TARGET.rare).forEach(r => keep.push(r)); rares.slice(TARGET.rare).forEach(r => { if(!r.isAdd) cut.push({ ...r, why: "over the 11-rare cap" }); });
  const megas = by("mega"); megas.forEach(r => { if ((KEEP_MEGA[id]||[]).includes(r.name)) keep.push(r); else cut.push({ ...r, why: "mega: one-off vagrant, over the " + (coastal?2:2) + "-mega cap" }); });
  // additions
  const have = new Set(keep.map(r => r.name));
  const add = [];
  let nCommon = keep.filter(r => r.tier === "common").length;
  for (const [name, group, idDiff] of COMMON_POOL) { if (nCommon >= TARGET.common) break; if (have.has(name) || rows.some(r => r.name === name)) continue; add.push({ name, group, tier: "common", idDiff }); have.add(name); nCommon++; }
  let nRare = keep.filter(r => r.tier === "rare").length, nMega = keep.filter(r => r.tier === "mega").length, nUnc = keep.filter(r => r.tier === "uncommon").length;
  for (const [name, group, t, idDiff] of (RARE_ADDS[id] || [])) {
    if (have.has(name) || rows.some(r => r.name === name && r.tier !== "drop" && keep.some(k=>k.name===name))) continue;
    const tier = MAP[t];
    if (tier === "rare" && nRare >= TARGET.rare) continue;
    if (tier === "mega" && nMega >= 2) continue;
    if (tier === "uncommon" && nUnc >= TARGET.uncommon) continue;
    add.push({ name, group, tier, idDiff }); have.add(name);
    if (tier === "rare") nRare++; else if (tier === "mega") nMega++; else nUnc++;
  }
  const finalRows = keep.filter(r => !r.isAdd).concat(keep.filter(r => r.isAdd).map(r => Object.assign({}, r)), add);
  keep.filter(r => r.isAdd).forEach(r => add.unshift(r));
  const keepOnly = keep.filter(r => !r.isAdd); keep.length = 0; keepOnly.forEach(r => keep.push(r));
  const c = { common:0, uncommon:0, rare:0, mega:0 }; finalRows.forEach(r => c[r.tier]++);
  const n = finalRows.length;
  plan[id] = { name: s.name.trim(), hotspot: null, coastal, before: { n: s.species.length, tiers: rows.reduce((a, r) => { a[r.old] = (a[r.old]||0)+1; return a; }, {}) }, retiered: rows.reduce((a, r) => { a[r.tier] = (a[r.tier]||0)+1; return a; }, {}), after: { n, tiers: c, rarePct: Math.round(100*c.rare/n), rareMegaPct: Math.round(100*(c.rare+c.mega)/n) }, keep, cut, add };
});
// roster after
const names = {}; Object.values(plan).forEach(p => p.keep.concat(p.add).forEach(r => { names[r.name] = r.tier; }));
const rosterAfter = Object.values(names).reduce((a, t) => { a[t] = (a[t]||0)+1; return a; }, {});
const out = { plan, rosterAfter, rosterAfterN: Object.keys(names).length };
if (require.main === module) {
  if (process.argv[2] === "summary") {
    Object.entries(plan).forEach(([id, p]) => console.log(id.padEnd(12), "before", p.before.n, JSON.stringify(p.before.tiers), "| re-tiered", JSON.stringify(p.retiered), "| after", p.after.n, JSON.stringify(p.after.tiers), "rare%", p.after.rarePct, "r+m%", p.after.rareMegaPct, "| cut", p.cut.length, "add", p.add.length));
    console.log("roster after", out.rosterAfterN, JSON.stringify(rosterAfter));
  } else console.log(JSON.stringify(out, null, 1));
}
module.exports = out;
