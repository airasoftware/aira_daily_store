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

  function add(product, quantity = 1) {
    setItems(current => {
      const existing = current.find(item => item.id === String(product.id));
      if (existing) return current.map(item => item.id === String(product.id) ? { ...item, quantity: Math.min(item.stock, item.quantity + quantity) } : item);
      return [...current, { id: String(product.id), slug: product.slug, name: product.name, price: product.price, image_url: product.image_url, stock: product.stock, quantity: Math.min(product.stock, quantity) }];
    });
  }

  function update(id, quantity) {
    setItems(current => current.map(item => item.id === id ? { ...item, quantity: Math.max(1, Math.min(item.stock, quantity)) } : item));
  }
  function remove(id) { setItems(current => current.filter(item => item.id !== id)); }
  function clear() { setItems([]); }
  return <CartContext.Provider value={{ items, ready, add, update, remove, clear, count: items.reduce((sum, item) => sum + item.quantity, 0) }}>{children}</CartContext.Provider>;
}

export function useCart() { return useContext(CartContext); }
