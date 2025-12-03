"use client";

import { useState, useEffect } from "react";
import { Search, Filter, X, Store, ShoppingBag, ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ProductCard } from "@/components/product-card";
import { StoreCard } from "@/components/store-card";
import { useGeolocation, calculateDistance } from "@/lib/hooks/use-geolocation";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CATEGORIES = [
    { id: "all", label: "Todo" },
    { id: "ropa", label: "Ropa" },
    { id: "comida", label: "Comida" },
    { id: "servicios", label: "Servicios" },
    { id: "repuestos", label: "Repuestos" },
];

export default function SearchPage() {
    const router = useRouter();
    const supabase = createClient();
    const { location } = useGeolocation();

    const [query, setQuery] = useState("");
    const [activeTab, setActiveTab] = useState<'products' | 'stores'>('products');
    const [category, setCategory] = useState("all");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<{ products: any[], stores: any[] }>({ products: [], stores: [] });
    const [showFilters, setShowFilters] = useState(false);
    const [priceRange, setPriceRange] = useState<{ min: string, max: string }>({ min: "", max: "" });

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch();
        }, 500);
        return () => clearTimeout(timer);
    }, [query, category, activeTab, priceRange]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            let productQuery = supabase
                .from('products')
                .select('*, stores!inner(id, name, exchange_rate_bs, lat, lng, is_banned, slug)')
                .eq('stores.is_banned', false); // Filter out products from banned stores

            let storeQuery = supabase
                .from('stores')
                .select('*')
                .eq('is_open', true)
                .eq('is_banned', false); // Filter out banned stores

            let reviewsQuery = supabase
                .from('reviews')
                .select('store_id, rating');

            // Text Search
            if (query) {
                productQuery = productQuery.ilike('title', `%${query}%`);
                storeQuery = storeQuery.ilike('name', `%${query}%`);
            }

            // Category Filter
            if (category !== 'all') {
                productQuery = productQuery.eq('category', category);
                storeQuery = storeQuery.eq('category', category);
            }

            // Price Filter (Products only)
            if (priceRange.min) productQuery = productQuery.gte('price_usd', parseFloat(priceRange.min));
            if (priceRange.max) productQuery = productQuery.lte('price_usd', parseFloat(priceRange.max));

            const [productsRes, storesRes, reviewsRes] = await Promise.all([
                productQuery.limit(20),
                storeQuery.limit(20),
                reviewsQuery
            ]);

            let products = productsRes.data || [];
            let stores = storesRes.data || [];
            let reviews = reviewsRes.data || [];

            // Calculate ratings map
            const ratingsMap = new Map<string, { total: number; count: number }>();
            reviews.forEach((review: any) => {
                if (review.store_id && review.rating) {
                    const current = ratingsMap.get(review.store_id) || { total: 0, count: 0 };
                    ratingsMap.set(review.store_id, {
                        total: current.total + review.rating,
                        count: current.count + 1
                    });
                }
            });

            // Add ratings to stores
            stores = stores.map((store: any) => {
                const ratingData = ratingsMap.get(store.id);
                const rating = ratingData ? ratingData.total / ratingData.count : 0;
                return { ...store, average_rating: rating };
            });

            // Sort Stores by Boost and then Distance
            stores = stores.map((store: any) => ({
                ...store,
                distanceVal: (location && store.lat && store.lng)
                    ? calculateDistance(location.lat, location.lng, store.lat, store.lng)
                    : 9999,
                isBoosted: store.boost_expires_at && new Date(store.boost_expires_at) > new Date()
            })).sort((a: any, b: any) => {
                // Primary Sort: Boosted First
                if (a.isBoosted && !b.isBoosted) return -1;
                if (!a.isBoosted && b.isBoosted) return 1;

                // Secondary Sort: Distance
                return a.distanceVal - b.distanceVal;
            });

            setResults({ products, stores });
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Search Header */}
            <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-3 mb-3">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar productos o tiendas..."
                            autoFocus
                            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-red/20 transition-all font-medium text-gray-900"
                        />
                        {query && (
                            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-gray-200 rounded-full text-gray-500 hover:bg-gray-300">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-3 rounded-xl border transition-all ${showFilters ? 'bg-brand-red text-white border-brand-red' : 'bg-white text-gray-500 border-gray-200'}`}
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 rounded-xl">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'products' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <ShoppingBag className="w-4 h-4" /> Productos
                    </button>
                    <button
                        onClick={() => setActiveTab('stores')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'stores' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Store className="w-4 h-4" /> Tiendas
                    </button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Categoría</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${category === cat.id ? 'bg-brand-red text-white border-brand-red' : 'bg-white text-gray-600 border-gray-200'}`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'products' && (
                            <>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Precio (USD)</p>
                                <div className="flex gap-3">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange.min}
                                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-red"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-red"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Results */}
            <div className="p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-2 text-brand-red" />
                        <span className="text-sm font-medium">Buscando...</span>
                    </div>
                ) : (
                    <MotionWrapper className="space-y-4">
                        {activeTab === 'products' ? (
                            results.products.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {results.products.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            id={product.id}
                                            title={product.title}
                                            priceUsd={product.price_usd}
                                            imageUrl={product.image_url}
                                            exchangeRate={product.stores?.exchange_rate_bs || 0}
                                            storeName={product.stores?.name || "Tienda"}
                                            storeId={product.store_id}
                                            storeSlug={product.stores?.slug}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="No se encontraron productos." />
                            )
                        ) : (
                            results.stores.length > 0 ? (
                                <div className="space-y-4">
                                    {results.stores.map((store) => (
                                        <Link href={`/store/${store.slug}`} key={store.id} className="block">
                                            <StoreCard
                                                id={store.id}
                                                name={store.name}
                                                rating={store.average_rating || 0}
                                                distance={store.distanceVal ? `${store.distanceVal.toFixed(1)} km` : "N/A"}
                                                deliveryPrice={store.delivery_fee || 0}
                                                imageUrl={store.image_url}
                                                category={store.category || "General"}
                                            />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="No se encontraron tiendas." />
                            )
                        )}
                    </MotionWrapper>
                )}
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">{message}</p>
            <p className="text-xs text-gray-400 mt-1">Intenta con otros términos o filtros.</p>
        </div>
    );
}
