import { test } from 'node:test';
import assert from 'node:assert/strict';
import { variantImage } from '../lib/variant-image.js';

const product = {
  image_url: 'utama.jpg',
  variants: [
    { color: 'Merah', size: 'M', image_url: 'merah-m.jpg' },
    { color: 'Merah', size: 'L', image_url: null },
    { color: 'Biru', size: null, image_url: 'biru.jpg' },
    { color: 'Biru', size: 'M', image_url: null },
    { color: 'Hijau', size: 'M', image_url: null },
  ],
};

test('gambar kombinasi tetap diutamakan', () => {
  assert.equal(variantImage(product, product.variants[0]), 'merah-m.jpg');
});

test('ukuran tanpa gambar memakai gambar dari warna yang sama', () => {
  assert.equal(variantImage(product, product.variants[1]), 'merah-m.jpg');
  assert.equal(variantImage(product, product.variants[3]), 'biru.jpg');
  assert.equal(variantImage(product, null, 'Biru'), 'biru.jpg');
});

test('warna tanpa gambar memakai gambar utama', () => {
  assert.equal(variantImage(product, product.variants[4]), 'utama.jpg');
  assert.equal(variantImage(product, null, 'Hijau'), 'utama.jpg');
});
