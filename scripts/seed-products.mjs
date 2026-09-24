import pg from 'pg';
import { getDatabaseConfig } from '../lib/db-config.js';

const products = [
  ['silas-outdoor-kids-vest', 'Silas Outdoor Kids Vest', 'Vest ringan untuk petualangan si kecil. Nyaman dipakai berlapis saat bermain di luar.', 'Pakaian', 203670, 302100, 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=900&q=85', 'TERBARU', 18, true, false],
  ['elba-kids-vest', 'Elba Kids Vest', 'Vest serbaguna dengan tampilan outdoor yang ceria.', 'Pakaian', 213570, 270100, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85', null, 24, true, false],
  ['kaja-vest-kids-set', 'Kaja Vest Kids Set', 'Setelan vest untuk anak yang siap menemani hari aktif.', 'Pakaian', 222570, 299300, 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85', 'TERFAVORIT', 12, true, false],
  ['kauri-kids-bags', 'Kauri Kids Bags', 'Tas praktis untuk membawa perlengkapan kecil saat menjelajah.', 'Tas', 297450, 330500, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', 'TERLARIS', 20, true, false],
  ['kitaro-kids-bag', 'Kitaro Kids Bag', 'Tas anak dengan ruang penyimpanan yang nyaman.', 'Tas', 268650, 335500, 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=900&q=85', 'TERLARIS', 16, true, false],
  ['jepun-kids-hat-v2', 'Jepun Kids Hat V.2', 'Topi untuk hari cerah di luar rumah.', 'Aksesori', 103680, 153200, 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=85', 'TERLARIS', 30, true, false],
  ['kian-skort-kids', 'Kian Skort Kids', 'Skort yang memberi kebebasan bergerak sepanjang hari.', 'Pakaian', 124290, 151900, 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=900&q=85', null, 22, false, true],
  ['orion-pants-kids', 'Orion Pants Kids', 'Celana nyaman untuk aktivitas luar ruang.', 'Pakaian', 254070, 310530, 'https://images.unsplash.com/photo-1503919005314-30d93d07d823?auto=format&fit=crop&w=900&q=85', null, 15, false, true],
  ['tracker-pants-kids', 'Tracker Pants Kids', 'Celana santai untuk penjelajah kecil.', 'Pakaian', 146880, 179500, 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?auto=format&fit=crop&w=900&q=85', null, 28, false, true],
  ['yuji-short-pants-kids', 'Yuji Short Pants Kids', 'Celana pendek yang ringan untuk bermain.', 'Pakaian', 108090, 132100, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=900&q=85', null, 25, false, true],
  ['escamp-longsleeve-kids', 'Escamp Longsleeve Kids', 'Atasan lengan panjang untuk perjalanan yang nyaman.', 'Pakaian', 136890, 167200, 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=85', null, 18, false, true],
  ['clover-backpack-kids', 'Clover Backpack Kids', 'Ransel mungil untuk semua kebutuhan si kecil.', 'Tas', 240750, 294500, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', null, 14, false, true]
];

const demoOrders = [
  {
    marker: '[aira-seed:pending-v1]', status: 'pending', customer: 'Pelanggan Contoh A',
    email: 'demo.pending@example.invalid', shippingFee: 20000,
    items: [['silas-outdoor-kids-vest', 1], ['jepun-kids-hat-v2', 1]]
  },
  {
    marker: '[aira-seed:paid-v1]', status: 'paid', customer: 'Pelanggan Contoh B',
    email: 'demo.paid@example.invalid', shippingFee: 15000,
    items: [['kauri-kids-bags', 1]]
  },
  {
    marker: '[aira-seed:cancelled-v1]', status: 'cancelled', customer: 'Pelanggan Contoh C',
    email: 'demo.cancelled@example.invalid', shippingFee: 0,
    items: [['elba-kids-vest', 1]]
  }
];

const client = new pg.Client(getDatabaseConfig({ migration: true }));
try {
  await client.connect();
  await client.query('BEGIN');
  let insertedProducts = 0;
  for (const product of products) {
    const result = await client.query(`INSERT INTO products (slug, name, description, category, price, compare_at_price, image_url, badge, stock, is_featured, is_new)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (slug) DO NOTHING`, product);
    insertedProducts += result.rowCount;
  }

  let insertedOrders = 0;
  let insertedItems = 0;
  for (const demo of demoOrders) {
    const notes = `Data contoh untuk pengujian; jangan diproses. ${demo.marker}`;
    const existing = await client.query('SELECT id FROM orders WHERE notes = $1 LIMIT 1', [notes]);
    if (existing.rowCount) continue;

    const items = [];
    for (const [slug, quantity] of demo.items) {
      const result = await client.query('SELECT id, name, price FROM products WHERE slug = $1', [slug]);
      if (!result.rowCount) throw new Error(`Produk contoh ${slug} tidak ditemukan.`);
      items.push({ ...result.rows[0], quantity });
    }

    if (demo.status !== 'cancelled') {
      for (const item of items) {
        const result = await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING id',
          [item.quantity, item.id]
        );
        if (!result.rowCount) throw new Error(`Stok produk contoh ${item.name} tidak cukup.`);
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await client.query(`INSERT INTO orders
      (customer_name, email, phone, address, city, postal_code, notes, subtotal, shipping_fee, total, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [demo.customer, demo.email, '0000000000', 'Alamat contoh, jangan kirim', 'Jakarta', '00000', notes,
        subtotal, demo.shippingFee, subtotal + demo.shippingFee, demo.status]
    );
    for (const item of items) {
      await client.query(`INSERT INTO order_items
        (order_id, product_id, product_name, quantity, unit_price, line_total)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [order.rows[0].id, item.id, item.name, item.quantity, item.price, item.price * item.quantity]
      );
      insertedItems += 1;
    }
    insertedOrders += 1;
  }
  await client.query('COMMIT');
  console.log(`Seed selesai: ${insertedProducts} produk, ${insertedOrders} pesanan, ${insertedItems} item pesanan ditambahkan.`);
} catch (error) {
  try { await client.query('ROLLBACK'); } catch { /* koneksi mungkin belum terbuka */ }
  console.error('Seed gagal:', error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
