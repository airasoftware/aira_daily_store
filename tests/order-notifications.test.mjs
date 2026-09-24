import assert from 'node:assert/strict';
import test from 'node:test';
import nodemailer from 'nodemailer';
import { normalizeWhatsAppPhone, orderMessage, sendOrderNotifications } from '../lib/order-notifications.js';
import { decryptNotificationSecret, encryptNotificationSecret } from '../lib/notification-settings.js';
import { invoiceNumber, orderEmailContent } from '../lib/order-email.js';
import { orderNumber } from '../lib/order-number.js';

test('nomor pesanan unik dari ID dan tanggal Jakarta tanpa mengubah ID', () => {
  const first = { id: '42', createdAt: '2026-09-23T17:30:00Z' };
  const second = { id: '43', createdAt: first.createdAt };
  assert.equal(orderNumber(first), 'ORD-20260924-000042');
  assert.equal(invoiceNumber(first), 'INV-20260924-000042');
  assert.notEqual(orderNumber(first), orderNumber(second));
  assert.equal(orderNumber({ id: '1234567', createdAt: first.createdAt }), 'ORD-20260924-1234567');
  assert.equal(first.id, '42');
});

test('nomor WhatsApp Indonesia dinormalisasi dan nomor tidak valid ditolak', () => {
  assert.equal(normalizeWhatsAppPhone('0812-3456-7890'), '6281234567890');
  assert.equal(normalizeWhatsAppPhone('+62 812 3456 7890'), '6281234567890');
  assert.equal(normalizeWhatsAppPhone('6281234567890'), '6281234567890');
  assert.equal(normalizeWhatsAppPhone('12345'), null);
});

test('kredensial admin terenkripsi dan perubahan ciphertext ditolak', () => {
  const originalKey = process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET = 'a'.repeat(64);
  try {
    const ciphertext = encryptNotificationSecret('secret-for-test');
    assert.doesNotMatch(ciphertext, /secret-for-test/);
    assert.equal(decryptNotificationSecret(ciphertext), 'secret-for-test');
    const parts = ciphertext.split('.');
    parts[2] = `${parts[2][0] === 'A' ? 'B' : 'A'}${parts[2].slice(1)}`;
    assert.throws(() => decryptNotificationSecret(parts.join('.')));
  } finally {
    if (originalKey === undefined) delete process.env.ADMIN_SESSION_SECRET; else process.env.ADMIN_SESSION_SECRET = originalKey;
  }
});

test('email memakai alamat pengirim yang diminta dan tujuan dari checkout', async () => {
  const originalTransport = nodemailer.createTransport;
  let sent;
  nodemailer.createTransport = options => {
    assert.equal(options.auth.user, 'it.airasolutions@gmail.com');
    return { sendMail: async message => { sent = message; } };
  };
  try {
    const order = { id: '43', createdAt: '2026-09-24T08:00:00Z', total: 75000, customerName: 'Aira', email: 'buyer@example.com', phone: '6281234567890', address: 'Jl. Mawar 12', city: 'Jakarta', postalCode: '12345', items: [{ name: 'Sprei', price: 75000, quantity: 1 }] };
    const result = await sendOrderNotifications(order, { senderEmail: 'it.airasolutions@gmail.com', gmailAppPassword: 'test-password' });
    assert.deepEqual(result, { whatsapp: 'not_requested', email: 'sent' });
    assert.match(sent.from, /it\.airasolutions@gmail\.com/);
    assert.equal(sent.to, 'buyer@example.com');
    assert.equal(sent.subject, 'Invoice INV-20260924-000043 | Pesanan Aira Daily diterima');
    assert.match(sent.text, /Pesanan ORD-20260924-000043 sudah kami terima/);
    assert.match(sent.html, /Sprei/);
    assert.match(sent.html, /Jl\. Mawar 12/);
    assert.equal(sent.attachments[0].filename, `${invoiceNumber(order)}.pdf`);
    assert.equal(sent.attachments[0].contentType, 'application/pdf');
    assert.equal(sent.attachments[0].content.subarray(0, 4).toString(), '%PDF');
  } finally {
    nodemailer.createTransport = originalTransport;
  }
});

test('nama pelanggan di email di-escape dan ongkir belum dinyatakan final', () => {
  const content = orderEmailContent({ id: '1', createdAt: '2026-09-24T08:00:00Z', customerName: '<Aira>', total: 10000, address: 'Jl. <Mawar>', city: 'Bandung', postalCode: '40111', items: [{ name: '<Sprei>', price: 10000, quantity: 1 }] });
  assert.match(content.html, /&lt;Aira&gt;/);
  assert.match(content.html, /&lt;Sprei&gt;/);
  assert.match(content.html, /Akan dikonfirmasi/);
  assert.match(content.text, /Pesanan ini belum dibayar/);
});

test('konfirmasi memuat ringkasan pesanan dan WhatsApp memakai template yang disetujui', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true };
  };
  const order = { id: '42', createdAt: '2026-09-24T08:00:00Z', total: 150000, customerName: 'Aira', email: 'buyer@example.com', phone: '6281234567890', whatsappOptIn: true, items: [{ name: 'Sprei', price: 75000, quantity: 2 }] };
  try {
    assert.match(orderMessage(order), /Sprei x2/);
    assert.match(orderMessage(order), /150\.000/);
    assert.deepEqual(await sendOrderNotifications(order, { whatsappAccessToken: 'test-token', whatsappPhoneNumberId: '123', whatsappApiVersion: 'v-test' }), { whatsapp: 'sent', email: 'unavailable' });
    assert.equal(request.url, 'https://graph.facebook.com/v-test/123/messages');
    const body = JSON.parse(request.options.body);
    assert.equal(body.to, order.phone);
    assert.equal(body.template.name, 'aira_order_received');
    assert.deepEqual(body.template.components[0].parameters.map(value => value.text), ['Aira', 'ORD-20260924-000042', 'Rp 150.000']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('tanpa persetujuan pelanggan WhatsApp tidak dikirim', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('WhatsApp tidak boleh dipanggil'); };
  try {
    const result = await sendOrderNotifications({ id: '44', whatsappOptIn: false }, { whatsappAccessToken: 'token', whatsappPhoneNumberId: '123', whatsappApiVersion: 'v-test' });
    assert.deepEqual(result, { whatsapp: 'not_requested', email: 'unavailable' });
  } finally { globalThis.fetch = originalFetch; }
});
