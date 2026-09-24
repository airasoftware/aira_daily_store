import { NextResponse } from 'next/server';
import { getPool } from '../../../lib/db';

export const runtime = 'nodejs';

function clean(value, max) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Data pesanan tidak valid.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Data pesanan tidak valid.' }, { status: 400 });
  const customerName = clean(body.customerName, 120);
  const email = clean(body.email, 254);
  const phone = clean(body.phone, 30);
  const address = clean(body.address, 500);
  const city = clean(body.city, 100);
  const postalCode = clean(body.postalCode, 12);
  const notes = clean(body.notes, 500);
  if (!customerName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone || !address || !city || !postalCode) {
    return NextResponse.json({ error: 'Lengkapi nama, email, telepon, dan alamat pengiriman.' }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
    return NextResponse.json({ error: 'Keranjang kosong atau terlalu banyak produk.' }, { status: 400 });
  }
  if (body.items.some(item => !item || typeof item !== 'object')) return NextResponse.json({ error: 'Produk tidak valid.' }, { status: 400 });
  const items = body.items.map(item => ({ id: String(item.productId), quantity: Number(item.quantity) }));
  if (items.some(item => !/^\d+$/.test(item.id) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) || new Set(items.map(item => item.id)).size !== items.length) {
    return NextResponse.json({ error: 'Jumlah atau produk tidak valid.' }, { status: 400 });
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const reserved = [];
    for (const item of items.sort((a, b) => BigInt(a.id) < BigInt(b.id) ? -1 : 1)) {
      const result = await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 AND is_active = TRUE RETURNING id, name, price', [item.quantity, item.id]);
      if (!result.rows.length) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Salah satu produk sudah habis atau stoknya berubah. Periksa keranjang kembali.' }, { status: 409 });
      }
      reserved.push({ ...result.rows[0], quantity: item.quantity });
    }
    const subtotal = reserved.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await client.query(`INSERT INTO orders (customer_name, email, phone, address, city, postal_code, notes, subtotal, total)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING id, total`, [customerName, email, phone, address, city, postalCode, notes, subtotal]);
    for (const item of reserved) {
      await client.query('INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total) VALUES ($1,$2,$3,$4,$5,$6)', [order.rows[0].id, item.id, item.name, item.quantity, item.price, item.price * item.quantity]);
    }
    await client.query('COMMIT');
    return NextResponse.json({ orderId: order.rows[0].id, total: order.rows[0].total }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Gagal menyimpan pesanan:', error);
    return NextResponse.json({ error: 'Pesanan belum dapat disimpan. Coba lagi nanti.' }, { status: 500 });
  } finally { client.release(); }
}
