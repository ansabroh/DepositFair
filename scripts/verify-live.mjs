import { transactionState } from "../src/lifecycle.js";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import fs from "node:fs";
const c = createClient({ chain: studionet });
const config = JSON.parse(fs.readFileSync("public/deployment.json", "utf8"));
const out = {
  checked_at: new Date().toISOString(),
  network: "studionet",
  chain_id: 61999,
  address: config.address,
  transactions: [],
};
for (const t of config.transactions) {
  const tx = await c.getTransaction({ hash: t.hash });
  out.transactions.push({
    method: t.method,
    hash: t.hash,
    status: tx.statusName,
    result: transactionState(tx).result,
    raw: tx,
  });
  console.log(t.method, tx.statusName, transactionState(tx).result);
}
console.log(
  "cases",
  await c.readContract({
    address: config.address,
    functionName: "list_cases",
    args: [0, 50],
    transactionHashVariant: "latest-final",
  }),
);
fs.writeFileSync(
  "evidence/live-transactions.json",
  JSON.stringify(out, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2),
);
