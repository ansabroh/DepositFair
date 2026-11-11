import { canonical, hashRecord } from './lifecycle.js';

const requireThat = (ok, message) => { if (!ok) throw new Error(message); };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const reportDisclaimer = 'Nonbinding research assessment of submitted text. Hash checks establish internal consistency with the fetched contract state, not document authenticity or legal entitlement. No funds are transferred.';

// Receipts must be fetched with latest-final from the configured contract, in order.
export function buildReport(record, receipts, deployment) {
  requireThat(record.attempts >= 1 && record.attempts <= 2 && receipts.length === record.attempts, 'Complete assessment history required.');
  let previous = '0'.repeat(64);
  const claimHash = hashRecord(record.claim);
  requireThat(claimHash === record.claim_hash, 'Case claim hash mismatch.');
  const total = record.claim.deductions.reduce((n, d) => n + d.amount_minor, 0);
  for (const [index, receipt] of receipts.entries()) {
    const { decision_hash, ...body } = receipt;
    requireThat(receipt.case_id === record.id && receipt.attempt === index + 1, 'Wrong case or assessment order.');
    requireThat(receipt.previous_hash === previous, 'Broken receipt history link.');
    requireThat(hashRecord(body) === decision_hash, 'Receipt hash mismatch.');
    requireThat(hashRecord(receipt.evidence) === receipt.evidence_hash, 'Evidence hash mismatch.');
    requireThat(receipt.claim_hash === claimHash && hashRecord(receipt.evidence.claim) === claimHash, 'Receipt claim mismatch.');
    const amounts = ['supported_minor','unsupported_minor','unresolved_minor'].map(k => receipt.assessment[k]);
    requireThat(amounts.every(n => Number.isSafeInteger(n) && n >= 0) && amounts.reduce((a,b) => a+b,0) === total, 'Invalid assessment totals.');
    previous = decision_hash;
  }
  requireThat(previous === record.head, 'History does not match the current case head.');
  const latest = receipts.at(-1).assessment;
  requireThat(latest.outcome === record.outcome, 'Case outcome mismatch.');
  const before = receipts[0].assessment;
  const changes = record.claim.deductions.map(d => {
    const first = before.findings.find(f => f.id === d.id);
    const last = latest.findings.find(f => f.id === d.id);
    return { id: d.id, description: d.description, amount_minor: d.amount_minor,
      before: first?.state ?? 'UNRESOLVED', after: last?.state ?? 'UNRESOLVED',
      reason: last?.reason ?? latest.reason };
  });
  // Unresolved deductions remain a range; they are never counted as supported.
  const refund = { minimum_minor: record.claim.deposit_minor - latest.supported_minor - latest.unresolved_minor,
    maximum_minor: record.claim.deposit_minor - latest.supported_minor };
  requireThat(refund.minimum_minor >= 0, 'Deductions exceed deposit.');
  const body = { format: 'depositfair-case-report-v1', source: { network: deployment.network, chainId: deployment.chainId, address: deployment.address },
    verification: 'FULL_RECEIPT_CHAIN_VERIFIED', disclaimer: reportDisclaimer,
    case: record, receipts, changes, refund, supported_change_minor: receipts.length === 2 ? latest.supported_minor - before.supported_minor : null };
  return structuredClone({ ...body, report_hash: hashRecord(body) });
}

export function reportHTML(report) {
  const c = report.case.claim;
  const money = n => `${c.currency} ${(n / 100).toFixed(2)}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>DepositFair case report — ${esc(report.case.id)}</title><style>body{font:16px/1.6 system-ui;max-width:960px;margin:40px auto;padding:0 24px;color:#183d38}h1,h2{line-height:1.2}table{border-collapse:collapse;width:100%;margin:24px 0}th,td{border:1px solid #b8c9c4;padding:10px;text-align:left}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}small{overflow-wrap:anywhere} @media print{body{margin:0}tr{break-inside:avoid}}</style></head><body><h1>DepositFair / Verified case report</h1><h2>${esc(c.title)}</h2><p>Case: ${esc(report.case.id)} · Stage: ${esc(report.case.stage)} · Assessments: ${report.receipts.length}</p><p>${esc(report.disclaimer)}</p><p>Receipt chain: verified against fetched case head. Source: ${esc(report.source.network)} / ${esc(report.source.chainId)} / ${esc(report.source.address)}</p><h2>Assessment-based refund range</h2><p>${esc(money(report.refund.minimum_minor))} – ${esc(money(report.refund.maximum_minor))}</p><p>Deposit minus supported deductions, reserving unresolved amounts at the lower end. This is not an agreed settlement.</p><h2>${report.receipts.length === 2 ? 'Challenge comparison' : 'Initial assessment'}</h2><table><thead><tr><th>Deduction</th><th>Claimed</th><th>Initial</th><th>Latest</th></tr></thead><tbody>${report.changes.map(d => `<tr><td>${esc(d.id)}: ${esc(d.description)}</td><td>${esc(money(d.amount_minor))}</td><td>${esc(d.before)}</td><td>${esc(d.after)}</td></tr>`).join('')}</tbody></table>${report.changes.map(d=>`<p><b>${esc(d.id)}:</b> ${esc(d.reason)}</p>`).join('')}<h2>Complete evidence and receipt history</h2><p>Includes self-attested evidence and all historical snapshots. Use your browser's Print → Save as PDF to retain a printable copy.</p><pre>${esc(JSON.stringify(report, null, 2))}</pre><small>Report SHA-256: ${esc(report.report_hash)}</small></body></html>`;
}
