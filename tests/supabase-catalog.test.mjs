import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://catalog-test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';

const requests = [];
let expectedHost = 'catalog-test.supabase.co';
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(input.toString());
  requests.push({ url, headers: new Headers(options.headers) });
  assert.equal(url.host, expectedHost);
  assert.equal(url.pathname, '/rest/v1/products');
  const rows = url.searchParams.get('slug') === 'eq.arsip' ? [] : [{ id: 1, slug: 'tas-anak', name: 'Tas Anak', is_active: true, price: 100000 }];
  return new Response(JSON.stringify(rows), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};

const { getProduct, getProducts } = await import('../lib/products.js');

test('katalog memakai URL dan publishable key Supabase dari environment', async () => {
  const products = await getProducts({ category: 'Tas', search: 'Anak', sort: 'price-desc' });
  assert.equal(products[0].name, 'Tas Anak');
  const request = requests.at(-1);
  assert.equal(request.url.searchParams.get('is_active'), 'eq.true');
  assert.equal(request.url.searchParams.get('category'), 'eq.Tas');
  assert.equal(request.url.searchParams.get('name'), 'ilike.%Anak%');
  assert.equal(request.url.searchParams.get('order'), 'price.desc');
  assert.equal(request.headers.get('apikey'), 'sb_publishable_test');
});

test('detail produk memakai Supabase dan menolak produk arsip', async () => {
  const product = await getProduct('tas-anak');
  assert.equal(product.slug, 'tas-anak');
  const request = requests.at(-1);
  assert.equal(request.url.searchParams.get('slug'), 'eq.tas-anak');
  assert.equal(request.url.searchParams.get('is_active'), 'eq.true');
  assert.equal(await getProduct('arsip'), null);
});

test('konfigurasi Supabase yang baru terisi satu variabel gagal dengan jelas', async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  await assert.rejects(getProducts(), /Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
});

test('katalog menerima env bawaan integrasi Vercel tanpa memakai secret key', async () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.SUPABASE_URL = 'https://vercel-catalog-test.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_vercel_test';
  process.env.SUPABASE_SECRET_KEY = 'sb_secret_must_not_be_used';
  expectedHost = 'vercel-catalog-test.supabase.co';

  assert.equal((await getProducts())[0].name, 'Tas Anak');
  assert.equal(requests.at(-1).headers.get('apikey'), 'sb_publishable_vercel_test');
});
