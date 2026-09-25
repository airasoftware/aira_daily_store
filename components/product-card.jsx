'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useCart } from './cart-provider';
import { animateProductToCart } from './cart-flight';
import { FigmaIcon } from './figma-icon';

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export function ProductCard({ product }) {
  const { add, items, ready } = useCart();
  const [feedback, setFeedback] = useState('');
  const [feedbackKey, setFeedbackKey] = useState(0);
  const feedbackTimer = useRef(null);
  const percent = product.compare_at_price ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0;
  useEffect(() => () => clearTimeout(feedbackTimer.current), []);

  function addOne(event) {
    if (product.has_variants) { window.location.href = `/products/${product.slug}`; return; }
    const inCart = items.find(item => item.id === String(product.id))?.quantity || 0;
    if (inCart < product.stock) {
      add(product);
      animateProductToCart(event.currentTarget.closest('.product-card')?.querySelector('.product-photo img'), event.currentTarget);
    }
    setFeedback(inCart < product.stock ? 'added' : 'maxed');
    setFeedbackKey(key => key + 1);
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(''), 2200);
  }

  return <article className="product-card"><Link href={`/products/${product.slug}`} className="product-photo"><img src={product.image_url} alt={product.name} loading="lazy" />{product.badge && <span className="product-badge">{product.badge}</span>}{percent > 0 && <span className="discount-badge">-{percent}%</span>}</Link><div className="product-info"><span className="category-label">{product.category}</span><Link href={`/products/${product.slug}`} className="product-name">{product.name}</Link><div className="prices">{product.compare_at_price && <s>{money(product.compare_at_price)}</s>}<strong>{money(product.price)}</strong></div><button className={`card-add cart-feedback-button ${feedback === 'added' ? 'is-added' : feedback === 'maxed' ? 'is-maxed' : ''}`} onClick={addOne} disabled={!ready || product.stock < 1} aria-live="polite">{product.stock < 1 ? 'Stok habis' : product.has_variants ? 'Pilih varian' : !ready ? 'Memuat keranjang...' : feedback === 'added' ? <><span className="cart-added-check" key={feedbackKey} aria-hidden="true">✓</span> Ditambahkan!</> : feedback === 'maxed' ? 'Stok maksimum di keranjang' : <><FigmaIcon name="cart-add" /> Keranjang</>}</button></div></article>;
}
