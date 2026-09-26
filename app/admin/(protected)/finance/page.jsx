import { FinanceAccountForm } from '../../../../components/finance-account-form';
import { FinanceFilterForm } from '../../../../components/finance-filter-form';
import { FinanceJournalForm } from '../../../../components/finance-journal-form';
import { FinanceTabLink } from '../../../../components/finance-tab-link';
import { getPool } from '../../../../lib/db';
import { rupiah } from '../../../../lib/products';
import { buildLedgerReport, financePeriod } from '../../../../lib/finance';

const views = [
  ['report', 'Ringkasan'], ['journal', 'Jurnal Umum'], ['ledger', 'Buku Besar'],
  ['trial-balance', 'Neraca Saldo'], ['balance-sheet', 'Neraca'],
  ['income-statement', 'Laba Rugi'], ['accounts', 'Daftar Akun'],
];
const typeLabels = { asset: 'Aset', liability: 'Liabilitas', equity: 'Ekuitas', revenue: 'Pendapatan', expense: 'Beban' };

function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00Z`));
}
function entryNumber(id) { return `JU-${String(id).padStart(6, '0')}`; }
function rowAmount(value) { return Number(value) ? rupiah(Number(value)) : '—'; }

function Statement({ title, subtitle, groups, totalLabel, total }) {
  return <section className="admin-section finance-report"><div className="admin-section-title"><h2>{title}</h2><span>{subtitle}</span></div><div className="finance-statement">{groups.flatMap(group => [<div className="statement-total" key={`${group.label}-head`}><span>{group.label}</span><strong /></div>, ...group.rows.map(account => <div key={account.id}><span>{account.code} · {account.name}</span><strong>{rupiah(account.balance)}</strong></div>), <div className="statement-subtotal" key={`${group.label}-total`}><span>Total {group.label.toLowerCase()}</span><strong>{rupiah(group.total)}</strong></div>])}<div className="statement-grand-total"><span>{totalLabel}</span><strong>{rupiah(total)}</strong></div></div></section>;
}

export default async function FinancePage({ searchParams }) {
  const params = await searchParams;
  const period = financePeriod(params);
  const activeView = views.some(([key]) => key === params.view) ? params.view : 'report';
  const pool = getPool();
  const { rows: accounts } = await pool.query('SELECT id, code, name, type, normal_balance, is_system, is_active FROM accounts WHERE is_active = TRUE ORDER BY code');
  const { rows: [data] } = await pool.query(`WITH period_lines AS (
      SELECT jl.id, jl.journal_entry_id, jl.account_id, jl.description AS line_description, jl.debit, jl.credit,
        je.entry_date, je.description AS entry_description, je.source_type, je.source_id, a.code, a.name AS account_name
      FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_entry_id JOIN accounts a ON a.id = jl.account_id
      WHERE je.entry_date >= $1::date AND je.entry_date <= $2::date
      ORDER BY je.entry_date DESC, je.id DESC, jl.id
    ), closing AS (
      SELECT jl.account_id, COALESCE(SUM(jl.debit),0)::bigint AS debit, COALESCE(SUM(jl.credit),0)::bigint AS credit
      FROM journal_lines jl JOIN journal_entries je ON je.id=jl.journal_entry_id WHERE je.entry_date <= $2::date GROUP BY jl.account_id
    ), opening AS (
      SELECT jl.account_id, COALESCE(SUM(jl.debit),0)::bigint AS debit, COALESCE(SUM(jl.credit),0)::bigint AS credit
      FROM journal_lines jl JOIN journal_entries je ON je.id=jl.journal_entry_id WHERE je.entry_date < $1::date GROUP BY jl.account_id
    ) SELECT COALESCE((SELECT json_agg(period_lines) FROM period_lines),'[]'::json) AS period_lines,
      COALESCE((SELECT json_agg(closing) FROM closing),'[]'::json) AS closing,
      COALESCE((SELECT json_agg(opening) FROM opening),'[]'::json) AS opening`, [period.start, period.end]);
  const report = buildLedgerReport(accounts, data.period_lines, data.closing, data.opening);
  const query = `from=${period.start}&to=${period.end}`;
  const retainedEarnings = { id: 'current-earnings', code: '—', name: 'Laba berjalan', balance: report.currentEarnings };

  return <main className="admin-main finance-page">
    <div className="admin-heading"><div><span className="admin-eyebrow">PEMBUKUAN</span><h1>Keuangan toko<span>.</span></h1><p>Ledger double-entry dari penjualan otomatis dan jurnal manual.</p></div></div>
    <div className="finance-tabs" aria-label="Jenis laporan">{views.map(([key, label]) => <FinanceTabLink key={key} active={activeView === key} href={`/admin/finance?view=${key}&${query}`}>{label}</FinanceTabLink>)}</div>
    {activeView !== 'accounts' && <FinanceFilterForm key={`${activeView}-${period.start}-${period.end}`} view={activeView} start={period.start} end={period.end} adjusted={period.adjusted} />}

    {activeView === 'report' && <><div className="finance-stat-grid"><div><span>Pendapatan</span><strong>{rupiah(report.periodRevenue)}</strong><small>Periode terpilih</small></div><div><span>Total beban</span><strong>{rupiah(report.periodExpense)}</strong><small>Termasuk HPP</small></div><div><span>Laba bersih</span><strong>{rupiah(report.periodProfit)}</strong><small>Pendapatan dikurangi beban</small></div><div><span>Saldo kas</span><strong>{rupiah(report.cash)}</strong><small>Sampai {formatDate(period.end)}</small></div></div><section className="admin-section finance-overview"><div className="admin-section-title"><h2>Posisi pembukuan</h2><span>{formatDate(period.start)} – {formatDate(period.end)}</span></div><div className="finance-overview-grid"><div><span>Jurnal periode ini</span><strong>{report.entryCount}</strong></div><div><span>Nilai persediaan</span><strong>{rupiah(report.inventory)}</strong></div><div><span>Total aset</span><strong>{rupiah(report.totalAssets)}</strong></div><div><span>Debit / kredit</span><strong>{rupiah(report.debitTotal)}</strong></div></div></section><section className="admin-section"><div className="admin-section-title"><h2>Input jurnal manual</h2><span>Untuk beban, modal, pembelian, utang, dan koreksi</span></div><p className="finance-helper">Contoh: setoran modal = Debit Kas / Kredit Modal; bayar beban = Debit Beban / Kredit Kas; beli stok tunai = Debit Persediaan / Kredit Kas; beli stok tempo = Debit Persediaan / Kredit Utang Usaha.</p><FinanceJournalForm accounts={accounts} defaultDate={period.end} /></section></>}

    {activeView === 'journal' && <section className="admin-section finance-report"><div className="admin-section-title"><h2>Jurnal umum</h2><span>{formatDate(period.start)} – {formatDate(period.end)}</span></div>{report.periodLines.length ? <div className="admin-table-wrap"><table className="admin-table finance-journal"><thead><tr><th>Tanggal</th><th>Nomor / Sumber</th><th>Keterangan / Akun</th><th>Debit</th><th>Kredit</th></tr></thead><tbody>{report.periodLines.map((line, index) => { const first = index === 0 || report.periodLines[index - 1].journal_entry_id !== line.journal_entry_id; return <tr key={line.id}><td>{first ? formatDate(line.entry_date) : ''}</td><td>{first ? <>{entryNumber(line.journal_entry_id)}<small>{line.source_type === 'order_payment' ? `Pesanan #${line.source_id}` : 'Manual'}</small></> : ''}</td><td><span>{first ? line.entry_description : line.line_description}</span><strong className={Number(line.credit) ? 'journal-credit' : ''}>{line.code} · {line.account_name}</strong></td><td>{rowAmount(line.debit)}</td><td>{rowAmount(line.credit)}</td></tr>; })}</tbody><tfoot><tr><th colSpan="3">Total</th><th>{rupiah(report.debitTotal)}</th><th>{rupiah(report.creditTotal)}</th></tr></tfoot></table></div> : <p className="admin-empty">Belum ada jurnal pada periode ini.</p>}</section>}

    {activeView === 'ledger' && <section className="finance-ledger-list">{report.accounts.filter(account => account.openingRaw || account.periodDebit || account.periodCredit).map(account => <article className="admin-section finance-ledger-card" key={account.id}><div className="admin-section-title"><h2>{account.code} · {account.name}</h2><span>Saldo akhir {rupiah(account.balance)}</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Tanggal</th><th>Jurnal</th><th>Keterangan</th><th>Debit</th><th>Kredit</th></tr></thead><tbody>{account.openingRaw !== 0 && <tr><td>{formatDate(period.start)}</td><td>—</td><td>Saldo awal</td><td>{account.openingRaw > 0 ? rupiah(account.openingRaw) : '—'}</td><td>{account.openingRaw < 0 ? rupiah(-account.openingRaw) : '—'}</td></tr>}{report.periodLines.filter(line => String(line.account_id) === String(account.id)).map(line => <tr key={line.id}><td>{formatDate(line.entry_date)}</td><td>{entryNumber(line.journal_entry_id)}</td><td>{line.line_description || line.entry_description}</td><td>{rowAmount(line.debit)}</td><td>{rowAmount(line.credit)}</td></tr>)}</tbody></table></div></article>)}</section>}

    {activeView === 'trial-balance' && <section className="admin-section finance-report"><div className="admin-section-title"><h2>Neraca saldo</h2><span>Per {formatDate(period.end)}</span></div><div className="admin-table-wrap"><table className="admin-table finance-journal"><thead><tr><th>Kode</th><th>Akun</th><th>Debit</th><th>Kredit</th></tr></thead><tbody>{report.accounts.filter(account => account.closingRaw !== 0).map(account => <tr key={account.id}><td>{account.code}</td><td>{account.name}</td><td>{account.closingRaw > 0 ? rupiah(account.closingRaw) : '—'}</td><td>{account.closingRaw < 0 ? rupiah(-account.closingRaw) : '—'}</td></tr>)}</tbody><tfoot><tr><th colSpan="2">Total</th><th>{rupiah(report.accounts.reduce((sum, account) => sum + Math.max(account.closingRaw, 0), 0))}</th><th>{rupiah(report.accounts.reduce((sum, account) => sum + Math.max(-account.closingRaw, 0), 0))}</th></tr></tfoot></table></div></section>}

    {activeView === 'balance-sheet' && <Statement title="Neraca" subtitle={`Per ${formatDate(period.end)}`} groups={[{ label: 'Aset', rows: report.assets, total: report.totalAssets }, { label: 'Liabilitas', rows: report.liabilities, total: report.totalLiabilities }, { label: 'Ekuitas', rows: [...report.equityAccounts, retainedEarnings], total: report.totalEquity }]} totalLabel="Total liabilitas dan ekuitas" total={report.totalLiabilities + report.totalEquity} />}
    {activeView === 'income-statement' && <Statement title="Laporan laba rugi" subtitle={`${formatDate(period.start)} – ${formatDate(period.end)}`} groups={[{ label: 'Pendapatan', rows: report.revenues.map(account => ({ ...account, balance: account.periodCredit - account.periodDebit })), total: report.periodRevenue }, { label: 'Beban', rows: report.expenses.map(account => ({ ...account, balance: account.periodDebit - account.periodCredit })), total: report.periodExpense }]} totalLabel="Laba bersih" total={report.periodProfit} />}

    {activeView === 'accounts' && <><section className="admin-section"><div className="admin-section-title"><h2>Tambah akun</h2><span>Saldo normal ditentukan otomatis dari kelompok</span></div><FinanceAccountForm /></section><section className="admin-section"><div className="admin-section-title"><h2>Daftar akun</h2><span>{accounts.length} akun aktif</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Kode</th><th>Nama akun</th><th>Kelompok</th><th>Saldo normal</th><th>Sumber</th></tr></thead><tbody>{accounts.map(account => <tr key={account.id}><td>{account.code}</td><td>{account.name}</td><td>{typeLabels[account.type]}</td><td>{account.normal_balance === 'debit' ? 'Debit' : 'Kredit'}</td><td>{account.is_system ? 'Sistem' : 'Buatan admin'}</td></tr>)}</tbody></table></div></section></>}

    <aside className="finance-note"><strong>Aturan audit</strong><p>Jurnal yang tersimpan tidak diubah atau dihapus dari CMS. Jika terjadi kesalahan, buat jurnal pembalik agar jejak pembukuan tetap utuh. Transaksi penjualan otomatis memakai harga modal yang disnapshot saat checkout.</p></aside>
  </main>;
}
