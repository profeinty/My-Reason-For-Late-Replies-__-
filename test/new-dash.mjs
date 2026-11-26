// 2026-11 game layout: the dashboard has no store list; stores come from Retail Sales & Price, cities from location cards, warehouses from the Warehouse stock screen.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const READER = readFileSync(new URL("../reader.js", import.meta.url), "utf8");
const P = ["Apple Juice", "Orange Juice"];
const setup = {setupDay: 1, modules: ["RTL"], lead: 1, machines: [], products: P.map(name => ({name, price: 5, cost: 3, dim: 0.0033, expire: 0, allow: "Yes", bom: []})), missing: []};
const card = (c, demo, rtl, wh) => `<div class="ms-loc-card"><div class="ms-loc-head"><div class="ms-loc-title"><span class="location-tag">${c}</span></div></div>
<div class="ms-demography">${demo.map((d, i) => `<span class="ms-demo-item ${["senior", "adult", "junior"][i]}"><i></i> ${d} </span>`).join('<span class="ms-demo-sep">|</span>')}</div>
<div class="ms-dept"><div class="ms-dept-top"><div class="ms-dept-label">Retail</div><div class="ms-action"><span>⟳ Manage</span></div></div><div>${rtl}</div></div>
<div class="ms-dept"><div class="ms-dept-top"><div class="ms-dept-label">Warehouse</div></div><div>${wh}</div></div>
<div class="ms-dept"><div class="ms-dept-top"><div class="ms-dept-label">Service</div></div><div>🏢 50 m2 30d Contract → D38 Rent Fee: 9 GBP/Day/m2</div></div></div>`;
const LOC = `<div class="ms-grid-container"><div id="row1" class="ms-card-col">${card("London", ["3,628,055", "1,649,116", "9,344,989"], "🏢 75 m2 30d Contract → D51 Rent Fee: 35 GBP/Day/m2Overflow Fee: 38 GBP/Day/m2", "Rent Rent Fee: 4 GBP/Day/m2Overflow Fee: 4 GBP/Day/m2")}</div>
<div id="row2" class="ms-card-col">${card("Nottingham", ["99,848", "565,803", "219,665"], "🏢 100 m2 30d Contract → D32 Rent Fee: 14 GBP/Day/m2", "Rental Manage 🏢 500 m2 30d Contract → D32 Rent Fee: 1 GBP/Day/m2")}</div></div>`;
const shop = (c, rows) => `<div><h5>${c} Retail <a>Change Price</a></h5><div>Daily Marketing: 1,656</div><table><tr><th>Unit Sold</th><th>Price (GBP)</th><th>Sales (GBP)</th><th>COGS (GBP)</th><th>Unit Remain</th></tr>
${rows.map(r => `<tr>${r.map(x => `<td> ${x} ${/^[\d,.]+$/.test(x) ? "\u200b" : ""}</td>`).join("\n")}</tr>`).join("")}</table></div>`;
const SALES = `<h4>Retail Sales</h4><div>Search Day: 5</div>${shop("Nottingham", [["Apple Juice", "1,456", "5.04", "7,338", "4,397", "3,667"], ["Orange Juice", "1,598", "5.76", "9,204", "5,530", "3,014"]])}
${shop("London", [["Apple Juice", "1,633", "5.04", "8,230", "4,932", "3,157"], ["Orange Juice", "1,572", "5.76", "9,055", "5,440", "2,277"]])}`;
const box = (id, p, q) => `<div class="box circle text-dark" id="${id}" lc="27"><div><span>${p}</span><br><span>B:923_2711</span><div id="banner${id}"></div><b><div id="Q${id}">${q}</div></b></div></div>`;
const WHINV = `<h4>Warehouse</h4><ul><li><a href="#loc-27">Nottingham Warehouse</a></li></ul><div id="loc-27" class="tab-pane"><div>Loading</div>${box(1, "Apple Juice", "320")}${box(2, "Apple Juice", "10,000")}${box(3, "Orange Juice", "1,000")}</div>`;
const GAME = `<!doctype html><body><div id="KPI_DAY____">5 / 30</div><div>Financial Snapshot (GBP)</div><div>Cash in Bank\t729,887</div>
<a id="MENU2_retail_location" href="/p/loc">Location</a> <a id="MENU2_whs_location" href="/p/loc">Location</a> <a id="MENU2_MODE_RTL_SALES" href="/p/sales">Retail Sales &amp; Price</a>
<a id="MENU2_MODE_WHS_INVENTORY" href="/p/whinv">Warehouse</a></body>`;
const PAGES = {"/p/loc": LOC, "/p/sales": SALES, "/p/whinv": WHINV};
const b = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});
const p = await b.newPage();
await p.route("http://dash.test/**", r => { const u = new URL(r.request().url());
  return u.pathname === "/reader.js" ? r.fulfill({body: READER, contentType: "text/javascript"}) : r.fulfill({body: PAGES[u.pathname] ?? GAME, contentType: "text/html"}); });
await p.goto("http://dash.test/14/game_player.html");
await p.evaluate(s => { localStorage.setItem("ff-reader:dash.test:14", JSON.stringify({setup: s})); window.__FF_MODE = "14"; const e = document.createElement("script"); e.src = "/reader.js"; document.head.appendChild(e); }, setup);
const got = await p.waitForFunction(() => { const d = window.__ff && window.__ff.data(); return d && (d.stores || []).length && (d.warehouses || []).length && d; }, null, {timeout: 60000}).then(h => h.jsonValue()).catch(() => p.evaluate(() => window.__ff && window.__ff.data()));
let fails = 0;
const check = (name, ok, info = "") => { if (!ok) fails++; console.log(ok ? "PASS" : "FAIL", name, info ? ":: " + info : ""); };
const st = n => (got.stores || []).find(s => s.name === n) || {items: []}, it = (s, n) => s.items.find(i => i.name === n) || {};
check("cities from the location cards", JSON.stringify((got.cities || []).map(c => [c.name, c.rent, c.demo])) === JSON.stringify([["London", 35, [3628055, 1649116, 9344989]], ["Nottingham", 14, [99848, 565803, 219665]]]), JSON.stringify(got.cities));
check("store stock and price from Retail Sales & Price", it(st("London"), "Orange Juice").qty === 2277 && it(st("London"), "Orange Juice").price === 5.76 && it(st("Nottingham"), "Apple Juice").qty === 3667, JSON.stringify(got.stores));
check("shop space from the cards", st("London").area === 75 && st("Nottingham").area === 100);
const w = (got.warehouses || [])[0] || {items: []};
check("warehouse stock summed per product", w.name === "Nottingham Warehouse" && w.area === 500 && (w.items.find(i => i.name === "Apple Juice") || {}).qty === 10320, JSON.stringify(got.warehouses));
check("warehouse rent", got.whRent === 4, String(got.whRent));
console.log(fails ? `${fails} FAILED` : "ALL PASS");
await b.close(); process.exit(fails ? 1 : 0);
