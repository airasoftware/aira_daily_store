import { notFound } from 'next/navigation';
import { getProduct, discount } from '../../../lib/products';
import { ProductDetailView } from '../../../components/product-detail-view';

export const dynamic = 'force-dynamic';

export default async function ProductDetail({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return <ProductDetailView product={product} discount={discount(product)} />;
}
