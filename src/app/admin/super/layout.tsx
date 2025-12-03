"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Loader2, LayoutDashboard, Store, Flag, LogOut, Menu, X, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        async function checkSuperAdmin() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('is_super_admin')
                .eq('id', user.id)
                .single();

            if (!profile || !profile.is_super_admin) {
                // Not a super admin, redirect to 404 or home
                router.push('/');
                return;
            }

            setIsSuperAdmin(true);
            setLoading(false);
        }
        checkSuperAdmin();
    }, [supabase, router]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><Loader2 className="w-10 h-10 animate-spin" /></div>;
    }

    if (!isSuperAdmin) return null;

    const navItems = [
        { name: "Dashboard", href: "/admin/super", icon: LayoutDashboard },
        { name: "Tiendas", href: "/admin/super/stores", icon: Store },
        { name: "Verificaciones KYC", href: "/admin/super/kyc", icon: UserCheck },
        { name: "Reportes", href: "/admin/super/reports", icon: Flag },
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-950 border-r border-gray-800 transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h1 className="text-xl font-black tracking-tighter text-white">
                        RESUELVE <span className="text-brand-red">ADMIN</span>
                    </h1>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                                    isActive
                                        ? "bg-brand-red text-white shadow-lg shadow-red-900/20"
                                        : "text-gray-400 hover:bg-gray-900 hover:text-white"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            router.push('/login');
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-all w-full font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950">
                    <button onClick={() => setSidebarOpen(true)} className="text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-white">Admin Panel</span>
                    <div className="w-6" /> {/* Spacer */}
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
