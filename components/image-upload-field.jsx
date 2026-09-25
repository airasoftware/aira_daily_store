'use client';

import { useState } from 'react';

const MAX_BYTES = 4 * 1024 * 1024;

export function ImageUploadField({ label, name, value, onChange, onBusyChange, required = false, inline = false }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) { setError('Ukuran gambar maksimal 4 MB.'); return; }
    setUploading(true); onBusyChange(1); setError('');
    try {
      const form = new FormData();
      form.set('file', file);
      const response = await fetch('/api/admin/product-images', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal mengunggah gambar.');
      onChange(result.url);
    } catch (cause) { setError(cause.message); }
    finally { setUploading(false); onBusyChange(-1); }
  }

  return <div className={`image-upload-field${inline ? ' is-inline' : ''}`}><div className="image-upload-inputs"><label>{label}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={uploading} /></label><label>URL gambar<input name={name} type="url" required={required} maxLength="1000" value={value} onChange={event => onChange(event.target.value)} placeholder="https://..." /></label></div><small>JPG, PNG, atau WebP. Maksimal 4 MB.</small>{uploading && <p role="status">Mengunggah gambar...</p>}{error && <p className="admin-error" role="alert">{error}</p>}{value && <img className="editor-preview" src={value} alt="Pratinjau gambar produk" />}</div>;
}
