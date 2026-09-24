'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setLoading(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form.entries())) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal masuk.');
      router.push('/admin'); router.refresh();
    } catch (cause) { setError(cause.message); setLoading(false); }
  }
  return <form onSubmit={submit} className="admin-form"><label>Email<input name="email" type="email" autoComplete="username" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label>{error && <p className="admin-error" role="alert">{error}</p>}<button disabled={loading} className="admin-primary">{loading ? 'Memeriksa...' : 'Masuk →'}</button></form>;
}
