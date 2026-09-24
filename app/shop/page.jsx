import { ProductCard } from '../../components/product-card';
import { getProducts } from '../../lib/products';

export const dynamic = 'force-dynamic';

export default async function Shop({ searchParams }) {
  const params = await searchParams;
  const category = ['Pakaian', 'Tas', 'Aksesori'].includes(params.category) ? params.category : 'Semua';
  const search = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const sort = ['price-asc', 'price-desc'].includes(params.sort) ? params.sort : '';
  const products = await getProducts({ category, search, sort });
  return <main className="page-shell"><div className="page-intro"><span className="eyebrow">KOLEKSI AIRA DAILY</span><h1>Siap bermain,<br /><em>siap menjelajah.</em></h1><p>Temukan pakaian dan perlengkapan untuk setiap cerita si kecil.</p></div><form className="shop-tools" action="/shop"><label className="search-box"><span>⌕</span><input name="q" type="search" placeholder="Cari produk..." defaultValue={search} aria-label="Cari produk" /></label><select name="category" defaultValue={category} aria-label="Kategori"><option>Semua</option><option>Pakaian</option><option>Tas</option><option>Aksesori</option></select><select name="sort" defaultValue={sort} aria-label="Urutkan"><option value="">Urutan awal</option><option value="price-asc">Harga termurah</option><option value="price-desc">Harga termahal</option></select><button className="button dark-button" type="submit">Terapkan</button></form><p className="result-count">{products.length} produk ditemukan</p>{products.length ? <div className="product-grid shop-grid">{products.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><h2>Produk tidak ditemukan</h2><p>Coba kata kunci atau kategori lain.</p></div>}</main>;
}
