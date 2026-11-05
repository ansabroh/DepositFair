import fs from "node:fs";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { transactionState } from "../src/lifecycle.js";
const config = JSON.parse(
  fs.readFileSync("evidence/initial-deployment/deployment.json"),
);
const c = createClient({ chain: studionet });
const out = [];
for (const t of config.transactions) {
  const tx = await c.getTransaction({ hash: t.hash });
  out.push({ ...t, ...transactionState(tx), raw: tx });
  console.log(t.method, tx.statusName, transactionState(tx).result);
}
fs.writeFileSync(
  "evidence/initial-deployment/transactions.json",
  JSON.stringify(out, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2),
);
