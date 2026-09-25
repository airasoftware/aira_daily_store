'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AddToCart } from './add-to-cart';
import { FigmaIcon } from './figma-icon';

export function ProductDetailView({ product, discount }) {
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const variant = product.variants?.find(row => row.color === color && row.size === size);
  const imageUrl = variant?.image_url || product.image_url;
  return <main className="page-shell detail-page"><div className="breadcrumbs"><Link href="/">Beranda</Link> / <Link href="/shop">Belanja</Link> / {product.name}</div><div className="detail-grid"><div className="detail-photo"><img src={imageUrl} alt={variant ? `${product.name} · ${color} · ${size}` : product.name} />{discount > 0 && <span className="discount-badge">-{discount}%</span>}</div><div className="detail-copy"><span className="eyebrow">{product.category.toUpperCase()} {product.badge ? ` · ${product.badge}` : ''}</span><h1>{product.name}</h1><p>{product.description}</p><AddToCart product={product} selectedColor={color} selectedSize={size} onColorChange={setColor} onSizeChange={setSize} /><div className="detail-note"><FigmaIcon name="star" /><p>Periksa detail produk sebelum checkout. Pesanan disiapkan setelah pesanan diterima.</p></div></div></div></main>;
}
