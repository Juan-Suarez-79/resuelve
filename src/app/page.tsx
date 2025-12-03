"use client";

import { useState, useEffect } from "react";
import { MapPin, ChevronDown, Loader2, Search, X, MapPinned } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { StoreCard } from "@/components/store-card";
import { createClient } from "@/lib/supabase/client";
import { useGeolocation, calculateDistance, isLocationInCoro, CORO_COORDS } from "@/lib/hooks/use-geolocation";
import Link from "next/link";
import Image from "next/image";
import MapWrapper from "@/components/map-wrapper";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

import { NotificationCenter } from "@/components/notification-center";

const CATEGORIES = [
  { id: "all", label: "Todo", icon: "🛍️" },
  { id: "ropa", label: "Ropa", icon: "👕" },
  { id: "comida", label: "Comida", icon: "🍔" },
  { id: "servicios", label: "Servicios", icon: "💅" },
  { id: "repuestos", label: "Repuestos", icon: "⚙️" },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { location: geoLoc, loading: geoLoading, isInRegion: geoInRegion } = useGeolocation();
  const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');

  const location = manualLocation || geoLoc;
  const isLocationValid = manualLocation
    ? isLocationInCoro(manualLocation.lat, manualLocation.lng)
    : (geoLoc ? geoInRegion : true); // If no location yet, assume valid or wait

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch Stores
      // Try to fetch from view first, fallback to table if view doesn't exist (or just use view)
      // Note: We assume the view 'stores_with_ratings' exists.
      let storeQuery = supabase
        .from('stores_with_ratings')
        .select('*')
        .eq('is_open', true)
        .eq('is_banned', false); // Filter out banned stores

      // Fetch Products
      let productQuery = supabase
        .from('products')
        .select('*, stores!inner(name, exchange_rate_bs, category, is_banned)')
        .eq('stores.is_banned', false); // Filter out products from banned stores

      // Apply Filters
      if (activeCategory !== "all") {
        storeQuery = storeQuery.eq('category', activeCategory);
        productQuery = productQuery.eq('stores.category', activeCategory);
      }

      if (searchQuery) {
        productQuery = productQuery.ilike('title', `%${searchQuery}%`);
        storeQuery = storeQuery.ilike('name', `%${searchQuery}%`);
      }

      const { data: storesData, error: storeError } = await storeQuery;

      // Fallback if view doesn't exist (e.g. migration not run)
      let finalStoresData = storesData;
      if (storeError) {
        console.warn("Could not fetch from stores_with_ratings, falling back to stores table", storeError);
        const { data: fallbackData } = await supabase
          .from('stores')
          .select('*')
          .eq('is_open', true)
          .eq('is_banned', false);
        finalStoresData = fallbackData;
      }

      const { data: productsData } = await productQuery.limit(20);

      if (finalStoresData) {
        let sortedStores = finalStoresData.map((store: any) => {
          const dist = location && store.lat && store.lng
            ? calculateDistance(location.lat, location.lng, store.lat, store.lng)
            : 9999;

          // Check if boosted
          const isBoosted = store.boost_expires_at && new Date(store.boost_expires_at) > new Date();

          return { ...store, distanceVal: dist, isBoosted };
        });

        sortedStores.sort((a: any, b: any) => {
          // Primary Sort: Boosted First
          if (a.isBoosted && !b.isBoosted) return -1;
          if (!a.isBoosted && b.isBoosted) return 1;

          // Secondary Sort: Selected Criteria
          if (sortBy === 'distance' && location) {
            return a.distanceVal - b.distanceVal;
          } else if (sortBy === 'rating') {
            return (b.average_rating || 0) - (a.average_rating || 0);
          }
          return 0;
        });

        setStores(sortedStores);
      }

      if (productsData) {
        setProducts(productsData);
      }
      setLoading(false);
    }

    // Debounce search
    const timer = setTimeout(() => {
      // Only wait for geoLoading if we don't have a manual location
      if (manualLocation || !geoLoading) {
        fetchData();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [supabase, location, geoLoading, activeCategory, searchQuery, manualLocation, sortBy]);

  return (
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Location Header - Glassmorphism */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 px-4 py-3 space-y-3 transition-all">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 shadow-sm rounded-xl overflow-hidden border border-gray-100">
            <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
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

        {/* Search Bar - Modern Input */}
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

      {/* Categories - Modern Pills */}
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
          <p className="text-gray-400 text-sm font-medium animate-pulse">Cargando lo mejor para ti...</p>
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
                    <Link href={`/store/${store.id}`} className="block">
                      <StoreCard
                        name={store.name}
                        rating={store.average_rating || 0}
                        distance={store.distanceVal ? `${store.distanceVal.toFixed(1)} km` : "N/A"}
                        deliveryPrice={store.delivery_fee || 0}
                        imageUrl={store.image_url}
                        category={store.category || "General"}
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
