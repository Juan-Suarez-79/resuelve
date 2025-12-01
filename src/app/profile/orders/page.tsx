"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ShoppingBag, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
        <div className="p-4 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/profile" className="text-gray-600">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900">Mis Pedidos</h1>
            </div>

            {/* Order List */}
            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No has realizado pedidos aún.</p>
                        <Link href="/" className="text-brand-red font-bold mt-2 inline-block">
                            Explorar Tiendas
                        </Link>
                    </div>
                ) : (
                    orders.map((order) => (
                        <Link
                            key={order.id}
                            href={`/profile/orders/${order.id}`}
                            className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-gray-900">{order.stores?.name || "Tienda"}</h3>
                                    <p className="text-xs text-gray-500">
                                        {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium
                                    ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                    }`}>
                                    {order.status === 'pending' ? 'Pendiente' :
                                        order.status === 'paid' ? 'Pagado' :
                                            order.status === 'delivered' ? 'Entregado' : order.status}
                                </span>
                            </div>

                            <div className="flex justify-between items-center mt-3">
                                <span className="font-bold text-brand-red">
                                    {formatCurrency(order.total_usd, 'USD')}
                                </span>
                                <div className="flex items-center text-gray-400 text-sm">
                                    Ver detalles <ChevronRight className="w-4 h-4 ml-1" />
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
