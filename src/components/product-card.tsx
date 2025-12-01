import { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Heart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/store/cart";
import { createClient } from "@/lib/supabase/client";

interface ProductCardProps {
    id: string;
    title: string;
    priceUsd: number;
    imageUrl: string;
    exchangeRate: number;
    storeName: string;
    storeId: string;
}

export function ProductCard({
    id,
    title,
    priceUsd,
    imageUrl,
    exchangeRate,
    storeName,
    storeId,
}: ProductCardProps) {
    const addItem = useCart((state) => state.addItem);
    const [isFavorite, setIsFavorite] = useState(false);
    const supabase = createClient();
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
        addItem({
            id,
            title,
            priceUsd,
            storeName,
            storeId,
            quantity: 1,
            imageUrl
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full relative group">
            <button
                onClick={toggleFavorite}
                className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm active:scale-90 transition-transform"
            >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-brand-red text-brand-red' : 'text-gray-400'}`} />
            </button>
            <div className="relative aspect-square w-full bg-gray-100">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        No Image
                    </div>
                )}
            </div>
            <div className="p-3 flex flex-col flex-grow">
                <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-1">
                    {title}
                </h3>
                <div className="mt-auto">
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-brand-red">
                            {formatCurrency(priceUsd, "USD")}
                        </span>
                        <span className="text-sm font-medium text-gray-600">
                            {formatCurrency(priceBs, "VES")}
                        </span>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        className="mt-2 w-full bg-brand-red text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 active:bg-red-800 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Agregar
                    </button>
                </div>
            </div>
        </div>
    );
}
