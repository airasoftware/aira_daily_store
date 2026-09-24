import './globals.css';
import { CartProvider } from '../components/cart-provider';
import { Header } from '../components/header';

export const metadata = {
  title: 'Aira Daily Store | Outdoor Kids',
  description: 'Perlengkapan outdoor untuk penjelajah kecil.'
};

export default function RootLayout({ children }) {
  return <html lang="id"><body><CartProvider><div className="ticker"><span>BE BRAVE&nbsp; ✦ &nbsp;BE FUN&nbsp; ✦ &nbsp;BE CHEERFUL&nbsp; ✦ &nbsp;OUTDOOR EXPLORER&nbsp; ✦ &nbsp;BE BRAVE&nbsp; ✦ &nbsp;BE FUN&nbsp; ✦ &nbsp;BE CHEERFUL&nbsp; ✦ &nbsp;OUTDOOR EXPLORER&nbsp; ✦</span></div><Header />{children}<footer className="footer"><div><strong>aira<span>daily</span></strong><p>Untuk langkah kecil yang penuh cerita.</p></div><div><a href="/shop">Belanja</a><a href="/cart">Keranjang</a><a href="/checkout">Checkout</a></div><small>© {new Date().getFullYear()} Aira Daily Store</small></footer></CartProvider></body></html>;
}
