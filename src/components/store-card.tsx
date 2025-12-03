"use client";

import Image from "next/image";
import { Star, MapPin } from "lucide-react";

interface StoreCardProps {
    name: string;
    rating: number;
    distance: string;
    deliveryPrice: number;
    imageUrl: string;
    category: string;
    priority?: boolean;
}

export function StoreCard({
    name,
    rating,
    distance,
    deliveryPrice,
    imageUrl,
    category,
    priority = false,
}: StoreCardProps) {
    return (
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4 hover:shadow-xl hover:shadow-red-100/50 transition-all duration-300 transform hover:-translate-y-1 group">
            <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        priority={priority}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        placeholder="empty" // Ideally use blur with blurDataURL if available
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50">
                        <span className="text-sm font-medium">Sin Imagen</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                <div className="absolute top-3 right-3 text-gray-600 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow-sm">
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
