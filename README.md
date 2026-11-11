# DepositFair

Rental deposit disputes often come down to incomplete evidence, different readings of a lease, and neither side trusting a unilateral assessment. DepositFair freezes both sides' submissions and uses real GenLayer validator consensus to assess each deduction against the agreed terms.

**Live application:** https://depositfair.mohamedansaf222.chatgpt.site  
**Contract (Studionet, 61999):** https://explorer-studio.genlayer.com/address/0x2cDd9704206261998586023a5F36bB45199e82F8

> Research application for synthetic or fully redacted text. All submissions are public and permanent. Assessments are nonbinding, do not apply local law, do not authenticate documents, and never transfer funds.

## Product

- Landlord opens a case with frozen lease clauses, inspection reports and up to five itemized deductions.
- A distinct invited tenant confirms/disputes lease terms and supplies counterevidence. No unilateral default assessment.
- Either party requests an independent AI validator assessment. Each deduction is checked for lease basis, damage beyond ordinary wear, tenant responsibility and cost support.
- Deterministic code calculates integer minor-unit amounts and one of DEDUCTIONS_SUPPORTED, DEDUCTIONS_UNSUPPORTED, PARTIALLY_SUPPORTED or INCONCLUSIVE.
- One shared evidence challenge permits a second assessment. The original assessment is preserved, including its exact evidence snapshot.
- The frontend reads finalized contract state, displays per-item checks and grounded quotations, verifies SHA-256 receipt chains, exports JSON receipts and tracks pending/accepted/finalized/failed transactions.

## Milestone v1: verified case reports

Open any assessed case and choose **Verify & build case report**. Verify the full receipt chain, compare initial and challenged item outcomes, review a nonbinding refund range and download complete JSON or a printable HTML report. No account required. Missing or inconsistent receipt histories block export. The contract address is unchanged. See [milestone delta and reproduction](docs/MILESTONE-V1.md).

## Try it

1. Open the live app and select **Connect test account** to create a disposable Studionet account. Its address is displayed in the connection notice.
2. Create a second account using the same dialog, retain its public address, then switch back to the first session account.
3. Open a case, load the synthetic example, enter a unique case ID and invite the second account. Review the public-data notice and submit.
4. Wait for FINALIZED + SUCCESS. Switch to the invited tenant account; review the frozen evidence and submit a response.
5. Request assessment. A successful transaction can record INCONCLUSIVE if facts, model output or terms are unresolved. Expand item findings, verify hashes and download the receipt.
6. Submit one evidence challenge, then request the second assessment. Previous receipts remain visible.
7. For a network interruption, retain the public transaction hash and use **Resume tracking**. Do not resubmit a pending write.

Frontend disposable accounts exist only in page memory. Reloading loses them permanently; disconnect removes the active connection but retains session accounts for switching. Never use funded/production accounts or real disputes. Contract deployment and `studio-demo-01` use Studio's built-in accounts; direct frontend writes use SDK-created disposable accounts. Studio does not expose a supported cross-origin wallet connector, so the app does not claim to share Studio's browser account session.

To act exclusively in Studio: upload `contracts/deposit_fair.py`, use the existing deployed address rather than redeploy, and call open_case/respond/evaluate/challenge with the documented arguments. Read existing public cases without connecting an account from the live app.

## Local development

Requires Node 22+ and Python 3.12.

```sh
npm ci
npm test
npm run build
python -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/pytest -q
.venv/bin/genvm-lint check contracts/deposit_fair.py
npm run dev
```

Direct-mode tests use the genuine GenLayer SDK with mocked LLM I/O and independently execute captured validator callbacks. They cover all outcomes, amount invariants, malformed/ungrounded output, duplicate keys, tenant authorization, no unilateral assessments, immutable data, challenges and tamper-evident history. JavaScript tests cover transaction finality, failure, consensus/execution distinction, resume timeout and canonical JSON. Mocked local results are distinguished from live network evidence.

## Source guide

| Path | Purpose |
| --- | --- |
| `contracts/deposit_fair.py` | Standalone Intelligent Contract with independent validator logic |
| `src/chain.js` | SDK integration and disposable session accounts |
| `src/lifecycle.js` | Transaction state/monitoring and cross-language canonical JSON |
| `src/main.js`, `src/style.css` | Responsive resolution workspace |
| `fixtures/` | Explicitly synthetic lease, inspection and invoice examples |
| `tests/` | SDK direct tests and lifecycle tests |
| `evidence/` | Reproducible test output, live receipts and screenshots |
| `DEPLOYMENT.md`, `EVIDENCE.md`, `SUBMISSION.md` | Verified deployment and submission material |

See [architecture](docs/ARCHITECTURE.md) for consensus criteria, [security](SECURITY.md) for trust boundaries, and [deployment](DEPLOYMENT.md) for the live network record. No external server-side signing service, API secret or MetaMask integration is required.

## Continued development

A production pilot would require confidential off-chain evidence storage with access control and content commitments, verified participant identity and consent, professional jurisdiction review, stable supported wallet integration and human escalation. PDF/photo ingestion and invoice issuer verification are future work, not implemented claims. This repository is an evidence-assessment primitive and working sandbox application, not a replacement for a statutory tenancy deposit scheme.

Verified release: 45 automated tests, 11 finalized transactions (nine successful executions and two verified rejections), one substantive AI assessment and a complete challenge lifecycle. See [EVIDENCE.md](EVIDENCE.md) for exact outcomes and limits.

MIT licensed.
