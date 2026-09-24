'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ProductForm({ product }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [slug, setSlug] = useState(product?.slug || '');
  function slugify(value) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError('');
    const form = new FormData(event.currentTarget);
    const body = { name: form.get('name'), slug, description: form.get('description'), category: form.get('category'), imageUrl: form.get('imageUrl'), price: form.get('price'), compareAtPrice: form.get('compareAtPrice'), stock: form.get('stock'), badge: form.get('badge'), featured: form.has('featured'), newest: form.has('newest'), active: form.has('active') };
    try {
      const response = await fetch(product ? `/api/admin/products/${product.id}` : '/api/admin/products', { method: product ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan produk.');
      router.push('/admin/products'); router.refresh();
    } catch (cause) { setError(cause.message); setSaving(false); }
  }
  return <form onSubmit={save} className="product-editor"><div className="editor-main"><section className="editor-card"><h2>Informasi produk</h2><div className="admin-field-grid"><label className="wide">Nama produk<input name="name" required maxLength="160" defaultValue={product?.name || ''} onChange={event => { if (!slugTouched) setSlug(slugify(event.target.value)); }} /></label><label className="wide">Slug URL<input name="slug" required maxLength="180" value={slug} onChange={event => { setSlugTouched(true); setSlug(slugify(event.target.value)); }} /><small>Huruf kecil, angka, dan tanda hubung.</small></label><label>Kategori<select name="category" defaultValue={product?.category || 'Pakaian'}><option>Pakaian</option><option>Tas</option><option>Aksesori</option></select></label><label>Label (opsional)<input name="badge" maxLength="40" defaultValue={product?.badge || ''} placeholder="Contoh: TERLARIS" /></label><label className="wide">Deskripsi<textarea name="description" rows="5" maxLength="2000" defaultValue={product?.description || ''} /></label></div></section><section className="editor-card"><h2>Harga & stok</h2><div className="admin-field-grid"><label>Harga jual (Rp)<input name="price" type="number" min="0" step="1" required defaultValue={product?.price ?? ''} /></label><label>Harga coret (Rp)<input name="compareAtPrice" type="number" min="0" step="1" defaultValue={product?.compare_at_price ?? ''} /></label><label>Stok<input name="stock" type="number" min="0" step="1" required defaultValue={product?.stock ?? 0} /></label></div></section></div><aside className="editor-side"><section className="editor-card"><h2>Gambar produk</h2><label>URL gambar<input name="imageUrl" type="url" required maxLength="1000" defaultValue={product?.image_url || ''} placeholder="https://..." /></label>{product?.image_url && <img className="editor-preview" src={product.image_url} alt={product.name} />}</section><section className="editor-card"><h2>Publikasi</h2><label className="admin-check"><input name="active" type="checkbox" defaultChecked={product?.is_active ?? true} /> Tampilkan di toko</label><label className="admin-check"><input name="featured" type="checkbox" defaultChecked={product?.is_featured ?? false} /> Best Seller</label><label className="admin-check"><input name="newest" type="checkbox" defaultChecked={product?.is_new ?? false} /> New Arrival</label></section>{error && <p className="admin-error" role="alert">{error}</p>}<div className="editor-buttons"><button className="admin-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan produk →'}</button><Link href="/admin/products">Batal</Link></div></aside></form>;
}
