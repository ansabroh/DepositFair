# Security and scope

DepositFair v1 is a public Studionet research application. Never submit personal data, addresses, signatures, real tenancy files or confidential evidence. All submitted text and transaction calldata are publicly readable and cannot be deleted through this application. Redaction must happen before submission. The app imports UTF-8 text only; PDF/image verification is not implemented.

## Threat model

A landlord could exaggerate damages, a tenant could omit facts, either could insert instructions into evidence, or an LLM could fabricate findings. Contract checks freeze the claim and first response, bind participant addresses, constrain required model fields and lengths, discard model-only extras, reject duplicate JSON keys, require grounded quotes, and derive outcomes and integer totals deterministically. Validators independently rerun the evidence task and compare every item verdict and exact amount. Quote membership is grounding, not proof of truth or of adequate context; models can still reason incorrectly or agree on biased inputs.

No assessment before tenant participation; disputed lease terms yield INCONCLUSIVE without substantive assessment. At most two assessments and one shared evidence challenge per case. An assessment preserves all evidence in an append-only receipt. A challenge cannot overwrite prior receipts. The first case ID registration wins; identifiers are not proof of property identity. Case participants are wallet identities, not verified legal parties. Two accounts cannot prevent one human from controlling both.

## Accounts and signing

Deployment and the Studio demonstration use Studio's built-in accounts. The frontend creates disposable SDK accounts in memory and signs transactions locally. No private key is requested, displayed, transmitted as application data or stored in browser storage. Reloading loses these disposable accounts and their ability to act on previously created cases. Disconnect removes the active signer; session account switching retains those accounts in memory until reload. The only browser storage value is a public transaction hash used for resume tracking. Use test accounts and synthetic cases only. This intentionally limited demo wallet is not production wallet infrastructure.

Source does not import MetaMask or depend on a browser extension. Signature verification and transaction ordering are the network's responsibility. Studionet is a sandbox, not production custody or identity assurance. No deposits or money are held/transferred. No real disputes were assessed during testing.

## Evidence limitations

Inputs are self-attested text, including synthetic invoices and inspection narratives. Content hashes prove consistency of submitted bytes, not document authenticity, property condition, agreement validity or completeness. There is no statutory-law oracle, legal jurisdiction engine, independent invoice issuer check, photo forensics or identity verification. Outcomes assess only frozen lease terms and supplied text. No binding legal determinations or automatic settlement. Production use requires authenticated confidential evidence storage, jurisdiction-specific professional review, verified participants, privacy controls and a supported production wallet.

Network errors and validator disagreement do not become a supported verdict. Two invalid model outputs yield a bounded INCONCLUSIVE record only when independent validators agree with that fallback. Native consensus can time out, rotate or remain undetermined; transaction tracking handles these separately from substantive outcomes. A successful transaction may validly record INCONCLUSIVE.

Report vulnerabilities privately to the repository owner before public disclosure. Do not upload secrets to GitHub issues.

The optional CLI verification helper creates its own disposable sandbox keys in a caller-selected scratch file outside the checkout, with file mode 0600, so verification can resume across process interruptions. It writes only public addresses and receipts to the repository and removes the temporary keys on completion. These are newly generated test keys, not imported Studio credentials. Run one helper process at a time; it checks finalized case state and retains known pending hashes rather than resubmitting.
