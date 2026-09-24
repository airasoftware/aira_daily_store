import './globals.css';
import { CartProvider } from '../components/cart-provider';
import { Header } from '../components/header';

export const metadata = {
  title: 'Aira Daily Store',
  description: 'Sprei, pakaian anak dan dewasa, serta kebutuhan harian untuk rumah dan keluarga.'
};

const tickerItems = ['SPREI & KAMAR', 'BAJU ANAK', 'BAJU DEWASA', 'PILIHAN HARIAN'];

export default function RootLayout({ children }) {
  return <html lang="id"><body><CartProvider><div className="ticker"><div className="marquee-track">{[0, 1].map(copy => <div className="marquee-group" aria-hidden={copy === 1 ? 'true' : undefined} key={copy}>{tickerItems.map(item => <span key={item}>{item}<span aria-hidden="true"> · </span></span>)}</div>)}</div></div><Header />{children}<footer className="footer"><div><img className="footer-logo" src="/aira-daily-logo.png" alt="Aira Daily" /><p>Pilihan harian untuk rumah dan keluarga.</p></div><div><a href="/shop">Belanja</a><a href="/cart">Keranjang</a><a href="/checkout">Checkout</a></div><small>© {new Date().getFullYear()} Aira Daily Store</small></footer></CartProvider></body></html>;
}
