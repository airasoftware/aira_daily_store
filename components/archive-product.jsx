'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ArchiveProduct({ id, name }) {
  const router = useRouter();
  const [error, setError] = useState('');
  async function archive() {
    if (!window.confirm(`Arsipkan ${name}? Produk tidak akan tampil di toko.`)) return;
    const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (!response.ok) { const result = await response.json(); setError(result.error || 'Gagal mengarsipkan.'); return; }
    router.refresh();
  }
  return <><button className="table-action-button" onClick={archive}>Arsipkan</button>{error && <span className="admin-inline-error">{error}</span>}</>;
}
