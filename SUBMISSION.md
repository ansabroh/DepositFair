# Project Explorer submission

## Identity

- Project name: DepositFair
- Submission type: Projects (complete application and Intelligent Contract)
- Suggested focus: rental deposit evidence and dispute resolution; choose the closest available taxonomy in the live form.
- Logo: `public/logo.png` (512 × 512 PNG, under 2 MB)
- Website: https://depositfair.mohamedansaf222.chatgpt.site
- GitHub: https://github.com/ansabroh/DepositFair
- GenLayer contract: https://explorer-studio.genlayer.com/address/0x2cDd9704206261998586023a5F36bB45199e82F8

## One-line description

Evidence-led rental deposit assessments with independent GenLayer validator consensus and verifiable receipts.

## Project description

DepositFair helps tenants and landlords compare deposit deductions against frozen lease terms and both parties' evidence. Landlords submit itemized claims; only the invited tenant can freeze the response. Independent GenLayer validators assess lease basis, ordinary wear, responsibility and cost. Deterministic rules derive amounts and outcomes, with missing or disputed evidence remaining inconclusive. One evidence challenge permits reassessment without erasing history. The live frontend signs Studionet transactions, tracks finality and execution failures, reads finalized findings, verifies receipt hashes and exports evidence. Includes SDK tests, browser checks, source verification and public transaction evidence. Research sandbox using synthetic or redacted text only; no legal ruling, document authentication, custody or automatic settlement.

## Problem and trust model

A unilateral deduction calculation gives one party control over the facts and interpretation. DepositFair commits both parties' evidence before assessment, requires independent reasoning against the same record, constrains the monetary result deterministically and exposes the resulting evidence and receipts for review. AI consensus is central to interpretation; a generic chatbot cannot provide the same signed participant workflow, shared state machine or consensus-backed receipt history.

## Demonstration instructions

Open the public application and browse the case register without connecting a wallet. Open a verified example, inspect the frozen evidence and assessment, expand the grounded item findings, verify receipt hashes, and download JSON. To make a new synthetic case, create two disposable page-session test accounts, invite one as tenant from the other, respond, assess, then challenge and reassess. Preserve transaction hashes if tracking times out. Reloading loses disposable accounts; use no real disputes.

## Evidence for reviewers

- `EVIDENCE.md`: final verification table and limitations
- `evidence/release-verification.json`: live transaction execution and receipt verification
- `evidence/source-verification.json`: deployed source byte comparison and SHA-256
- `evidence/contract-tests.txt`: real SDK direct tests with mocked model I/O
- `evidence/frontend-tests.txt`: lifecycle, canonical hashing and amount-input tests
- `evidence/initial-deployment/`: transparent record of the retired text-response deployment and its fail-closed assessments
- `SECURITY.md` and `docs/ARCHITECTURE.md`: trust boundaries and consensus criteria

No claim is made about production adoption, real tenancy decisions, legal compliance, independent authentication or any external social post. Acceptance and scoring remain the Project Explorer reviewers' decision.
