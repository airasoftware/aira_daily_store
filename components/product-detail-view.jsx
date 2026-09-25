'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AddToCart } from './add-to-cart';
import { FigmaIcon } from './figma-icon';
import { variantImage } from '../lib/variant-image';

export function ProductDetailView({ product, discount, descriptionHtml }) {
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const variant = product.variants?.find(row => (row.color || '') === color && (row.size || '') === size);
  const mainImage = variantImage(product, variant, color);
  const images = [...new Set([mainImage, ...(product.gallery_urls || []).filter(Boolean)])];
  const imageUrl = selectedImage && images.includes(selectedImage) ? selectedImage : mainImage;
  function changeColor(value) { setColor(value); setSelectedImage(null); }
  function changeSize(value) { setSize(value); setSelectedImage(null); }
  return <main className="page-shell detail-page">
    <div className="breadcrumbs"><Link href="/">Beranda</Link> / <Link href="/shop">Belanja</Link> / {product.name}</div>
    <div className="detail-heading"><span className="eyebrow">{product.category.toUpperCase()} {product.badge ? ` · ${product.badge}` : ''}</span><h1>{product.name}</h1></div>
    <div className="detail-grid">
      <div className="detail-gallery"><div className="detail-photo"><img src={imageUrl} alt={variant ? `${product.name} · ${[color, size].filter(Boolean).join(' · ')}` : product.name} />{discount > 0 && <span className="discount-badge">-{discount}%</span>}</div>{images.length > 1 && <div className="detail-thumbnails">{images.map((url, index) => <button type="button" key={url} className={imageUrl === url ? 'is-active' : ''} onClick={() => setSelectedImage(url)} aria-label={`Lihat gambar ${index + 1}`} aria-pressed={imageUrl === url}><img src={url} alt="" /></button>)}</div>}</div>
      <div className="detail-copy"><AddToCart product={product} selectedColor={color} selectedSize={size} onColorChange={changeColor} onSizeChange={changeSize} /><div className="detail-note"><FigmaIcon name="warning" /><p>Periksa detail produk sebelum checkout. Pesanan disiapkan setelah pesanan diterima.</p></div></div>
    </div>
    <div className="product-description detail-description" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
  </main>;
}
