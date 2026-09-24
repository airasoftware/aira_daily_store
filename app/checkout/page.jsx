'use client';

import Link from 'next/link';
import { FigmaIcon } from '../../components/figma-icon';
import { useState } from 'react';
import { useCart } from '../../components/cart-provider';

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export default function CheckoutPage() {
  const { items, ready, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const customer = Object.fromEntries(form.entries());
    try {
      const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...customer, items: items.map(item => ({ productId: item.id, quantity: item.quantity })) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Pesanan gagal dibuat. Coba lagi.');
      setOrder(result);
      clear();
    } catch (cause) { setError(cause.message); }
    finally { setSubmitting(false); }
  }

  if (order) return <main className="page-shell"><div className="success-card"><span><FigmaIcon name="document" /></span><h1>Pesanan diterima!</h1><p>Nomor pesanan <strong>#{order.orderId}</strong> telah tersimpan. Subtotal produk: <strong>{money(order.total)}</strong>.</p><p>Kami akan menghubungi Anda melalui nomor telepon yang dicantumkan untuk konfirmasi biaya pengiriman dan pembayaran.</p><Link href="/shop" className="button dark-button">Lanjut belanja <FigmaIcon name="arrow-up-right" className="inline-arrow" /></Link></div></main>;
  return <main className="page-shell checkout-page"><div className="page-intro compact"><span className="eyebrow">LANGKAH TERAKHIR</span><h1>Checkout<span className="orange-dot">.</span></h1><p>Isi alamat dan kontak agar kami dapat menyiapkan pesananmu.</p></div>{!ready ? <p>Memuat keranjang...</p> : !items.length ? <div className="empty-state"><h2>Belum ada produk di keranjang</h2><Link href="/shop" className="button dark-button">Belanja dulu <FigmaIcon name="arrow-up-right" className="inline-arrow" /></Link></div> : <form onSubmit={submit} className="checkout-grid"><section className="checkout-form"><h2>Informasi pengiriman</h2><div className="form-grid"><label>Nama lengkap<input name="customerName" required maxLength="120" autoComplete="name" /></label><label>Email<input name="email" type="email" required maxLength="254" autoComplete="email" /></label><label>Nomor telepon<input name="phone" type="tel" required maxLength="30" autoComplete="tel" /></label><label>Kota / Kabupaten<input name="city" required maxLength="100" autoComplete="address-level2" /></label><label className="wide">Alamat lengkap<textarea name="address" required maxLength="500" rows="3" autoComplete="street-address" /></label><label>Kode pos<input name="postalCode" required maxLength="12" autoComplete="postal-code" /></label><label className="wide">Catatan (opsional)<textarea name="notes" maxLength="500" rows="2" placeholder="Petunjuk alamat atau pesan lain" /></label></div><div className="checkout-notice">Pembayaran dan biaya pengiriman akan dikonfirmasi setelah pesanan diterima.</div>{error && <p className="form-error" role="alert">{error}</p>}<button className="button dark-button" disabled={submitting}>{submitting ? 'Menyimpan pesanan...' : <>Buat pesanan <FigmaIcon name="arrow-up-right" className="inline-arrow" /></>}</button></section><aside className="summary"><h2>Pesananmu</h2>{items.map(item => <div className="checkout-line" key={item.id}><span>{item.name} <small>× {item.quantity}</small></span><strong>{money(item.price * item.quantity)}</strong></div>)}<div className="total-line"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p>Jumlah final dihitung berdasarkan harga produk terbaru saat pesanan dibuat.</p></aside></form>}</main>;
}
