export async function getVariantOptions(client) {
  const { rows } = await client.query('SELECT id, kind, name FROM variant_options ORDER BY kind, name');
  return rows;
}

export async function getProductVariants(client, productId, { includeInactive = false } = {}) {
  const { rows } = await client.query(`SELECT v.id, v.color_id, v.size_id, v.price, v.stock, v.image_url, v.is_active,
    c.name AS color, s.name AS size FROM product_variants v
    JOIN variant_options c ON c.id = v.color_id AND c.kind = 'color'
    JOIN variant_options s ON s.id = v.size_id AND s.kind = 'size'
    WHERE v.product_id = $1 ${includeInactive ? '' : 'AND v.is_active = TRUE'} ORDER BY c.name, s.name`, [productId]);
  return rows;
}

export async function saveProductVariants(client, productId, variants) {
  if (variants.length) {
    const ids = [...new Set(variants.flatMap(row => [row.colorId, row.sizeId]))];
    const { rows } = await client.query('SELECT id, kind FROM variant_options WHERE id = ANY($1::bigint[])', [ids]);
    const kinds = new Map(rows.map(row => [String(row.id), row.kind]));
    if (variants.some(row => kinds.get(row.colorId) !== 'color' || kinds.get(row.sizeId) !== 'size')) throw new Error('INVALID_VARIANTS');
    if (variants.reduce((sum, row) => sum + row.stock, 0) > 2147483647) throw new Error('INVALID_VARIANTS');
  }
  await client.query('UPDATE product_variants SET is_active = FALSE WHERE product_id = $1', [productId]);
  for (const variant of variants) {
    await client.query(`INSERT INTO product_variants (product_id, color_id, size_id, price, stock, image_url)
      VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (product_id, color_id, size_id)
      DO UPDATE SET price = EXCLUDED.price, stock = EXCLUDED.stock, image_url = EXCLUDED.image_url, is_active = TRUE`,
    [productId, variant.colorId, variant.sizeId, variant.price, variant.stock, variant.imageUrl]);
  }
  if (variants.length) {
    await client.query(`UPDATE products SET has_variants = TRUE,
      price = (SELECT MIN(price) FROM product_variants WHERE product_id = $1 AND is_active),
      stock = (SELECT SUM(stock) FROM product_variants WHERE product_id = $1 AND is_active)
      WHERE id = $1`, [productId]);
  }
}
