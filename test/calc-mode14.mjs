// Mode 14 only: the calculator has no Mode 12i left, takes 12i's B2B settings once, sends no shop or warehouse rent steps (the team
// opens those by hand), scales the B2B share with cash and bids just under the lowest rival bid of the last result.
// Run: node test/server.mjs 8791 reader.js &   then   node test/calc-mode14.mjs 8791
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const BASE = "http://localhost:" + (process.argv[2] || 8790), PASS = "mode14-test-pass";
let fails = 0;
const check = (name, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`); if (!ok) fails++; };

// the engine on its own, in node
const html = readFileSync(new URL("../calc/index.html", import.meta.url), "utf8");
const src = html.slice(html.indexOf('<script id="engine">') + 20, html.indexOf("</script>", html.indexOf('<script id="engine">')));
const E = new Function(src + "\nreturn {fromPreset, plan, planSafe, stepsOf, bidModel, bidPick, ecomOf};")();
const game = (cash, keepOpen = 2) => { const S = E.fromPreset("juice"); Object.assign(S.g, {day: 5, maxDay: 30, cash});
  S.C.forEach((c, i) => { c.open = i < keepOpen; c.area = c.open ? 200 : 0; }); return S; };

const fixedOf = S => E.plan(S, "balanced").b2bU[0];
const base = E.fromPreset("juice").P[0].b2bFc*E.fromPreset("juice").g.b2bShare/100;
check("B2B share x1.5 with lots of cash", Math.abs(fixedOf(game(1e8)) - 1.5*base) < 1e-6, fixedOf(game(1e8)) + " vs " + base);
check("B2B share x0.5 with little cash", Math.abs(fixedOf(game(1000)) - 0.5*base) < 1e-6, fixedOf(game(1000)) + " vs " + base);

const S = game(5e6), ST = E.stepsOf(S, E.planSafe(S, "balanced")), ops = ST.steps.map(s => s.op);
check("no shop or warehouse rent steps", !ops.includes("rentStore") && !ops.includes("rentSpace"), [...new Set(ops)].join(","));
const closed = S.C.filter(c => !c.open).map(c => c.name);
check("no orders or marketing for stores we haven't opened", !ST.steps.some(s => closed.includes(s.target && s.target.city)));
check("still orders stock for open stores", ST.steps.some(s => s.op === "vendorPO"));

const B = game(5e6); B.g.bidLog = ["Apple Juice, 10, 9.4, 9.6, lost, 2", "Apple Juice, 10, 8.8, 9.0, lost, 4"].join("\n");
const M = E.bidModel(B, 5), R = E.plan(B, "balanced"), pick = E.bidPick(M, {name: "Apple Juice", floorEach: 5}, {maxBid: 20}, R);
check("bids 0.40 under the last lowest rival bid", pick.price === 17.2, JSON.stringify(pick.price));
const low = E.bidPick(M, {name: "Apple Juice", floorEach: 19}, {maxBid: 20}, R);
check("never under the floor", low.price >= 19, low.price);

// marketing: each open store's daily total = its own lowest Unit Sold, split as evenly as possible over Media A, B and C (user, 2026-11-27)
{ const S = game(1e8); S.C[0].sold = [1359, 1477, 1600]; S.C[1].sold = [1000, 1001, 2000];
  const R = E.plan(S, "balanced"), m = n => R.mkStores.find(x => x.c.name === S.C[n].name) || {};
  check("marketing total = the store's lowest units sold", m(0).budget === 1359 && m(1).budget === 1000, R.mkStores.map(x => x.c.name + " " + x.budget).join(", "));
  check("split evenly over all 3 media", JSON.stringify(m(0).media) === JSON.stringify({"Media A": 453, "Media B": 453, "Media C": 453}) && JSON.stringify(m(1).media) === JSON.stringify({"Media A": 334, "Media B": 333, "Media C": 333}), JSON.stringify([m(0).media, m(1).media]));
  const mk = E.stepsOf(S, E.planSafe(S, "balanced")).steps.filter(s => s.op === "setMarketing" && s.target.city === S.C[1].name).map(s => s.agency + " " + s.qty).join(", ");
  check("the bot gets 3 marketing steps per store, even with no media picked for age groups", mk === "MA 334, MB 333, MC 333", mk); }

// Web Market: never buy; our leftover goes up at the vendor's price minus 0.6 a unit
{ const S = game(1e8); S.web = {us: "FF", listings: [{id: 9, product: "Apple Juice", price: 1, qty: 500, seller: "Rival"}]};
  const R = E.plan(S, "balanced"); R.whFree = S.P.map(() => 2000); R.flow.left = S.P.map(() => 800); R.b2bPlan = S.P.map(() => ({units: 1000}));
  const ec = E.ecomOf(S, R);
  check("Web Market: nothing to buy", ec.every(x => !x.buyMaxUnits), JSON.stringify(ec.map(x => x.buyMaxUnits)));
  check("Web Market: leftover at the vendor price minus 0.6", ec.length > 0 && ec.every(x => x.sellAsk === +(R.vend(x.j, x.sellUnits) - 0.6).toFixed(2)), JSON.stringify(ec.map(x => [x.name, x.sellAsk, R.vend(x.j, x.sellUnits)])));
  const ST = E.stepsOf(S, E.planSafe(S, "balanced"));
  check("Web Market: no buy steps", !ST.steps.some(s => s.op === "ecomBuy")); }
// a buyer's (red) listing: We sell when it pays at most 1 under the vendor price
{ const S = game(1e8); S.wh = 0; const R0 = E.plan(S, "balanced"), v = j => R0.vend(j, 100);
  S.web = {us: "FF", listings: [{id: 70, kind: "WTB", product: "Apple Juice", price: +(v(0) - 0.9).toFixed(2), qty: 100, seller: "Rival"},
    {id: 71, kind: "WTB", product: "Orange Juice", price: +(v(1) - 1.5).toFixed(2), qty: 100, seller: "Rival"}]};
  const X = E.planSafe(S, "balanced"); X.R.whFree = S.P.map(() => 5000);
  const st = E.stepsOf(S, X).steps.filter(s => s.op === "ecomSellTo");
  check("We sell: a buyer paying up to 1 under cost", st.length === 1 && st[0].target.listing === "70" && st[0].priceMin === +(v(0) - 1).toFixed(2), JSON.stringify(st.map(s => [s.target, s.price, s.priceMin])));
  check("We sell: not more than 1 under cost", !st.some(s => s.target.listing === "71")); }

// the page: only Mode 14, and 12i's B2B settings carried over once
const b = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});
const ctx = await b.newContext(), p = await ctx.newPage(), errs = [];
p.on("pageerror", e => errs.push(e.message));
await fetch(BASE + "/reset?calc=real"); await p.goto(BASE + "/calc/");
await p.evaluate(async pass => { const salt = b64(crypto.getRandomValues(new Uint8Array(16))), key = await deriveTeamKey(pass, salt, 1000);
  localStorage.setItem(SEC.flag, JSON.stringify({v: 1, salt, iter: 1000, check: await sealV(SEC.check, key)}));
  const old = fromPreset("coffee"); Object.assign(old.g, {b2bShare: 33, b2bPricePct: 44, b2bMin: 11, b2bBoost: 1.5, bidLog: "Americano, 10, 9, 8, lost, 3", salary: 9999});
  localStorage.setItem(KEY, JSON.stringify(old)); localStorage.setItem(KEY + "-mode3", "12i"); }, PASS);
await p.goto(BASE + "/calc/?embed=1&mode=12i");
check("a 12i link opens Mode 14", await p.evaluate(() => MODE) === "14");
check("only Mode 14 to pick", await p.evaluate(() => JSON.stringify(MODES)) === '["14"]' && await p.evaluate(() => !document.querySelector('[data-mode="12i"]')));
check("unlocked with the test passcode", await p.evaluate(pass => unlockTeam(pass, false), PASS) === "ok");
await p.waitForFunction(() => S.g.b2bShare === 33, null, {timeout: 10000}).catch(() => {});
const g = await p.evaluate(() => S.g);
check("12i B2B settings copied", g.b2bShare === 33 && g.b2bPricePct === 44 && g.b2bMin === 11 && g.b2bBoost === 1.5 && /Americano/.test(g.bidLog), JSON.stringify([g.b2bShare, g.b2bPricePct, g.b2bMin, g.b2bBoost]));
check("nothing else copied", g.salary !== 9999);
check("Mode 14 starts from the juice products", await p.evaluate(() => S.P[0].name) === "Apple Juice");
await p.evaluate(() => { S.g.b2bShare = 20; saveLocal(); });
await p.reload(); await p.evaluate(pass => unlockTeam(pass, false), PASS); await p.waitForTimeout(1500);
check("copied only once", await p.evaluate(() => S.g.b2bShare) === 20, await p.evaluate(() => S.g.b2bShare));
const cities = await p.evaluate(() => applyGame({day: 3, maxDay: 30, cash: 1e6, products: [{name: "Apple Juice", price: 9, cost: 3}], cities: [{name: "Leeds", rent: 40}, {name: "York", rent: 30}], forecast: {}}).C.map(c => c.name).join(","));
check("city names come from each game", cities === "Leeds,York", cities);
check("no fixed country named before a game fills it", !/Korea|Germany/.test(await p.evaluate(() => document.getElementById("srcText").textContent + document.getElementById("presetMenu").textContent)));
check("no page errors", errs.length === 0, errs.join(" | "));
await b.close();
console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
