'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useCart } from './cart-provider';
import { FigmaIcon } from './figma-icon';

export function Header() {
  const { count, ready } = useCart();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) { setResults([]); setSearching(false); return undefined; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        const data = await response.json();
        setResults(response.ok ? data.products : []);
      } catch (error) {
        if (error.name !== 'AbortError') setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  function submitSearch(event) {
    event.preventDefault();
    const value = query.trim();
    if (value) window.location.href = `/shop?q=${encodeURIComponent(value)}`;
  }

  function formatPrice(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  }

  return <header className="header">
    <div className="header-inner">
      <Link href="/" className="logo" aria-label="Aira Daily Store, beranda"><img className="brand-logo" src="/aira-daily-logo.png" alt="Aira Daily" /></Link>
      <nav className="desktop-nav" aria-label="Navigasi utama">
        <Link href="/">Beranda</Link>
        <Link href="/shop">Semua Produk</Link>
        <Link href="/shop?category=Sprei%20%26%20Kamar">Sprei & Kamar</Link>
        <Link href="/shop?category=Baju%20Anak">Baju Anak</Link>
        <Link href="/shop?category=Baju%20Dewasa">Baju Dewasa</Link>
      </nav>
      <div className="header-actions">
        <div className="header-search" ref={searchRef}>
          <form className="header-search-form" onSubmit={submitSearch} role="search">
            <FigmaIcon name="search" />
            <input value={query} onChange={event => setQuery(event.target.value)} aria-label="Cari produk" placeholder="Cari produk" autoComplete="off" />
          </form>
          {query.trim().length >= 2 && <div className="search-results" role="listbox" aria-label="Hasil pencarian produk">
            {searching ? <p className="search-status">Mencari produk...</p> : results.length ? results.map(product => <Link key={product.id} href={`/products/${product.slug}`} className="search-result" onClick={() => setQuery('')} role="option"><img src={product.image_url} alt="" /><span><strong>{product.name}</strong><small>{product.category} · {formatPrice(product.price)}</small></span></Link>) : <p className="search-status">Produk tidak ditemukan.</p>}
            {!searching && results.length > 0 && <Link href={`/shop?q=${encodeURIComponent(query.trim())}`} className="search-all" onClick={() => setQuery('')}>Lihat semua hasil</Link>}
          </div>}
        </div>
        <Link href="/cart" aria-label={`Keranjang, ${ready ? count : 0} barang`} className="cart-link"><FigmaIcon name="cart" /><b>{ready ? count : 0}</b></Link>
      </div>
    </div>
    <nav className="mobile-nav" aria-label="Navigasi ponsel">
      <Link href="/"><FigmaIcon name="home" /><span>Beranda</span></Link>
      <Link href="/shop"><FigmaIcon name="shop" /><span>Belanja</span></Link>
      <Link href="/cart"><FigmaIcon name="cart" /><span>Keranjang{ready && count ? ` (${count})` : ''}</span></Link>
    </nav>
  </header>;
}
