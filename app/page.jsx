import Link from 'next/link';
import { FigmaIcon } from '../components/figma-icon';
import { ProductCard } from '../components/product-card';
import { getProducts } from '../lib/products';

export const dynamic = 'force-dynamic';

const categoryCards = [
  { title: 'Sprei & Kamar', description: 'Untuk ruang istirahat yang nyaman.', href: '/shop?category=Sprei%20%26%20Kamar', className: 'bedroom' },
  { title: 'Baju Anak', description: 'Pilihan pakaian untuk si kecil.', href: '/shop?category=Baju%20Anak', className: 'children' },
  { title: 'Baju Dewasa', description: 'Pakaian untuk aktivitas harian.', href: '/shop?category=Baju%20Dewasa', className: 'adults' },
];

const promiseItems = ['PILIHAN UNTUK RUMAH', 'PAKAIAN UNTUK KELUARGA', 'BELANJA LEBIH PRAKTIS'];

export default async function Home() {
  const homeProducts = await getProducts({ homepage: true });
  const featured = homeProducts.filter(product => product.is_featured);
  const newest = homeProducts.filter(product => product.is_new);

  return <main>
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow light"><FigmaIcon name="star" /> AIRA DAILY STORE</span>
        <h1>Kebutuhan rumah,<br />gaya keluarga,<br /><em>semua di sini.</em></h1>
        <p>Temukan sprei, pakaian anak, pakaian dewasa, dan pilihan harian lainnya dalam satu toko.</p>
        <Link href="/shop" className="button light-button">Belanja semua produk <FigmaIcon name="arrow-up-right" className="inline-arrow" /></Link>
      </div>
      <div className="hero-stamp">RUMAH<br />KELUARGA<br />HARIAN <span><FigmaIcon name="star" /></span></div>
    </section>
    <div className="promise-bar"><div className="marquee-track">{[0, 1].map(copy => <div className="marquee-group" aria-hidden={copy === 1 ? 'true' : undefined} key={copy}>{promiseItems.map(item => <span key={item}><FigmaIcon name="star" /> {item}</span>)}</div>)}</div></div>
    <section className="section category-section">
      <div className="section-head"><div><span className="eyebrow">CARI SESUAI KEBUTUHAN</span><h2>Jelajahi kategori<span className="orange-dot">.</span></h2></div><Link href="/shop" className="text-link">Semua produk <FigmaIcon name="arrow-up-right" className="inline-arrow" /></Link></div>
      <div className="category-grid">{categoryCards.map((category, index) => <Link key={category.title} href={category.href} className={`category-card ${category.className}`}><span className="category-number">0{index + 1}</span><div><h3>{category.title}</h3><p>{category.description}</p></div><FigmaIcon name="arrow-right" /></Link>)}</div>
    </section>
    <section className="section featured-section">
      <div className="section-head"><div><span className="eyebrow">PILIHAN FAVORIT</span><h2>Sering dipilih<span className="orange-dot">.</span></h2></div><Link href="/shop" className="text-link">Lihat semua <FigmaIcon name="arrow-up-right" className="inline-arrow" /></Link></div>
      <div className="product-grid">{featured.map(product => <ProductCard key={product.id} product={product} />)}</div>
    </section>
    <section className="story-band"><div><span className="eyebrow light">SATU TOKO, BANYAK KEBUTUHAN</span><h2>Temukan yang pas<br />untuk sehari-hari.</h2><p>Dari kamar tidur hingga lemari keluarga, jelajahi pilihan produk sesuai kebutuhanmu.</p><Link href="/shop" className="button light-button">Jelajahi katalog <FigmaIcon name="arrow-up-right" className="inline-arrow" /></Link></div></section>
    <section className="section new-section">
      <div className="section-head"><div><span className="eyebrow">BARU DI TOKO</span><h2>Pilihan terbaru<span className="orange-dot">.</span></h2></div><Link href="/shop" className="text-link">Lihat semua <FigmaIcon name="arrow-up-right" className="inline-arrow" /></Link></div>
      <div className="product-grid">{newest.map(product => <ProductCard key={product.id} product={product} />)}</div>
    </section>
    <section className="closing"><FigmaIcon name="star" /><h2>Belanja kebutuhan harian lebih mudah.</h2><p>Jelajahi seluruh produk dan pilih yang sesuai untuk rumah serta keluarga.</p><Link href="/shop" className="button dark-button">Lihat katalog <FigmaIcon name="arrow-up-right" className="inline-arrow" /></Link></section>
  </main>;
}
