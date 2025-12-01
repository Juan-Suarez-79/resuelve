"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, LayoutDashboard, Package, ClipboardList, User, LogOut, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export function SellerHeader() {
    const [isOpen, setIsOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || "Vendedor");
            }
        }
        getUser();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const menuItems = [
        { href: "/seller", icon: LayoutDashboard, label: "Dashboard", desc: "Resumen y ganancias" },
        { href: "/seller/products", icon: Package, label: "Mis Productos", desc: "Gestionar inventario" },
        { href: "/seller/orders", icon: ClipboardList, label: "Pedidos", desc: "Ver y procesar órdenes" },
        { href: "/seller/profile", icon: User, label: "Mi Perfil", desc: "Configuración de cuenta" },
    ];

    return (
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
            <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/seller" className="relative w-32 h-10">
                    <Image
                        src="/logo-final.jpg"
                        alt="Resuelve Maestre"
                        fill
                        className="object-contain object-left"
                        priority
                    />
                </Link>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2.5 hover:bg-gray-100 rounded-full transition-all active:scale-90 shadow-sm border border-transparent hover:border-gray-200"
                >
                    {isOpen ? <X className="w-6 h-6 text-gray-900" /> : <Menu className="w-6 h-6 text-gray-900" />}
                </button>
            </div>

            {/* Dropdown Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-[calc(100%+1px)] left-0 right-0 bg-white shadow-xl border-b border-gray-100 z-50 rounded-b-3xl overflow-hidden"
                        >
                            <div className="max-w-md mx-auto p-4 space-y-2">
                                {/* User Info */}
                                <div className="bg-gray-50 p-4 rounded-2xl mb-4 flex items-center gap-3 border border-gray-100">
                                    <div className="w-10 h-10 bg-brand-red/10 rounded-full flex items-center justify-center text-brand-red font-bold">
                                        {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs text-gray-500 font-medium">Conectado como</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{userEmail}</p>
                                    </div>
                                </div>

                                {menuItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-all group border border-transparent hover:border-gray-100"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-gray-500 group-hover:text-brand-red">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                                                <p className="text-xs text-gray-400 font-medium">{item.desc}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-red transition-colors" />
                                    </Link>
                                ))}

                                <div className="h-px bg-gray-100 my-2" />

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 active:scale-[0.98] transition-all"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Cerrar Sesión
                                </button>
                            </div>
                        </motion.div>

                        {/* Backdrop to close */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 top-16 bg-black/20 backdrop-blur-sm z-40"
                            onClick={() => setIsOpen(false)}
                        />
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}
