'use client';

import Link from 'next/link';
import { useCart } from './cart-provider';

export function Header() {
  const { count, ready } = useCart();
  return <header className="header"><div className="header-inner"><Link href="/" className="logo" aria-label="Aira Daily Store, beranda"><span className="logo-mark">✳</span>aira<span>daily</span><small>OUTDOOR KIDS</small></Link><nav className="desktop-nav" aria-label="Navigasi utama"><Link href="/">Beranda</Link><Link href="/shop">Semua Produk</Link><Link href="/shop?category=Pakaian">Pakaian</Link><Link href="/shop?category=Tas">Tas</Link><Link href="/shop?category=Aksesori">Aksesori</Link></nav><div className="header-actions"><Link href="/shop" aria-label="Cari produk" className="icon-link">⌕</Link><Link href="/cart" aria-label={`Keranjang, ${ready ? count : 0} barang`} className="cart-link"><span>♧</span><b>{ready ? count : 0}</b></Link></div></div><nav className="mobile-nav" aria-label="Navigasi ponsel"><Link href="/">⌂<span>Beranda</span></Link><Link href="/shop">▦<span>Belanja</span></Link><Link href="/cart">♧<span>Keranjang{ready && count ? ` (${count})` : ''}</span></Link></nav></header>;
}
