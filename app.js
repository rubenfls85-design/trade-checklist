// ============================
// Short-Term Trade Checklist - app.js (Known Good)
// ============================

const ids = [
  "c_volume","c_catalyst","c_ma","c_trend","c_rsi","c_beta",
  "ticker","breakout","entry","volconfirm","stop","target","notes",
  "acct","riskpct",
  "autocalc","stopMinPct","stopMaxPct","tpMinPct","tpMaxPct"
];

function readState(){
  const s = {};
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    s[id] = (el.type === "checkbox") ? el.checked : el.value;
  });
  return s;
}

function writeState(s){
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(!el || s[id] === undefined) return;
    if(el.type === "checkbox") el.checked = s[id];
    else el.value = s[id];
  });

  // Recalculate after loading saved data
  calcStopsFromEntry();
  calcRisk();
}

function save(){
  localStorage.setItem("tradeChecklist", JSON.stringify(readState()));
  alert("Saved ✅");
}

function resetAll(){
  if(!confirm("Reset everything?")) return;
  localStorage.removeItem("tradeChecklist");
  location.reload();
}

function round2(n){
  return Math.round(n * 100) / 100;
}

function calcStopsFromEntry(){
  const entryEl = document.getElementById("entry");
  const stopEl = document.getElementById("stop");
  const targetEl = document.getElementById("target");
  const autoEl = document.getElementById("autocalc");

  const note = document.getElementById("rangeNote");

  // If the Risk Management section isn't on the page for some reason, bail safely
  if(!entryEl || !stopEl || !targetEl || !autoEl || !note) return;

  const stopMinPct = parseFloat(document.getElementById("stopMinPct")?.value);
  const stopMaxPct = parseFloat(document.getElementById("stopMaxPct")?.value);
  const tpMinPct   = parseFloat(document.getElementById("tpMinPct")?.value);
  const tpMaxPct   = parseFloat(document.getElementById("tpMaxPct")?.value);

  const entry = parseFloat(entryEl.value);

  // Validate entry
  if(!isFinite(entry) || entry <= 0){
    note.textContent = "Enter an Entry Price above, then this will show your Stop/Target range.";
    return;
  }

  // Validate percentages
  if(!isFinite(stopMinPct) || !isFinite(stopMaxPct) || !isFinite(tpMinPct) || !isFinite(tpMaxPct)){
    note.textContent = "Enter valid % ranges (numbers).";
    return;
  }

  // Optional sanity checks (keeps weird inputs from confusing you)
  if(stopMinPct <= 0 || stopMaxPct <= 0 || tpMinPct <= 0 || tpMaxPct <= 0){
    note.textContent = "Percentages must be greater than 0.";
    return;
  }

  // If user enters min > max, still work but show message
  const sMin = Math.min(stopMinPct, stopMaxPct);
  const sMax = Math.max(stopMinPct, stopMaxPct);
  const tMin = Math.min(tpMinPct, tpMaxPct);
  const tMax = Math.max(tpMinPct, tpMaxPct);

  const stopMinPrice = round2(entry * (1 - sMin/100)); // tighter stop (min %)
  const stopMaxPrice = round2(entry * (1 - sMax/100)); // wider stop (max %)
  const tpMinPrice   = round2(entry * (1 + tMin/100)); // smaller target (min %)
  const tpMaxPrice   = round2(entry * (1 + tMax/100)); // bigger target (max %)

  // Show the range note (always)
  note.textContent =
    `Based on Entry $${entry.toFixed(2)} → Stop range: $${stopMaxPrice.toFixed(2)} to $${stopMinPrice.toFixed(2)} ` +
    `| Take Profit range: $${tpMinPrice.toFixed(2)} to $${tpMaxPrice.toFixed(2)}.`;

  // Auto-fill stop/target using the MIN % values (your rule)
  if(autoEl.checked){
    stopEl.value = stopMinPrice.toFixed(2);
    targetEl.value = tpMinPrice.toFixed(2);
  }
}

function calcRisk(){
  const entryEl = document.getElementById("entry");
  const stopEl = document.getElementById("stop");
  const acctEl = document.getElementById("acct");
  const riskPctEl = document.getElementById("riskpct");

  const maxRiskEl = document.getElementById("maxrisk");
  const sharesEl = document.getElementById("shares");

  if(!entryEl || !stopEl || !acctEl || !riskPctEl || !maxRiskEl || !sharesEl) return;

  const entry = parseFloat(entryEl.value);
  const stop = parseFloat(stopEl.value);
  const acct = parseFloat(acctEl.value);
  const riskpct = parseFloat(riskPctEl.value);

  // Max $ risk
  if(!isFinite(acct) || !isFinite(riskpct) || acct <= 0 || riskpct <= 0){
    maxRiskEl.textContent = "$0.00";
    sharesEl.textContent = "0";
    return;
  }

  const maxRisk = acct * (riskpct/100);
  maxRiskEl.textContent = `$${maxRisk.toFixed(2)}`;

  // Shares based on entry-stop
  if(!isFinite(entry) || !isFinite(stop) || entry <= stop){
    sharesEl.textContent = "0";
    return;
  }

  const riskPerShare = entry - stop;
  const shares = Math.floor(maxRisk / riskPerShare);
  sharesEl.textContent = String(Math.max(0, shares));
}

// ============================
// Event Wiring
// ============================

document.getElementById("btnSave")?.addEventListener("click", save);
document.getElementById("btnReset")?.addEventListener("click", resetAll);
document.getElementById("btnPrint")?.addEventListener("click", () => window.print());

// Recalculate when user edits any relevant input
document.addEventListener("input", (e) => {
  const id = e.target?.id || "";
  if(["entry","stop","acct","riskpct","stopMinPct","stopMaxPct","tpMinPct","tpMaxPct","autocalc"].includes(id)){
    calcStopsFromEntry();
    calcRisk();
  }
});

// ============================
// Initial Load
// ============================

const saved = localStorage.getItem("tradeChecklist");
if(saved){
  try {
    writeState(JSON.parse(saved));
  } catch {
    // If saved data is corrupted, ignore it
  }
}

// Initial calculations even if nothing is saved
calcStopsFromEntry();
calcRisk();