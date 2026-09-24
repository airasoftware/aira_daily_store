'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function OrderStatus({ id, orderNumber, status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (status !== 'pending') return null;
  async function update(nextStatus) {
    if (nextStatus === 'cancelled' && !window.confirm(`Batalkan pesanan ${orderNumber}? Stok akan dikembalikan.`)) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/admin/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal mengubah status.');
      router.refresh();
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }
  return <div className="order-actions"><button disabled={busy} onClick={() => update('paid')} className="admin-primary">Tandai dibayar</button><button disabled={busy} onClick={() => update('cancelled')} className="admin-secondary">Batalkan pesanan</button>{error && <p className="admin-inline-error" role="alert">{error}</p>}</div>;
}
