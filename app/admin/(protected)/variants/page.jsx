import { getPool } from '../../../../lib/db';
import { getVariantOptions } from '../../../../lib/variants';
import { VariantOptionsForm } from '../../../../components/variant-options-form';

export default async function VariantsPage() {
  const options = await getVariantOptions(getPool());
  return <main className="admin-main"><div className="admin-heading"><div><span className="admin-eyebrow">KATALOG / VARIAN</span><h1>Master varian<span>.</span></h1><p>Tambahkan warna dan ukuran, lalu buat kombinasi serta harga jualnya di editor produk.</p></div></div><section className="editor-card"><h2>Tambah pilihan</h2><VariantOptionsForm /></section><div className="variant-master-grid">{[['color', 'Warna'], ['size', 'Ukuran']].map(([kind, label]) => <section className="editor-card" key={kind}><h2>{label}</h2><div className="variant-chips">{options.filter(option => option.kind === kind).map(option => <span key={option.id}>{option.name}</span>)}</div>{!options.some(option => option.kind === kind) && <p>Belum ada pilihan.</p>}</section>)}</div></main>;
}
