import fs from "node:fs";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { createHash } from "node:crypto";
const cfg = JSON.parse(fs.readFileSync("public/deployment.json"));
const c = createClient({ chain: studionet });
const code = await c.getContractCode(cfg.address);
const raw = code.startsWith("0x")
  ? Buffer.from(code.slice(2), "hex")
  : Buffer.from(code);
const local = fs.readFileSync("contracts/deposit_fair.py");
const hash = (x) => createHash("sha256").update(x).digest("hex");
const out = {
  address: cfg.address,
  local_sha256: hash(local),
  onchain_sha256: hash(raw),
  matches: local.equals(raw),
  checked_at: new Date().toISOString(),
};
fs.writeFileSync(
  "evidence/source-verification.json",
  JSON.stringify(out, null, 2),
);
if (!out.matches) throw new Error("Deployed source mismatch");
console.log("Deployed source matches:", out.onchain_sha256);
