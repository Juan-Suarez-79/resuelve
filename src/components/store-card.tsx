import { useState, useEffect } from "react";
import Image from "next/image";
import { Star, MapPin, Heart, Crown, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface StoreCardProps {
    id: string;
    name: string;
    rating: number;
    distance: string;
    deliveryPrice: number;
    imageUrl: string;
    category: string;
    priority?: boolean;
    isOpen?: boolean;
    planTier?: string;
}

export function StoreCard({
    id,
    name,
    rating,
    distance,
    deliveryPrice,
    imageUrl,
    category,
    priority = false,
    isOpen = true,
    planTier,
}: StoreCardProps) {
    const [isFavorite, setIsFavorite] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        checkFavorite();
    }, []);

    const checkFavorite = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('favorites').select('*').eq('user_id', user.id).eq('store_id', id).single();
        if (data) setIsFavorite(true);
    };

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent link navigation
        e.stopPropagation();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (isFavorite) {
            await supabase.from('favorites').delete().eq('user_id', user.id).eq('store_id', id);
            setIsFavorite(false);
        } else {
            await supabase.from('favorites').insert({ user_id: user.id, store_id: id });
            setIsFavorite(true);
        }
    };

    const isVip = planTier === 'vip';
    const isPro = planTier === 'pro';

    return (
        <article className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4 hover:shadow-xl hover:shadow-red-100/50 transition-all duration-300 transform hover:-translate-y-1 group relative ${!isOpen ? 'opacity-80' : ''} ${isVip ? 'ring-2 ring-yellow-400/50 shadow-yellow-100' : isPro ? 'ring-1 ring-blue-400/30' : ''}`}>
            <button
                onClick={toggleFavorite}
                className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-sm active:scale-90 transition-all hover:bg-red-50"
            >
                <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-brand-red text-brand-red' : 'text-gray-400 hover:text-brand-red'}`} />
            </button>

            <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        priority={priority}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={`object-cover group-hover:scale-105 transition-transform duration-700 ${!isOpen ? 'grayscale' : ''}`}
                        placeholder="empty"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50">
                        <span className="text-sm font-medium">Sin Imagen</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                {/* Premium Badges */}
                {isVip && (
                    <div className="absolute top-3 left-14 z-20 flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg shadow-yellow-500/20 animate-pulse">
                        <Crown className="w-3 h-3 fill-white" />
                        VIP
                    </div>
                )}
                {isPro && (
                    <div className="absolute top-3 left-14 z-20 flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg shadow-blue-500/20">
                        <Sparkles className="w-3 h-3 fill-white" />
                        PRO
                    </div>
                )}

                {!isOpen && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] z-10">
                        <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg border border-red-400">
                            Cerrado
                        </span>
                    </div>
                )}

                <div className="absolute top-3 right-3 text-gray-600 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow-sm z-10">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    {rating > 0 ? rating.toFixed(1) : "Nuevo"}
                </div>

                <div className="absolute bottom-3 left-3 text-white">
                    <span className="text-xs font-bold bg-brand-red/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm">
                        {category}
                    </span>
                </div>
            </div>
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-brand-red transition-colors">{name}</h3>
                            {isVip && <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                            {isPro && <Sparkles className="w-4 h-4 text-blue-500 fill-blue-500" />}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 font-medium">
                            <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                                <MapPin className="w-3.5 h-3.5 text-brand-red" />
                                {distance}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md">
                                ${deliveryPrice} Delivery
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
