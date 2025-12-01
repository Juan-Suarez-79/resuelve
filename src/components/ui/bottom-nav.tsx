"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/store/cart";
import { useEffect, useState } from "react";

export function BottomNav() {
    const pathname = usePathname();
    const { items } = useCart();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    const navItems = [
        { href: "/", icon: Home, label: "Inicio" },
        { href: "/search", icon: Search, label: "Buscar" },
        { href: "/cart", icon: ShoppingCart, label: "Carrito", hasBadge: true },
        { href: "/profile", icon: User, label: "Perfil" },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe max-w-md mx-auto">
            <div className="flex justify-around items-center h-16">
                {navItems.map(({ href, icon: Icon, label, hasBadge }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "relative flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive ? "text-brand-red" : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            <div className="relative">
                                <Icon className="w-6 h-6" />
                                {hasBadge && mounted && itemCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-brand-red text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                        {itemCount > 99 ? '99+' : itemCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-medium">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
