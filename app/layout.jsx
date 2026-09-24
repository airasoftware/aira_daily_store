import './globals.css';
import { CartProvider } from '../components/cart-provider';
import { Header } from '../components/header';

export const metadata = {
  title: 'Aira Daily Store',
  description: 'Sprei, pakaian anak dan dewasa, serta kebutuhan harian untuk rumah dan keluarga.'
};

export default function RootLayout({ children }) {
  return <html lang="id"><body><CartProvider><div className="ticker"><span>SPREI & KAMAR&nbsp; · &nbsp;BAJU ANAK&nbsp; · &nbsp;BAJU DEWASA&nbsp; · &nbsp;PILIHAN HARIAN&nbsp; · &nbsp;SPREI & KAMAR&nbsp; · &nbsp;BAJU ANAK&nbsp; · &nbsp;BAJU DEWASA&nbsp; · &nbsp;PILIHAN HARIAN&nbsp; ·</span></div><Header />{children}<footer className="footer"><div><img className="footer-logo" src="/aira-daily-logo.png" alt="Aira Daily" /><p>Pilihan harian untuk rumah dan keluarga.</p></div><div><a href="/shop">Belanja</a><a href="/cart">Keranjang</a><a href="/checkout">Checkout</a></div><small>© {new Date().getFullYear()} Aira Daily Store</small></footer></CartProvider></body></html>;
}
