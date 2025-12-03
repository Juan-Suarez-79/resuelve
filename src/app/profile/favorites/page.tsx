"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Heart, Loader2, ShoppingBag, Store } from "lucide-react";
import Link from "next/link";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { ProductCard } from "@/components/product-card";
import { StoreCard } from "@/components/store-card";

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<{ products: any[], stores: any[] }>({ products: [], stores: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'products' | 'stores'>('products');
    const supabase = createClient();

    useEffect(() => {
        async function fetchFavorites() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch favorite products
            const { data: productData } = await supabase
                .from('favorites')
                .select(`
                    product_id,
                    products (
                        *,
                        stores (name, exchange_rate_bs, slug)
                    )
                `)
                .eq('user_id', user.id)
                .not('product_id', 'is', null)
                .order('created_at', { ascending: false });

            // Fetch favorite stores
            const { data: storeData } = await supabase
                .from('favorites')
                .select(`
                    store_id,
                    stores (*)
                `)
                .eq('user_id', user.id)
                .not('store_id', 'is', null)
                .order('created_at', { ascending: false });

            const formattedProducts = productData?.map((item: any) => ({
                ...item.products,
                store_name: item.products.stores?.name,
                exchange_rate: item.products.stores?.exchange_rate_bs,
                store_slug: item.products.stores?.slug
            })) || [];

            const formattedStores = storeData?.map((item: any) => item.stores) || [];

            setFavorites({ products: formattedProducts, stores: formattedStores });
            setLoading(false);
        }
        fetchFavorites();
    }, [supabase]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    const hasFavorites = favorites.products.length > 0 || favorites.stores.length > 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <MotionWrapper className="p-4 max-w-lg mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/profile" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-brand-red transition-colors active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mis Favoritos</h1>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-200 rounded-xl mb-6">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'products' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <ShoppingBag className="w-4 h-4" /> Productos ({favorites.products.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('stores')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'stores' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Store className="w-4 h-4" /> Tiendas ({favorites.stores.length})
                    </button>
                </div>

                {!hasFavorites ? (
                    <div className="text-center py-16 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center">
                            <Heart className="w-8 h-8 text-pink-300 fill-pink-100" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-lg mb-1">No tienes favoritos</p>
                            <p className="text-sm text-gray-500">Guarda lo que te guste para después.</p>
                        </div>
                        <Link href="/" className="mt-4 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-gray-200 active:scale-95 transition-all">
                            Explorar
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeTab === 'products' && (
                            favorites.products.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {favorites.products.map((product, index) => (
                                        <MotionWrapper key={product.id} delay={index * 0.05}>
                                            <ProductCard
                                                id={product.id}
                                                title={product.title}
                                                priceUsd={product.price_usd}
                                                imageUrl={product.image_url}
                                                exchangeRate={product.exchange_rate || 0}
                                                storeName={product.store_name || "Tienda"}
                                                storeId={product.store_id}
                                                storeSlug={product.store_slug}
                                            />
                                        </MotionWrapper>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">No tienes productos favoritos.</div>
                            )
                        )}

                        {activeTab === 'stores' && (
                            favorites.stores.length > 0 ? (
                                <div className="space-y-4">
                                    {favorites.stores.map((store, index) => (
                                        <MotionWrapper key={store.id} delay={index * 0.1}>
                                            <Link href={`/store/${store.slug}`} className="block">
                                                <StoreCard
                                                    id={store.id}
                                                    name={store.name}
                                                    rating={0} // We might need to fetch ratings if important here, or just show 0/Nuevo
                                                    distance="N/A" // Distance is hard to calculate here without geo context easily available
                                                    deliveryPrice={store.delivery_fee || 0}
                                                    imageUrl={store.image_url}
                                                    category={store.category || "General"}
                                                />
                                            </Link>
                                        </MotionWrapper>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">No tienes tiendas favoritas.</div>
                            )
                        )}
                    </div>
                )}
            </MotionWrapper>
        </div>
    );
}
