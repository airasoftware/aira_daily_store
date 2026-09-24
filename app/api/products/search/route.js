import { NextResponse } from 'next/server';
import { getProducts } from '../../../../lib/products';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const query = new URL(request.url).searchParams.get('q')?.trim().slice(0, 100) || '';
  if (query.length < 2) return NextResponse.json({ products: [] });
  try {
    const products = await getProducts({ search: query });
    return NextResponse.json({ products: products.slice(0, 6).map(product => ({ id: product.id, slug: product.slug, name: product.name, category: product.category, price: product.price, image_url: product.image_url })) });
  } catch (error) {
    return NextResponse.json({ products: [], error: error.message }, { status: 500 });
  }
}
