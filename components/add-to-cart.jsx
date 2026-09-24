'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from './cart-provider';
import { animateProductToCart } from './cart-flight';
import { FigmaIcon } from './figma-icon';

export function AddToCart({ product }) {
  const { add, items, ready } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [hasAdded, setHasAdded] = useState(false);

  function handleAdd(event) {
    const inCart = items.find(item => item.id === String(product.id))?.quantity || 0;
    if (inCart >= product.stock) { setFeedback('maxed'); return; }
    add(product, quantity);
    animateProductToCart(event.currentTarget.closest('.detail-grid')?.querySelector('.detail-photo img'), event.currentTarget);
    setHasAdded(true);
    setFeedback('added');
    setFeedbackKey(key => key + 1);
  }

  return <div className="detail-buy"><div className="quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Kurangi jumlah">−</button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} aria-label="Tambah jumlah">+</button></div><button className={`button dark-button add-cart-action cart-feedback-button ${feedback === 'added' ? 'is-added' : feedback === 'maxed' ? 'is-maxed' : ''}`} disabled={!ready || product.stock < 1} onClick={handleAdd} aria-live="polite">{!ready ? 'Memuat keranjang...' : feedback === 'added' ? <><span className="cart-added-check" key={feedbackKey} aria-hidden="true">✓</span> Masuk keranjang!</> : feedback === 'maxed' ? 'Stok maksimum di keranjang' : <><FigmaIcon name="cart-add" /> Tambah ke keranjang</>}</button>{hasAdded && <Link href="/cart" className="text-link">Lihat keranjang →</Link>}</div>;
}
