# Milestone v1 — Verified case reports and challenge comparison

Date: 2026-11-11. Repository baseline: `56d33b7dd7009ddbd407118b8563708cbe03b817`.

## New functionality

Previously, users could inspect and export one receipt at a time. The new **Verify & build case report** action reads the finalized case and its complete assessment history from the existing contract, checks the chain against the current case head, and produces a single portable report.

- Verifies case/attempt identity, ordered previous links, decision/evidence/claim SHA-256 hashes, case head, outcome and amount totals. An incomplete or inconsistent history blocks report generation and export.
- Compares each deduction's first and latest state by item ID and shows the supported-amount change after a challenge. Cases with disputed terms and empty findings remain unresolved rather than receiving invented item findings.
- Calculates a nonbinding refund range using deposit minus supported deductions, reserving unresolved amounts at its lower end.
- Exports full JSON including source address, complete evidence snapshots, both receipts, comparison and a deterministic report hash.
- Exports standalone escaped HTML with print styles and a restrictive content security policy. Open it and choose Print → Save as PDF. No third-party service or account needed.

## Unchanged deployment

Contract source, ABI, address and network configuration are unchanged. No redeployment or on-chain migration was performed.

Studionet (61999): `0x2cDd9704206261998586023a5F36bB45199e82F8`.

## Validation

- `npm test`: 16 passed, including five new report tests covering real saved live receipts, missing/reordered/tampered history, initial reports, changed item outcomes and escaped hostile HTML.
- `python -m pytest -q`: 34 passed; existing contract suite unchanged.
- `npm run build`: passed.
- Browser QA on the local preview using live finalized reads: opened `depositfair-lifecycle-v12`, verified both receipts, displayed unresolved item comparison and GBP 800.00–1,000.00 range, downloaded JSON and printable HTML successfully.
- The changed-outcome test is synthetic. The live challenge example remains INCONCLUSIVE; no new consensus transaction is claimed for this milestone.

Reproduce: open the application, look up `depositfair-lifecycle-v12`, select **Verify & build case report**, inspect comparison/range, and download either report. No wallet connection required.

## Submission copy (under 1,000 characters)

Added verified case reports and challenge comparison to DepositFair. Users can now fetch the complete finalized assessment history, verify receipt/evidence/claim hashes and previous links against the case head, compare initial vs latest deduction outcomes, and export one complete JSON or printable HTML report with evidence snapshots and a report hash. A nonbinding refund range reserves unresolved deductions rather than treating them as supported. Missing or inconsistent histories block export. This extends the original single-receipt view into a portable review workflow for both parties. Added five report tests; all 50 automated tests and the production build pass. Browser-tested using the existing live two-assessment case and both downloads. Contract source, ABI, Studionet network and deployed address are unchanged; no redeployment or migration.
