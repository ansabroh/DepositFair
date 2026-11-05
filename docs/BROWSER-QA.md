# Browser verification

Desktop Chromium was used to verify the real application, not a screenshot-only mock.

- Landing page, workspace navigation and synthetic example form render correctly.
- Example loading preserves a case ID entered during the fetch.
- Test-account creation, switching between landlord and tenant, and disconnect work in page memory.
- The initial deployment was used for real frontend create/respond/evaluate transactions; all three finalized with execution SUCCESS. Its model-output validation resulted in INCONCLUSIVE and is retained as historical evidence.
- The corrected contract is exercised through the same SDK write lifecycle by `scripts/live-lifecycle.mjs`, with hashes and execution results captured in `evidence/final-lifecycle.json`.
- The transaction tracker distinguishes provisional acceptance, successful finalization and failed execution; a saved public hash can be resumed.
- Receipt hash verification uses a bundled SHA-256 implementation, including in a local HTTP preview where Web Crypto subtle is unavailable. Canonical Unicode and known Python fixture hashes are tested.

Responsive styles are implemented for narrow screens. Automated device emulation is not claimed. No real rental documents or personal data were used. See EVIDENCE.md for the final receipt/download and public deployment verification record.

Final v1.2 browser checks: the PARTIALLY_SUPPORTED assessment displays GBP 80 supported and GBP 120 unsupported, the hash-verification control reports all hashes valid, and the downloaded JSON exactly matches the SDK RPC receipt (`evidence/browser-export-verification.json`). UTF-8 file import and dynamic deduction add/remove were exercised without submitting personal data. All automatic item references remained distinct after removal and reinsertion.

An accidental duplicate response in the verification helper was rejected on-chain with execution ERROR; the immutable original response was preserved. The helper now checks finalized case state before submitting each operation. Evidence identifies this as an observed rejection, rather than presenting it as a successful write. The frontend's transaction guard prevents a second write while one is tracked.
