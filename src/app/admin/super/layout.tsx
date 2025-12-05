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
        <div className="min-h-screen bg-gray-950 text-gray-100">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-gray-950 border-r border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-gray-800 flex justify-between items-center h-20">
                    <h1 className="text-2xl font-black tracking-tighter text-white">
                        RESUELVE <span className="text-brand-red">ADMIN</span>
                    </h1>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Menu Principal</p>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium group",
                                    isActive
                                        ? "bg-brand-red text-white shadow-lg shadow-red-900/20"
                                        : "text-gray-400 hover:bg-gray-900 hover:text-white"
                                )}
                            >
                                <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-gray-500 group-hover:text-white")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-gray-800">
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            router.push('/login');
                        }}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-400 hover:bg-red-900/10 hover:text-red-400 transition-all w-full font-medium group"
                    >
                        <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:pl-72 flex flex-col min-h-screen bg-gray-900 transition-all duration-300">
                {/* Header */}
                <header className="h-20 border-b border-gray-800 bg-gray-950/50 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white p-2 hover:bg-gray-800 rounded-lg transition-colors">
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="text-lg font-bold text-white hidden md:block">
                            {navItems.find(i => i.href === pathname)?.name || "Dashboard"}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* User Profile Preview */}
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-white">Super Admin</p>
                                <p className="text-xs text-gray-500">admin@resuelve.com</p>
                            </div>
                            <div className="w-10 h-10 bg-brand-red rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-red-900/20">
                                SA
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
