"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/store/cart";

interface ProductCardProps {
    id: string;
    title: string;
    priceUsd: number;
    imageUrl: string;
    exchangeRate: number;
    storeName: string;
}

export function ProductCard({
    id,
    title,
    priceUsd,
    imageUrl,
    exchangeRate,
    storeName,
}: ProductCardProps) {
    const addItem = useCart((state) => state.addItem);
    const priceBs = priceUsd * exchangeRate;

    const handleAddToCart = () => {
        addItem({
            id,
            title,
            priceUsd,
            storeName,
            quantity: 1,
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
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
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-brand-red">
                            {formatCurrency(priceUsd, "USD")}
                        </span>
                        <span className="text-xs text-gray-500">
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
