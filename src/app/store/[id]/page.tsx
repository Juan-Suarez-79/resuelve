"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Search, MapPin, Loader2 } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useGeolocation, calculateDistance } from "@/lib/hooks/use-geolocation";

export default function StorePage() {
    const params = useParams();
    const id = params.id as string;
    const [store, setStore] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { location } = useGeolocation();
    const supabase = createClient();

    useEffect(() => {
        async function fetchStoreData() {
            // Fetch Store Details
            const { data: storeData, error: storeError } = await supabase
                .from('stores')
                .select('*')
                .eq('id', id)
                .single();

            if (storeError) {
                console.error("Error fetching store:", storeError);
                setLoading(false);
                return;
            }

            setStore(storeData);

            // Fetch Products
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', id)
                .eq('in_stock', true);

            if (productsData) {
                setProducts(productsData);
            }
            setLoading(false);
        }

        if (id) {
            fetchStoreData();
        }
    }, [id, supabase]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    if (!store) {
        return <div className="min-h-screen flex items-center justify-center">Tienda no encontrada</div>;
    }

    const distance = location && store.lat && store.lng
        ? calculateDistance(location.lat, location.lng, store.lat, store.lng).toFixed(1) + " km"
        : "N/A";

    return (
        <div className="pb-20 bg-gray-50 min-h-screen">
            {/* Header / Banner */}
            <div className="relative h-64 w-full bg-gray-900">
                {store.image_url ? (
                    <Image
                        src={store.image_url}
                        alt={store.name}
                        fill
                        className="object-cover opacity-80"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-red to-gray-900" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* Navigation Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                    <Link href="/" className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div className="flex gap-2">
                        <button className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                            <Search className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Store Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h1 className="text-3xl font-bold mb-1">{store.name}</h1>
                    <div className="flex items-center gap-2 text-sm opacity-90">
                        <span className="bg-brand-yellow text-black px-2 py-0.5 rounded font-bold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-black" /> 4.8
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {distance}
                        </span>
                    </div>
                </div>
            </div>

            {/* Info Bar */}
            <div className="bg-brand-yellow px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
                <span className="font-bold text-gray-900 text-sm">
                    Tasa Hoy: Bs. {store.exchange_rate_bs}
                </span>
                <span className="font-bold text-gray-900 text-sm flex items-center gap-1">
                    {store.is_open ? "Abierto" : "Cerrado"}
                    <div className={`w-2 h-2 rounded-full animate-pulse ${store.is_open ? "bg-green-600" : "bg-red-600"}`} />
                </span>
            </div>

            {/* Products Grid */}
            <div className="p-4">
                <h2 className="font-bold text-gray-900 mb-4">Menú / Catálogo</h2>
                {products.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Esta tienda aún no tiene productos.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                title={product.title}
                                priceUsd={product.price_usd}
                                imageUrl={product.image_url}
                                exchangeRate={store.exchange_rate_bs}
                                storeName={store.name}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
