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

  // 2. Fetch Top Rated IDs from VIEW
  const topRatedIdsQuery = supabase
    .from('stores_with_ratings')
    .select('id, average_rating')
    .eq('is_open', true)
    .eq('is_banned', false)
    .order('average_rating', { ascending: false })
    .limit(4);

  // Fetch Products
  let productQuery = supabase
    .from('products')
    .select('*, stores!inner(name, exchange_rate_bs, category, is_banned, slug)')
    .eq('stores.is_banned', false)
    .limit(10); // Limit initial products

  const [boostedRes, topRatedIdsRes, productsRes] = await Promise.all([
    boostedQuery,
    topRatedIdsQuery,
    productQuery
  ]);

  // Merge Stores Logic
  let finalStoresData: any[] = [];
  const boostedStores = boostedRes.data || [];
  const topRatedIds = topRatedIdsRes.data || [];

  // Fetch details for top rated stores if we have any
  let topRatedStores: any[] = [];
  if (topRatedIds.length > 0) {
    const { data: details } = await supabase
      .from('stores')
      .select('*')
      .in('id', topRatedIds.map((r: any) => r.id));

    if (details) {
      // Merge rating back into details
      topRatedStores = details.map((store: any) => ({
        ...store,
        average_rating: topRatedIds.find((r: any) => r.id === store.id)?.average_rating || 0
      }));
      // Re-sort because 'in' query doesn't preserve order
      topRatedStores.sort((a: any, b: any) => b.average_rating - a.average_rating);
    }
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
  if (boostedRes.error || topRatedIdsRes.error) {
    console.warn("Error fetching stores, falling back to simple query", boostedRes.error || topRatedIdsRes.error);
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
