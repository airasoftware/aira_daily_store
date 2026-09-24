import nodemailer from 'nodemailer';
import { getNotificationSettings } from './notification-settings.js';
import { orderEmailContent, invoiceNumber } from './order-email.js';
import { createInvoicePdf } from './order-invoice.js';
import { orderNumber } from './order-number.js';

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export function normalizeWhatsAppPhone(value) {
  const compact = value.replace(/[\s().-]/g, '');
  const number = compact.startsWith('+62') ? compact.slice(1) : compact.startsWith('0') ? `62${compact.slice(1)}` : compact;
  return /^628\d{8,11}$/.test(number) ? number : null;
}

export function orderMessage(order) {
  const lines = order.items.map(item => `- ${item.name} x${item.quantity}: ${money(item.price * item.quantity)}`);
  return `Halo ${order.customerName}, pesanan Aira Daily ${orderNumber(order)} sudah kami terima.\n\n${lines.join('\n')}\n\nSubtotal: ${money(order.total)}. Biaya pengiriman dan pembayaran akan kami konfirmasi kemudian. Terima kasih!`;
}

async function sendWhatsApp(order, settings) {
  if (!order.whatsappOptIn) return 'not_requested';
  const token = settings.whatsappAccessToken;
  const phoneNumberId = settings.whatsappPhoneNumberId;
  const version = settings.whatsappApiVersion;
  if (!token || !phoneNumberId || !version) return 'unavailable';

  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: order.phone,
      type: 'template',
      template: {
        name: 'aira_order_received',
        language: { code: 'id' },
        components: [{ type: 'body', parameters: [
          { type: 'text', text: order.customerName },
          { type: 'text', text: orderNumber(order) },
          { type: 'text', text: money(order.total) },
        ] }],
      },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Meta HTTP ${response.status}`);
  return 'sent';
}

async function sendEmail(order, settings) {
  const password = settings.gmailAppPassword;
  const senderEmail = settings.senderEmail;
  if (!password) return 'unavailable';
  const transporter = emailTransport(settings);
  const content = orderEmailContent(order);
  const invoice = await createInvoicePdf(order);
  await transporter.sendMail({
    from: `Aira Daily <${senderEmail}>`,
    to: order.email,
    ...content,
    attachments: [{ filename: `${invoiceNumber(order)}.pdf`, content: invoice, contentType: 'application/pdf' }],
  });
  return 'sent';
}

function emailTransport(settings) {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: settings.senderEmail, pass: settings.gmailAppPassword },
    connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 8000,
  });
}

export async function sendTestEmail() {
  const settings = await getNotificationSettings();
  if (!settings.gmailAppPassword) throw new Error('App Password belum tersedia.');
  const order = {
    id: '0', createdAt: new Date(), customerName: 'Pelanggan Contoh', email: settings.senderEmail,
    phone: '6281234567890', address: 'Alamat contoh untuk pratinjau', city: 'Jakarta', postalCode: '12345',
    total: 125000, items: [{ name: 'Sprei Contoh', quantity: 1, price: 125000 }],
  };
  const content = orderEmailContent(order, { preview: true });
  const invoice = await createInvoicePdf(order, { preview: true });
  const result = await emailTransport(settings).sendMail({
    from: `Aira Daily <${settings.senderEmail}>`,
    to: settings.senderEmail,
    ...content,
    attachments: [{ filename: `${invoiceNumber(order)}-CONTOH.pdf`, content: invoice, contentType: 'application/pdf' }],
  });
  if (!result.accepted?.some(address => address.toLowerCase() === settings.senderEmail.toLowerCase())) throw new Error('SMTP tidak menerima alamat tujuan.');
  return settings.senderEmail;
}

export async function sendOrderNotifications(order, providedSettings) {
  let settings;
  try { settings = providedSettings || await getNotificationSettings(); }
  catch (error) {
    console.error(`Pengaturan notifikasi pesanan #${order.id} gagal dimuat.`, error.code || error.name);
    return { whatsapp: 'failed', email: 'failed' };
  }
  const channels = await Promise.allSettled([sendWhatsApp(order, settings), sendEmail(order, settings)]);
  return Object.fromEntries(channels.map((result, index) => {
    const channel = index === 0 ? 'whatsapp' : 'email';
    if (result.status === 'fulfilled') return [channel, result.value];
    console.error(`Notifikasi ${channel} pesanan #${order.id} gagal.`, result.reason?.code || result.reason?.name || 'provider_error');
    return [channel, 'failed'];
  }));
}
