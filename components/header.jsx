'use client';

import Link from 'next/link';
import { useCart } from './cart-provider';
import { FigmaIcon } from './figma-icon';

export function Header() {
  const { count, ready } = useCart();
  return <header className="header"><div className="header-inner"><Link href="/" className="logo" aria-label="Aira Daily Store, beranda"><span className="logo-mark">✳</span>aira<span>daily</span><small>OUTDOOR KIDS</small></Link><nav className="desktop-nav" aria-label="Navigasi utama"><Link href="/">Beranda</Link><Link href="/shop">Semua Produk</Link><Link href="/shop?category=Pakaian">Pakaian</Link><Link href="/shop?category=Tas">Tas</Link><Link href="/shop?category=Aksesori">Aksesori</Link></nav><div className="header-actions"><Link href="/shop" aria-label="Cari produk" className="icon-link"><FigmaIcon name="search" /></Link><Link href="/cart" aria-label={`Keranjang, ${ready ? count : 0} barang`} className="cart-link"><FigmaIcon name="cart" /><b>{ready ? count : 0}</b></Link></div></div><nav className="mobile-nav" aria-label="Navigasi ponsel"><Link href="/"><FigmaIcon name="home" /><span>Beranda</span></Link><Link href="/shop"><FigmaIcon name="shop" /><span>Belanja</span></Link><Link href="/cart"><FigmaIcon name="cart" /><span>Keranjang{ready && count ? ` (${count})` : ''}</span></Link></nav></header>;
}
