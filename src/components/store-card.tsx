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
}

export function StoreCard({
    name,
    rating,
    distance,
    deliveryPrice,
    imageUrl,
    category,
}: StoreCardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <div className="relative h-32 w-full bg-gray-100">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        No Image
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium shadow-sm">
                    <Star className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
                    {rating}
                </div>
            </div>
            <div className="p-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-gray-900">{name}</h3>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {distance} • Delivery: ${deliveryPrice}
                        </p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {category}
                    </span>
                </div>
            </div>
        </div>
    );
}
