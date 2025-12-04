"use client";

import { useState, useEffect } from "react";
import { MapPin, ChevronDown, Loader2, Search, X, MapPinned } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { StoreCard } from "@/components/store-card";
import { createClient } from "@/lib/supabase/client";
import { useGeolocation, calculateDistance, isLocationInCoro, CORO_COORDS } from "@/lib/hooks/use-geolocation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { NotificationCenter } from "@/components/notification-center";

import { HeroSection } from "@/components/hero-section";

// Dynamic import for Map to reduce initial bundle size
const MapWrapper = dynamic(() => import("@/components/map-wrapper"), {
    loading: () => <div className="h-[400px] bg-gray-100 animate-pulse rounded-3xl" />,
    ssr: false
});

const CATEGORIES = [
    { id: "all", label: "Todo", icon: "🛍️" },
    { id: "ropa", label: "Ropa", icon: "👕" },
    { id: "comida", label: "Comida", icon: "🍔" },
    { id: "servicios", label: "Servicios", icon: "💅" },
    { id: "repuestos", label: "Repuestos", icon: "⚙️" },
];

interface HomeClientProps {
    initialStores: any[];
    initialProducts: any[];
}

export default function HomeClient({ initialStores, initialProducts }: HomeClientProps) {
    const [activeCategory, setActiveCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [stores, setStores] = useState<any[]>(initialStores);
    const [products, setProducts] = useState<any[]>(initialProducts);
    const [loading, setLoading] = useState(false);
    const { location: geoLoc, loading: geoLoading, isInRegion: geoInRegion } = useGeolocation();
    const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');

    const location = manualLocation || geoLoc;
    const isLocationValid = manualLocation
        ? isLocationInCoro(manualLocation.lat, manualLocation.lng)
        : (geoLoc ? geoInRegion : true);

    const supabase = createClient();

    useEffect(() => {
        // Skip if it's the initial load and we have data, unless filters change
        if (activeCategory === "all" && !searchQuery && !location && initialStores.length > 0) {
            return;
        }

        async function fetchData() {
            setLoading(true);

            let storeQuery = supabase
                .from('stores')
                .select('*')
                // .eq('is_open', true) // Show closed stores too
                .eq('is_banned', false);

            // Fetch reviews instead of stores_with_ratings view
            let reviewsQuery = supabase
                .from('reviews')
                .select('store_id, rating');

            let productQuery = supabase
                .from('products')
                .select('*, stores!inner(name, exchange_rate_bs, category, is_banned, slug, is_open)')
                .eq('stores.is_banned', false);

            if (activeCategory !== "all") {
                storeQuery = storeQuery.eq('category', activeCategory);
                // We can't easily filter reviews by category without a join, so we'll fetch all relevant reviews or filter later
                // But for now, fetching all reviews is safer to ensure we have ratings for the stores we show
                productQuery = productQuery.eq('stores.category', activeCategory);
            }

            if (searchQuery) {
                productQuery = productQuery.ilike('title', `%${searchQuery}%`);
                storeQuery = storeQuery.ilike('name', `%${searchQuery}%`);
                // reviewsQuery = reviewsQuery.ilike('name', `%${searchQuery}%`); // Reviews don't have name
            }

            const limit = searchQuery ? 100 : 20;
            const [storesRes, reviewsRes, productsRes] = await Promise.all([
                storeQuery,
                reviewsQuery,
                productQuery.limit(limit)
            ]);

            const storesData = storesRes.data;
            const reviewsData = reviewsRes.data || [];
            const productsData = productsRes.data;

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

            if (storesData) {
                let sortedStores = storesData.map((store: any) => {
                    const dist = location && store.lat && store.lng
                        ? calculateDistance(location.lat, location.lng, store.lat, store.lng)
                        : 9999;
                    const isBoosted = store.boost_expires_at && new Date(store.boost_expires_at) > new Date();

                    // Calculate rating from map
                    const storeRatingData = ratingsMap.get(store.id);
                    const rating = storeRatingData ? storeRatingData.total / storeRatingData.count : 0;

                    return { ...store, distanceVal: dist, isBoosted, average_rating: rating };
                });

                sortedStores.sort((a: any, b: any) => {
                    if (a.isBoosted && !b.isBoosted) return -1;
                    if (!a.isBoosted && b.isBoosted) return 1;
                    if (sortBy === 'distance' && location) return a.distanceVal - b.distanceVal;
                    if (sortBy === 'rating') return (b.average_rating || 0) - (a.average_rating || 0);
                    return 0;
                });

                setStores(sortedStores);
            }

            if (productsData) {
                setProducts(productsData);
            }
            setLoading(false);
        }

        // Debounce
        const timer = setTimeout(() => {
            fetchData();
        }, 500);

        return () => clearTimeout(timer);
    }, [supabase, location, activeCategory, searchQuery, sortBy]);

    return (
        <div className="pb-24 bg-gray-50 min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 px-4 py-3 space-y-3 transition-all">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 shadow-sm rounded-xl overflow-hidden border border-gray-100">
                        <Image src="/logo.jpg" alt="Logo" fill className="object-cover" priority />
                    </div>
                    <div className="flex-1 group cursor-pointer" onClick={() => setShowMap(true)}>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Tu Ubicación</p>
                        <div className="flex items-center gap-1 text-gray-800 font-bold text-sm group-hover:text-brand-red transition-colors">
                            <MapPin className="w-4 h-4 text-brand-red" />
                            <span className="truncate max-w-[200px]">
                                {manualLocation ? "Ubicación Seleccionada" : (location ? "Ubicación Actual" : "Seleccionar Ubicación")}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-brand-red" />
                        </div>
                    </div>
                    <NotificationCenter />
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400 group-focus-within:text-brand-red transition-colors" />
                    <input
                        type="text"
                        placeholder="¿Qué estás buscando hoy?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-100/50 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-brand-red/20 focus:ring-4 focus:ring-brand-red/5 transition-all shadow-sm"
                    />
                </div>
            </header>

            {/* Hero Section */}
            <div className="pt-4">
                <HeroSection />
            </div>

            {/* Categories */}
            <div className="px-4 py-4 overflow-x-auto no-scrollbar">
                <div className="flex gap-3">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`
                flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all active:scale-95 shadow-sm
                ${activeCategory === cat.id
                                    ? "bg-brand-red text-white shadow-red-200 shadow-md"
                                    : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
                                }
              `}
                        >
                            <span className="text-lg">{cat.icon}</span>
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-red" />
                    <p className="text-gray-400 text-sm font-medium animate-pulse">Cargando...</p>
                </div>
            ) : (
                <MotionWrapper className="space-y-8">
                    {/* Featured Stores */}
                    {stores.length > 0 && (
                        <section className="px-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Tiendas {sortBy === 'distance' ? 'Cercanas' : 'Destacadas'}</h2>
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    <button
                                        onClick={() => setSortBy('distance')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'distance' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Cercanos
                                    </button>
                                    <button
                                        onClick={() => setSortBy('rating')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'rating' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        ⭐ Mejor Valorados
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {stores.map((store, index) => (
                                    <MotionWrapper key={store.id} delay={index * 0.1}>
                                        <Link href={`/store/${store.slug}`} className="block">
                                            <StoreCard
                                                id={store.id}
                                                name={store.name}
                                                rating={store.average_rating || 0}
                                                distance={store.distanceVal ? `${store.distanceVal.toFixed(1)} km` : "N/A"}
                                                deliveryPrice={store.delivery_fee || 0}
                                                imageUrl={store.image_url}
                                                category={store.category || "General"}
                                                priority={index < 4}
                                                isOpen={store.is_open}
                                            />
                                        </Link>
                                    </MotionWrapper>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Popular Products */}
                    <section className="px-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Productos Destacados</h2>
                        {products.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 mx-4">
                                No se encontraron productos.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {products.map((product, index) => (
                                    <MotionWrapper key={product.id} delay={index * 0.05}>
                                        <ProductCard
                                            id={product.id}
                                            title={product.title}
                                            priceUsd={product.price_usd}
                                            imageUrl={product.image_url}
                                            exchangeRate={product.stores?.exchange_rate_bs || 0}
                                            storeName={product.stores?.name || "Tienda"}
                                            storeId={product.store_id}
                                            storeSlug={product.stores?.slug}
                                            priority={index < 4}
                                            inStock={product.in_stock}
                                            isStoreOpen={product.stores?.is_open}
                                        />
                                    </MotionWrapper>
                                ))}
                            </div>
                        )}
                    </section>
                </MotionWrapper>
            )}

            {/* Map Modal */}
            {showMap && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="p-4 flex justify-between items-center border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 text-lg">Selecciona tu ubicación</h3>
                            <button onClick={() => setShowMap(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        <div className="h-[400px] relative">
                            <MapWrapper
                                initialLat={location?.lat}
                                initialLng={location?.lng}
                                onLocationSelect={(lat, lng) => {
                                    setManualLocation({ lat, lng });
                                    setShowMap(false);
                                }}
                            />
                            <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
                                <span className="bg-white/95 backdrop-blur px-4 py-2 rounded-full text-sm font-bold shadow-lg text-gray-700 border border-gray-100">
                                    📍 Toca el mapa para seleccionar
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Region Restriction Modal */}
            {!isLocationValid && !geoLoading && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MapPinned className="w-10 h-10 text-brand-red" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-3 leading-tight">Fuera de Zona</h2>
                        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                            Lo sentimos, <strong>Resuelve</strong> solo está disponible actualmente en <strong>Coro, Falcón</strong>.
                        </p>
                        <button
                            onClick={() => {
                                setManualLocation(CORO_COORDS);
                                setShowMap(true);
                            }}
                            className="w-full bg-brand-red text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 active:scale-[0.98] transition-all"
                        >
                            Seleccionar Ubicación en Coro
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
