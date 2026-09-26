import { NextResponse } from 'next/server';
import { isAdmin, sameOrigin } from '../../../../../lib/admin-auth';
import { getPool } from '../../../../../lib/db';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Sesi admin berakhir. Masuk kembali.' }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Asal permintaan tidak valid.' }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Data akun tidak valid.' }, { status: 400 }); }
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const type = body?.type;
  if (!/^\d{4,10}$/.test(code) || !name || name.length > 120 || !['asset', 'liability', 'equity', 'revenue', 'expense'].includes(type)) return NextResponse.json({ error: 'Kode, nama, atau kelompok akun tidak valid.' }, { status: 400 });
  const normalBalance = ['asset', 'expense'].includes(type) ? 'debit' : 'credit';
  try {
    const { rows } = await getPool().query('INSERT INTO accounts (code, name, type, normal_balance) VALUES ($1,$2,$3,$4) RETURNING id', [code, name, type, normalBalance]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Kode akun sudah digunakan.' }, { status: 409 });
    console.error('Gagal membuat akun:', error); return NextResponse.json({ error: 'Akun belum dapat disimpan.' }, { status: 500 });
  }
}
