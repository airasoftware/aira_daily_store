'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from './cart-provider';

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export function ProductCard({ product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const percent = product.compare_at_price ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0;
  function addOne() { add(product); setAdded(true); setTimeout(() => setAdded(false), 1800); }
  return <article className="product-card"><Link href={`/products/${product.slug}`} className="product-photo"><img src={product.image_url} alt={product.name} loading="lazy" />{product.badge && <span className="product-badge">{product.badge}</span>}{percent > 0 && <span className="discount-badge">-{percent}%</span>}</Link><div className="product-info"><span className="category-label">{product.category}</span><Link href={`/products/${product.slug}`} className="product-name">{product.name}</Link><div className="prices">{product.compare_at_price && <s>{money(product.compare_at_price)}</s>}<strong>{money(product.price)}</strong></div><button className="card-add" onClick={addOne} disabled={product.stock < 1}>{product.stock < 1 ? 'Stok habis' : added ? '✓ Ditambahkan' : '+ Keranjang'}</button></div></article>;
}
