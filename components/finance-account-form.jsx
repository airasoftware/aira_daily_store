'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function FinanceAccountForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    const form = event.currentTarget;
    try {
      const response = await fetch('/api/admin/finance/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Akun belum dapat disimpan.');
      form.reset(); router.refresh();
    } catch (cause) { setError(cause.message); } finally { setSaving(false); }
  }
  return <form className="finance-account-form" onSubmit={submit}><label>Kode akun<input name="code" inputMode="numeric" pattern="[0-9]{4,10}" required placeholder="Contoh: 6100" /></label><label>Nama akun<input name="name" maxLength="120" required placeholder="Contoh: Beban listrik" /></label><label>Kelompok<select name="type" defaultValue="expense"><option value="asset">Aset</option><option value="liability">Liabilitas</option><option value="equity">Ekuitas</option><option value="revenue">Pendapatan</option><option value="expense">Beban</option></select></label><button className="admin-primary" disabled={saving}>{saving ? 'Menyimpan...' : '+ Tambah akun'}</button>{error && <p className="admin-error" role="alert">{error}</p>}</form>;
}
