"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Store, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from "@/lib/utils";

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState({
        activeSellers: 0,
        registeredBuyers: 0,
        totalOrders: 0,
        globalGMV: 0
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [topStores, setTopStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                // 1. Active Sellers (Stores)
                const { count: sellersCount } = await supabase
                    .from('stores')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_banned', false);

                // 2. Registered Buyers
                const { count: buyersCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });

                // 3. Total Orders & GMV
                const { data: orders } = await supabase
                    .from('orders')
                    .select('total_usd, created_at, store_id');

                const totalOrders = orders?.length || 0;
                const globalGMV = orders?.reduce((acc, order) => acc + (order.total_usd || 0), 0) || 0;

                setStats({
                    activeSellers: sellersCount || 0,
                    registeredBuyers: buyersCount || 0,
                    totalOrders,
                    globalGMV
                });

                // 4. Prepare Chart Data (Last 30 Days)
                if (orders) {
                    const last30Days = [...Array(30)].map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        return d.toISOString().split('T')[0];
                    }).reverse();

                    const data = last30Days.map(date => {
                        const count = orders.filter(o => o.created_at.startsWith(date)).length;
                        return { date: date.slice(5), orders: count }; // MM-DD
                    });
                    setChartData(data);

                    // 5. Top Performing Stores
                    const storeOrderCounts: Record<string, number> = {};
                    orders.forEach(o => {
                        if (o.store_id) {
                            storeOrderCounts[o.store_id] = (storeOrderCounts[o.store_id] || 0) + 1;
                        }
                    });

                    const sortedStoreIds = Object.entries(storeOrderCounts)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([id]) => id);

                    if (sortedStoreIds.length > 0) {
                        const { data: stores } = await supabase
                            .from('stores')
                            .select('id, name, profiles:owner_id(full_name)')
                            .in('id', sortedStoreIds);

                        if (stores) {
                            const topStoresData = sortedStoreIds.map(id => {
                                const store = stores.find(s => s.id === id);
                                return {
                                    id,
                                    name: store?.name || "Desconocida",
                                    owner: Array.isArray(store?.profiles) ? store?.profiles[0]?.full_name : (store?.profiles as any)?.full_name || "N/A",
                                    orders: storeOrderCounts[id]
                                };
                            });
                            setTopStores(topStoresData);
                        }
                    }
                }

            } catch (error) {
                console.error("Error fetching super admin stats:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchDashboardData();
    }, [supabase]);

    if (loading) return <div className="text-white">Cargando datos...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard General</h1>
                <p className="text-gray-400">Vista general del rendimiento de la plataforma.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Vendedores Activos"
                    value={stats.activeSellers}
                    icon={Store}
                    color="text-blue-400"
                    bg="bg-blue-400/10"
                />
                <KpiCard
                    title="Usuarios Registrados"
                    value={stats.registeredBuyers}
                    icon={Users}
                    color="text-purple-400"
                    bg="bg-purple-400/10"
                />
                <KpiCard
                    title="Total Pedidos"
                    value={stats.totalOrders}
                    icon={ShoppingBag}
                    color="text-yellow-400"
                    bg="bg-yellow-400/10"
                />
                <KpiCard
                    title="GMV Global"
                    value={formatCurrency(stats.globalGMV, 'USD')}
                    icon={DollarSign}
                    color="text-green-400"
                    bg="bg-green-400/10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-gray-950 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-brand-red" />
                        <h2 className="text-lg font-bold text-white">Nuevos Pedidos (Últimos 30 días)</h2>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9CA3AF"
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="orders"
                                    stroke="#D32F2F"
                                    strokeWidth={3}
                                    dot={{ fill: '#D32F2F', strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: '#fff' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Stores List */}
                <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Store className="w-5 h-5 text-yellow-400" />
                        <h2 className="text-lg font-bold text-white">Top Tiendas</h2>
                    </div>
                    <div className="space-y-4">
                        {topStores.length === 0 ? (
                            <p className="text-gray-500 text-sm">No hay datos suficientes.</p>
                        ) : (
                            topStores.map((store, i) => (
                                <div key={store.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-900/50 border border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-orange-400 text-black' : 'bg-gray-800 text-gray-400'}`}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white leading-none mb-1">{store.name}</p>
                                            <p className="text-xs text-gray-500">{store.owner}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-white">{store.orders}</p>
                                        <p className="text-[10px] text-gray-500 uppercase">Pedidos</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-gray-950 border border-gray-800 p-6 rounded-2xl flex items-center gap-4 hover:border-gray-700 transition-colors">
            <div className={`p-4 rounded-xl ${bg} ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
                <p className="text-2xl font-black text-white">{value}</p>
            </div>
        </div>
    );
}
