export function variantImage(product, variant, color = variant?.color) {
  if (variant?.image_url) return variant.image_url;
  if (color) {
    const sameColor = (product.variants || []).filter(row => row.color === color && row.image_url);
    const colorOnly = sameColor.find(row => !row.size);
    if (colorOnly) return colorOnly.image_url;
    if (sameColor.length) return sameColor[0].image_url;
  }
  return product.image_url;
}
