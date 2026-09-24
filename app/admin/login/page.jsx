import { redirect } from 'next/navigation';
import { isAdmin } from '../../../lib/admin-auth';
import { AdminLogin } from '../../../components/admin-login';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await isAdmin()) redirect('/admin');
  return <main className="admin-login admin-root"><div className="login-panel"><span className="admin-eyebrow">AIRA DAILY STORE</span><h1>Masuk ke<br />panel admin<span>.</span></h1><p>Kelola koleksi dan pesanan dari satu tempat.</p><AdminLogin /></div><div className="login-art"><div>Pilihan untuk rumah,<br /><em>dan keluarga.</em></div></div></main>;
}
