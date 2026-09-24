import Link from 'next/link';
import { requireAdmin } from '../../../lib/admin-auth';
import { AdminLogout } from '../../../components/admin-logout';

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({ children }) {
  await requireAdmin();
  return <div className="admin-root admin-frame"><aside className="admin-sidebar"><Link href="/admin" className="admin-brand">✳ &nbsp;aira<span>daily</span><small>ADMIN PANEL</small></Link><div className="sidebar-caption">MENU UTAMA</div><nav><Link href="/admin">▦ <span>Ringkasan</span></Link><Link href="/admin/products">◈ <span>Produk</span></Link><Link href="/admin/orders">▤ <span>Pesanan</span></Link></nav><div className="sidebar-bottom"><Link href="/shop" target="_blank">↗ &nbsp; Lihat toko</Link><AdminLogout /></div></aside><div className="admin-content"><div className="admin-topbar"><span>Panel Admin / Aira Daily Store</span><div><Link href="/shop" target="_blank">Lihat toko ↗</Link><AdminLogout /></div></div>{children}</div></div>;
}
