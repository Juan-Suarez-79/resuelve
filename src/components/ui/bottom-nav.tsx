"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/search", icon: Search, label: "Search" },
        { href: "/cart", icon: ShoppingCart, label: "Cart" },
        { href: "/profile", icon: User, label: "Profile" },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive ? "text-brand-red" : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs font-medium">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
