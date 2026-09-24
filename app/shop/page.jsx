import Link from 'next/link';
import { ProductCard } from '../../components/product-card';
import { getProducts } from '../../lib/products';
import { FigmaIcon } from '../../components/figma-icon';
import { mainCategories, legacyCategories, categories } from '../../lib/categories';

export const dynamic = 'force-dynamic';

export default async function Shop({ searchParams }) {
  const params = await searchParams;
  const category = categories.includes(params.category) ? params.category : 'Semua';
  const search = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const sort = ['price-asc', 'price-desc'].includes(params.sort) ? params.sort : '';
  const products = await getProducts({ category, search, sort });

  return <main className="page-shell">
    <div className="page-intro"><span className="eyebrow">KATALOG AIRA DAILY</span><h1>Semua kebutuhan,<br /><em>dalam satu toko.</em></h1><p>Jelajahi sprei, pakaian anak, pakaian dewasa, dan produk harian lainnya.</p></div>
    <form className="shop-tools" action="/shop">
      <label className="search-box"><FigmaIcon name="search" /><input name="q" type="search" placeholder="Cari nama produk..." defaultValue={search} aria-label="Cari produk" /></label>
      <label className="filter-field">Kategori<span className="select-field"><select name="category" defaultValue={category}><option value="Semua">Semua kategori</option><optgroup label="Kategori toko">{mainCategories.map(item => <option key={item}>{item}</option>)}</optgroup><optgroup label="Kategori produk lama">{legacyCategories.map(item => <option key={item}>{item}</option>)}</optgroup></select><FigmaIcon name="arrow-right" /></span></label>
      <label className="filter-field">Urutkan<span className="select-field"><select name="sort" defaultValue={sort}><option value="">Urutan awal</option><option value="price-asc">Harga termurah</option><option value="price-desc">Harga termahal</option></select><FigmaIcon name="arrow-right" /></span></label>
      <button className="button dark-button" type="submit">Terapkan</button>
    </form>
    <p className="result-count">{products.length} produk ditemukan{category !== 'Semua' ? ` dalam ${category}` : ''}</p>
    {products.length ? <div className="product-grid shop-grid">{products.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><h2>Belum ada produk yang cocok</h2><p>Coba kategori atau kata kunci lain untuk melihat pilihan yang tersedia.</p><Link href="/shop" className="button dark-button">Lihat semua produk</Link></div>}
  </main>;
}
