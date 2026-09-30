// Matches your Printful products to the shop so kids' orders go to Printful automatically.
// Run from the repo root:
//   $env:PRINTFUL_TOKEN="your-token"; node tools/printful-sync.js
// Writes data/printful-variants.json. Re-run whenever you add or change a kids' product in Printful.
const fs = require("fs");
const path = require("path");
const { PRODUCTS, COLORS } = require(path.resolve("js/products.js"));

const TOKEN = process.env.PRINTFUL_TOKEN, STORE = process.env.PRINTFUL_STORE_ID;
const API = process.env.PRINTFUL_API || "https://api.printful.com";
if (!TOKEN) { console.error('Set your token first:  $env:PRINTFUL_TOKEN="..."'); process.exit(1); }

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
async function pf(p) {
  const res = await fetch(API + p, { headers: Object.assign({ Authorization: "Bearer " + TOKEN }, STORE ? { "X-PF-Store-Id": STORE } : {}) });
  const data = await res.json();
  if (!res.ok) throw new Error("Printful " + res.status + ": " + JSON.stringify(data.error || data.result || data));
  return data;
}

(async () => {
  const listed = [];
  for (let offset = 0; ; offset += 100) {
    const page = await pf("/store/products?limit=100&offset=" + offset);
    listed.push(...page.result);
    if (page.result.length < 100) break;
  }
  console.log(`Found ${listed.length} product(s) in Printful.\n`);

  const kids = PRODUCTS.filter((p) => p.fulfillment ? p.fulfillment === "printful" : p.categories.some((c) => c === "boys" || c === "girls"));
  const out = {}, used = new Set();
  let missing = 0;
  for (const p of kids) {
    const match = listed.find((x) => !used.has(x.id) && (norm(x.name).includes(norm(p.name)) || norm(p.name).includes(norm(x.name))));
    if (!match) { console.log(`NO MATCH  ${p.name}: rename it in Printful to include "${p.name}"`); missing++; continue; }
    used.add(match.id);
    const detail = (await pf("/store/products/" + match.id)).result;
    out[p.id] = {};
    const need = [];
    for (const color of Object.keys(p.colors)) for (const size of p.sizes) need.push([color, size]);
    for (const [color, size] of need) {
      const label = norm((COLORS[color] && COLORS[color].label) || color);
      const v = detail.sync_variants.find((sv) => norm(sv.size) === norm(size) &&
        (norm(sv.color) === label || norm(sv.color) === norm(color) || norm(sv.name).includes(label)));
      if (v) out[p.id][color + "|" + size] = v.id;
      else { console.log(`  missing   ${p.name} ${(COLORS[color] || {}).label || color} ${size}`); missing++; }
    }
    console.log(`MATCHED   ${p.name}  ->  Printful "${match.name}" (${Object.keys(out[p.id]).length}/${need.length} variants)`);
  }
  fs.writeFileSync("data/printful-variants.json", JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote data/printful-variants.json. ${missing ? missing + " item(s) need attention above." : "Everything matched."}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
