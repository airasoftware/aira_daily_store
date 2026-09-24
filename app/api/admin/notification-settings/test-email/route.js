import { NextResponse } from 'next/server';
import { isAdmin, sameOrigin } from '../../../../../lib/admin-auth';
import { sendTestEmail } from '../../../../../lib/order-notifications';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Sesi admin berakhir. Masuk kembali.' }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Asal permintaan tidak valid.' }, { status: 403 });
  try {
    const recipient = await sendTestEmail();
    return NextResponse.json({ recipient });
  } catch (error) {
    console.error('Email uji gagal:', error.code || error.name);
    return NextResponse.json({ error: 'Email uji gagal dikirim. Periksa App Password, alamat Gmail, dan koneksi SMTP.' }, { status: 502 });
  }
}
