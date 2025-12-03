"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, TrendingUp, DollarSign, Calendar, Package, Loader2, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency, getExchangeRate } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function EarningsPage() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        today: 0,
        week: 0,
        month: 0,
        year: 0,
        totalOrders: 0
    });
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [weeklyData, setWeeklyData] = useState<any[]>([]);
    const [exchangeRate, setExchangeRate] = useState(0);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const rate = await getExchangeRate();
            setExchangeRate(rate);

            // Get Store ID
            const { data: store } = await supabase
                .from('stores')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (!store) return;

            // Fetch Paid/Delivered Orders
            const { data: orders } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (title, quantity, price_at_time_usd)
                `)
                .eq('store_id', store.id)
                .in('status', ['paid', 'delivered'])
                .order('created_at', { ascending: false });

            if (orders) {
                processMetrics(orders);
            }
            setLoading(false);
        }
        fetchData();
    }, [supabase, router]);

    const processMetrics = (orders: any[]) => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let todayTotal = 0;
        let weekTotal = 0;
        let monthTotal = 0;
        let yearTotal = 0;
        const productMap = new Map();
        const dailyMap = new Map();

        // Initialize last 7 days for chart
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
            dailyMap.set(dateStr, { day: dayName, amount: 0 });
        }

        orders.forEach(order => {
            const orderDate = new Date(order.created_at);
            const dateStr = order.created_at.split('T')[0];
            const amount = order.total_usd;

            // Time periods
            if (dateStr === today) todayTotal += amount;
            if (orderDate >= oneWeekAgo) weekTotal += amount;
            if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) monthTotal += amount;
            if (orderDate.getFullYear() === currentYear) yearTotal += amount;

            // Chart Data
            if (dailyMap.has(dateStr)) {
                dailyMap.get(dateStr).amount += amount;
            }

            // Top Products
            order.order_items.forEach((item: any) => {
                if (productMap.has(item.title)) {
                    const existing = productMap.get(item.title);
                    existing.quantity += item.quantity;
                    existing.revenue += item.quantity * item.price_at_time_usd;
                } else {
                    productMap.set(item.title, {
                        title: item.title,
                        quantity: item.quantity,
                        revenue: item.quantity * item.price_at_time_usd
                    });
                }
            });
        });

        setMetrics({
            today: todayTotal,
            week: weekTotal,
            month: monthTotal,
            year: yearTotal,
            totalOrders: orders.length
        });

        setWeeklyData(Array.from(dailyMap.values()));

        const sortedProducts = Array.from(productMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
        setTopProducts(sortedProducts);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    const maxChartValue = Math.max(...weeklyData.map(d => d.amount), 1);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link href="/seller" className="text-gray-600">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">Panel de Ganancias</h1>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-brand-red to-red-600 p-5 rounded-2xl text-white shadow-lg shadow-red-200">
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Hoy</span>
                        </div>
                        <p className="text-2xl font-bold">{formatCurrency(metrics.today, 'USD')}</p>
                        <p className="text-xs font-medium opacity-80 mt-1">≈ {formatCurrency(metrics.today * exchangeRate, 'VES')}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2 text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Esta Semana</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.week, 'USD')}</p>
                        <p className="text-xs font-medium text-gray-400 mt-1">≈ {formatCurrency(metrics.week * exchangeRate, 'VES')}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2 text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Este Mes</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.month, 'USD')}</p>
                        <p className="text-xs font-medium text-gray-400 mt-1">≈ {formatCurrency(metrics.month * exchangeRate, 'VES')}</p>
                    </div>
                    <div className="bg-gray-900 p-5 rounded-2xl text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Total Anual</span>
                        </div>
                        <p className="text-2xl font-bold">{formatCurrency(metrics.year, 'USD')}</p>
                        <p className="text-xs font-medium opacity-80 mt-1">≈ {formatCurrency(metrics.year * exchangeRate, 'VES')}</p>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-brand-red" />
                        Rendimiento Semanal
                    </h3>
                    <div className="flex items-end justify-between h-40 gap-2">
                        {weeklyData.map((data, index) => (
                            <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                                <div className="w-full bg-gray-100 rounded-t-lg relative flex items-end overflow-hidden h-full">
                                    <div
                                        className="w-full bg-brand-red opacity-80 group-hover:opacity-100 transition-all duration-500 ease-out rounded-t-lg"
                                        style={{ height: `${(data.amount / maxChartValue) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400 font-medium">{data.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Package className="w-5 h-5 text-brand-yellow" />
                            Productos Más Vendidos
                        </h3>
                    </div>
                    <div>
                        {topProducts.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                No hay datos suficientes aún.
                            </div>
                        ) : (
                            topProducts.map((product, index) => (
                                <div key={index} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{product.title}</p>
                                            <p className="text-xs text-gray-500">{product.quantity} vendidos</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 text-sm">{formatCurrency(product.revenue, 'USD')}</p>
                                        <p className="text-xs text-gray-400">≈ {formatCurrency(product.revenue * exchangeRate, 'VES')}</p>
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
