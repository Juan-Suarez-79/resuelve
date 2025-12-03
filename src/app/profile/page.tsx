"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User, LogOut, ShoppingBag, MapPin, Loader2, ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

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
        <div className="min-h-screen bg-gray-50 pb-24">
            <MotionWrapper className="p-4 max-w-lg mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">Mi Perfil</h1>

                {/* User Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                        <User className="w-32 h-32" />
                    </div>
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shadow-inner border-4 border-white relative z-10">
                        <User className="w-10 h-10" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="font-bold text-xl text-gray-900 mb-1">{user?.user_metadata?.full_name || "Usuario"}</h2>
                        <p className="text-gray-500 text-sm font-medium mb-3">{user?.email}</p>
                        <Link href="/profile/edit" className="inline-flex items-center gap-1 text-xs font-bold text-brand-red bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors">
                            Editar Perfil
                        </Link>
                    </div>
                </div>

                {/* Seller Dashboard Link */}
                {isSeller && (
                    <Link href="/seller" className="block w-full bg-gradient-to-r from-brand-red to-red-600 text-white p-5 rounded-2xl shadow-lg shadow-red-200 mb-8 flex items-center justify-between active:scale-[0.98] hover:scale-[1.02] transition-all group relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center shadow-inner">
                                <Store className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">Panel de Vendedor</h3>
                                <p className="text-xs font-medium text-white/80">Gestionar mi tienda</p>
                            </div>
                        </div>
                        <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm group-hover:bg-white/30 transition-colors relative z-10">
                            <ArrowLeft className="w-5 h-5 rotate-180" />
                        </div>
                    </Link>
                )}

                {/* Menu Options */}
                <div className="space-y-4">
                    <Link href="/profile/orders" className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] hover:shadow-md transition-all group">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">Mis Pedidos</h3>
                            <p className="text-xs font-medium text-gray-500">Ver historial de compras</p>
                        </div>
                        <ArrowLeft className="w-5 h-5 text-gray-300 rotate-180 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link href="/profile/addresses" className="w-full flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] hover:shadow-md transition-all group text-left">
                        <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-orange-600 transition-colors">Mis Direcciones</h3>
                            <p className="text-xs font-medium text-gray-500">Gestionar direcciones de entrega</p>
                        </div>
                        <ArrowLeft className="w-5 h-5 text-gray-300 rotate-180 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link href="/profile/favorites" className="w-full flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] hover:shadow-md transition-all group text-left">
                        <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Heart className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-pink-600 transition-colors">Mis Favoritos</h3>
                            <p className="text-xs font-medium text-gray-500">Productos que te gustan</p>
                        </div>
                        <ArrowLeft className="w-5 h-5 text-gray-300 rotate-180 group-hover:text-pink-600 group-hover:translate-x-1 transition-all" />
                    </Link>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="mt-10 w-full flex items-center justify-center gap-2 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-50 active:scale-[0.98] transition-all border border-transparent hover:border-red-100"
                >
                    <LogOut className="w-5 h-5" />
                    Cerrar Sesión
                </button>
            </MotionWrapper>
        </div>
    );
}
