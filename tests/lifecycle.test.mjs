import { test } from "node:test";
import assert from "node:assert/strict";
import {
  transactionState,
  monitor,
  canonical,
  validId,
} from "../src/lifecycle.js";
test("accepted is provisional, finalized requires success", () => {
  assert.equal(
    transactionState({
      statusName: "ACCEPTED",
      txExecutionResultName: "SUCCESS",
    }).phase,
    "accepted",
  );
  assert.equal(
    transactionState({
      statusName: "FINALIZED",
      txExecutionResultName: "SUCCESS",
    }).phase,
    "finalized",
  );
  assert.equal(
    transactionState({
      statusName: "FINALIZED",
      txExecutionResultName: "ERROR",
    }).phase,
    "failed",
  );
  assert.equal(transactionState({ statusName: "FINALIZED" }).phase, "failed");
});
test("terminal consensus failure", () => {
  for (const statusName of ["UNDETERMINED", "CANCELED", "LEADER_TIMEOUT"])
    assert.equal(transactionState({ statusName }).phase, "failed");
});
test("monitor follows pending to finalized", async () => {
  const sequence = [
    { statusName: "PROPOSING" },
    { statusName: "ACCEPTED", txExecutionResultName: "SUCCESS" },
    { statusName: "FINALIZED", txExecutionResultName: "SUCCESS" },
  ];
  let seen = [];
  await monitor(
    { getTransaction: async () => sequence.shift() },
    "0xabc",
    (s) => seen.push(s.phase),
    { sleep: async () => {} },
  );
  assert.deepEqual(seen, ["pending", "accepted", "finalized"]);
});
test("failed execution never reported as success", async () => {
  await assert.rejects(
    monitor(
      {
        getTransaction: async () => ({
          statusName: "FINALIZED",
          txExecutionResultName: "ERROR",
        }),
      },
      "x",
      () => {},
    ),
    /ERROR/,
  );
});
test("timeout retains transaction for resume", async () => {
  await assert.rejects(
    monitor(
      { getTransaction: async () => ({ statusName: "PENDING" }) },
      "x",
      () => {},
      { maxPolls: 2, sleep: async () => {} },
    ),
    /do not resubmit/,
  );
});
test("canonical JSON matches Python ensure_ascii", () => {
  assert.equal(
    canonical({ z: "é😀", a: [1, "ok"] }),
    '{"a":[1,"ok"],"z":"\\u00e9\\ud83d\\ude00"}',
  );
});
test("IDs reject injected markup and paths", () => {
  assert.throws(() => validId("<script>"));
  assert.throws(() => validId("../a"));
  assert.equal(validId("hello-1"), "hello-1");
});

test("Studio consensus result is separate from execution result", () => {
  assert.equal(
    transactionState({
      statusName: "FINALIZED",
      result_name: "MAJORITY_AGREE",
      consensus_data: {
        leader_receipt: [{ mode: "leader", execution_result: "SUCCESS" }],
      },
    }).phase,
    "finalized",
  );
  assert.equal(
    transactionState({
      statusName: "FINALIZED",
      result_name: "MAJORITY_AGREE",
      consensus_data: {
        leader_receipt: [{ mode: "leader", execution_result: "ERROR" }],
      },
    }).phase,
    "failed",
  );
});
