"use client";

import { useState, useEffect } from "react";
import { MapPin, ChevronDown, Loader2, Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { StoreCard } from "@/components/store-card";
import { createClient } from "@/lib/supabase/client";
import { useGeolocation, calculateDistance } from "@/lib/hooks/use-geolocation";
import Link from "next/link";

const CATEGORIES = [
  { id: "all", label: "Todo", icon: "🛍️" },
  { id: "Comida", label: "Comida", icon: "🍔" },
  { id: "Ropa", label: "Ropa", icon: "👕" },
  { id: "Servicios", label: "Servicios", icon: "🔧" },
  { id: "Repuestos", label: "Repuestos", icon: "⚙️" },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { location, loading: geoLoading } = useGeolocation();
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch Stores
      let storeQuery = supabase.from('stores').select('*');

      // Fetch Products
      let productQuery = supabase
        .from('products')
        .select('*, stores(name, exchange_rate_bs)');

      // Apply Filters
      if (activeCategory !== "all") {
        // For products, we filter by category
        productQuery = productQuery.eq('category', activeCategory);
        // For stores, we might filter if stores had categories, but for now we keep all stores or filter by products?
        // Let's assume stores don't have categories yet in schema, so we just filter products.
      }

      if (searchQuery) {
        productQuery = productQuery.ilike('title', `%${searchQuery}%`);
        storeQuery = storeQuery.ilike('name', `%${searchQuery}%`);
      }

      const { data: storesData } = await storeQuery;
      const { data: productsData } = await productQuery.limit(20);

      if (storesData) {
        let sortedStores = storesData;
        if (location) {
          sortedStores = storesData.map(store => {
            const dist = store.lat && store.lng
              ? calculateDistance(location.lat, location.lng, store.lat, store.lng)
              : 9999;
            return { ...store, distanceVal: dist };
          }).sort((a, b) => a.distanceVal - b.distanceVal);
        }
        setStores(sortedStores);
      }

      if (productsData) {
        setProducts(productsData);
      }
      setLoading(false);
    }

    // Debounce search
    const timer = setTimeout(() => {
      if (!geoLoading) {
        fetchData();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [supabase, location, geoLoading, activeCategory, searchQuery]);

  return (
    <div className="pb-20">
      {/* Location Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm px-4 py-3 space-y-3">
        <div className="flex items-center gap-2 text-gray-700">
          <MapPin className="w-5 h-5 text-brand-red" />
          <div className="flex-1">
            <p className="text-xs text-gray-500">Ubicación</p>
            <div className="flex items-center gap-1 font-semibold text-sm cursor-pointer">
              {location ? "Ubicación Actual" : "Seleccionar Ubicación"}
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos o tiendas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20 transition-all"
          />
        </div>
      </header>

      {/* Categories */}
      <div className="px-4 py-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${activeCategory === cat.id
                  ? "bg-brand-yellow text-gray-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
              `}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
        </div>
      ) : (
        <>
          {/* Featured Stores (Only show if no search or matches search) */}
          {stores.length > 0 && (
            <section className="px-4 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Tiendas</h2>
              <div className="space-y-4">
                {stores.map((store) => (
                  <Link key={store.id} href={`/store/${store.id}`}>
                    <StoreCard
                      name={store.name}
                      rating={4.8}
                      distance={store.distanceVal ? `${store.distanceVal.toFixed(1)} km` : "N/A"}
                      deliveryPrice={3}
                      imageUrl={store.image_url}
                      category="General"
                    />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Popular Products */}
          <section className="px-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Productos</h2>
            {products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron productos.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    priceUsd={product.price_usd}
                    imageUrl={product.image_url}
                    exchangeRate={product.stores?.exchange_rate_bs || 0}
                    storeName={product.stores?.name || "Tienda"}
                    storeId={product.store_id}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
