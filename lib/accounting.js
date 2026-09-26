export const SYSTEM_ACCOUNT_CODES = {
  cash: '1000',
  inventory: '1100',
  sales: '4000',
  shipping: '4100',
  cogs: '5000',
};

export function orderPaymentLines(order) {
  const subtotal = integerAmount(order.subtotal);
  const total = integerAmount(order.total);
  const cogs = integerAmount(order.cogs);
  if (subtotal === null || total === null || cogs === null || total < subtotal) throw new Error('INVALID_ORDER_ACCOUNTING_VALUES');
  const shipping = total - subtotal;
  return [
    { code: SYSTEM_ACCOUNT_CODES.cash, debit: total, credit: 0 },
    { code: SYSTEM_ACCOUNT_CODES.sales, debit: 0, credit: subtotal },
    ...(shipping ? [{ code: SYSTEM_ACCOUNT_CODES.shipping, debit: 0, credit: shipping }] : []),
    ...(cogs ? [{ code: SYSTEM_ACCOUNT_CODES.cogs, debit: cogs, credit: 0 }, { code: SYSTEM_ACCOUNT_CODES.inventory, debit: 0, credit: cogs }] : []),
  ];
}

function integerAmount(value) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 && amount <= Number.MAX_SAFE_INTEGER ? amount : null;
}

export function parseManualJournal(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Data jurnal tidak valid.' };
  const entryDate = typeof body.entryDate === 'string' ? body.entryDate : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const inputLines = Array.isArray(body.lines) ? body.lines : [];
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(entryDate) ? new Date(`${entryDate}T00:00:00Z`) : null;
  if (!parsedDate || Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== entryDate) return { error: 'Tanggal jurnal tidak valid.' };
  if (!description || description.length > 500) return { error: 'Keterangan jurnal wajib diisi maksimal 500 karakter.' };
  if (inputLines.length < 2 || inputLines.length > 50) return { error: 'Jurnal harus memiliki 2 sampai 50 baris.' };
  const lines = inputLines.map(line => ({
    accountId: typeof line?.accountId === 'string' || typeof line?.accountId === 'number' ? String(line.accountId) : '',
    description: typeof line?.description === 'string' ? line.description.trim().slice(0, 300) : '',
    debit: integerAmount(line?.debit),
    credit: integerAmount(line?.credit),
  }));
  if (lines.some(line => !/^\d+$/.test(line.accountId) || line.debit === null || line.credit === null || !((line.debit > 0 && line.credit === 0) || (line.credit > 0 && line.debit === 0)))) return { error: 'Setiap baris harus memiliki satu akun dan hanya nilai debit atau kredit.' };
  const debit = lines.reduce((sum, line) => sum + line.debit, 0);
  const credit = lines.reduce((sum, line) => sum + line.credit, 0);
  if (debit === 0 || debit !== credit || !Number.isSafeInteger(debit)) return { error: 'Total debit dan kredit harus sama dan lebih dari nol.' };
  return { data: { entryDate, description, lines, total: debit } };
}

export async function postOrderPayment(client, orderId) {
  const { rows: [order] } = await client.query(`SELECT o.id, o.subtotal, o.total, o.paid_at,
    COALESCE(SUM(oi.unit_cost::bigint * oi.quantity), 0)::bigint AS cogs
    FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.id = $1 AND o.status = 'paid' GROUP BY o.id`, [orderId]);
  if (!order) throw new Error('PAID_ORDER_NOT_FOUND');
  const inserted = await client.query(`INSERT INTO journal_entries (entry_date, description, source_type, source_id)
    VALUES (($1::timestamptz AT TIME ZONE 'Asia/Jakarta')::date, $2, 'order_payment', $3)
    ON CONFLICT DO NOTHING RETURNING id`, [order.paid_at, `Pembayaran pesanan #${order.id}`, order.id]);
  if (!inserted.rows.length) return null;
  const entryId = inserted.rows[0].id;
  const lines = orderPaymentLines(order);
  const { rows: accounts } = await client.query('SELECT id, code FROM accounts WHERE code = ANY($1::text[])', [lines.map(line => line.code)]);
  const ids = new Map(accounts.map(account => [account.code, account.id]));
  if (lines.some(line => !ids.has(line.code))) throw new Error('ACCOUNTING_ACCOUNTS_MISSING');
  for (const line of lines) {
    await client.query('INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit) VALUES ($1,$2,$3,$4)', [entryId, ids.get(line.code), line.debit, line.credit]);
  }
  return entryId;
}
