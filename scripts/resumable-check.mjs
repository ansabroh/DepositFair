import fs from "node:fs";
import path from "node:path";
import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { transactionState } from "../src/lifecycle.js";
const runtimePath = process.env.DEPOSITFAIR_RUNTIME_PATH;
if (!runtimePath)
  throw new Error(
    "Set DEPOSITFAIR_RUNTIME_PATH to a scratch file OUTSIDE this checkout. It stores disposable generated test keys and must never be committed.",
  );
if (path.resolve(runtimePath).startsWith(process.cwd() + path.sep))
  throw new Error("Runtime key file must be outside the source checkout.");
const cfg = JSON.parse(fs.readFileSync("public/deployment.json"));
const reader = createClient({ chain: studionet });
if (
  !fs.existsSync(runtimePath) &&
  fs.existsSync("evidence/challenge-lifecycle.json")
) {
  const done = JSON.parse(fs.readFileSync("evidence/challenge-lifecycle.json"));
  if (done.complete && done.address === cfg.address) {
    console.log(
      "This verification is already complete; no transaction submitted.",
    );
    process.exit(0);
  }
}
let rt;
if (fs.existsSync(runtimePath)) rt = JSON.parse(fs.readFileSync(runtimePath));
else {
  rt = {
    address: cfg.address,
    keys: [generatePrivateKey(), generatePrivateKey(), generatePrivateKey()],
    case_id: "depositfair-lifecycle-v12",
    step: 0,
    pending: null,
    transactions: [],
  };
  fs.writeFileSync(runtimePath, JSON.stringify(rt), { mode: 0o600 });
}
if (rt.address !== cfg.address)
  throw new Error("Runtime belongs to a different deployment.");
const accounts = rt.keys.map(createAccount);
const clients = accounts.map((account) =>
  createClient({ chain: studionet, account }),
);
const persist = () => {
  fs.writeFileSync(runtimePath, JSON.stringify(rt), { mode: 0o600 });
  const { keys, ...publicState } = rt;
  fs.writeFileSync(
    "evidence/challenge-lifecycle.json",
    JSON.stringify(
      {
        ...publicState,
        landlord: accounts[0].address,
        tenant: accounts[1].address,
      },
      null,
      2,
    ),
  );
};
const claim = JSON.parse(fs.readFileSync("fixtures/claim.json"));
claim.title = "Synthetic lifecycle test · disputed lease terms";
const response = {
  agrees_terms: false,
  statement:
    "Synthetic tenant response: I dispute that the quoted lease terms are the terms we agreed. Please do not assess deductions until the lease agreement can be established.",
};
const steps = [
  ["open_case", [rt.case_id, accounts[1].address, JSON.stringify(claim)], 0],
  ["respond", [rt.case_id, JSON.stringify(response)], 1],
  ["evaluate", [rt.case_id], 1],
  [
    "challenge",
    [
      rt.case_id,
      "Synthetic challenge: the parties still disagree on the frozen lease terms. This challenge must preserve the original record and must not turn disputed terms into an agreed lease.",
    ],
    1,
  ],
  ["evaluate", [rt.case_id], 0],
  ["evaluate", [rt.case_id], 2],
];
if (rt.pending) {
  const tx = await reader.getTransaction({ hash: rt.pending });
  const state = transactionState(tx);
  const entry = rt.transactions.at(-1);
  entry.state = state;
  persist();
  console.log(entry.method, state.status, state.result || "");
  if (tx.statusName !== "FINALIZED") {
    console.log("PENDING: resume with this same command; do not resubmit.");
    process.exit(0);
  }
  const expected = rt.step === 5 ? "failed" : "finalized";
  if (state.phase !== expected)
    throw new Error("Unexpected finalized execution: " + state.phase);
  entry.execution_receipts = tx.consensus_data?.leader_receipt;
  entry.votes = tx.consensus_data?.votes;
  rt.pending = null;
  rt.step++;
  persist();
}
if (rt.step >= steps.length) {
  rt.receipts = [];
  for (let i = 1; i <= 2; i++)
    rt.receipts.push(
      JSON.parse(
        await reader.readContract({
          address: cfg.address,
          functionName: "get_receipt",
          args: [rt.case_id, i],
          transactionHashVariant: "latest-final",
        }),
      ),
    );
  rt.complete = true;
  persist();
  fs.unlinkSync(runtimePath);
  console.log("COMPLETE; disposable local test keys removed.");
  process.exit(0);
}
const [method, args, clientIndex] = steps[rt.step];
let record = null;
try {
  record = JSON.parse(
    await reader.readContract({
      address: cfg.address,
      functionName: "get_case",
      args: [rt.case_id],
      transactionHashVariant: "latest-final",
    }),
  );
} catch (e) {
  if (!String(e.message || e).includes("Unknown case")) throw e;
}
const legal = [
  !record,
  record?.stage === "AWAITING_TENANT",
  record?.stage === "READY" && record?.attempts === 0,
  record?.stage === "ASSESSED" &&
    record?.attempts === 1 &&
    record?.challenges?.length === 0,
  record?.stage === "READY" && record?.attempts === 1,
  true,
][rt.step];
if (!legal)
  throw new Error(
    "Finalized case state already advanced or does not match this step. Reconcile transaction receipts; do not resubmit.",
  );
const hash = await clients[clientIndex].writeContract({
  address: cfg.address,
  functionName: method,
  args,
  leaderOnly: false,
});
rt.pending = hash;
rt.transactions.push({ method, hash, expectFailure: rt.step === 5 });
persist();
console.log("SUBMITTED", method, hash);
