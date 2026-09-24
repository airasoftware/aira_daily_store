import Link from 'next/link';
import { getPool } from '../../../lib/db';
import { rupiah } from '../../../lib/products';
import { orderNumber } from '../../../lib/order-number';

export default async function AdminDashboard() {
  const { rows: [summary] } = await getPool().query(`
    SELECT
      (SELECT COUNT(*)::int FROM products WHERE is_active = TRUE) AS product_total,
      (SELECT COUNT(*)::int FROM products WHERE is_active = TRUE AND stock < 5) AS low_stock,
      (SELECT COUNT(*)::int FROM orders) AS order_total,
      (SELECT COUNT(*)::int FROM orders WHERE status = 'pending') AS pending,
      (SELECT COALESCE(SUM(total), 0)::bigint FROM orders WHERE status = 'paid') AS revenue,
      (SELECT COALESCE(json_agg(recent_rows ORDER BY created_at DESC), '[]'::json)
         FROM (SELECT id, customer_name, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5) recent_rows
      ) AS recent
  `);
  return <main className="admin-main"><div className="admin-heading"><div><span className="admin-eyebrow">OVERVIEW</span><h1>Ringkasan toko<span>.</span></h1><p>Pantau produk dan pesanan terbaru di sini.</p></div><Link href="/admin/products/new" className="admin-primary">+ Tambah produk</Link></div><div className="stat-grid"><div><span>Produk aktif</span><strong>{summary.product_total}</strong><small>{summary.low_stock} produk stok rendah</small></div><div><span>Total pesanan</span><strong>{summary.order_total}</strong><small>{summary.pending} menunggu konfirmasi</small></div><div><span>Penjualan dibayar</span><strong className="stat-money">{rupiah(Number(summary.revenue))}</strong><small>Subtotal pesanan berstatus dibayar</small></div></div><section className="admin-section"><div className="admin-section-title"><h2>Pesanan terbaru</h2><Link href="/admin/orders">Lihat semua →</Link></div>{summary.recent.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Pesanan</th><th>Pelanggan</th><th>Tanggal</th><th>Total</th><th>Status</th></tr></thead><tbody>{summary.recent.map(order => <tr key={order.id}><td>{orderNumber(order)}</td><td>{order.customer_name}</td><td>{new Date(order.created_at).toLocaleDateString('id-ID')}</td><td>{rupiah(order.total)}</td><td><span className={`status-pill ${order.status}`}>{order.status}</span></td></tr>)}</tbody></table></div> : <p className="admin-empty">Belum ada pesanan.</p>}</section></main>;
}
