import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isAdmin, sameOrigin } from '../../../../lib/admin-auth';
import { inspectProductImage, MAX_PRODUCT_IMAGE_BYTES, PRODUCT_IMAGE_BUCKET } from '../../../../lib/product-images';

export const runtime = 'nodejs';

function storageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return null;
  return createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

async function ensurePublicBucket(supabase) {
  const { data, error } = await supabase.storage.getBucket(PRODUCT_IMAGE_BUCKET);
  if (!error) {
    if (!data.public) throw new Error('BUCKET_PRIVATE');
    return;
  }
  const created = await supabase.storage.createBucket(PRODUCT_IMAGE_BUCKET, {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: MAX_PRODUCT_IMAGE_BYTES,
  });
  if (created.error) {
    const retry = await supabase.storage.getBucket(PRODUCT_IMAGE_BUCKET);
    if (retry.error || !retry.data.public) throw created.error;
  }
}

export async function POST(request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Sesi admin berakhir. Masuk kembali.' }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Asal permintaan tidak valid.' }, { status: 403 });
  const supabase = storageClient();
  if (!supabase) return NextResponse.json({ error: 'Upload belum dikonfigurasi. Isi SUPABASE_SECRET_KEY di server.' }, { status: 503 });
  const contentLength = Number(request.headers.get('content-length'));
  if (contentLength > MAX_PRODUCT_IMAGE_BYTES + 100_000) return NextResponse.json({ error: 'Gambar harus berukuran maksimal 4 MB.' }, { status: 413 });
  let file;
  try { file = (await request.formData()).get('file'); }
  catch { return NextResponse.json({ error: 'File gambar tidak valid.' }, { status: 400 }); }
  if (!(file instanceof File)) return NextResponse.json({ error: 'Pilih file gambar.' }, { status: 400 });
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) return NextResponse.json({ error: 'Gambar harus berukuran maksimal 4 MB.' }, { status: 413 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const inspected = inspectProductImage(bytes, file.type);
  if (inspected.error) return NextResponse.json({ error: inspected.error }, { status: 400 });
  try {
    await ensurePublicBucket(supabase);
    const path = `products/${randomUUID()}.${inspected.extension}`;
    const bucket = supabase.storage.from(PRODUCT_IMAGE_BUCKET);
    const { error } = await bucket.upload(path, bytes, { contentType: file.type, cacheControl: '31536000', upsert: false });
    if (error) throw error;
    return NextResponse.json({ url: bucket.getPublicUrl(path).data.publicUrl }, { status: 201 });
  } catch (error) {
    console.error('Gagal mengunggah gambar produk:', error);
    return NextResponse.json({ error: error.message === 'BUCKET_PRIVATE' ? 'Bucket product-images harus bersifat publik.' : 'Gambar belum dapat diunggah ke Supabase Storage.' }, { status: 500 });
  }
}
