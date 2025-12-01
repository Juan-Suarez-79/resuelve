"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus } from "lucide-react";
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

    return (
        <div className="p-4 pb-24">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Hola,</h1>
                <h1 className="text-3xl font-bold text-gray-900">Vendedor!</h1>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-brand-red text-white p-4 rounded-2xl shadow-lg shadow-red-100">
                    <p className="text-sm opacity-90 mb-1">Ventas Hoy:</p>
                    <p className="text-2xl font-bold">${salesToday.toFixed(2)}</p>
                </div>
                <div className="bg-brand-yellow text-yellow-900 p-4 rounded-2xl shadow-lg shadow-yellow-100">
                    <p className="text-sm opacity-90 mb-1">Pedidos Pendientes:</p>
                    <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
            </div>

            {/* Recent Orders */}
            <h2 className="text-lg font-bold text-gray-900 mb-4">Pedidos Recientes</h2>

            <div className="space-y-4">
                {orders.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        No tienes pedidos aún.
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-gray-900">Pedido #{order.id.slice(0, 4)} - {order.buyer_name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {order.order_items.length} items • {formatCurrency(order.total_usd, 'USD')}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                    {order.status === 'pending' ? 'Pendiente de Pago' :
                                        order.status === 'paid' ? 'Pagado' : order.status}
                                </span>
                            </div>

                            <div className="flex justify-between items-center mt-4">
                                <span className="text-xs text-gray-400">
                                    Hace {Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000)} min
                                </span>
                                <Link
                                    href={`/seller/orders/${order.id}`}
                                    className="bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-transform"
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
                className="fixed bottom-24 right-6 w-14 h-14 bg-brand-red text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50"
            >
                <Plus className="w-8 h-8" />
            </Link>
        </div>
    );
}
