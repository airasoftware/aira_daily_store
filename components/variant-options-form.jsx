'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function VariantOptionsForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch('/api/admin/variant-options', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(data)) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      form.reset(); router.refresh();
    } catch (cause) { setError(cause.message); } finally { setSaving(false); }
  }
  return <form onSubmit={submit} className="variant-option-form"><label>Jenis<select name="kind"><option value="color">Warna</option><option value="size">Ukuran</option></select></label><label>Nama pilihan<input name="name" required maxLength="80" placeholder="Contoh: Biru atau XL" /></label><button className="admin-primary" disabled={saving}>{saving ? 'Menyimpan...' : '+ Tambah pilihan'}</button>{error && <p className="admin-error" role="alert">{error}</p>}</form>;
}
