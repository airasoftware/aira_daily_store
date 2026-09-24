import path from 'node:path';
import PDFDocument from 'pdfkit';
import { invoiceNumber } from './order-email.js';
import { orderNumber } from './order-number.js';

const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const ink = '#293c30';
const muted = '#6d796e';
const orange = '#bd7149';
const left = 48;
const right = 547;

function text(doc, value, x, y, options = {}) {
  doc.text(String(value ?? ''), x, y, { lineBreak: false, ...options });
}

function tableHeader(doc, y) {
  doc.rect(left, y, right - left, 30).fill(ink);
  doc.fillColor('#fff').font('NotoBold').fontSize(9);
  text(doc, 'PRODUK', left + 13, y + 10, { width: 240 });
  text(doc, 'JML', 321, y + 10, { width: 35, align: 'center' });
  text(doc, 'HARGA', 370, y + 10, { width: 72, align: 'right' });
  text(doc, 'JUMLAH', 452, y + 10, { width: 82, align: 'right' });
  return y + 30;
}

function pageHeader(doc, order, continued = false, preview = false) {
  doc.fillColor(ink).rect(0, 0, 595.28, 9).fill();
  doc.image(path.join(process.cwd(), 'public/aira-daily-logo.png'), left, 29, { fit: [55, 55] });
  doc.fillColor(ink).font('NotoBold').fontSize(19);
  text(doc, 'Aira Daily', 112, 43);
  doc.fillColor(muted).font('Noto').fontSize(9);
  text(doc, 'INVOICE PESANAN', 112, 69);
  doc.fillColor(ink).font('NotoBold').fontSize(15);
  text(doc, invoiceNumber(order), 302, 46, { width: 245, align: 'right' });
  if (continued || preview) {
    doc.fillColor(muted).font('Noto').fontSize(9);
    text(doc, preview ? 'CONTOH - BUKAN TAGIHAN' : 'Lanjutan rincian produk', 302, 69, { width: 245, align: 'right' });
  }
  doc.moveTo(left, 106).lineTo(right, 106).strokeColor('#dfdfd6').lineWidth(1).stroke();
  doc.fillColor(muted).font('Noto').fontSize(8);
  text(doc, `No. pesanan: ${orderNumber(order)}`, left, 112);
}

export function createInvoicePdf(order, { preview = false } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true, info: { Title: `Invoice ${invoiceNumber(order)}`, Author: 'Aira Daily' } });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    try {
      doc.registerFont('Noto', path.join(process.cwd(), 'public/fonts/noto-sans-regular.woff'));
      doc.registerFont('NotoBold', path.join(process.cwd(), 'public/fonts/noto-sans-bold.woff'));
      pageHeader(doc, order, false, preview);

      const date = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(order.createdAt));
      doc.fillColor(orange).font('NotoBold').fontSize(8);
      text(doc, 'TANGGAL PESANAN', left, 130);
      text(doc, 'STATUS', 304, 130);
      doc.fillColor(ink).font('Noto').fontSize(10);
      text(doc, date, left, 149);
      text(doc, preview ? 'Dokumen contoh' : 'Menunggu konfirmasi', 304, 149);

      doc.fillColor(ink).font('NotoBold').fontSize(10);
      text(doc, 'DITAGIHKAN KEPADA', left, 192);
      text(doc, 'ALAMAT PENGIRIMAN', 304, 192);
      doc.font('Noto').fontSize(9).fillColor(ink);
      const customer = [order.customerName, order.email, order.phone].join('\n');
      const destination = [order.address, `${order.city} ${order.postalCode}`].join('\n');
      const customerHeight = doc.heightOfString(customer, { width: 220, lineGap: 3 });
      const destinationHeight = doc.heightOfString(destination, { width: 235, lineGap: 3 });
      doc.text(customer, left, 214, { width: 220, lineGap: 3 });
      doc.text(destination, 304, 214, { width: 235, lineGap: 3 });
      let y = Math.max(318, 214 + Math.max(customerHeight, destinationHeight) + 34);
      if (y > 690) { doc.addPage(); pageHeader(doc, order, true, preview); y = 125; }
      y = tableHeader(doc, y);

      for (const item of order.items) {
        doc.font('Noto').fontSize(9);
        const rowHeight = Math.max(37, doc.heightOfString(item.name, { width: 245 }) + 17);
        if (y + rowHeight > 735) {
          doc.addPage();
          pageHeader(doc, order, true, preview);
          y = tableHeader(doc, 125);
        }
        doc.fillColor(ink).font('Noto').fontSize(9);
        doc.text(item.name, left + 13, y + 12, { width: 245 });
        text(doc, item.quantity, 321, y + 12, { width: 35, align: 'center' });
        text(doc, money(item.price), 365, y + 12, { width: 77, align: 'right' });
        text(doc, money(item.price * item.quantity), 449, y + 12, { width: 85, align: 'right' });
        y += rowHeight;
        doc.moveTo(left, y).lineTo(right, y).strokeColor('#e7e5dd').lineWidth(0.7).stroke();
      }

      if (y + 157 > 755) {
        doc.addPage();
        pageHeader(doc, order, true, preview);
        y = 125;
      }
      y += 22;
      doc.fillColor(muted).font('Noto').fontSize(9);
      text(doc, 'Subtotal produk', 325, y, { width: 120 });
      doc.fillColor(ink).font('NotoBold');
      text(doc, money(order.total), 449, y, { width: 85, align: 'right' });
      y += 25;
      doc.fillColor(muted).font('Noto');
      text(doc, 'Ongkos kirim', 325, y, { width: 120 });
      text(doc, 'Dikonfirmasi', 449, y, { width: 85, align: 'right' });
      y += 37;
      doc.roundedRect(left, y, right - left, 68, 6).fill('#f7ecde');
      doc.fillColor(ink).font('NotoBold').fontSize(10);
      text(doc, 'Total sementara', left + 17, y + 14);
      text(doc, money(order.total), 392, y + 14, { width: 138, align: 'right' });
      doc.fillColor('#66543b').font('Noto').fontSize(8);
      text(doc, 'Tagihan akhir dan cara pembayaran akan dikonfirmasi. Belum dibayar.', left + 17, y + 39, { width: 465 });

      const pages = doc.bufferedPageRange().count;
      for (let page = 0; page < pages; page++) {
        doc.switchToPage(page);
        doc.moveTo(left, 786).lineTo(right, 786).strokeColor('#dfdfd6').lineWidth(0.7).stroke();
        doc.fillColor(muted).font('Noto').fontSize(8);
        text(doc, 'Aira Daily  |  Invoice pesanan', left, 797);
        text(doc, `${page + 1} / ${pages}`, 490, 797, { width: 57, align: 'right' });
      }
      doc.end();
    } catch (error) { reject(error); }
  });
}
