import './globals.css';
import { CartProvider } from '../components/cart-provider';
import { Header } from '../components/header';
import { ServiceWorkerRegistration } from '../components/service-worker-registration';

export const metadata = {
  title: 'Aira Daily Store',
  description: 'Sprei, pakaian anak dan dewasa, serta kebutuhan harian untuk rumah dan keluarga.',
  applicationName: 'Aira Daily Store',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Aira Daily', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' }, { url: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png' }],
    apple: [{ url: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' }]
  }
};

export const viewport = { themeColor: '#fffdf6' };

const tickerItems = ['SPREI & KAMAR', 'BAJU ANAK', 'BAJU DEWASA', 'PILIHAN HARIAN'];

export default function RootLayout({ children }) {
  return <html lang="id"><body><ServiceWorkerRegistration /><CartProvider><div className="ticker"><div className="marquee-track">{[0, 1].map(copy => <div className="marquee-group" aria-hidden={copy === 1 ? 'true' : undefined} key={copy}>{tickerItems.map(item => <span key={item}>{item}<span aria-hidden="true"> · </span></span>)}</div>)}</div></div><Header />{children}<footer className="footer"><div><img className="footer-logo" src="/aira-daily-logo.png" alt="Aira Daily" /><p>Pilihan harian untuk rumah dan keluarga.</p></div><div><a href="/shop">Belanja</a><a href="/cart">Keranjang</a><a href="/checkout">Checkout</a></div><small>© {new Date().getFullYear()} Aira Daily Store</small></footer></CartProvider></body></html>;
}
