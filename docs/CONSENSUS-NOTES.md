# Consensus interpretation

DepositFair uses full consensus, not leader-only simulation. A leader can produce a valid proposed assessment before the committee agrees. The frontend must not show that proposal as finalized state.

The validator re-runs the model task independently, validates every leader finding and quotation, then compares exact normalized decision fields. This includes each derived item verdict, its original amount, total amounts and overall outcome. Explanation text and selected exact quotations may vary. Item identities and verdicts must match, so equal grand totals cannot hide a different allocation between deductions. Individual non-decisive subchecks and explanation wording may vary; the displayed subchecks are the accepted leader’s grounded explanation.

A runtime-invalid output is retried once, then may produce an INCONCLUSIVE fallback. The fallback itself requires independent validator agreement. Leader rotation, disagreement and an unresolved consensus transaction are protocol states, not evidence that a deduction is supported or unsupported. The application retains transaction hashes for resume and does not automatically resubmit.

The initial deployment used text response mode, which produced outputs rejected by the schema checks. Version 1.1 explicitly requests JSON from the model provider but its exact-subcheck comparison caused unnecessary disagreement. Version 1.2 ignores model-only extra fields, makes a definite failed requirement dominate unknown requirements, and compares item verdicts and amounts. Earlier source and transaction history are retained. The current byte-verified deployed source is identified in DEPLOYMENT.md. No claim is made that hashes authenticate a real inspection or invoice.
