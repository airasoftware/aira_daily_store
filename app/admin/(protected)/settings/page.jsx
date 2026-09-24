import { getNotificationSettingsForAdmin } from '../../../../lib/notification-settings';
import { NotificationSettingsForm } from '../../../../components/notification-settings-form';

export default async function SettingsPage() {
  const settings = await getNotificationSettingsForAdmin();
  return <main className="admin-main"><div className="admin-heading"><div><span className="admin-eyebrow">PENGATURAN</span><h1>Notifikasi pesanan<span>.</span></h1><p>Atur nomor WhatsApp dan email yang mengirim konfirmasi pesanan.</p></div></div><NotificationSettingsForm initial={settings} /></main>;
}
