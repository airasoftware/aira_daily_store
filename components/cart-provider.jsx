'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('aira-cart') || '[]');
      if (Array.isArray(saved)) setItems(saved);
    } catch { localStorage.removeItem('aira-cart'); }
    setReady(true);
  }, []);

  useEffect(() => { if (ready) localStorage.setItem('aira-cart', JSON.stringify(items)); }, [items, ready]);

  function add(product, quantity = 1, variant = null) {
    setItems(current => {
      const key = `${product.id}:${variant?.id ?? ''}`;
      const existing = current.find(item => `${item.id}:${item.variantId ?? ''}` === key);
      if (existing) return current.map(item => `${item.id}:${item.variantId ?? ''}` === key ? { ...item, quantity: Math.min(item.stock, item.quantity + quantity) } : item);
      const stock = variant?.stock ?? product.stock;
      return [...current, { id: String(product.id), variantId: variant ? String(variant.id) : null, color: variant?.color ?? null, size: variant?.size ?? null, slug: product.slug, name: product.name, price: variant?.price ?? product.price, image_url: variant?.image_url || product.image_url, stock, quantity: Math.min(stock, quantity) }];
    });
  }

  function update(id, variantId, quantity) {
    setItems(current => current.map(item => item.id === id && (item.variantId ?? null) === (variantId ?? null) ? { ...item, quantity: Math.max(1, Math.min(item.stock, quantity)) } : item));
  }
  function remove(id, variantId) { setItems(current => current.filter(item => item.id !== id || (item.variantId ?? null) !== (variantId ?? null))); }
  function clear() { setItems([]); }
  return <CartContext.Provider value={{ items, ready, add, update, remove, clear, count: items.reduce((sum, item) => sum + item.quantity, 0) }}>{children}</CartContext.Provider>;
}

export function useCart() { return useContext(CartContext); }
