import { createClient } from "@/lib/supabase/server";
import HomeClient from "@/components/home-client";

// Revalidate data every 60 seconds (ISR)
export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();

  // Fetch Stores
  // Try to fetch from view first, fallback to table if view doesn't exist (or just use view)
  // Note: We assume the view 'stores_with_ratings' exists.
  const now = new Date().toISOString();

  // 1. Fetch Boosted Stores (Active) from TABLE
  const boostedQuery = supabase
    .from('stores')
    .select('*')
    .eq('is_open', true)
    .eq('is_banned', false)
    .gt('boost_expires_at', now)
    .order('boost_expires_at', { ascending: true });

  // 2. Fetch Reviews to calculate ratings (Replacement for VIEW)
  const reviewsQuery = supabase
    .from('reviews')
    .select('store_id, rating');

  // Fetch Products
  let productQuery = supabase
    .from('products')
    .select('*, stores!inner(name, exchange_rate_bs, category, is_banned, slug)')
    .eq('stores.is_banned', false)
    .limit(10); // Limit initial products

  const [boostedRes, reviewsRes, productsRes] = await Promise.all([
    boostedQuery,
    reviewsQuery,
    productQuery
  ]);

  // Merge Stores Logic
  let finalStoresData: any[] = [];
  const boostedStores = boostedRes.data || [];
  const reviewsData = reviewsRes.data || [];

  // Calculate ratings map
  const ratingsMap = new Map<string, { total: number; count: number }>();
  reviewsData.forEach((review: any) => {
    if (review.store_id && review.rating) {
      const current = ratingsMap.get(review.store_id) || { total: 0, count: 0 };
      ratingsMap.set(review.store_id, {
        total: current.total + review.rating,
        count: current.count + 1
      });
    }
  });

  // Get all store IDs that we might need (boosted + top rated candidates)
  // Since we don't have a simple "top rated" query anymore without fetching all stores,
  // we will fetch a batch of stores to sort by rating.
  // For efficiency, let's fetch active stores.
  const { data: allActiveStores } = await supabase
    .from('stores')
    .select('*')
    .eq('is_open', true)
    .eq('is_banned', false);

  let topRatedStores: any[] = [];

  if (allActiveStores) {
    // Map ratings to stores
    const storesWithRatings = allActiveStores.map((store: any) => {
      const ratingData = ratingsMap.get(store.id);
      const avgRating = ratingData ? ratingData.total / ratingData.count : 0;
      return { ...store, average_rating: avgRating };
    });

    // Sort by rating desc
    storesWithRatings.sort((a: any, b: any) => b.average_rating - a.average_rating);

    // Take top 4
    topRatedStores = storesWithRatings.slice(0, 4);
  }

  // Merge Stores Logic
  const storeMap = new Map();

  // Add all boosted stores first (Priority)
  boostedStores.forEach((store: any) => {
    storeMap.set(store.id, { ...store, isBoosted: true, average_rating: 0 }); // Placeholder rating
  });

  // Fill with top rated stores until we have at least 4 stores
  topRatedStores.forEach((store: any) => {
    if (storeMap.size < 4 && !storeMap.has(store.id)) {
      storeMap.set(store.id, store);
    } else if (storeMap.has(store.id)) {
      // Update rating if it was added as boosted without rating
      const existing = storeMap.get(store.id);
      storeMap.set(store.id, { ...existing, average_rating: store.average_rating });
    }
  });

  finalStoresData = Array.from(storeMap.values());

  // Fallback if view doesn't exist (handle gracefully)
  if (boostedRes.error || reviewsRes.error) {
    console.warn("Error fetching stores, falling back to simple query", boostedRes.error || reviewsRes.error);
    const { data: fallbackData } = await supabase
      .from('stores')
      .select('*')
      .eq('is_open', true)
      .eq('is_banned', false)
      .limit(4);
    finalStoresData = fallbackData || [];
  }

  // Initial sort (optional, can be done on client, but good for SSR)
  // We can't sort by distance here because we don't have user location on server
  // So we just pass the raw data and let client handle distance sorting

  return (
    <HomeClient
      initialStores={finalStoresData || []}
      initialProducts={productsRes.data || []}
    />
  );
}
