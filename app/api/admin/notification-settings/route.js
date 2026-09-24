import { NextResponse } from 'next/server';
import { isAdmin, sameOrigin } from '../../../../lib/admin-auth';
import { getNotificationSettingsForAdmin, saveNotificationSettings } from '../../../../lib/notification-settings';
import { normalizeWhatsAppPhone } from '../../../../lib/order-notifications';

export const runtime = 'nodejs';

export async function PUT(request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Sesi admin berakhir. Masuk kembali.' }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Asal permintaan tidak valid.' }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Data pengaturan tidak valid.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Data pengaturan tidak valid.' }, { status: 400 });
  const value = key => typeof body[key] === 'string' ? body[key].trim() : '';
  const whatsappSender = normalizeWhatsAppPhone(value('whatsappSender'));
  const whatsappPhoneNumberId = value('whatsappPhoneNumberId');
  const whatsappApiVersion = value('whatsappApiVersion');
  const whatsappAccessToken = value('whatsappAccessToken');
  const senderEmail = value('senderEmail').toLowerCase();
  const gmailAppPassword = value('gmailAppPassword').replace(/\s/g, '');
  if (!whatsappSender || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail) || senderEmail.length > 254) {
    return NextResponse.json({ error: 'Nomor WhatsApp atau email pengirim tidak valid.' }, { status: 400 });
  }
  if (whatsappPhoneNumberId && !/^\d{1,30}$/.test(whatsappPhoneNumberId)) return NextResponse.json({ error: 'Phone Number ID Meta harus berupa angka.' }, { status: 400 });
  if (whatsappApiVersion && !/^v\d+\.\d+$/.test(whatsappApiVersion)) return NextResponse.json({ error: 'Versi Graph API harus seperti v24.0.' }, { status: 400 });
  if (whatsappAccessToken.length > 4096 || gmailAppPassword.length > 256) return NextResponse.json({ error: 'Kredensial terlalu panjang.' }, { status: 400 });
  try {
    const previous = await getNotificationSettingsForAdmin();
    if (whatsappSender !== previous.whatsappSender && !whatsappPhoneNumberId) return NextResponse.json({ error: 'Isi Phone Number ID untuk nomor WhatsApp pengirim yang baru.' }, { status: 400 });
    if (senderEmail !== previous.senderEmail && !gmailAppPassword) return NextResponse.json({ error: 'Isi App Password dari email pengirim yang baru.' }, { status: 400 });
    await saveNotificationSettings({ whatsappSender, whatsappPhoneNumberId, whatsappApiVersion, whatsappAccessToken, senderEmail, gmailAppPassword });
    return NextResponse.json({ settings: await getNotificationSettingsForAdmin() });
  } catch (error) {
    console.error('Gagal menyimpan pengaturan notifikasi:', error.code || error.name);
    return NextResponse.json({ error: 'Pengaturan belum dapat disimpan. Periksa koneksi database dan secret sesi admin.' }, { status: 500 });
  }
}
