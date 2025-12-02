import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Heart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/store/cart";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

interface ProductCardProps {
    id: string;
    title: string;
    priceUsd: number;
    imageUrl: string;
    exchangeRate: number;
    storeName: string;
    storeId: string;
}

import Link from "next/link";

import { CartConflictModal } from "./cart-conflict-modal";

export function ProductCard({
    id,
    title,
    priceUsd,
    imageUrl,
    exchangeRate,
    storeName,
    storeId,
}: ProductCardProps) {
    const { addItem, items, clearCart } = useCart();
    const [isFavorite, setIsFavorite] = useState(false);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const supabase = createClient();
    const { toast } = useToast();
    const priceBs = priceUsd * exchangeRate;

    useEffect(() => {
        checkFavorite();
    }, []);

    const checkFavorite = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('favorites').select('*').eq('user_id', user.id).eq('product_id', id).single();
        if (data) setIsFavorite(true);
    };

    const toggleFavorite = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (isFavorite) {
            await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', id);
            setIsFavorite(false);
        } else {
            await supabase.from('favorites').insert({ user_id: user.id, product_id: id });
            setIsFavorite(true);
        }
    };

    const handleAddToCart = () => {
        if (items.length > 0 && items[0].storeId !== storeId) {
            setShowConflictModal(true);
            return;
        }
        addToCart();
    };

    const addToCart = () => {
        addItem({
            id,
            title,
            priceUsd,
            storeName,
            storeId,
            quantity: 1,
            imageUrl
        });
        toast("Producto agregado al carrito", "success");
    };

    const handleClearAndAdd = () => {
        clearCart();
        addToCart();
        setShowConflictModal(false);
    };

    return (
        <>
            <CartConflictModal
                isOpen={showConflictModal}
                onClose={() => setShowConflictModal(false)}
                onClearAndAdd={handleClearAndAdd}
                currentStoreName={items[0]?.storeName || "otra tienda"}
                newStoreName={storeName}
            />
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full relative group hover:shadow-xl hover:shadow-red-100/50 transition-all duration-300 transform hover:-translate-y-1">
                <button
                    onClick={toggleFavorite}
                    className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-sm active:scale-90 transition-all hover:bg-red-50"
                >
                    <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-brand-red text-brand-red' : 'text-gray-400 hover:text-brand-red'}`} />
                </button>
                <Link href={`/product/${id}`} className="relative aspect-square w-full bg-gray-50 block overflow-hidden">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-300 bg-gray-50">
                            <span className="text-xs font-medium">Sin Imagen</span>
                        </div>
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
                <div className="p-4 flex flex-col flex-grow">
                    <Link href={`/product/${id}`}>
                        <h3 className="font-bold text-gray-900 line-clamp-2 text-sm mb-2 hover:text-brand-red transition-colors leading-snug">
                            {title}
                        </h3>
                    </Link>
                    <div className="mt-auto pt-2 border-t border-gray-50">
                        <div className="flex flex-col mb-3">
                            <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                                {formatCurrency(priceUsd, "USD")}
                            </span>
                            <span className="text-xs font-semibold text-gray-500">
                                ≈ {formatCurrency(priceBs, "VES")}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                href={`/product/${id}`}
                                className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                            >
                                Ver
                            </Link>
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 bg-brand-red text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-100 active:scale-[0.98] hover:bg-red-700 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
