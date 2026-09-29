// Rewrite the SITES species arrays in index-uk.html from the plan in uk_plan.js.
const fs = require("fs");
const file = process.env.TW_HTML;
const o = require("./uk_plan.js");
let html = fs.readFileSync(file, "utf8");
const SEA = new Set(["Northern Gannet","Northern Fulmar","Manx Shearwater","Sooty Shearwater","Cory's Shearwater","Balearic Shearwater","European Storm-Petrel","Leach's Storm-Petrel","Wilson's Storm-Petrel","Great Skua","Parasitic Jaeger","Pomarine Jaeger","Long-tailed Jaeger","Black-legged Kittiwake","Atlantic Puffin","Common Murre","Black Guillemot","Brown Booby","Red-footed Booby","Black-browed Albatross","Sabine's Gull"]);
const slug = n => n.toLowerCase().replace(/[^a-z]/g, "");
let totalBefore = 0, totalAfter = 0;
for (const [id, p] of Object.entries(o.plan)) {
  const re = new RegExp('(id:"' + id + '",[^\\n]*\\n(?:[^\\n]*\\n)*?\\s*species:\\[\\n)((?:\\s*sp\\([^\\n]*\\n)+)(\\s*\\]\\n)');
  const m = html.match(re);
  if (!m) throw new Error("site block not found: " + id);
  const lines = m[2].split("\n").filter(l => l.trim());
  totalBefore += lines.length;
  const byName = {};
  lines.forEach(l => { const mm = l.match(/sp\("([^"]+)","([^"]+)","(\w+)","(\w+)",([\d.]+)(,true)?\)/); if (!mm) throw new Error("bad line " + l); byName[mm[2]] = { id: mm[1], group: mm[4], idDiff: mm[5], audio: !!mm[6] }; });
  const rows = p.keep.map(r => ({ ...byName[r.name], name: r.name, tier: r.tier }))
    .concat(p.add.map(r => ({ id: id + "_" + slug(r.name), name: r.name, tier: r.tier, group: r.group, idDiff: r.idDiff, audio: !!r.audio })));
  rows.forEach(r => { if (SEA.has(r.name)) r.group = "water"; });
  const order = { common: 0, uncommon: 1, rare: 2, mega: 3 };
  rows.sort((a, b) => order[a.tier] - order[b.tier] || a.name.localeCompare(b.name));
  const ids = new Set(); rows.forEach(r => { if (ids.has(r.id)) throw new Error("dup id " + r.id); ids.add(r.id); });
  totalAfter += rows.length;
  const text = rows.map(r => '      sp("' + r.id + '","' + r.name + '","' + r.tier + '","' + r.group + '",' + Number(r.idDiff).toFixed(2).replace(/0$/, "") + (r.audio ? ",true" : "") + '),').join("\n") + "\n";
  html = html.replace(m[0], m[1] + text.replace(/,\n$/, "\n") + m[3]);
}
// hide flags: headlands and islands, not hides
for (const id of ["stmarys", "stagnes", "flamborough"]) {
  const re = new RegExp('(id:"' + id + '",[^\\n]*?)hide:true');
  if (!re.test(html)) throw new Error("hide flag not found " + id);
  html = html.replace(re, "$1hide:false");
}
fs.writeFileSync(file, html);
console.log("listings", totalBefore, "->", totalAfter);
