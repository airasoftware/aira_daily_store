import { NextResponse } from 'next/server';
import { getPool } from '../../../lib/db';
import { normalizeWhatsAppPhone, sendOrderNotifications } from '../../../lib/order-notifications';
import { orderNumber } from '../../../lib/order-number';

export const runtime = 'nodejs';

function clean(value, max) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Data pesanan tidak valid.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Data pesanan tidak valid.' }, { status: 400 });
  const customerName = clean(body.customerName, 120);
  const email = clean(body.email, 254);
  const phone = clean(body.phone, 30);
  const whatsAppPhone = normalizeWhatsAppPhone(phone);
  const address = clean(body.address, 500);
  const city = clean(body.city, 100);
  const postalCode = clean(body.postalCode, 12);
  const notes = clean(body.notes, 500);
  const whatsappOptIn = body.whatsappOptIn === true;
  if (!customerName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !address || !city || !postalCode) {
    return NextResponse.json({ error: 'Lengkapi nama, email, WhatsApp, dan alamat pengiriman.' }, { status: 400 });
  }
  if (!whatsAppPhone) return NextResponse.json({ error: 'Masukkan nomor WhatsApp Indonesia yang valid, misalnya 081234567890.' }, { status: 400 });
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
    return NextResponse.json({ error: 'Keranjang kosong atau terlalu banyak produk.' }, { status: 400 });
  }
  if (body.items.some(item => !item || typeof item !== 'object')) return NextResponse.json({ error: 'Produk tidak valid.' }, { status: 400 });
  const items = body.items.map(item => ({ id: String(item.productId), variantId: item.variantId == null ? null : String(item.variantId), quantity: Number(item.quantity) }));
  if (items.some(item => !/^\d+$/.test(item.id) || (item.variantId !== null && !/^\d+$/.test(item.variantId)) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) || new Set(items.map(item => `${item.id}:${item.variantId ?? ''}`)).size !== items.length) {
    return NextResponse.json({ error: 'Jumlah atau produk tidak valid.' }, { status: 400 });
  }

  const client = await getPool().connect();
  let savedOrder;
  try {
    await client.query('BEGIN');
    const reserved = [];
    for (const item of items.sort((a, b) => BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : BigInt(a.variantId ?? 0) < BigInt(b.variantId ?? 0) ? -1 : 1)) {
      const productResult = await client.query('SELECT id, name, price, cost_price, stock, has_variants FROM products WHERE id = $1 AND is_active = TRUE FOR UPDATE', [item.id]);
      const product = productResult.rows[0];
      if (!product || product.has_variants !== (item.variantId !== null) || product.stock < item.quantity) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Salah satu produk sudah habis atau stoknya berubah. Periksa keranjang kembali.' }, { status: 409 });
      }
      let chosen = { id: product.id, name: product.name, price: product.price, cost: product.cost_price, quantity: item.quantity, variantId: null };
      if (item.variantId !== null) {
        const variantResult = await client.query(`UPDATE product_variants v SET stock = v.stock - $1
          FROM product_variants matched
          LEFT JOIN variant_options c ON c.id = matched.color_id
          LEFT JOIN variant_options s ON s.id = matched.size_id
          WHERE matched.id = v.id AND v.id = $2 AND v.product_id = $3 AND v.is_active = TRUE AND v.stock >= $1
          RETURNING v.id, v.price, v.cost_price, c.name AS color, s.name AS size`, [item.quantity, item.variantId, item.id]);
        if (!variantResult.rows.length) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: 'Varian yang dipilih sudah habis atau berubah. Periksa keranjang kembali.' }, { status: 409 });
        }
        const variant = variantResult.rows[0];
        chosen = { ...chosen, name: `${product.name} (${[variant.color, variant.size].filter(Boolean).join(' · ')})`, price: variant.price, cost: variant.cost_price, variantId: variant.id };
      }
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.id]);
      reserved.push(chosen);
    }
    const subtotal = reserved.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await client.query(`INSERT INTO orders (customer_name, email, phone, whatsapp_opt_in, address, city, postal_code, notes, subtotal, total)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9) RETURNING id, total, created_at`, [customerName, email, whatsAppPhone, whatsappOptIn, address, city, postalCode, notes, subtotal]);
    for (const item of reserved) {
      await client.query('INSERT INTO order_items (order_id, product_id, variant_id, product_name, quantity, unit_price, unit_cost, line_total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [order.rows[0].id, item.id, item.variantId, item.name, item.quantity, item.price, item.cost, item.price * item.quantity]);
    }
    await client.query('COMMIT');
    savedOrder = { id: order.rows[0].id, total: order.rows[0].total, createdAt: order.rows[0].created_at, customerName, email, phone: whatsAppPhone, whatsappOptIn, address, city, postalCode, notes, items: reserved };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Gagal menyimpan pesanan:', error);
    return NextResponse.json({ error: 'Pesanan belum dapat disimpan. Coba lagi nanti.' }, { status: 500 });
  } finally { client.release(); }
  const notifications = await sendOrderNotifications(savedOrder);
  return NextResponse.json({ orderId: savedOrder.id, orderNumber: orderNumber(savedOrder), total: savedOrder.total, notifications }, { status: 201 });
}
