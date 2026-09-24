import { notFound } from 'next/navigation';
import { ProductForm } from '../../../../../../components/product-form';
import { getPool } from '../../../../../../lib/db';

export default async function EditProductPage({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const result = await getPool().query('SELECT * FROM products WHERE id=$1', [id]);
  if (!result.rows.length) notFound();
  return <main className="admin-main"><div className="admin-heading"><div><span className="admin-eyebrow">KATALOG / EDIT</span><h1>Edit produk<span>.</span></h1><p>Perubahan harga dan stok akan langsung berlaku di toko.</p></div></div><ProductForm product={result.rows[0]} /></main>;
}
