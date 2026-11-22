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
const E = new Function(src + "\nreturn {fromPreset, plan, planSafe, stepsOf, bidModel, bidPick};")();
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
check("bids 0.01 under the last lowest rival bid", pick.price === 17.59, JSON.stringify(pick.price));
const low = E.bidPick(M, {name: "Apple Juice", floorEach: 19}, {maxBid: 20}, R);
check("never under the floor", low.price >= 19, low.price);

// the page: only Mode 14, and 12i's B2B settings carried over once
const b = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});
const ctx = await b.newContext(), p = await ctx.newPage(), errs = [];
p.on("pageerror", e => errs.push(e.message));
await p.goto(BASE + "/calc/");
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
check("no page errors", errs.length === 0, errs.join(" | "));
await b.close();
console.log(fails ? `\n${fails} FAILED` : "\nALL PASS");
process.exit(fails ? 1 : 0);
