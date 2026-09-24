'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from './cart-provider';

export function AddToCart({ product }) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  return <div className="detail-buy"><div className="quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Kurangi jumlah">−</button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} aria-label="Tambah jumlah">+</button></div><button className="button dark-button" disabled={product.stock < 1} onClick={() => { add(product, quantity); setAdded(true); }}>{added ? '✓ Masuk keranjang' : 'Tambah ke keranjang ↗'}</button>{added && <Link href="/cart" className="text-link">Lihat keranjang →</Link>}</div>;
}
