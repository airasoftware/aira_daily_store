'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function FinanceFilterForm({ view, start, end, adjusted }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const query = new URLSearchParams({
      view,
      from: String(data.get('from') || ''),
      to: String(data.get('to') || ''),
    });
    startTransition(() => router.push(`/admin/finance?${query}`));
  }

  return <form className="finance-filter" onSubmit={submit}>
    <label>Dari tanggal<input type="date" name="from" defaultValue={start} disabled={pending} /></label>
    <label>Sampai tanggal<input type="date" name="to" defaultValue={end} disabled={pending} /></label>
    <button className="admin-primary" type="submit" disabled={pending}>{pending ? 'Memuat...' : 'Tampilkan'}</button>
    {adjusted && <small>Tanggal awal disesuaikan agar tidak melewati tanggal akhir.</small>}
  </form>;
}
