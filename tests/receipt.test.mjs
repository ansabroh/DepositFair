import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { hashRecord, canonical } from "../src/lifecycle.js";
test("receipt hashing works without the browser secure-context crypto API", () => {
  const fixture = JSON.parse(
    fs.readFileSync(new URL("../fixtures/claim.json", import.meta.url)),
  );
  assert.equal(
    hashRecord(fixture),
    "d33d997e9a448e76f66ecf4e7701cd6b6db97d39bc7c4b379312829e66c9b021",
  );
});
test("canonical unicode hashing agrees with the standard SHA-256 implementation", () => {
  const data = { z: "é😀", a: [1, "ok"] };
  assert.equal(
    hashRecord(data),
    createHash("sha256").update(canonical(data), "utf8").digest("hex"),
  );
  assert.notEqual(hashRecord(data), hashRecord({ ...data, z: "altered" }));
});
import { moneyToMinor } from "../src/lifecycle.js";
test("currency entry converts exact decimal text to integer minor units", () => {
  assert.equal(moneyToMinor("80.00"), 8000);
  assert.equal(moneyToMinor("0.29"), 29);
  assert.equal(moneyToMinor("120.5"), 12050);
  assert.equal(moneyToMinor("1000000"), 100000000);
  for (const bad of ["-1", "0", "1.001", "1e2", "NaN", "1000000.01", ""])
    assert.throws(() => moneyToMinor(bad));
});
