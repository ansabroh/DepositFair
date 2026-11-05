# Deployment

## Current release

- Product: DepositFair
- Network: GenLayer Studionet (sandbox), chain ID 61999
- Intelligent Contract version: DepositFair/1.2
- Contract: `0x2cDd9704206261998586023a5F36bB45199e82F8`
- Explorer: https://explorer-studio.genlayer.com/address/0x2cDd9704206261998586023a5F36bB45199e82F8
- Deployment transaction: https://explorer-studio.genlayer.com/transactions/0xeaafadc5f5daedb92427b827b14b559e0023326bbef3dd3ebd9a036e92ad7823
- Application origin: https://depositfair.mohamedansaf222.chatgpt.site
- Source repository: https://github.com/ansabroh/DepositFair
- Contract source SHA-256: `a89274e56aed717b160bb5c37f5345a697eeb2346b0b61659991dff1a0ec6fb7`

Deployment used GenLayer Studio's built-in account and Normal (Full Consensus) execution, not leader-only mode. `evidence/source-verification.json` records exact byte equality between the deployed source retrieved through the SDK and `contracts/deposit_fair.py`. `public/deployment.json` is the frontend's deployment configuration; it contains no credentials.

The frontend uses disposable SDK accounts for direct signed Studionet writes. It does not connect to Studio's cross-origin browser account session, and does not request Studio credentials. This distinction is visible in the connection dialog. Studio supports locally signing its own sandbox transactions; a simple public-address/unsigned RPC integration was tested and rejected by the backend, so it is not shipped.

## Earlier deployment

`0x31d298571AB68011A2e749aFF7C777A43DB86Cf5` was the initial v1 deployment. The initial text-response mode failed strict model-output validation on both synthetic live assessments and correctly recorded INCONCLUSIVE. It is retired from the frontend. The corrected deployment changed model invocation to explicit JSON response mode and added bounded diagnostic logging; this was a source change, not an unnecessary redeployment of unchanged code. The earlier code, receipts and transaction evidence remain under `evidence/initial-deployment/`.

## Reproduce deployment

Use the existing deployed instance for normal verification; do not redeploy unchanged contracts. To deploy a changed release, upload `contracts/deposit_fair.py` to GenLayer Studio, choose Normal (Full Consensus), and deploy with no constructor arguments. Record the GenLayer transaction ID. Wait for FINALIZED and verify leader execution SUCCESS. Retrieve deployed source and compare bytes, then update frontend deployment configuration deliberately.

For local tests and builds see README. Sites hosting configuration is checked in at `.openai/hosting.json`. The published site is a static build with browser-to-Studionet RPC integration; no signing backend or server-side user-data database exists. The public-data warning applies to all submitted text, including uploaded UTF-8 .txt content. Existing case and receipt reads require no account.

## Consensus refinement

The intermediate JSON-mode deployment at `0x8D5A4C8662b2f8A285233Fcee5174FDeD7488Be2` is also retired. Its exact-subcheck comparison led to leader rotation on the mixed deduction fixture. Version 1.2 compares the complete per-item verdict and exact amounts, discards irrelevant model-only extra fields, and treats a definite failed requirement as sufficient to reject a deduction. It preserves independent reasoning, exact quotation checks and deterministic arithmetic. This source change was tested before deploying the final address above. Historical source and verification are under `evidence/json-v11-deployment/`.
