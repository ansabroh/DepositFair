# Architecture

The static Vite frontend uses genlayer-js 1.1.8 with the matching Studionet chain definition (61999), rather than the separate Consensus v0.6 preview chain. Python contract code pins its GenVM dependency runner. Latest official documentation was checked on 2026-11-04: https://docs.genlayer.com/api-references/genlayer-js and https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle .

The app calls `writeContract` with full consensus (leaderOnly false), receives the GenLayer transaction ID, polls execution plus lifecycle state, and refreshes only latest-final state after finalized successful execution. ACCEPTED is provisional; FINALIZED alone does not imply execution success. A failed execution, undetermined consensus, cancellation or timeout is not presented as success. Transport interruptions preserve the public hash for resume. No automatic resubmission and no automatic contract redeployment.

## State machine

`open_case` → AWAITING_TENANT → `respond` → READY → `evaluate` → ASSESSED → one optional `challenge` → READY → second `evaluate` → ASSESSED.

Landlord and tenant must have distinct nonzero addresses. Only the invited tenant can freeze the response. Either party can evaluate or consume the shared challenge slot. Case IDs and the landlord claim are immutable. No timer, forced default, adjudication without tenant participation or mutable admin verdict exists. There is deliberately no automatic timeout win for a landlord.

## Assessment

Each deduction has four checks: lease basis, damage beyond wear, tenant attribution and cost support. Each is YES, NO or UNCERTAIN. Any definite NO makes the item unsupported. Otherwise any UNCERTAIN makes it unresolved; four YES makes it supported. A definite exclusion is sufficient even if a separate requirement is unknown. Item amounts are the original integer minor-unit claims; the model cannot invent a settlement amount. Total deductions cannot exceed the deposit. Supported amounts are not disbursed and are not legally payable conclusions.

Overall outcomes: DEDUCTIONS_SUPPORTED, DEDUCTIONS_UNSUPPORTED, PARTIALLY_SUPPORTED, INCONCLUSIVE. Any unresolved item makes the overall result INCONCLUSIVE while retaining item-level supported/unsupported totals. Failure to validate two model outputs records MODEL_OUTPUT_INVALID with all amounts unresolved, subject to independent validator agreement. Disputed lease terms record LEASE_TERMS_DISPUTED without AI assessment.

The leader validates required model fields and exact source quote membership. Extra model-only fields are discarded before validation; model-proposed outcomes and amounts never affect the result. Submitted claim and response JSON remain strict. Each validator independently runs the same task without receiving the leader's reasoning, validates the leader's schema, quotations and derived totals, and compares per-item verdicts and exact amounts. Explanation wording and exact quote selection can differ between independent assessments; item verdicts, totals and overall outcome must match exactly. The detailed subchecks and wording form the accepted leader explanation; they are not individually required to match every validator. Local direct tests mock external model calls and separately execute the validator callback; live evidence documents actual consensus.

## Hashes

Canonical JSON: recursively sorted object keys, compact separators, ASCII escapes matching Python ensure_ascii=True, arrays retain order. SHA-256 uses UTF-8 bytes. `claim_hash` binds the frozen landlord claim. `evidence_hash` binds claim, tenant response and the cumulative challenge. Each receipt embeds that exact evidence snapshot plus its previous receipt hash. `decision_hash` hashes the complete receipt before adding decision_hash. Frontend verification independently recomputes these hashes and checks the previous link.

No HTTP evidence fetching means no SSRF or mutable external URL dependence. All decision inputs are on-chain snapshots. This is reliable byte binding of self-attested evidence, not an authoritative verification of external facts. The synthetic fixtures are explicitly labelled. A live external rent-law feed would incorrectly imply legal authority and is outside v1 scope.
