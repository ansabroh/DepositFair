# Verified evidence

Current contract: [0x2cDd9704206261998586023a5F36bB45199e82F8](https://explorer-studio.genlayer.com/address/0x2cDd9704206261998586023a5F36bB45199e82F8), GenLayer Studionet (61999).

Website: https://depositfair.mohamedansaf222.chatgpt.site

## Automated verification

- 34 real GenLayer SDK direct tests passed (mocked model I/O, independently executed validator callbacks).
- 11 JavaScript tests passed: lifecycle states, success/failure handling, canonical SHA-256 and exact decimal amount entry.
- GenVM lint and SDK semantic validation passed: DepositFair, seven public methods.
- Production dependency audit reported zero known vulnerabilities at verification time (`evidence/dependency-audit.json`).
- Deployed source exactly matches the current Python file. SHA-256: `a89274e56aed717b160bb5c37f5345a697eeb2346b0b61659991dff1a0ec6fb7`.

## Finalized network evidence

All 11 transactions below were independently queried and required FINALIZED plus the expected execution result by `scripts/verify-release.mjs`. Nine executions succeeded; two rejections demonstrate authorization and immutability. A consensus status alone was never treated as execution success.

| Operation | Consensus | Execution | Explorer |
| --- | --- | --- | --- |
| deploy | FINALIZED | SUCCESS | [Transaction](https://explorer-studio.genlayer.com/transactions/0xeaafadc5f5daedb92427b827b14b559e0023326bbef3dd3ebd9a036e92ad7823) |
| ai_open_case | FINALIZED | SUCCESS | [Transaction](https://explorer-studio.genlayer.com/transactions/0x7d4949192bc4490f9db8dea3efb81a4f623bc1ac1fe351edb58f95088938e561) |
| ai_respond | FINALIZED | SUCCESS | [Transaction](https://explorer-studio.genlayer.com/transactions/0x7cadddc4d0061ff184aa292fd559afd32271a1bfd9797e77fab481bd4bbc2234) |
| ai_evaluate | FINALIZED | SUCCESS | [Transaction](https://explorer-studio.genlayer.com/transactions/0x286532a05ca434a601d45d2e58dd3764861ec70fbaa5ccbf30c6096403136d55) |
| lifecycle_1_open_case | FINALIZED | SUCCESS | [Transaction](https://explorer-studio.genlayer.com/transactions/0x19a943889dca9cc97fe861310d95bd3d125522c296b2681271152e32a62d6922) |
| lifecycle_2_respond | FINALIZED | SUCCESS | [Transaction](https://explorer-studio.genlayer.com/transactions/0x33aa3dacf8bd84d9c88badfe5cc72f2476ed4c3ac0a2595b3b395a4eea02762e) |
| lifecycle_3_evaluate | FINALIZED | SUCCESS | [Transaction](https://explorer-studio.genlayer.com/transactions/0xfa12f7634ca6a4746158e358a2dfa0b585065acbff4b862bf8a2217aa719f7a9) |
| lifecycle_4_challenge | FINALIZED | SUCCESS | [Transaction](https://explorer-studio.genlayer.com/transactions/0x567c34dd7325eeb97ca9c702df70ec23f45d832f333b249cfc0808b3ad37fc76) |
| lifecycle_5_evaluate | FINALIZED | SUCCESS | [Transaction](https://explorer-studio.genlayer.com/transactions/0x4db6d81f463cb5ab6305267f616627a3efe7bce5b79ff9c22b2d5d2808cb5ead) |
| lifecycle_6_evaluate | FINALIZED | ERROR | [Transaction](https://explorer-studio.genlayer.com/transactions/0x42684148d7885e7c4e567fdad5be62643b705367cd451a4bfb305a41a6e6ea6d) |
| duplicate_response_rejected | FINALIZED | ERROR | [Transaction](https://explorer-studio.genlayer.com/transactions/0x0526b611484078e7a79efb4193f262e7cd1a5df07848e5ae7f6671b730009eec) |

## Substantive AI assessment

Case `depositfair-verified-v12` finalized as **PARTIALLY_SUPPORTED**: GBP 80 supported for the agreed shelf repair, GBP 120 unsupported for pre-existing hallway paint wear, GBP 0 unresolved. This was real full validator consensus, not a mocked model call or leader-only simulation. The initial leader rotated before the accepted result reached finality. The displayed subchecks and quotations are the accepted leader explanation; validators independently agreed on item verdicts and exact amounts.

The case uses explicitly synthetic inspection and invoice text. It does not prove the authenticity of real documents or a legally payable amount. Its decision hash is `e4de3510b66f81819653982dca32aab1b3a21a02dc4e3d3149efcc18774ff064`.

## Challenge and fail-closed lifecycle

Case `depositfair-lifecycle-v12` exercised open → tenant response → assessment → challenge → reassessment with distinct signed accounts. The tenant disputed the frozen lease terms, so both assessments correctly returned **INCONCLUSIVE / LEASE_TERMS_DISPUTED**, with GBP 200 unresolved and no supported deduction. These two assessments intentionally test the deterministic terms-dispute path; they are not claimed as two additional AI adjudications.

The second receipt preserves the first receipt hash, binds the changed evidence snapshot and does not erase or revise the first response. Both receipt hashes, evidence hashes, claim hashes and history links were independently recomputed. An outsider's evaluation was rejected. An accidental duplicate response during helper resumption was also rejected without modifying the original frozen response; the helper was corrected to check finalized state before sending an operation.

## Browser evidence

- Desktop Chromium rendered the real responsive application.
- Account creation/switching/disconnect and initial direct frontend create/respond/evaluate writes were exercised. The retired first deployment's model-format failures are preserved transparently.
- The final deployment's live assessment displays GBP 80 / GBP 120 in the browser, with grounded findings and working independent hash verification.
- Browser JSON export exactly matches the RPC receipt (`evidence/browser-export-verification.json`).
- UTF-8 text import, itemized deduction editing, unique generated item references and transaction tracking were exercised.
- Screenshots: `evidence/screenshots/studio-deployment.jpg` and `evidence/screenshots/assessment.jpg`.

## Limits and historical attempts

This is a public research sandbox, not production tenancy arbitration. Only text evidence is implemented. No PDF/photo authenticity verification, confidential storage, identity verification, external legal-data feed, money custody, automatic settlement or real adoption is claimed. The frontend uses disposable SDK accounts and does not share Studio's cross-origin account session; Studio built-in accounts were used for deployment and the original Studio demonstration. No Studio credentials were accessed.

The first text-response deployment and the intermediate exact-subcheck deployment were replaced after observed live problems; their source and evidence are retained. The final contract was not redeployed without a source change. Explorer availability can differ from RPC availability: a direct Explorer visit returned a temporary 503 during testing. Contract source, finalized transactions and receipt state were independently verified over RPC, and the app reads the network directly.

Raw verification: `evidence/release-verification.json`. Commands and expected results are documented in DEPLOYMENT.md and SECURITY.md. Project Explorer approval and scoring remain external reviewer decisions.
