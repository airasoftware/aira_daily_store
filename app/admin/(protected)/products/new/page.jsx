import { ProductForm } from '../../../../../components/product-form';
import { getPool } from '../../../../../lib/db';
import { getVariantOptions } from '../../../../../lib/variants';

export default async function NewProductPage() { const options = await getVariantOptions(getPool()); return <main className="admin-main"><div className="admin-heading"><div><span className="admin-eyebrow">KATALOG / BARU</span><h1>Tambah produk<span>.</span></h1><p>Produk baru akan langsung tersedia di toko jika statusnya aktif.</p></div></div><ProductForm options={options} /></main>; }
