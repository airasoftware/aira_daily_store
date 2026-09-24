import { NextResponse } from 'next/server';
import { isAdmin, sameOrigin } from '../../../../../lib/admin-auth';
import { getPool } from '../../../../../lib/db';

export const runtime = 'nodejs';

export async function PATCH(request, { params }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Sesi admin berakhir. Masuk kembali.' }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Asal permintaan tidak valid.' }, { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'ID pesanan tidak valid.' }, { status: 400 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 }); }
  if (!['paid', 'cancelled'].includes(body?.status)) return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 });

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const order = await client.query('SELECT status FROM orders WHERE id=$1 FOR UPDATE', [id]);
    if (!order.rows.length) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 }); }
    if (order.rows[0].status !== 'pending') { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Hanya pesanan menunggu yang dapat diubah.' }, { status: 409 }); }
    await client.query('UPDATE orders SET status=$1 WHERE id=$2', [body.status, id]);
    if (body.status === 'cancelled') {
      await client.query(`UPDATE products p SET stock = p.stock + oi.quantity FROM order_items oi WHERE oi.order_id=$1 AND oi.product_id=p.id`, [id]);
    }
    await client.query('COMMIT');
    return NextResponse.json({ ok: true, status: body.status });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Gagal memperbarui pesanan:', error);
    return NextResponse.json({ error: 'Status pesanan belum dapat diperbarui.' }, { status: 500 });
  } finally { client.release(); }
}
