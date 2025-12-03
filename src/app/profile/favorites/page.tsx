"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Heart, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { ProductCard } from "@/components/product-card";

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchFavorites() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('favorites')
                .select(`
                    product_id,
                    products (
                        *,
                        stores (name, exchange_rate_bs)
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                // Map to flatten the structure
                const formattedFavorites = data.map((item: any) => ({
                    ...item.products,
                    store_name: item.products.stores?.name,
                    exchange_rate: item.products.stores?.exchange_rate_bs
                }));
                setFavorites(formattedFavorites);
            }
            setLoading(false);
        }
        fetchFavorites();
    }, [supabase]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <MotionWrapper className="p-4 max-w-lg mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/profile" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-brand-red transition-colors active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mis Favoritos</h1>
                </div>

                {favorites.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center">
                            <Heart className="w-8 h-8 text-pink-300 fill-pink-100" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-lg mb-1">No tienes favoritos</p>
                            <p className="text-sm text-gray-500">Guarda los productos que te gusten para después.</p>
                        </div>
                        <Link href="/" className="mt-4 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-gray-200 active:scale-95 transition-all">
                            Explorar Productos
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {favorites.map((product, index) => (
                            <MotionWrapper key={product.id} delay={index * 0.05}>
                                <ProductCard
                                    id={product.id}
                                    title={product.title}
                                    priceUsd={product.price_usd}
                                    imageUrl={product.image_url}
                                    exchangeRate={product.exchange_rate || 0}
                                    storeName={product.store_name || "Tienda"}
                                    storeId={product.store_id}
                                />
                            </MotionWrapper>
                        ))}
                    </div>
                )}
            </MotionWrapper>
        </div>
    );
}
