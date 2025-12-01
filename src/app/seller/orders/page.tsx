"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Search, Filter } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Order {
    id: string;
    buyer_name: string;
    total_usd: number;
    status: string;
    created_at: string;
    order_items: { quantity: number; title: string }[];
}

export default function SellerOrdersPage() {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'delivered'>('all');
    const supabase = createClient();

    useEffect(() => {
        async function fetchOrders() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: store } = await supabase
                .from('stores')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (!store) return;

            const { data: ordersData } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (quantity, title)
                `)
                .eq('store_id', store.id)
                .order('created_at', { ascending: false });

            if (ordersData) {
                setOrders(ordersData);
            }
            setLoading(false);
        }
        fetchOrders();
    }, [supabase]);

    const filteredOrders = orders.filter(order => {
        if (filter === 'all') return true;
        return order.status === filter;
    });

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    return (
        <div className="p-4 pb-24">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Pedidos</h1>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                {['all', 'pending', 'paid', 'delivered'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                            filter === f
                                ? "bg-brand-red text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                    >
                        {f === 'all' ? 'Todos' :
                            f === 'pending' ? 'Pendientes' :
                                f === 'paid' ? 'Pagados' : 'Entregados'}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        No hay pedidos {filter !== 'all' && 'en esta categoría'}.
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <Link
                            key={order.id}
                            href={`/seller/orders/${order.id}`}
                            className="block bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.99] transition-transform"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900">#{order.id.slice(0, 4)}</h3>
                                        <span className="text-gray-400">•</span>
                                        <span className="font-medium text-gray-700">{order.buyer_name}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {order.order_items.length} items • {formatCurrency(order.total_usd, 'USD')}
                                    </p>
                                </div>
                                <span className={cn(
                                    "px-2 py-1 rounded-lg text-xs font-bold",
                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                )}>
                                    {order.status === 'pending' ? 'Pendiente' :
                                        order.status === 'paid' ? 'Pagado' :
                                            order.status === 'delivered' ? 'Entregado' : order.status}
                                </span>
                            </div>

                            <div className="flex justify-between items-center border-t border-gray-50 pt-3 mt-2">
                                <span className="text-xs text-gray-400">
                                    {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-brand-red text-sm font-bold">Ver Detalles &rarr;</span>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
