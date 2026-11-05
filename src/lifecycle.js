import { sha256, toBytes } from "viem";
export function transactionState(tx) {
  const status =
    tx.statusName || (typeof tx.status === "string" ? tx.status : "UNKNOWN");
  const receipt = tx.consensus_data?.leader_receipt;
  const leader = Array.isArray(receipt)
    ? receipt.find((r) => r.mode === "leader")
    : receipt;
  const result = tx.txExecutionResultName || leader?.execution_result || "";
  if (
    [
      "UNDETERMINED",
      "CANCELED",
      "CANCELLED",
      "LEADER_TIMEOUT",
      "VALIDATORS_TIMEOUT",
    ].includes(status)
  )
    return { phase: "failed", status, result };
  if (["ACCEPTED", "FINALIZED"].includes(status)) {
    const success =
      result === "SUCCESS" || result === "Success" || result === "success";
    return {
      phase: success
        ? status === "FINALIZED"
          ? "finalized"
          : "accepted"
        : "failed",
      status,
      result: result || "EXECUTION_NOT_VERIFIED",
    };
  }
  return { phase: "pending", status, result };
}
export async function monitor(
  client,
  hash,
  update,
  {
    maxPolls = 160,
    interval = 3000,
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  } = {},
) {
  for (let i = 0; i < maxPolls; i++) {
    const tx = await client.getTransaction({ hash });
    const state = transactionState(tx);
    update({ ...state, hash });
    if (state.phase === "failed")
      throw new Error(
        `Transaction ${state.status}: ${state.result || "consensus failed"}`,
      );
    if (state.phase === "finalized") return tx;
    await sleep(interval);
  }
  throw new Error(
    "Still pending. Keep the transaction hash and use Resume tracking; do not resubmit.",
  );
}
export function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value !== null && typeof value === "object")
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical(value[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(value).replace(
    /[\u007f-\uffff]/g,
    (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"),
  );
}
export function validId(s) {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(s))
    throw new Error(
      "IDs must contain 1–64 letters, numbers, underscores or hyphens.",
    );
  return s;
}

export const hashRecord = (value) => sha256(toBytes(canonical(value))).slice(2);

export function moneyToMinor(value) {
  if (!/^(?:0|[1-9]\d{0,6})(?:\.\d{1,2})?$/.test(value))
    throw new Error("Enter a positive amount with at most two decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const n = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(n) || n < 1 || n > 100000000)
    throw new Error("Amount must be between 0.01 and 1,000,000.00.");
  return n;
}
