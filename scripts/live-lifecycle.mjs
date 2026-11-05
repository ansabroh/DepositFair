import fs from "node:fs";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { monitor, transactionState } from "../src/lifecycle.js";
const cfg = JSON.parse(fs.readFileSync("public/deployment.json"));
const reader = createClient({ chain: studionet });
const landlord = createAccount(),
  tenant = createAccount(),
  outsider = createAccount();
const lc = createClient({ chain: studionet, account: landlord }),
  tc = createClient({ chain: studionet, account: tenant }),
  oc = createClient({ chain: studionet, account: outsider });
const id = process.env.DEPOSITFAIR_CASE_ID || "demo-" + Date.now().toString(36);
const claim = JSON.parse(fs.readFileSync("fixtures/claim.json"));
const response = JSON.parse(fs.readFileSync("fixtures/response.json"));
if (process.env.DEPOSITFAIR_SIMPLE === "1") {
  claim.title = "Synthetic demo · agreed shelf repair";
  claim.deductions = claim.deductions.filter((d) => d.id === "shelf");
  response.statement =
    "Synthetic tenant response: I agree these are our lease terms. I broke the shelf during my tenancy and agree with the GBP 80 repair invoice. The shelf was intact at check-in and broken at check-out. Both reports and the repair-only invoice are agreed by both parties.";
}
const out = {
  address: cfg.address,
  case_id: id,
  landlord: landlord.address,
  tenant: tenant.address,
  transactions: [],
};
const persist = () =>
  fs.writeFileSync(
    process.env.DEPOSITFAIR_EVIDENCE || "evidence/final-lifecycle.json",
    JSON.stringify(
      out,
      (_, v) => (typeof v === "bigint" ? v.toString() : v),
      2,
    ),
  );
async function call(client, method, args, expectFailure = false) {
  const hash = await client.writeContract({
    address: cfg.address,
    functionName: method,
    args,
    leaderOnly: false,
  });
  const entry = { method, hash, expectFailure };
  out.transactions.push(entry);
  persist();
  console.log("SUBMITTED", method, hash);
  let last = "";
  try {
    const tx = await monitor(
      reader,
      hash,
      (s) => {
        entry.state = s;
        if (s.status !== last) {
          last = s.status;
          console.log(method, s.status, s.result || "");
        }
        persist();
      },
      { maxPolls: 240, interval: 5000 },
    );
    entry.raw = tx;
    if (expectFailure)
      throw new Error("Unauthorized call unexpectedly succeeded");
  } catch (e) {
    entry.error = e.message;
    persist();
    if (
      !expectFailure ||
      entry.state?.phase !== "failed" ||
      !["ERROR", "Error", "error"].includes(entry.state.result)
    )
      throw e;
    entry.raw = await reader.getTransaction({ hash });
  }
  persist();
}
await call(lc, "open_case", [id, tenant.address, JSON.stringify(claim)]);
await call(tc, "respond", [id, JSON.stringify(response)]);
await call(tc, "evaluate", [id]);
let first = JSON.parse(
  await reader.readContract({
    address: cfg.address,
    functionName: "get_receipt",
    args: [id, 1],
    transactionHashVariant: "latest-final",
  }),
);
out.first_receipt = first;
persist();
console.log("ASSESSMENT", JSON.stringify(first.assessment));
await call(tc, "challenge", [
  id,
  "Synthetic additional evidence: both parties confirm the shelf repair invoice is GBP 80.00 for repair only, and hallway paint scuffs were present at check-in with no deterioration. Please reconsider against the same lease.",
]);
await call(lc, "evaluate", [id]);
out.second_receipt = JSON.parse(
  await reader.readContract({
    address: cfg.address,
    functionName: "get_receipt",
    args: [id, 2],
    transactionHashVariant: "latest-final",
  }),
);
persist();
console.log(
  "CHALLENGE_ASSESSMENT",
  JSON.stringify(out.second_receipt.assessment),
);
await call(oc, "evaluate", [id], true);
console.log("COMPLETE", id);
persist();
