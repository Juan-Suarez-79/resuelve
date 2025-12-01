"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, DollarSign, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Order {
    id: string;
    buyer_name: string;
    total_usd: number;
    status: string;
    created_at: string;
    order_items: { quantity: number; title: string }[];
}

export default function SellerDashboard() {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [salesToday, setSalesToday] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                // Get Store ID
                const { data: store } = await supabase
                    .from('stores')
                    .select('id')
                    .eq('owner_id', user.id)
                    .single();

                if (!store) {
                    setLoading(false);
                    return;
                }

                // Fetch Orders
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
                    setTotalOrders(ordersData.length);

                    // Calculate Metrics
                    const today = new Date().toISOString().split('T')[0];
                    const todayOrders = ordersData.filter(o => o.created_at.startsWith(today) && o.status !== 'cancelled');
                    const sales = todayOrders.reduce((acc, curr) => acc + curr.total_usd, 0);
                    setSalesToday(sales);

                    const pending = ordersData.filter(o => o.status === 'pending').length;
                    setPendingCount(pending);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [supabase, router]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    const getTimeAgo = (dateString: string) => {
        const diff = new Date().getTime() - new Date(dateString).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `Hace ${minutes} min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `Hace ${hours} h`;
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="p-4 pb-24 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Hola,</h1>
                    <h1 className="text-3xl font-bold text-gray-900">Vendedor!</h1>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">Total Pedidos</p>
                    <p className="text-xl font-bold text-gray-900">{totalOrders}</p>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <Link href="/seller/earnings" className="bg-brand-red p-5 rounded-3xl text-white shadow-lg shadow-red-200 active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-2 mb-2 opacity-90">
                        <DollarSign className="w-5 h-5" />
                        <span className="text-sm font-medium">Ventas Hoy</span>
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(salesToday, 'USD')}</p>
                    <div className="mt-2 text-xs bg-white/20 inline-block px-2 py-1 rounded-lg">
                        Ver Reporte Completo →
                    </div>
                </Link>

                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <ShoppingBag className="w-5 h-5" />
                        <span className="text-sm font-medium">Pendientes</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Pedidos Recientes</h2>
                <Link href="/seller/orders" className="text-sm text-brand-red font-bold">Ver todos</Link>
            </div>

            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                        No tienes pedidos aún.
                    </div>
                ) : (
                    orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900">#{order.id.slice(0, 4)}</h3>
                                        <span className="text-gray-400 text-xs">• {order.buyer_name}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {order.order_items.length} items • <span className="font-bold text-gray-900">{formatCurrency(order.total_usd, 'USD')}</span>
                                    </p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                        order.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {order.status === 'pending' ? 'Pendiente' :
                                        order.status === 'paid' ? 'Pagado' :
                                            order.status === 'delivered' ? 'Entregado' : order.status}
                                </span>
                            </div>

                            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-50">
                                <span className="text-xs text-gray-400 font-medium">
                                    {getTimeAgo(order.created_at)}
                                </span>
                                <Link
                                    href={`/seller/orders/${order.id}`}
                                    className="text-brand-red text-sm font-bold hover:underline"
                                >
                                    Ver Detalles
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Action Button */}
            <Link
                href="/seller/products/new"
                className="fixed bottom-24 right-6 w-14 h-14 bg-brand-red text-white rounded-full shadow-xl shadow-red-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50"
            >
                <Plus className="w-8 h-8" />
            </Link>
        </div>
    );
}
