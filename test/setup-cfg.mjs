// Configuration screen where products sit inside "Physical Goods Allow" (seen in a real Mode 14 game, 2026-11-27).
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const READER = readFileSync(new URL("../reader.js", import.meta.url), "utf8");
const kids = {
  "GEN General": [["Physical Goods Allow", "Yes", 1], ["Rental Fee", "Normal"]],
  "Physical Goods Allow": [["Batch Size", "500"], ["Product 1 Allow", "Yes", 1], ["Product 2 Allow", "Yes", 1]],
  "Product 1 Allow": [["Product 1 Name", "Apple"], ["Product 1 Initial Price", "5.00"], ["Product 1 Initial Costs", "3.02"]],
  "Product 2 Allow": [["Product 2 Name", "Orange"], ["Product 2 Initial Price", "5.50"], ["Product 2 Initial Costs", "3.46"]],
  "FIN Finance": [["Initial Cash", "250,000"]]
};
const PAGE = `<!doctype html><body><div id="KPI_DAY____">30 / 30</div><a id="MENU2_INF_cf" href="#" onclick="cf();return false">Configuration</a>
<div id="SlideTableMODE_CFG_PLAYER" style="display:none"></div>
<script>
const K = ${JSON.stringify(kids)}; let n = 0;
const row = (l, v, sub) => '<div id="row' + (++n) + '"><div>' + l + '</div><div>' + (v || "") + '</div>' + (sub ? '<div><a href="#" onclick="ex(this);return false">' + (K[l] || []).length + '</a></div>' : '') + '</div>';
const box = document.getElementById("SlideTableMODE_CFG_PLAYER");
box.innerHTML = row("GEN General", "", 1) + row("FIN Finance", "", 1);
function cf(){ box.style.display = box.style.display === "none" ? "" : "none"; }
function ex(a){ const r = a.closest("[id^=row]"), l = r.firstElementChild.textContent; if (r.dataset.open) return; r.dataset.open = 1; r.insertAdjacentHTML("afterend", (K[l] || []).map(x => row(x[0], x[1], x[2])).join("")); }
</script></body>`;
const b = await chromium.launch(process.env.CHROMIUM ? {executablePath: process.env.CHROMIUM} : {});
const p = await b.newPage();
await p.route("http://cfg.test/**", r => r.request().url().includes("reader.js") ? r.fulfill({body: READER, contentType: "text/javascript"}) : r.fulfill({body: PAGE, contentType: "text/html"}));
await p.goto("http://cfg.test/14/game_player.html");
await p.evaluate(() => { window.__FF_MODE = "14"; const s = document.createElement("script"); s.src = "/reader.js"; document.head.appendChild(s); });
await p.waitForFunction(() => { const m = JSON.parse(localStorage.getItem("ff-reader:cfg.test:14") || "{}"); return (m.setup && m.setup.products) || /Problem/.test(document.getElementById("ff-live")?.shadowRoot?.textContent || ""); }, null, {timeout: 60000});
const names = await p.evaluate(() => ((JSON.parse(localStorage.getItem("ff-reader:cfg.test:14") || "{}").setup || {}).products || []).map(x => x.name).join(","));
if (!names) console.log(await p.evaluate(() => [...document.getElementById("ff-live").shadowRoot.children].map(e => e.innerText).join(" | ").slice(0, 600) + " || " + document.getElementById("SlideTableMODE_CFG_PLAYER").innerText.replace(/\s+/g, " ")));
const ok = names === "Apple,Orange";
console.log(ok ? "PASS" : "FAIL", "products read through Physical Goods Allow ::", names || "none");
await b.close(); process.exit(ok ? 0 : 1);
