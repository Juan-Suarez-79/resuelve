import { useState, useEffect } from "react";
import Image from "next/image";
import { Star, MapPin, Heart } from "lucide-react";
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

    return (
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4 hover:shadow-xl hover:shadow-red-100/50 transition-all duration-300 transform hover:-translate-y-1 group relative">
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
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        placeholder="empty"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50">
                        <span className="text-sm font-medium">Sin Imagen</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

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
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-brand-red transition-colors">{name}</h3>
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
