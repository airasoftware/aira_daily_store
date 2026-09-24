import Link from 'next/link';
import { FigmaIcon } from '../components/figma-icon';

export default function NotFound() { return <main className="page-shell"><div className="empty-state"><h1>Halaman tidak ditemukan</h1><p>Produk atau halaman yang dicari tidak tersedia.</p><Link href="/shop" className="button dark-button">Lihat koleksi <FigmaIcon name="arrow-up-right" className="inline-arrow" /></Link></div></main>; }
