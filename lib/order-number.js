function documentNumber(prefix, order) {
  const date = new Date(order.createdAt ?? order.created_at);
  if (Number.isNaN(date.getTime())) throw new Error('Tanggal pesanan tidak valid.');
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date).map(part => [part.type, part.value]));
  const day = `${parts.year}${parts.month}${parts.day}`;
  return `${prefix}-${day}-${String(order.id).padStart(6, '0')}`;
}

export const orderNumber = order => documentNumber('ORD', order);
export const invoiceNumber = order => documentNumber('INV', order);
