import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildReport, reportHTML } from '../src/report.js';
import { hashRecord } from '../src/lifecycle.js';
const load = name => JSON.parse(fs.readFileSync(new URL('../evidence/' + name, import.meta.url)));
const receipts = [1,2].map(i => load(`depositfair-lifecycle-v12-receipt-${i}.json`));
const record = { id: receipts[0].case_id, claim: receipts[0].evidence.claim, claim_hash: receipts[0].claim_hash, attempts: 2, head: receipts[1].decision_hash, stage: 'ASSESSED', outcome: receipts[1].assessment.outcome };
const deployment = { network: 'studionet', chainId: 61999, address: '0x2cDd9704206261998586023a5F36bB45199e82F8' };
test('full report verifies genuine two-assessment on-chain history and reserves unresolved deductions', () => {
  const report = buildReport(record, receipts, deployment);
  assert.deepEqual(report.refund, {minimum_minor:80000, maximum_minor:100000});
  assert.equal(report.changes.length, 2);
  assert.ok(report.changes.every(d => d.after === 'UNRESOLVED'));
  const { report_hash, ...body } = report;
  assert.equal(report_hash, hashRecord(body));
  assert.equal(report.source.address, deployment.address);
});
test('initial report works before challenge and has no fabricated comparison delta', () => {
  const first = {...record, attempts: 1, head:receipts[0].decision_hash, outcome:receipts[0].assessment.outcome};
  const report = buildReport(first, receipts.slice(0,1), deployment);
  assert.equal(report.supported_change_minor, null);
});
test('missing, reordered, substituted or tampered receipts cannot produce a verified report', () => {
  assert.throws(() => buildReport(record, receipts.slice(0,1), deployment));
  assert.throws(() => buildReport(record, [...receipts].reverse(), deployment));
  for (const change of [r => r[0].assessment.reason = 'tampered', r => r[1].previous_hash = '0'.repeat(64), r => r[0].case_id = 'other-case', r => r[0].evidence.claim.title = 'altered']) {
    const copy = structuredClone(receipts); change(copy);
    assert.throws(() => buildReport(record, copy, deployment));
  }
  assert.throws(() => buildReport({...record,head:'0'.repeat(64)}, receipts, deployment));
  assert.throws(() => buildReport({...record,outcome:'OTHER'}, receipts, deployment));
});
test('printable report escapes hostile text and contains no executable scripts', () => {
  const report = buildReport(record, receipts, deployment);
  report.case.claim.title = '<script>alert(1)</script>';
  const html = reportHTML(report);
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes("default-src 'none'"));
});
test('challenge comparison matches findings by item ID and computes supported amount change', () => {
  const copy = structuredClone(receipts);
  copy[1].assessment = {outcome:'PARTIALLY_SUPPORTED', supported_minor:8000, unsupported_minor:12000, unresolved_minor:0, reason:'New evidence', findings:[{id:'shelf',state:'SUPPORTED',reason:'Cost documented'},{id:'paint',state:'UNSUPPORTED',reason:'Ordinary wear'}]};
  delete copy[1].decision_hash;
  copy[1].decision_hash = hashRecord(copy[1]);
  const report = buildReport({...record,head:copy[1].decision_hash,outcome:'PARTIALLY_SUPPORTED'},copy,deployment);
  assert.equal(report.changes.find(d => d.id === 'shelf').after, 'SUPPORTED');
  assert.equal(report.supported_change_minor,8000);
  assert.deepEqual(report.refund,{minimum_minor:92000,maximum_minor:92000});
});
