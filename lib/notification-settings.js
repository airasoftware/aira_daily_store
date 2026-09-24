import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { getPool } from './db.js';

export const defaultSender = { whatsappSender: '6285111412046', senderEmail: 'it.airasolutions@gmail.com' };

function encryptionKey() {
  const value = process.env.ADMIN_SESSION_SECRET || '';
  if (value.length < 32) throw new Error('ADMIN_SESSION_SECRET harus minimal 32 karakter.');
  return Buffer.from(hkdfSync('sha256', value, '', 'aira-notification-settings-v1', 32));
}

export function encryptNotificationSecret(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map(part => part.toString('base64url')).join('.');
}

export function decryptNotificationSecret(value) {
  if (!value) return '';
  const [iv, tag, data] = value.split('.').map(part => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

function readSecret(value) {
  try { return decryptNotificationSecret(value); }
  catch {
    console.error('Kredensial notifikasi tersimpan tidak dapat didekripsi. Isi ulang melalui admin.');
    return '';
  }
}

export async function getNotificationSettings() {
  const { rows: [row] } = await getPool().query('SELECT * FROM notification_settings WHERE id = 1');
  if (!row) throw new Error('Jalankan db:migrate sebelum memakai pengaturan notifikasi.');
  return {
    whatsappSender: row.whatsapp_sender,
    whatsappPhoneNumberId: row.whatsapp_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    whatsappApiVersion: row.whatsapp_api_version || process.env.WHATSAPP_API_VERSION || '',
    whatsappAccessToken: readSecret(row.whatsapp_access_token_ciphertext) || process.env.WHATSAPP_ACCESS_TOKEN || '',
    senderEmail: row.sender_email,
    gmailAppPassword: readSecret(row.gmail_app_password_ciphertext) || process.env.GMAIL_APP_PASSWORD || '',
  };
}

export async function getNotificationSettingsForAdmin() {
  const settings = await getNotificationSettings();
  return {
    whatsappSender: settings.whatsappSender,
    whatsappPhoneNumberId: settings.whatsappPhoneNumberId,
    whatsappApiVersion: settings.whatsappApiVersion,
    whatsappTokenConfigured: Boolean(settings.whatsappAccessToken),
    senderEmail: settings.senderEmail,
    gmailPasswordConfigured: Boolean(settings.gmailAppPassword),
  };
}

export async function saveNotificationSettings(settings) {
  const waCiphertext = settings.whatsappAccessToken ? encryptNotificationSecret(settings.whatsappAccessToken) : null;
  const gmailCiphertext = settings.gmailAppPassword ? encryptNotificationSecret(settings.gmailAppPassword) : null;
  await getPool().query(`UPDATE notification_settings SET
    whatsapp_sender = $1, whatsapp_phone_number_id = $2, whatsapp_api_version = $3,
    whatsapp_access_token_ciphertext = COALESCE($4, whatsapp_access_token_ciphertext),
    sender_email = $5, gmail_app_password_ciphertext = COALESCE($6, gmail_app_password_ciphertext),
    updated_at = NOW() WHERE id = 1`, [settings.whatsappSender, settings.whatsappPhoneNumberId, settings.whatsappApiVersion, waCiphertext, settings.senderEmail, gmailCiphertext]);
}
