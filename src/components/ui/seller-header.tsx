"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LayoutDashboard, Package, ClipboardList, User, LogOut, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function SellerHeader() {
    const [isOpen, setIsOpen] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const menuItems = [
        { href: "/seller", icon: LayoutDashboard, label: "Dashboard / Ganancias" },
        { href: "/seller/products", icon: Package, label: "Mis Productos / Inventario" },
        { href: "/seller/orders", icon: ClipboardList, label: "Pedidos" },
        { href: "/seller/profile", icon: User, label: "Mi Perfil" },
    ];

    return (
        <header className="bg-white shadow-sm sticky top-0 z-40">
            <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/seller" className="font-bold text-xl text-brand-red">
                    Resuelve<span className="text-brand-yellow">.</span>
                </Link>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    {isOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
                </button>
            </div>

            {/* Dropdown Menu Overlay */}
            {isOpen && (
                <div className="absolute top-16 left-0 right-0 bg-white shadow-xl border-t border-gray-100 z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="max-w-md mx-auto p-4 space-y-2">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-700 font-medium"
                            >
                                <item.icon className="w-5 h-5 text-brand-red" />
                                {item.label}
                            </Link>
                        ))}

                        <div className="h-px bg-gray-100 my-2" />

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors text-red-600 font-medium"
                        >
                            <LogOut className="w-5 h-5" />
                            Cerrar Sesión
                        </button>
                    </div>

                    {/* Backdrop to close */}
                    <div
                        className="fixed inset-0 top-[calc(4rem+1px)] bg-black/20 z-[-1]"
                        onClick={() => setIsOpen(false)}
                    />
                </div>
            )}
        </header>
    );
}
