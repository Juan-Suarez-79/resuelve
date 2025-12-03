import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://resuelve.app'; // Replace with your actual domain
    const supabase = createClient();

    // Static routes
    const routes = [
        '',
        '/search',
        '/profile',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
    }));

    // Fetch Stores for dynamic routes
    const { data: stores } = await supabase
        .from('stores')
        .select('slug, updated_at')
        .eq('is_open', true)
        .eq('is_banned', false);

    const storeRoutes = (stores || []).map((store) => ({
        url: `${baseUrl}/store/${store.slug}`,
        lastModified: new Date(store.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }));

    // Fetch Products for dynamic routes
    const { data: products } = await supabase
        .from('products')
        .select('id, created_at')
        .limit(1000); // Limit to avoid massive sitemaps initially

    const productRoutes = (products || []).map((product) => ({
        url: `${baseUrl}/product/${product.id}`,
        lastModified: new Date(product.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
    }));

    return [...routes, ...storeRoutes, ...productRoutes];
}
