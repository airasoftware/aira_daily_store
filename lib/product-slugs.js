export function slugFromName(name) {
  return name.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180).replace(/-+$/g, '') || 'produk';
}

export function numberedSlug(base, number) {
  if (number === 1) return base;
  const suffix = `-${number}`;
  return `${base.slice(0, 180 - suffix.length).replace(/-+$/g, '')}${suffix}`;
}
