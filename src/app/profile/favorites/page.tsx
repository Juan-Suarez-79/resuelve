"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { useRouter } from "next/navigation";

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data } = await supabase
            .from('favorites')
            .select(`
                *,
                products (
                    *,
                    stores (name, exchange_rate_bs)
                )
            `)
            .eq('user_id', user.id);

        if (data) {
            const mapped = data.map((f: any) => f.products);
            setFavorites(mapped);
        }
        setLoading(false);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    return (
        <div className="p-4 pb-24 min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/profile" className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-600 active:scale-90 transition-transform">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Mis Favoritos</h1>
            </div>

            {/* List */}
            {favorites.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                    <Heart className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>No tienes favoritos aún.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {favorites.map((product) => (
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
        </div>
    );
}
