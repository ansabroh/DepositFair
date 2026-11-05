import "./style.css";
import {
  config,
  connect,
  disconnect,
  accountList,
  write,
  read,
  readJSON,
  resume,
} from "./chain.js";
import { canonical, validId, hashRecord, moneyToMinor } from "./lifecycle.js";
let account = "",
  current = null,
  busy = false,
  offset = 0;
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const explorer = "https://explorer-studio.genlayer.com";
const money = (n, c) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: c }).format(
    n / 100,
  );
const $ = (s) => document.querySelector(s);
document.querySelector("#app").innerHTML = `
<header><a class="brand" href="#"><img src="/logo.svg" alt="">DepositFair<span>RENTAL RESOLUTION</span></a><nav><a href="#workspace">Workspace</a><a href="#how">How it works</a><a href="https://github.com/ansabroh/DepositFair" target="_blank" rel="noreferrer">Source ↗</a></nav><button id="wallet" class="outline">Connect test account <span>↗</span></button></header>
<main><section class="hero"><div><div class="eyebrow"><span class="dot"></span> EVIDENCE FIRST. FAIRNESS BY DESIGN.</div><h1>A fairer ending.<br>A fresh <i>beginning.</i></h1><p>Take the uncertainty out of rental deposits. Bring both sides of the story to one transparent, evidence-led assessment.</p><div class="hero-actions"><a class="button" href="#workspace">Open a case <span>↗</span></a><a class="text-link" href="#how">See how it works ↓</a></div><div class="trust"><span>↗ Powered by GenLayer</span><span>◉ Independent AI consensus</span></div></div><div class="illustration" aria-label="Illustration of a rental evidence folder"><div class="orb"></div><div class="folder-back"></div><div class="paper paper-back"></div><div class="paper"><div class="doc-top">DEPOSIT REVIEW <span>DF / 01</span></div><h3>Two perspectives.<br>One clear record.</h3><div class="doc-line"></div><div class="doc-line short"></div><div class="doc-row"><span>Lease terms</span><b>✓</b></div><div class="doc-row"><span>Inspection evidence</span><b>✓</b></div><div class="doc-row"><span>Tenant response</span><b>✓</b></div></div><div class="seal">✓</div><div class="float-label">AGREEMENT STARTS WITH CLARITY</div></div></section>
<div class="disclosure"><b>Studionet research application</b><span>Nonbinding assessments against submitted lease terms. Evidence is self-attested. Use synthetic or fully redacted text only: all submissions are public and permanent.</span></div>
<section id="workspace"><div class="section-title"><div class="eyebrow">YOUR RESOLUTION DESK</div><h2>Let the evidence speak.</h2><p>Start a dispute, respond as the tenant, or explore the on-chain record.</p></div><div class="workspace-layout"><aside><button class="tab active" data-panel="cases">01 <span>Case register</span>↗</button><button class="tab" data-panel="new">02 <span>Open a case</span>＋</button><button class="tab" data-panel="tracking">03 <span>Transaction tracker</span>↗</button><div class="network"><span class="dot"></span> GenLayer Studionet<small>Chain ID 61999 · public sandbox</small><a id="contract-link" target="_blank" rel="noreferrer">View contract ↗</a></div><div class="aside-note">Fairness requires participation.<br>Only the invited tenant can respond. Either party can request an assessment.</div></aside><div class="desk">
<section id="cases-panel" class="panel"><div class="panel-title"><h3>Case register</h3><button id="refresh" class="small outline">Refresh ↻</button></div><div id="case-list" class="case-list">Loading finalized cases…</div><div class="pagination"><button id="prev" class="small outline">← Previous</button><button id="next" class="small outline">Next →</button></div><form id="lookup"><label>Find a case by ID</label><div class="input-row"><input id="lookup-id" placeholder="e.g. deposit-demo-01" required maxlength="64"><button>Open case</button></div></form></section>
<section id="new-panel" class="panel" hidden><div class="panel-title"><h3>Open a deposit dispute</h3><button id="sample" class="small outline" type="button">Load synthetic example</button></div><p class="muted">Your connected account becomes the landlord. The tenant must use a different account.</p><form id="new-case"><div class="two"><label>Case ID<input name="case_id" maxlength="64" required placeholder="Unique case reference"></label><label>Invited tenant address<input name="tenant" required placeholder="0x…" pattern="0x[a-fA-F0-9]{40}"></label></div><label>Case title<input name="title" required maxlength="120" placeholder="A short, anonymous description"></label><div class="two"><label>Currency<select name="currency"><option>GBP</option><option>EUR</option><option>USD</option><option>LKR</option></select></label><label>Deposit amount<input name="deposit_minor" type="number" min="0.01" max="1000000" step="0.01" value="1000.00" required></label></div><label>Agreed lease terms<textarea name="lease" maxlength="6000" required placeholder="Paste the relevant redacted lease terms"></textarea><input type="file" data-target="lease" accept=".txt,text/plain"><small>Optional UTF-8 .txt import; review text before submitting.</small></label><label>Check-in and check-out inspection reports<textarea name="inspection" maxlength="6000" required placeholder="Include dates, condition and provenance; omit personal details"></textarea><input type="file" data-target="inspection" accept=".txt,text/plain"></label><div class="panel-title"><h3>Itemized deductions</h3><button type="button" id="add-deduction" class="small outline">＋ Add deduction</button></div><p class="muted">Up to five deductions. Include the exact cost and the supporting damage record or invoice text.</p><div id="deduction-rows"></div><label class="check"><input name="consent" type="checkbox" required>I have reviewed the text. It contains no personal or confidential information, and I understand it will be public.</label><button class="wide">Freeze evidence & open case ↗</button></form></section>
<section id="tracking-panel" class="panel" hidden><h3>Track a transaction</h3><p class="muted">Accepted is provisional. DepositFair reports success only after finalized execution succeeds.</p><form id="track"><label>GenLayer transaction hash<input id="tx-hash" pattern="0x[a-fA-F0-9]{64}" required placeholder="0x…"></label><button>Resume tracking</button></form><div id="tx-state" class="tx-state" role="status">No transaction selected.</div><div id="tx-history"></div></section>
<div id="notice" role="status" hidden></div></div></div><section id="detail" hidden></section></section>
<section id="how"><div class="eyebrow">FROM DISAGREEMENT TO UNDERSTANDING</div><h2>A process both sides can see.</h2><div class="steps"><article><span>01 / DOCUMENT</span><h3>Start with the agreement.</h3><p>The landlord freezes relevant lease terms, inspection text and itemized deductions. Content hashes bind the record.</p></article><article><span>02 / RESPOND</span><h3>Make room for both sides.</h3><p>The invited tenant confirms or disputes the terms and submits counterevidence before assessment can begin.</p></article><article><span>03 / ASSESS</span><h3>Independent reasoning.</h3><p>GenLayer validators assess lease basis, wear, responsibility and cost. Deterministic rules calculate supported amounts.</p></article><article><span>04 / VERIFY</span><h3>A record you can revisit.</h3><p>Read grounded findings and hash-linked receipts. One evidence challenge permits a second assessment without erasing the first.</p></article></div></section>
<section class="limits"><h3>Clear evidence. Clear limits.</h3><p>DepositFair assesses supplied text; it cannot authenticate documents, inspect a property, apply local rental law, or guarantee a fair legal outcome. Missing or disputed facts remain unresolved. No funds are held and no settlement is enforced. A supported amount is an assessment of the submitted claim, not an order to pay.</p></section></main>
<footer><a class="brand" href="#">DepositFair</a><span>A little more clarity. A fairer way forward.</span><a href="https://github.com/ansabroh/DepositFair" target="_blank" rel="noreferrer">Open source ↗</a></footer>
<dialog id="wallet-dialog"><form id="connect-form"><button type="button" id="close-wallet" class="close outline">×</button><div class="eyebrow">STUDIONET SESSION ACCOUNTS</div><h2>Try both sides of the story.</h2><p>Create disposable test accounts for direct transactions on GenLayer Studionet. Switch between two accounts to try the landlord and tenant roles. No MetaMask required.</p><label>Existing page-session account<select id="account-select"><option value="new">Create a new test account</option></select></label><small>Keys live only in this page's memory and are lost on reload. Use synthetic cases only. Deployment and the reference demonstration use Studio's built-in accounts; this frontend uses the SDK's disposable accounts.</small><button class="wide">Connect account</button><button type="button" id="disconnect" class="outline wide">Disconnect</button><p id="wallet-error" role="alert"></p></form></dialog>`;
function notice(msg, error = false) {
  $("#notice").hidden = false;
  $("#notice").className = error ? "error" : "success";
  $("#notice").textContent = msg;
}
function panel(name) {
  document
    .querySelectorAll(".panel")
    .forEach((e) => (e.hidden = e.id !== name + "-panel"));
  document
    .querySelectorAll(".tab")
    .forEach((e) => e.classList.toggle("active", e.dataset.panel === name));
}
document
  .querySelectorAll(".tab")
  .forEach((e) => (e.onclick = () => panel(e.dataset.panel)));
document.querySelector(".hero-actions .button").onclick = () => panel("new");
$("#wallet").onclick = () => {
  $("#account-select").innerHTML =
    '<option value="new">Create a new test account</option>' +
    accountList()
      .map((a, i) => '<option value="' + i + '">' + esc(a) + "</option>")
      .join("");
  $("#wallet-dialog").showModal();
};
$("#close-wallet").onclick = () => $("#wallet-dialog").close();
$("#disconnect").onclick = () => {
  disconnect();
  account = "";
  $("#wallet").textContent = "Connect test account ↗";
  $("#wallet-dialog").close();
};
$("#connect-form").onsubmit = (e) => {
  e.preventDefault();
  try {
    account = connect(
      $("#account-select").value === "new"
        ? undefined
        : Number($("#account-select").value),
    );
    $("#wallet").textContent = account.slice(0, 6) + "…" + account.slice(-4);
    $("#wallet-dialog").close();
    notice("Disposable Studionet account connected. " + account);
    if (current) renderDetail(current);
  } catch (err) {
    $("#wallet-error").textContent = err.message;
  }
};
if (config.address) {
  $("#contract-link").href = explorer + "/address/" + config.address;
  $("#contract-link").textContent = config.address.slice(0, 8) + "… ↗";
} else $("#contract-link").textContent = "Deployment awaiting verification";
function updateTx(state) {
  if (state.hash) {
    $("#tx-hash").value = state.hash;
    sessionStorage.setItem("depositfair-pending", state.hash);
  }
  $("#tx-state").replaceChildren();
  const title = document.createElement("strong");
  title.textContent = state.phase.toUpperCase() + " · " + state.status;
  $("#tx-state").append(title);
  if (state.hash) {
    const a = document.createElement("a");
    a.href = explorer + "/tx/" + state.hash;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = state.hash + " ↗";
    $("#tx-state").append(a);
  }
  if (state.result) {
    const p = document.createElement("p");
    p.textContent = "Execution: " + state.result;
    $("#tx-state").append(p);
  }
}
async function action(name, args) {
  if (busy) throw new Error("A transaction is already being tracked.");
  busy = true;
  panel("tracking");
  try {
    const tx = await write(name, args, updateTx);
    notice("Transaction finalized successfully.");
    await loadCases();
    if (args[0] && name !== "open_case") await loadCase(args[0]);
    return tx;
  } catch (e) {
    notice(e.message || String(e), true);
    throw e;
  } finally {
    busy = false;
  }
}
async function loadCases() {
  try {
    const ids = await read("list_cases", [offset, 10]);
    $("#case-list").innerHTML = ids.length
      ? ""
      : '<p class="empty">No cases on this page. Open a case to begin.</p>';
    for (const id of ids) {
      const r = await readJSON("get_case", [id]);
      const b = document.createElement("button");
      b.className = "case-card";
      b.innerHTML = `<span class="case-icon">⌂</span><span><b>${esc(r.claim.title)}</b><small>${esc(id)} · ${esc(r.claim.currency)} · ${money(r.claim.deposit_minor, r.claim.currency)}</small></span><span class="badge">${esc(r.stage.replaceAll("_", " "))}</span><span>↗</span>`;
      b.onclick = () => loadCase(id);
      $("#case-list").append(b);
    }
    $("#prev").disabled = offset === 0;
    $("#next").disabled = ids.length < 10;
  } catch (e) {
    $("#case-list").textContent = e.message || String(e);
  }
}
$("#refresh").onclick = loadCases;
$("#prev").onclick = () => {
  offset = Math.max(0, offset - 10);
  loadCases();
};
$("#next").onclick = () => {
  offset += 10;
  loadCases();
};
$("#lookup").onsubmit = (e) => {
  e.preventDefault();
  loadCase($("#lookup-id").value);
};
async function loadCase(id) {
  try {
    validId(id);
    current = await readJSON("get_case", [id]);
    await renderDetail(current);
    $("#detail").scrollIntoView({ behavior: "smooth" });
  } catch (e) {
    notice(e.message || String(e), true);
  }
}
async function renderDetail(r) {
  const d = $("#detail");
  d.hidden = false;
  const c = r.claim;
  d.innerHTML = `<div class="panel-title"><div><div class="eyebrow">CASE / ${esc(r.id)}</div><h2>${esc(c.title)}</h2></div><span class="badge">${esc(r.outcome.replaceAll("_", " "))}</span></div><div class="detail-meta"><span>Deposit <b>${money(c.deposit_minor, c.currency)}</b></span><span>Stage <b>${esc(r.stage)}</b></span><span>Assessments <b>${r.attempts} / 2</b></span></div><details><summary>Frozen evidence & participant addresses</summary><pre>${esc(JSON.stringify(r, null, 2))}</pre></details><div id="party-actions"></div><div id="receipts"></div>`;
  const a = $("#party-actions");
  const party = [r.landlord, r.tenant].includes(account.toLowerCase());
  if (r.stage === "AWAITING_TENANT") {
    a.innerHTML = `<h3>Tenant response</h3><p class="muted">Only the invited tenant (${esc(r.tenant)}) can submit. Responses are immutable.</p><form id="respond"><label>Do these lease terms match the agreement?<select id="terms"><option value="true">Yes, these are the agreed terms</option><option value="false">No, I dispute these lease terms</option></select></label><label>Counterevidence and response<textarea id="response" required maxlength="6000"></textarea></label><label class="check"><input type="checkbox" required>I have redacted all personal information and understand this response is public.</label><button ${account.toLowerCase() !== r.tenant ? "disabled" : ""}>Freeze tenant response</button></form>`;
    $("#respond").onsubmit = async (e) => {
      e.preventDefault();
      try {
        await action("respond", [
          r.id,
          canonical({
            agrees_terms: $("#terms").value === "true",
            statement: $("#response").value,
          }),
        ]);
      } catch {}
    };
  }
  if (r.stage === "READY") {
    a.innerHTML = `<h3>Ready for independent assessment</h3><p>Both sides are recorded. Either case party can request validator assessment.</p><button id="evaluate" ${!party ? "disabled" : ""}>Request assessment ↗</button>`;
    $("#evaluate").onclick = async () => {
      try {
        await action("evaluate", [r.id]);
      } catch {}
    };
  }
  if (r.stage === "ASSESSED" && r.attempts === 1) {
    a.innerHTML = `<details><summary>Challenge this assessment with additional evidence</summary><form id="challenge"><label>Additional redacted evidence<textarea id="challenge-text" required maxlength="4000"></textarea></label><label class="check"><input type="checkbox" required>I understand this is the single shared challenge and will be public.</label><button ${!party ? "disabled" : ""}>Submit evidence challenge</button></form></details>`;
    $("#challenge").onsubmit = async (e) => {
      e.preventDefault();
      try {
        await action("challenge", [r.id, $("#challenge-text").value]);
      } catch {}
    };
  }
  for (let i = 1; i <= r.attempts; i++) {
    const receipt = await readJSON("get_receipt", [r.id, i]);
    const a = receipt.assessment;
    const box = document.createElement("article");
    box.className = "receipt";
    box.innerHTML = `<div class="eyebrow">ASSESSMENT ${i} / ${i === r.attempts ? "LATEST" : "HISTORICAL"}</div><p class="muted">Validators agree on item verdicts and amounts. Detailed checks and quotations show the accepted leader’s explanation.</p><h3>${esc(a.outcome.replaceAll("_", " "))}</h3><div class="amounts"><span>Supported<b>${money(a.supported_minor, c.currency)}</b></span><span>Unsupported<b>${money(a.unsupported_minor, c.currency)}</b></span><span>Unresolved<b>${money(a.unresolved_minor, c.currency)}</b></span></div><p>${esc(a.reason)}</p>${a.findings.map((f) => `<details><summary>${esc(f.id)} · ${esc(f.state)} · ${money(f.amount_minor, c.currency)}</summary><p>${esc(f.reason)}</p><div class="checks">${["lease_allows", "beyond_wear", "attributable", "cost_supported"].map((k) => `<span>${esc(k.replaceAll("_", " "))}<b>${esc(f[k])}</b></span>`).join("")}</div><blockquote>${esc(f.lease_quote)}</blockquote><blockquote>${esc(f.evidence_quote)}</blockquote><blockquote>${esc(f.tenant_quote)}</blockquote></details>`).join("")}<p class="hash">Decision hash: ${esc(receipt.decision_hash)}</p><button class="outline small verify">Verify receipt hashes</button><button class="outline small download">Download receipt JSON ↓</button><small class="verification" role="status"></small>`;
    box.querySelector(".download").onclick = () => {
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(receipt, null, 2)], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = r.id + "-" + i + ".json";
      link.click();
      URL.revokeObjectURL(url);
    };
    box.querySelector(".verify").onclick = async () => {
      const hash = async (x) => hashRecord(x);
      const { decision_hash, ...body } = receipt;
      let ok =
        (await hash(body)) === decision_hash &&
        (await hash(receipt.evidence)) === receipt.evidence_hash &&
        (await hash(receipt.evidence.claim)) === receipt.claim_hash;
      if (i === 1) ok = ok && receipt.previous_hash === "0".repeat(64);
      else
        ok =
          ok &&
          receipt.previous_hash ===
            (await readJSON("get_receipt", [r.id, i - 1])).decision_hash;
      box.querySelector(".verification").textContent = ok
        ? "✓ Receipt, evidence, claim and previous-link hashes verified."
        : "Hash verification failed.";
    };
    $("#receipts").append(box);
  }
}
function collectDeductions() {
  return [...document.querySelectorAll(".deduction-row")].map((row) => ({
    id: validId(row.querySelector("[data-field=id]").value),
    description: row.querySelector("[data-field=description]").value,
    amount_minor: moneyToMinor(row.querySelector("[data-field=amount]").value),
    evidence: row.querySelector("[data-field=evidence]").value,
  }));
}
function renderDeductions(items) {
  $("#deduction-rows").innerHTML = items
    .map(
      (d, i) =>
        `<fieldset class="deduction-row"><legend>Deduction ${i + 1}</legend><div class="two"><label>Item reference<input data-field="id" required maxlength="64" pattern="[A-Za-z0-9_-]{1,64}" value="${esc(d.id || "item-" + (i + 1))}"></label><label>Amount<input data-field="amount" type="number" min="0.01" max="1000000" step="0.01" required value="${d.amount_minor ? (d.amount_minor / 100).toFixed(2) : ""}" placeholder="80.00"></label></div><label>What is the deduction for?<input data-field="description" required maxlength="300" value="${esc(d.description || "")}" placeholder="e.g. Repair of bedroom shelf"></label><label>Damage evidence and documented cost<textarea data-field="evidence" required maxlength="1800" placeholder="Redacted invoice, damage details and provenance…">${esc(d.evidence || "")}</textarea></label><button type="button" class="remove-deduction small outline" ${items.length === 1 ? "disabled" : ""}>Remove deduction</button></fieldset>`,
    )
    .join("");
  document.querySelectorAll(".remove-deduction").forEach(
    (b, i) =>
      (b.onclick = () => {
        b.closest(".deduction-row").remove();
        $("#add-deduction").disabled = false;
        const buttons = document.querySelectorAll(".remove-deduction");
        if (buttons.length === 1) buttons[0].disabled = true;
      }),
  );
  $("#add-deduction").disabled = items.length >= 5;
}
$("#add-deduction").onclick = () => {
  const items = [...document.querySelectorAll(".deduction-row")].map((row) => ({
    id: row.querySelector("[data-field=id]").value,
    description: row.querySelector("[data-field=description]").value,
    amount_minor: row.querySelector("[data-field=amount]").value
      ? moneyToMinor(row.querySelector("[data-field=amount]").value)
      : 0,
    evidence: row.querySelector("[data-field=evidence]").value,
  }));
  if (items.length < 5) {
    let n = 1;
    while (items.some((d) => d.id === "item-" + n)) n++;
    renderDeductions([...items, { id: "item-" + n }]);
  }
};
renderDeductions([{}]);
$("#sample").onclick = async () => {
  const c = await fetch("/fixtures/claim.json").then((r) => r.json());
  const f = $("#new-case");
  for (const k of ["title", "currency", "lease", "inspection"])
    f.elements[k].value = c[k];
  f.elements.deposit_minor.value = (c.deposit_minor / 100).toFixed(2);
  renderDeductions(c.deductions);
  if (!f.elements.case_id.value)
    f.elements.case_id.value = "deposit-" + Date.now().toString(36);
};
document.querySelectorAll("input[type=file]").forEach(
  (input) =>
    (input.onchange = async () => {
      try {
        const file = input.files[0];
        if (!file) return;
        if (file.size > 24000)
          throw new Error("Use a text file smaller than 24 KB.");
        const text = await file.text();
        const field = $("#new-case").elements[input.dataset.target];
        if (text.length > 6000)
          throw new Error("Text exceeds 6,000 characters.");
        field.value = text;
      } catch (e) {
        notice(e.message, true);
      } finally {
        input.value = "";
      }
    }),
);
$("#new-case").onsubmit = async (e) => {
  e.preventDefault();
  const f = e.target;
  try {
    const id = validId(f.elements.case_id.value);
    const claim = {};
    for (const k of ["title", "currency", "lease", "inspection"])
      claim[k] = f.elements[k].value;
    claim.deposit_minor = moneyToMinor(f.elements.deposit_minor.value);
    claim.deductions = collectDeductions();
    if (
      claim.deductions.reduce((n, d) => n + d.amount_minor, 0) >
      claim.deposit_minor
    )
      throw new Error("Deductions cannot exceed the deposit.");
    await action("open_case", [id, f.elements.tenant.value, canonical(claim)]);
    await loadCase(id);
  } catch (e) {
    notice(e.message || String(e), true);
  }
};
$("#track").onsubmit = async (e) => {
  e.preventDefault();
  if (busy) return;
  busy = true;
  try {
    await resume($("#tx-hash").value, updateTx);
    notice("Transaction finalized successfully.");
    await loadCases();
    if (current) await loadCase(current.id);
  } catch (e) {
    notice(e.message || String(e), true);
  } finally {
    busy = false;
  }
};
const pending = sessionStorage.getItem("depositfair-pending");
if (pending) $("#tx-hash").value = pending;
loadCases();
