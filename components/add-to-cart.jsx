'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from './cart-provider';
import { animateProductToCart } from './cart-flight';
import { FigmaIcon } from './figma-icon';

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export function AddToCart({ product, selectedColor = '', selectedSize = '', onColorChange = () => {}, onSizeChange = () => {} }) {
  const { add, items, ready } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [hasAdded, setHasAdded] = useState(false);
  const variants = product.variants || [];
  const colors = [...new Set(variants.map(row => row.color))];
  const sizes = [...new Set(variants.filter(row => !selectedColor || row.color === selectedColor).map(row => row.size))];
  const variant = product.has_variants ? variants.find(row => row.color === selectedColor && row.size === selectedSize) : null;
  const stock = product.has_variants ? variant?.stock ?? 0 : product.stock;
  const price = variant?.price ?? product.price;

  function handleAdd(event) {
    const key = `${product.id}:${variant?.id ?? ''}`;
    const inCart = items.find(item => `${item.id}:${item.variantId ?? ''}` === key)?.quantity || 0;
    if (inCart >= stock) { setFeedback('maxed'); return; }
    add(product, quantity, variant);
    animateProductToCart(event.currentTarget.closest('.detail-grid')?.querySelector('.detail-photo img'), event.currentTarget);
    setHasAdded(true); setFeedback('added'); setFeedbackKey(key => key + 1);
  }

  return <>
    <div className="detail-prices">{!product.has_variants && product.compare_at_price && <s>{money(product.compare_at_price)}</s>}<strong>{money(price)}</strong></div>
    {product.has_variants && <div className="variant-picker"><label>Warna<select value={selectedColor} onChange={event => { onColorChange(event.target.value); onSizeChange(''); setQuantity(1); setFeedback(''); }}><option value="">Pilih warna</option>{colors.map(value => <option key={value} value={value}>{value}</option>)}</select></label><label>Ukuran<select value={selectedSize} onChange={event => { onSizeChange(event.target.value); setQuantity(1); setFeedback(''); }} disabled={!selectedColor}><option value="">Pilih ukuran</option>{sizes.map(value => <option key={value} value={value}>{value}</option>)}</select></label></div>}
    <p className="stock">{product.has_variants && !variant ? 'Pilih warna dan ukuran untuk melihat stok.' : stock > 0 ? `● Tersedia · ${stock} tersisa` : 'Stok habis'}</p>
    <div className="detail-buy"><div className="quantity"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Kurangi jumlah">−</button><span>{quantity}</span><button type="button" onClick={() => setQuantity(Math.min(stock || 1, quantity + 1))} aria-label="Tambah jumlah">+</button></div><button type="button" className={`button dark-button add-cart-action cart-feedback-button ${feedback === 'added' ? 'is-added' : feedback === 'maxed' ? 'is-maxed' : ''}`} disabled={!ready || stock < 1 || (product.has_variants && !variant)} onClick={handleAdd} aria-live="polite">{!ready ? 'Memuat keranjang...' : feedback === 'added' ? <><span className="cart-added-check" key={feedbackKey} aria-hidden="true">✓</span> Masuk keranjang!</> : feedback === 'maxed' ? 'Stok maksimum di keranjang' : <><FigmaIcon name="cart-add" /> Tambah ke keranjang</>}</button>{hasAdded && <Link href="/cart" className="text-link">Lihat keranjang →</Link>}</div>
  </>;
}
