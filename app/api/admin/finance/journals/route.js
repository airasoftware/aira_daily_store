import { NextResponse } from 'next/server';
import { isAdmin, sameOrigin } from '../../../../../lib/admin-auth';
import { parseManualJournal } from '../../../../../lib/accounting';
import { getPool } from '../../../../../lib/db';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Sesi admin berakhir. Masuk kembali.' }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Asal permintaan tidak valid.' }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Data jurnal tidak valid.' }, { status: 400 }); }
  const parsed = parseManualJournal(body);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const accountIds = [...new Set(parsed.data.lines.map(line => line.accountId))];
    const accounts = await client.query('SELECT id FROM accounts WHERE id = ANY($1::bigint[]) AND is_active = TRUE', [accountIds]);
    if (accounts.rows.length !== accountIds.length) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Salah satu akun tidak tersedia.' }, { status: 400 }); }
    const entry = await client.query("INSERT INTO journal_entries (entry_date, description, source_type) VALUES ($1,$2,'manual') RETURNING id", [parsed.data.entryDate, parsed.data.description]);
    for (const line of parsed.data.lines) await client.query('INSERT INTO journal_lines (journal_entry_id, account_id, description, debit, credit) VALUES ($1,$2,$3,$4,$5)', [entry.rows[0].id, line.accountId, line.description, line.debit, line.credit]);
    await client.query('COMMIT');
    return NextResponse.json({ id: entry.rows[0].id }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK'); console.error('Gagal menyimpan jurnal:', error);
    return NextResponse.json({ error: 'Jurnal belum dapat disimpan.' }, { status: 500 });
  } finally { client.release(); }
}
