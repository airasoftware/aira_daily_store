import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct, rupiah, discount } from '../../../lib/products';
import { AddToCart } from '../../../components/add-to-cart';

export const dynamic = 'force-dynamic';

export default async function ProductDetail({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return <main className="page-shell detail-page"><div className="breadcrumbs"><Link href="/">Beranda</Link> / <Link href="/shop">Belanja</Link> / {product.name}</div><div className="detail-grid"><div className="detail-photo"><img src={product.image_url} alt={product.name} />{discount(product) > 0 && <span className="discount-badge">-{discount(product)}%</span>}</div><div className="detail-copy"><span className="eyebrow">{product.category.toUpperCase()} {product.badge ? ` · ${product.badge}` : ''}</span><h1>{product.name}</h1><div className="detail-prices">{product.compare_at_price && <s>{rupiah(product.compare_at_price)}</s>}<strong>{rupiah(product.price)}</strong></div><p>{product.description}</p><p className="stock">{product.stock > 0 ? `● Tersedia · ${product.stock} tersisa` : 'Stok habis'}</p><AddToCart product={product} /><div className="detail-note"><span>✳</span><p>Nyaman untuk hari aktif si kecil. Pesanan disiapkan setelah checkout.</p></div></div></div></main>;
}
