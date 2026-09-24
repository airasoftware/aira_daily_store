import Link from 'next/link';
import { getPool } from '../../../../lib/db';
import { rupiah } from '../../../../lib/products';
import { ArchiveProduct } from '../../../../components/archive-product';

export default async function AdminProducts() {
  const result = await getPool().query('SELECT id, slug, name, category, price, stock, is_active, image_url FROM products ORDER BY is_active DESC, id DESC');
  return <main className="admin-main"><div className="admin-heading"><div><span className="admin-eyebrow">KATALOG</span><h1>Kelola produk<span>.</span></h1><p>{result.rows.length} produk termasuk yang diarsipkan.</p></div><Link href="/admin/products/new" className="admin-primary">+ Tambah produk</Link></div><div className="admin-table-wrap"><table className="admin-table product-table"><thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{result.rows.map(product => <tr key={product.id}><td><div className="table-product"><img src={product.image_url} alt="" /><div><strong>{product.name}</strong><small>/{product.slug}</small></div></div></td><td>{product.category}</td><td>{rupiah(product.price)}</td><td><span className={product.stock < 5 ? 'low-stock' : ''}>{product.stock}</span></td><td><span className={`status-pill ${product.is_active ? 'active' : 'archived'}`}>{product.is_active ? 'Aktif' : 'Arsip'}</span></td><td><div className="table-actions"><Link href={`/admin/products/${product.id}/edit`}>Edit</Link>{product.is_active && <ArchiveProduct id={product.id} name={product.name} />}</div></td></tr>)}</tbody></table></div></main>;
}
