import test from 'node:test';
import assert from 'node:assert/strict';
import { orderPaymentLines, parseManualJournal } from '../lib/accounting.js';
import { buildLedgerReport, financePeriod, jakartaDayAfter, jakartaDayStart } from '../lib/finance.js';

test('periode keuangan memakai bulan berjalan di zona Jakarta', () => {
  const period = financePeriod({}, new Date('2026-09-26T02:00:00Z'));
  assert.deepEqual(period, { start: '2026-09-01', end: '2026-09-26', adjusted: false });
  assert.equal(jakartaDayStart(period.start).toISOString(), '2026-08-31T17:00:00.000Z');
  assert.equal(jakartaDayAfter(period.end).toISOString(), '2026-09-26T17:00:00.000Z');
});

test('jurnal manual wajib double-entry seimbang', () => {
  const valid = parseManualJournal({ entryDate: '2026-09-26', description: 'Setoran modal', lines: [
    { accountId: '1', debit: 500000, credit: 0 }, { accountId: '4', debit: 0, credit: 500000 },
  ] });
  assert.equal(valid.data.total, 500000);
  assert.match(parseManualJournal({ entryDate: '2026-09-26', description: 'Tidak seimbang', lines: [
    { accountId: '1', debit: 500000, credit: 0 }, { accountId: '4', debit: 0, credit: 400000 },
  ] }).error, /debit dan kredit harus sama/i);
  assert.match(parseManualJournal({ entryDate: '2026-13-40', description: 'Tanggal salah', lines: [
    { accountId: '1', debit: 1, credit: 0 }, { accountId: '4', debit: 0, credit: 1 },
  ] }).error, /tanggal jurnal tidak valid/i);
});

test('ledger menghasilkan neraca saldo, laba rugi, dan neraca seimbang', () => {
  const accounts = [
    { id: 1, code: '1000', name: 'Kas', type: 'asset', normal_balance: 'debit' },
    { id: 2, code: '1100', name: 'Persediaan', type: 'asset', normal_balance: 'debit' },
    { id: 3, code: '3000', name: 'Modal', type: 'equity', normal_balance: 'credit' },
    { id: 4, code: '4000', name: 'Penjualan', type: 'revenue', normal_balance: 'credit' },
    { id: 5, code: '5000', name: 'HPP', type: 'expense', normal_balance: 'debit' },
  ];
  const periodLines = [
    { id: 1, journal_entry_id: 1, account_id: 1, debit: 1000000, credit: 0 },
    { id: 2, journal_entry_id: 1, account_id: 3, debit: 0, credit: 1000000 },
    { id: 3, journal_entry_id: 2, account_id: 1, debit: 300000, credit: 0 },
    { id: 4, journal_entry_id: 2, account_id: 4, debit: 0, credit: 300000 },
    { id: 5, journal_entry_id: 2, account_id: 5, debit: 120000, credit: 0 },
    { id: 6, journal_entry_id: 2, account_id: 2, debit: 0, credit: 120000 },
  ];
  const closing = [
    { account_id: 1, debit: 1300000, credit: 0 }, { account_id: 2, debit: 0, credit: 120000 },
    { account_id: 3, debit: 0, credit: 1000000 }, { account_id: 4, debit: 0, credit: 300000 },
    { account_id: 5, debit: 120000, credit: 0 },
  ];
  const report = buildLedgerReport(accounts, periodLines, closing);
  assert.equal(report.debitTotal, report.creditTotal);
  assert.equal(report.periodProfit, 180000);
  assert.equal(report.totalAssets, 1180000);
  assert.equal(report.totalLiabilities + report.totalEquity, 1180000);
});

test('pesanan dibayar membentuk jurnal kas, pendapatan, HPP, dan persediaan yang seimbang', () => {
  const lines = orderPaymentLines({ subtotal: '100000', total: '110000', cogs: '60000' });
  assert.deepEqual(lines.map(line => line.code), ['1000', '4000', '4100', '5000', '1100']);
  assert.equal(lines.reduce((sum, line) => sum + line.debit, 0), 170000);
  assert.equal(lines.reduce((sum, line) => sum + line.credit, 0), 170000);
  assert.throws(() => orderPaymentLines({ subtotal: 100000, total: 90000, cogs: 0 }), /INVALID_ORDER_ACCOUNTING_VALUES/);
});
