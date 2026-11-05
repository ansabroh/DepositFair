import fs from "node:fs";
import assert from "node:assert/strict";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { transactionState, hashRecord } from "../src/lifecycle.js";
const config = JSON.parse(fs.readFileSync("public/deployment.json"));
const life = JSON.parse(fs.readFileSync("evidence/challenge-lifecycle.json"));
assert.equal(
  life.complete,
  true,
  "Complete the resumable challenge verification first",
);
assert.equal(life.address, config.address);
const c = createClient({ chain: studionet });
const refs = [
  config.transactions.find((t) => t.method === "deploy"),
  {
    method: "ai_open_case",
    hash: "0x7d4949192bc4490f9db8dea3efb81a4f623bc1ac1fe351edb58f95088938e561",
  },
  {
    method: "ai_respond",
    hash: "0x7cadddc4d0061ff184aa292fd559afd32271a1bfd9797e77fab481bd4bbc2234",
  },
  {
    method: "ai_evaluate",
    hash: "0x286532a05ca434a601d45d2e58dd3764861ec70fbaa5ccbf30c6096403136d55",
  },
  ...life.transactions.map(({ method, hash, expectFailure }, i) => ({
    method: "lifecycle_" + (i + 1) + "_" + method,
    hash,
    expectFailure,
  })),
  {
    method: "duplicate_response_rejected",
    hash: "0x0526b611484078e7a79efb4193f262e7cd1a5df07848e5ae7f6671b730009eec",
    expectFailure: true,
  },
];
const out = {
  checked_at: new Date().toISOString(),
  address: config.address,
  chain_id: 61999,
  transactions: [],
  cases: [],
};
for (const ref of refs) {
  const tx = await c.getTransaction({ hash: ref.hash });
  const state = transactionState(tx);
  assert.equal(tx.statusName, "FINALIZED", ref.method + " is not finalized");
  assert.equal(
    state.phase,
    ref.expectFailure ? "failed" : "finalized",
    ref.method + " execution mismatch",
  );
  out.transactions.push({
    ...ref,
    ...state,
    explorer: "https://explorer-studio.genlayer.com/tx/" + ref.hash,
    votes: tx.consensus_data?.votes,
    execution_receipts: tx.consensus_data?.leader_receipt,
  });
  console.log(ref.method, state.status, state.result);
}
for (const [id, count] of [
  ["depositfair-verified-v12", 1],
  [life.case_id, 2],
]) {
  const record = JSON.parse(
    await c.readContract({
      address: config.address,
      functionName: "get_case",
      args: [id],
      transactionHashVariant: "latest-final",
    }),
  );
  assert.equal(record.stage, "ASSESSED");
  assert.equal(record.attempts, count);
  const receipts = [];
  let previous = "0".repeat(64);
  for (let attempt = 1; attempt <= count; attempt++) {
    const r = JSON.parse(
      await c.readContract({
        address: config.address,
        functionName: "get_receipt",
        args: [id, attempt],
        transactionHashVariant: "latest-final",
      }),
    );
    const { decision_hash, ...body } = r;
    assert.equal(hashRecord(body), decision_hash);
    assert.equal(hashRecord(r.evidence), r.evidence_hash);
    assert.equal(hashRecord(r.evidence.claim), r.claim_hash);
    assert.equal(r.previous_hash, previous);
    previous = decision_hash;
    receipts.push(r);
    fs.writeFileSync(
      "evidence/" + id + "-receipt-" + attempt + ".json",
      JSON.stringify(r, null, 2),
    );
  }
  assert.equal(record.head, previous);
  if (count === 1) {
    assert.equal(receipts[0].assessment.outcome, "PARTIALLY_SUPPORTED");
    assert.equal(receipts[0].assessment.supported_minor, 8000);
    assert.equal(receipts[0].assessment.unsupported_minor, 12000);
  } else {
    for (const r of receipts) {
      assert.equal(r.assessment.outcome, "INCONCLUSIVE");
      assert.equal(r.assessment.reason, "LEASE_TERMS_DISPUTED");
      assert.equal(r.assessment.unresolved_minor, 20000);
    }
    assert.notEqual(receipts[0].evidence_hash, receipts[1].evidence_hash);
  }
  out.cases.push({ record, receipts });
  console.log(id, "verified", count, "receipt(s)");
}
const source = JSON.parse(fs.readFileSync("evidence/source-verification.json"));
assert.equal(source.matches, true);
assert.equal(source.address, config.address);
out.source = source;
fs.writeFileSync(
  "evidence/release-verification.json",
  JSON.stringify(out, null, 2),
);
config.transactions = refs;
config.verified = true;
config.case_id = "depositfair-verified-v12";
config.challenge_case_id = life.case_id;
fs.writeFileSync("public/deployment.json", JSON.stringify(config, null, 2));
console.log("RELEASE VERIFIED");
