"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Search, Filter, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

import { MotionWrapper } from "@/components/ui/motion-wrapper";

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
    const { toast } = useToast();

    useEffect(() => {
        let storeId: string | null = null;

        async function fetchOrders() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: store } = await supabase
                .from('stores')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (!store) return;
            storeId = store.id;

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

        // Realtime Subscription
        const channel = supabase
            .channel('seller-orders')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: storeId ? `store_id=eq.${storeId}` : undefined
                },
                async (payload) => {
                    // Fetch the full order with items
                    const { data: newOrder } = await supabase
                        .from('orders')
                        .select(`*, order_items (quantity, title)`)
                        .eq('id', payload.new.id)
                        .single();

                    if (newOrder) {
                        setOrders((prev) => [newOrder, ...prev]);
                        toast("¡Nuevo pedido recibido!", "success");
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, toast]);

    const filteredOrders = orders.filter(order => {
        if (filter === 'all') return true;
        return order.status === filter;
    });

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <MotionWrapper className="p-4 max-w-lg mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/seller" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-brand-red transition-colors active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pedidos</h1>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-4 no-scrollbar">
                    {['all', 'pending', 'paid', 'delivered'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={cn(
                                "px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm",
                                filter === f
                                    ? "bg-brand-red text-white shadow-red-200 scale-105"
                                    : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
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
                        <div className="text-center py-16 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                <Search className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="font-medium text-gray-900">No hay pedidos {filter !== 'all' && 'en esta categoría'}.</p>
                        </div>
                    ) : (
                        filteredOrders.map((order) => (
                            <Link
                                key={order.id}
                                href={`/seller/orders/${order.id}`}
                                className="block bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.01] transition-all group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg text-xs font-bold font-mono">#{order.id.slice(0, 4)}</span>
                                            <span className="text-gray-400 text-xs font-medium">• {new Date(order.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-brand-red transition-colors">{order.buyer_name}</h3>
                                    </div>
                                    <span className={cn(
                                        "px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wide shadow-sm border",
                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                            order.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' :
                                                order.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                                                    'bg-gray-100 text-gray-800 border-gray-200'
                                    )}>
                                        {order.status === 'pending' ? 'Pendiente' :
                                            order.status === 'paid' ? 'Pagado' :
                                                order.status === 'delivered' ? 'Entregado' : order.status}
                                    </span>
                                </div>

                                <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                                    <div className="flex -space-x-2 overflow-hidden pl-1">
                                        {order.order_items.slice(0, 3).map((item, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500 shadow-sm" title={item.title}>
                                                {item.title.charAt(0)}
                                            </div>
                                        ))}
                                        {order.order_items.length > 3 && (
                                            <div className="w-8 h-8 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500 shadow-sm">
                                                +{order.order_items.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 font-medium mb-0.5">Total</p>
                                        <p className="text-xl font-black text-gray-900 leading-none">{formatCurrency(order.total_usd, 'USD')}</p>
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
