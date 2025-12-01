"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, LogOut, ShoppingBag, MapPin, Loader2, ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";

import { Store } from "lucide-react";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [isSeller, setIsSeller] = useState(false);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);

            // Check role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile && profile.role === 'seller') {
                setIsSeller(true);
            }

            setLoading(false);
        }
        getUser();
    }, [supabase, router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    return (
        <div className="p-4 pb-24">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h1>

            {/* User Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <User className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="font-bold text-lg text-gray-900">{user?.user_metadata?.full_name || "Usuario"}</h2>
                    <p className="text-gray-500 text-sm">{user?.email}</p>
                </div>
            </div>

            {/* Seller Dashboard Link */}
            {isSeller && (
                <Link href="/seller" className="block w-full bg-brand-red text-white p-4 rounded-xl shadow-lg shadow-red-100 mb-6 flex items-center justify-between active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Store className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Panel de Vendedor</h3>
                            <p className="text-xs opacity-90">Gestionar mi tienda</p>
                        </div>
                    </div>
                    <div className="bg-white/20 rounded-full p-1">
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                    </div>
                </Link>
            )}

            {/* Menu Options */}
            <div className="space-y-3">
                <Link href="/profile/orders" className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900">Mis Pedidos</h3>
                        <p className="text-xs text-gray-500">Ver historial de compras</p>
                    </div>
                </Link>

                <Link href="/profile/addresses" className="w-full flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform text-left">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900">Mis Direcciones</h3>
                        <p className="text-xs text-gray-500">Gestionar direcciones de entrega</p>
                    </div>
                </Link>

                <Link href="/profile/favorites" className="w-full flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform text-left">
                    <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900">Mis Favoritos</h3>
                        <p className="text-xs text-gray-500">Productos que te gustan</p>
                    </div>
                </Link>
            </div>

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="mt-8 w-full flex items-center justify-center gap-2 text-red-600 font-bold py-4 rounded-xl hover:bg-red-50 transition-colors"
            >
                <LogOut className="w-5 h-5" />
                Cerrar Sesión
            </button>
        </div>
    );
}
