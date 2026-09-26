'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

function blankLine(key = crypto.randomUUID()) { return { key, accountId: '', description: '', debit: '', credit: '' }; }

export function FinanceJournalForm({ accounts, defaultDate }) {
  const router = useRouter();
  const [lines, setLines] = useState(() => [blankLine('initial-debit'), blankLine('initial-credit')]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  function update(key, field, value) { setLines(current => current.map(line => line.key === key ? { ...line, [field]: value } : line)); }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch('/api/admin/finance/journals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryDate: data.get('entryDate'), description: data.get('description'), lines: lines.map(({ accountId, description, debit, credit }) => ({ accountId, description, debit: Number(debit || 0), credit: Number(credit || 0) })) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Jurnal belum dapat disimpan.');
      setLines([blankLine(), blankLine()]); form.reset(); router.refresh();
    } catch (cause) { setError(cause.message); } finally { setSaving(false); }
  }
  const debit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const credit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  return <form className="finance-entry-form" onSubmit={submit}><div className="finance-entry-head"><label>Tanggal<input type="date" name="entryDate" required defaultValue={defaultDate} /></label><label>Keterangan<input name="description" required maxLength="500" placeholder="Contoh: Pembayaran listrik September" /></label></div><div className="finance-entry-lines">{lines.map((line, index) => <div className="finance-entry-line" key={line.key}><span>{index + 1}</span><select required value={line.accountId} onChange={event => update(line.key, 'accountId', event.target.value)}><option value="">Pilih akun</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.code} · {account.name}</option>)}</select><input value={line.description} onChange={event => update(line.key, 'description', event.target.value)} placeholder="Catatan baris (opsional)" maxLength="300" /><input aria-label={`Debit baris ${index + 1}`} type="number" min="0" step="1" value={line.debit} onChange={event => update(line.key, 'debit', event.target.value)} placeholder="Debit" /><input aria-label={`Kredit baris ${index + 1}`} type="number" min="0" step="1" value={line.credit} onChange={event => update(line.key, 'credit', event.target.value)} placeholder="Kredit" />{lines.length > 2 && <button type="button" onClick={() => setLines(current => current.filter(item => item.key !== line.key))}>Hapus</button>}</div>)}</div><div className="finance-entry-footer"><button type="button" className="admin-secondary" onClick={() => setLines(current => [...current, blankLine()])}>+ Tambah baris</button><span>Total debit <strong>{debit.toLocaleString('id-ID')}</strong> · kredit <strong>{credit.toLocaleString('id-ID')}</strong></span><button className="admin-primary" disabled={saving || debit <= 0 || debit !== credit}>{saving ? 'Menyimpan...' : 'Simpan jurnal'}</button></div>{error && <p className="admin-error" role="alert">{error}</p>}</form>;
}
