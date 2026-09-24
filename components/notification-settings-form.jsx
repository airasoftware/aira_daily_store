'use client';

import { useState } from 'react';

export function NotificationSettingsForm({ initial }) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState('');

  async function testEmail() {
    setTestingEmail(true);
    setTestResult('');
    try {
      const response = await fetch('/api/admin/notification-settings/test-email', { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Email uji gagal dikirim.');
      setTestResult(`Pratinjau email dan PDF invoice diterima server Gmail untuk ${result.recipient}. Periksa inbox atau folder Spam.`);
    } catch (cause) { setTestResult(cause.message); }
    finally { setTestingEmail(false); }
  }

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setError('');
    setSuccess('');
    const data = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch('/api/admin/notification-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Pengaturan belum dapat disimpan.');
      setSettings(result.settings);
      form.reset();
      setSuccess('Pengaturan tersimpan. Pesanan berikutnya akan memakai pengaturan ini.');
    } catch (cause) { setError(cause.message); }
    finally { setSaving(false); }
  }

  return <form className="settings-form" onSubmit={submit} key={`${settings.whatsappSender}-${settings.senderEmail}`}>
    <section className="editor-card"><h2>WhatsApp pengirim</h2><div className="admin-field-grid">
      <label>Nomor pengirim<input name="whatsappSender" type="tel" required defaultValue={settings.whatsappSender} placeholder="6285111412046" /><small>Nomor ini harus terdaftar pada Meta WhatsApp Business Platform.</small></label>
      <label>Phone Number ID Meta<input name="whatsappPhoneNumberId" inputMode="numeric" defaultValue={settings.whatsappPhoneNumberId} /><small>Harus sesuai dengan nomor pengirim di atas.</small></label>
      <label>Versi Graph API<input name="whatsappApiVersion" defaultValue={settings.whatsappApiVersion} placeholder="v24.0" /></label>
      <label>Access Token Meta<input name="whatsappAccessToken" type="password" autoComplete="new-password" placeholder={settings.whatsappTokenConfigured ? 'Sudah terisi — kosongkan untuk mempertahankan' : 'Belum terisi'} /><small>{settings.whatsappTokenConfigured ? 'Token sudah tersedia. Isi hanya untuk mengganti.' : 'Token belum tersedia.'}</small></label>
    </div><p className="settings-note">Template Meta <strong>aira_order_received</strong> bahasa Indonesia harus sudah disetujui sebelum pesan dapat dikirim.</p></section>
    <section className="editor-card"><h2>Email pengirim</h2><div className="admin-field-grid">
      <label>Alamat Gmail<input name="senderEmail" type="email" required defaultValue={settings.senderEmail} /></label>
      <label>Google App Password<input name="gmailAppPassword" type="password" autoComplete="new-password" placeholder={settings.gmailPasswordConfigured ? 'Sudah terisi — kosongkan untuk mempertahankan' : 'Belum terisi'} /><small>{settings.gmailPasswordConfigured ? 'App Password sudah tersedia. Isi hanya untuk mengganti.' : 'App Password belum tersedia.'}</small></label>
    </div><p className="settings-note">Gunakan App Password dari akun Gmail yang sama dengan alamat pengirim, bukan password login Google.</p><button type="button" className="admin-secondary settings-test-button" disabled={testingEmail || saving || !settings.gmailPasswordConfigured} onClick={testEmail}>{testingEmail ? 'Mengirim pratinjau...' : 'Kirim pratinjau email & invoice'}</button>{testResult && <p className="settings-test-result" role="status">{testResult}</p>}</section>
    {error && <p className="admin-error" role="alert">{error}</p>}{success && <p className="settings-success" role="status">{success}</p>}
    <button className="admin-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan pengaturan'}</button>
  </form>;
}
