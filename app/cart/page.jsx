'use client';

import Link from 'next/link';
import { useCart } from '../../components/cart-provider';

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export default function CartPage() {
  const { items, ready, update, remove } = useCart();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <main className="page-shell cart-page"><div className="page-intro compact"><span className="eyebrow">PILIHANMU</span><h1>Keranjang<span className="orange-dot">.</span></h1><p>Periksa lagi perlengkapan untuk petualangan berikutnya.</p></div>{!ready ? <p>Memuat keranjang...</p> : !items.length ? <div className="empty-state"><span>♧</span><h2>Keranjang masih kosong</h2><p>Yuk, temukan teman petualangan si kecil.</p><Link href="/shop" className="button dark-button">Mulai belanja ↗</Link></div> : <div className="checkout-grid"><div className="cart-list">{items.map(item => <article className="cart-item" key={item.id}><Link href={`/products/${item.slug}`}><img src={item.image_url} alt={item.name} /></Link><div><Link href={`/products/${item.slug}`} className="cart-name">{item.name}</Link><strong>{money(item.price)}</strong><div className="cart-controls"><div className="quantity"><button onClick={() => update(item.id, item.quantity - 1)} aria-label={`Kurangi ${item.name}`}>−</button><span>{item.quantity}</span><button onClick={() => update(item.id, item.quantity + 1)} aria-label={`Tambah ${item.name}`}>+</button></div><button className="remove-link" onClick={() => remove(item.id)}>Hapus</button></div></div><b>{money(item.price * item.quantity)}</b></article>)}</div><aside className="summary"><h2>Ringkasan belanja</h2><div><span>Subtotal ({items.length} jenis produk)</span><strong>{money(subtotal)}</strong></div><p>Harga akhir dan ketersediaan stok diperiksa kembali saat checkout. Pengiriman diatur setelah pesanan diterima.</p><Link href="/checkout" className="button dark-button full">Lanjut checkout <span>↗</span></Link><Link href="/shop" className="text-link">← Lanjut belanja</Link></aside></div>}</main>;
}
