import Link from 'next/link';
import { FigmaIcon } from '../../../components/figma-icon';
import { notFound } from 'next/navigation';
import { getProduct, discount } from '../../../lib/products';
import { AddToCart } from '../../../components/add-to-cart';

export const dynamic = 'force-dynamic';

export default async function ProductDetail({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return <main className="page-shell detail-page"><div className="breadcrumbs"><Link href="/">Beranda</Link> / <Link href="/shop">Belanja</Link> / {product.name}</div><div className="detail-grid"><div className="detail-photo"><img src={product.image_url} alt={product.name} />{discount(product) > 0 && <span className="discount-badge">-{discount(product)}%</span>}</div><div className="detail-copy"><span className="eyebrow">{product.category.toUpperCase()} {product.badge ? ` · ${product.badge}` : ''}</span><h1>{product.name}</h1><p>{product.description}</p><AddToCart product={product} /><div className="detail-note"><FigmaIcon name="star" /><p>Periksa detail produk sebelum checkout. Pesanan disiapkan setelah pesanan diterima.</p></div></div></div></main>;
}
