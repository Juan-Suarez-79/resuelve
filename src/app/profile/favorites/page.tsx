"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { useRouter } from "next/navigation";
import { getExchangeRate } from "@/lib/utils";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [exchangeRate, setExchangeRate] = useState(0);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const rate = await getExchangeRate();
            setExchangeRate(rate);

            const { data } = await supabase
                .from('favorites')
                .select(`
                    id,
                    product:products (
                        id,
                        title,
                        price_usd,
                        image_url,
                        store_id,
                        store:stores (
                            id,
                            name
                        )
                    )
                `)
                .eq('user_id', user.id);

            if (data) {
                // Filter out null products (in case a product was deleted)
                const validProducts = data
                    .map(f => f.product)
                    .filter(p => p !== null);
                setFavorites(validProducts);
            }
            setLoading(false);
        }
        fetchData();
    }, [supabase, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            <MotionWrapper className="p-4 max-w-lg mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/profile" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-brand-red transition-colors active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mis Favoritos</h1>
                </div>

                {/* Favorites Grid */}
                {favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                            <Heart className="w-10 h-10 text-pink-400 fill-pink-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No tienes favoritos</h2>
                        <p className="text-gray-500 mb-8 max-w-xs leading-relaxed">Guarda los productos que te gustan para encontrarlos fácilmente.</p>
                        <Link href="/" className="bg-brand-red text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95">
                            Explorar Productos
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {favorites.map((product) => (
                            <div key={product.id} className="h-full">
                                <ProductCard
                                    id={product.id}
                                    title={product.title}
                                    priceUsd={product.price_usd}
                                    imageUrl={product.image_url}
                                    exchangeRate={exchangeRate}
                                    storeName={product.store?.name || "Tienda"}
                                    storeId={product.store_id}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </MotionWrapper>
        </div>
    );
}
