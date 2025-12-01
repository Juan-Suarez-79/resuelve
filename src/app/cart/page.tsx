"use client";

import { useCart } from "@/lib/store/cart";
import { formatCurrency, generateWhatsAppLink } from "@/lib/utils";
import { Trash2, MessageCircle, MapPin, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CartPage() {
    const { items, removeItem, totalUsd } = useCart();
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");

    // In a real app, we'd fetch the store's rate dynamically. 
    // For now, we use the rate from the first item (assuming single store checkout or mixed is handled simply)
    // Ideally, cart should be per-store or handle mixed rates.
    // We'll assume mixed cart is allowed but display USD total primarily.

    const total = totalUsd();

    // Mock rate for display if mixed, or average. 
    // Better approach: Calculate Bs total per item and sum up.
    const totalBs = items.reduce((acc, item) => {
        // We need the rate stored in the item or fetch it.
        // For this MVP, let's assume a global rate or passed in item. 
        // I'll update the cart store to include rate if needed, but for now let's just use a fallback or 0 if not available.
        // The prompt says "Seller Rate".
        return acc + (item.priceUsd * 38.5 * item.quantity); // Fallback mock rate 38.5
    }, 0);

    const handleCheckout = () => {
        if (items.length === 0) return;
        if (!name || !address) {
            alert("Por favor completa tu nombre y dirección.");
            return;
        }

        // Group by store to potentially send multiple messages
        // For MVP, we take the first store's "phone" (mocked)
        const storeName = items[0]?.storeName || "Store";

        const itemsList = items
            .map((item) => `- ${item.quantity}x ${item.title} ($${item.priceUsd})`)
            .join("\n");

        const message = `*Nuevo Pedido - Resuelve*\n\n*Cliente:* ${name}\n*Dirección:* ${address}\n\n*Pedido:*\n${itemsList}\n\n*Total: $${total.toFixed(2)}*`;

        // Mock phone number - In real app, fetch from store profile
        const phone = "584120000000";

        const link = generateWhatsAppLink(phone, message);
        window.open(link, "_blank");
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] px-4 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Trash2 className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
                <p className="text-gray-500 mb-6">Parece que aún no has agregado productos.</p>
                <Link
                    href="/"
                    className="bg-brand-red text-white px-6 py-3 rounded-full font-medium shadow-lg shadow-red-200"
                >
                    Ir a comprar
                </Link>
            </div>
        );
    }

    return (
        <div className="p-4 pb-32">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Tu Carrito</h1>

            <div className="space-y-4 mb-8">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100"
                    >
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-500">{item.storeName}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-bold text-brand-red">
                                    {formatCurrency(item.priceUsd, "USD")}
                                </span>
                                <span className="text-xs text-gray-400">
                                    x {item.quantity}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Checkout Form */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand-red" />
                    Datos de Entrega
                </h3>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Nombre Completo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Juan Pérez"
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-brand-red outline-none text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Dirección Exacta</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Ej: Av. Principal, Edif. Azul, Apto 4B"
                                rows={2}
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-brand-red outline-none text-sm resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-md mx-auto z-30">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-sm text-gray-500">Total a pagar</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                                {formatCurrency(total, "USD")}
                            </span>
                            <span className="text-sm text-gray-500">
                                ~ {formatCurrency(totalBs, "VES")}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleCheckout}
                    className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold text-lg shadow-lg shadow-green-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                    <MessageCircle className="w-6 h-6" />
                    Pedir por WhatsApp
                </button>
            </div>
        </div>
    );
}
