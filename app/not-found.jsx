import Link from 'next/link';

export default function NotFound() { return <main className="page-shell"><div className="empty-state"><h1>Halaman tidak ditemukan</h1><p>Produk atau halaman yang dicari tidak tersedia.</p><Link href="/shop" className="button dark-button">Lihat koleksi ↗</Link></div></main>; }
