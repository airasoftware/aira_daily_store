import Link from 'next/link';
import { getPool } from '../../../lib/db';
import { rupiah } from '../../../lib/products';

export default async function AdminDashboard() {
  const [products, orders, recent] = await Promise.all([
    getPool().query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE stock < 5 AND is_active)::int AS low_stock FROM products WHERE is_active = TRUE'),
    getPool().query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='pending')::int AS pending, COALESCE(SUM(total) FILTER (WHERE status='paid'),0)::bigint AS revenue FROM orders`),
    getPool().query('SELECT id, customer_name, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5')
  ]);
  return <main className="admin-main"><div className="admin-heading"><div><span className="admin-eyebrow">OVERVIEW</span><h1>Ringkasan toko<span>.</span></h1><p>Pantau produk dan pesanan terbaru di sini.</p></div><Link href="/admin/products/new" className="admin-primary">+ Tambah produk</Link></div><div className="stat-grid"><div><span>Produk aktif</span><strong>{products.rows[0].total}</strong><small>{products.rows[0].low_stock} produk stok rendah</small></div><div><span>Total pesanan</span><strong>{orders.rows[0].total}</strong><small>{orders.rows[0].pending} menunggu konfirmasi</small></div><div><span>Penjualan dibayar</span><strong className="stat-money">{rupiah(Number(orders.rows[0].revenue))}</strong><small>Subtotal pesanan berstatus dibayar</small></div></div><section className="admin-section"><div className="admin-section-title"><h2>Pesanan terbaru</h2><Link href="/admin/orders">Lihat semua →</Link></div>{recent.rows.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Pesanan</th><th>Pelanggan</th><th>Tanggal</th><th>Total</th><th>Status</th></tr></thead><tbody>{recent.rows.map(order => <tr key={order.id}><td>#{order.id}</td><td>{order.customer_name}</td><td>{new Date(order.created_at).toLocaleDateString('id-ID')}</td><td>{rupiah(order.total)}</td><td><span className={`status-pill ${order.status}`}>{order.status}</span></td></tr>)}</tbody></table></div> : <p className="admin-empty">Belum ada pesanan.</p>}</section></main>;
}
