import { NextResponse } from 'next/server';
import { isAdmin, sameOrigin } from '../../../../lib/admin-auth';
import { getPool } from '../../../../lib/db';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Sesi admin berakhir. Masuk kembali.' }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Asal permintaan tidak valid.' }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 }); }
  const kind = body?.kind;
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!['color', 'size'].includes(kind) || !name || name.length > 80) return NextResponse.json({ error: 'Jenis atau nama varian tidak valid.' }, { status: 400 });
  try {
    const { rows } = await getPool().query('INSERT INTO variant_options (kind, name) VALUES ($1,$2) RETURNING id, kind, name', [kind, name]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Nama ini sudah ada untuk jenis varian tersebut.' }, { status: 409 });
    console.error('Gagal menyimpan pilihan varian:', error);
    return NextResponse.json({ error: 'Pilihan varian belum dapat disimpan.' }, { status: 500 });
  }
}
