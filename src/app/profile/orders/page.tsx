"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ShoppingBag, ChevronRight, Package, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

export default function BuyerOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function fetchOrders() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: ordersData, error } = await supabase
                .from('orders')
                .select('*, stores(name)')
                .eq('buyer_id', user.id)
                .order('created_at', { ascending: false });

            if (ordersData) {
                setOrders(ordersData);
            }
            setLoading(false);
        }
        fetchOrders();
    }, [supabase, router]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            <MotionWrapper className="p-4 max-w-lg mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/profile" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-brand-red transition-colors active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mis Pedidos</h1>
                </div>

                {/* Order List */}
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShoppingBag className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No tienes pedidos</h3>
                            <p className="text-gray-500 mb-6">Aún no has realizado ninguna compra. ¡Explora las tiendas y haz tu primer pedido!</p>
                            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-brand-red text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95">
                                Explorar Tiendas
                            </Link>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <Link
                                key={order.id}
                                href={`/profile/orders/${order.id}`}
                                className="block bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.01] transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red font-bold text-lg">
                                            {order.stores?.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{order.stores?.name || "Tienda"}</h3>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">ID: #{order.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide shadow-sm
                                        ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                            order.status === 'paid' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                order.status === 'delivered' ? 'bg-green-100 text-green-800 border border-green-200' :
                                                    'bg-gray-100 text-gray-800 border border-gray-200'
                                        }`}>
                                        {order.status === 'pending' ? 'Pendiente' :
                                            order.status === 'paid' ? 'Pagado' :
                                                order.status === 'delivered' ? 'Entregado' : order.status}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 bg-gray-50 p-3 rounded-xl">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="w-px h-4 bg-gray-300"></div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium mb-0.5">Total</p>
                                        <span className="font-black text-xl text-gray-900">
                                            {formatCurrency(order.total_usd, 'USD')}
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand-red group-hover:text-white transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </MotionWrapper>
        </div>
    );
}
