"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, DollarSign, ShoppingBag, UserSquare2, MapPin, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { useToast } from "@/components/ui/toast";

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
    const [sellerName, setSellerName] = useState("");
    const [storeSlug, setStoreSlug] = useState("");
    const [approvalStatus, setApprovalStatus] = useState<string>('approved'); // Default to approved to avoid flash, or handle loading
    const [locationRequests, setLocationRequests] = useState(0);
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                // Parallel Fetch: Profile & Store
                const [profileRes, storeRes] = await Promise.all([
                    supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('id', user.id)
                        .single(),
                    supabase
                        .from('stores')
                        .select('id, approval_status, location_requests_count, slug')
                        .eq('owner_id', user.id)
                        .single()
                ]);

                const profile = profileRes.data;
                const store = storeRes.data;

                if (profile) {
                    setSellerName(profile.full_name || "Vendedor");
                }

                if (!store) {
                    router.push('/seller/profile');
                    return;
                }

                if (store.location_requests_count) setLocationRequests(store.location_requests_count);
                if (store.slug) setStoreSlug(store.slug);

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
                    if (store.approval_status) setApprovalStatus(store.approval_status);

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

    const copyStoreLink = () => {
        if (!storeSlug) {
            toast("Tu tienda no tiene un link generado aún", "error");
            return;
        }
        const url = `${window.location.origin}/store/${storeSlug}`;
        navigator.clipboard.writeText(url);
        toast("Link de tu tienda copiado al portapapeles", "success");
    };

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
        <div className="min-h-screen bg-gray-50 pb-24">
            <MotionWrapper className="p-4 max-w-lg mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Hola,</h1>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-red-600">{sellerName}!</h1>
                        <button
                            onClick={copyStoreLink}
                            className="mt-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                        >
                            <LinkIcon className="w-3 h-3" />
                            Copiar Link Tienda
                        </button>
                    </div>
                    <div className="text-right bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Pedidos</p>
                        <p className="text-2xl font-black text-gray-900">{totalOrders}</p>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <Link href="/seller/earnings" className="bg-gradient-to-br from-brand-red to-red-700 p-6 rounded-[2rem] text-white shadow-xl shadow-red-200 active:scale-[0.98] hover:scale-[1.02] transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <DollarSign className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 opacity-90">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold">Ventas Hoy</span>
                            </div>
                            <p className="text-2xl font-black tracking-tight mb-4">{formatCurrency(salesToday, 'USD')}</p>
                            <div className="text-[10px] font-bold bg-white/20 inline-flex items-center gap-1 px-3 py-1.5 rounded-full backdrop-blur-md group-hover:bg-white/30 transition-colors">
                                Ver Reporte <span className="text-lg leading-none">→</span>
                            </div>
                        </div>
                    </Link>

                    <Link href="/seller/kyc" className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden active:scale-[0.98] hover:scale-[1.02] transition-all group">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                            <UserSquare2 className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 text-gray-500">
                                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                    <UserSquare2 className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold">Verificación</span>
                            </div>
                            <p className="text-sm font-medium text-gray-600 mb-2">Estado KYC</p>
                            <div className={`text-xs font-bold inline-flex items-center gap-1 px-3 py-1.5 rounded-full ${approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {approvalStatus === 'approved' ? 'Verificado' : 'Pendiente'}
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Location Stats Card */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-10 relative overflow-hidden">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-500 mb-0.5">Interés en Ubicación</p>
                            <p className="text-2xl font-black text-gray-900">
                                {locationRequests} <span className="text-sm font-medium text-gray-400">clics</span>
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3 pl-1">
                        Veces que los clientes han solicitado ver tu ubicación en el mapa.
                    </p>
                </div>

                {/* Recent Orders */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        Pedidos Recientes
                        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{orders.length}</span>
                    </h2>
                    <Link href="/seller/orders" className="text-sm text-brand-red font-bold hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors">Ver todos</Link>
                </div>

                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                <ShoppingBag className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="font-medium">No tienes pedidos aún.</p>
                        </div>
                    ) : (
                        orders.slice(0, 5).map((order) => (
                            <Link href={`/seller/orders/${order.id}`} key={order.id} className="block bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:scale-[1.01] transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg text-xs font-bold font-mono">#{order.id.slice(0, 4)}</span>
                                            <span className="text-gray-400 text-xs font-medium">• {getTimeAgo(order.created_at)}</span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-brand-red transition-colors">{order.buyer_name}</h3>
                                    </div>
                                    <span className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wide shadow-sm ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                        order.status === 'paid' ? 'bg-green-100 text-green-800 border border-green-200' :
                                            order.status === 'delivered' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                'bg-gray-100 text-gray-800 border border-gray-200'
                                        }`}>
                                        {order.status === 'pending' ? 'Pendiente' :
                                            order.status === 'paid' ? 'Pagado' :
                                                order.status === 'delivered' ? 'Entregado' : order.status}
                                    </span>
                                </div>

                                <div className="flex justify-between items-end pt-3 border-t border-gray-50">
                                    <div className="flex -space-x-2 overflow-hidden">
                                        {order.order_items.slice(0, 3).map((item, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500" title={item.title}>
                                                {item.title.charAt(0)}
                                            </div>
                                        ))}
                                        {order.order_items.length > 3 && (
                                            <div className="w-8 h-8 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                +{order.order_items.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 font-medium mb-0.5">Total</p>
                                        <p className="text-lg font-black text-gray-900 leading-none">{formatCurrency(order.total_usd, 'USD')}</p>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </MotionWrapper>

            {/* Floating Action Button - Only if Approved */}
            {approvalStatus === 'approved' && (
                <Link
                    href="/seller/products/new"
                    className="fixed bottom-24 right-6 w-16 h-16 bg-brand-red text-white rounded-full shadow-xl shadow-red-300 flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50 group"
                >
                    <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
                </Link>
            )}

            {/* Approval Status Modal */}
            {approvalStatus === 'pending' && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-3 leading-tight">Cuenta en Revisión</h2>
                        <p className="text-gray-500 font-medium mb-6 leading-relaxed">
                            Tu solicitud de vendedor está siendo revisada por nuestro equipo.
                        </p>
                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-6 text-left">
                            <p className="text-sm text-yellow-800 font-bold mb-1">⚠️ Proceso Manual</p>
                            <p className="text-xs text-yellow-700 leading-relaxed">
                                La verificación puede tardar dado que es un proceso manual para asegurar la seguridad de la plataforma. Agradecemos tu paciencia.
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-400 font-mono">
                            Estado: Pendiente de Aprobación
                        </div>
                    </div>
                </div>
            )}

            {approvalStatus === 'rejected' && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 text-center shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <div className="text-4xl">❌</div>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-3 leading-tight">Solicitud Rechazada</h2>
                        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                            Lo sentimos, tu solicitud para ser vendedor no ha sido aprobada. Contacta a soporte para más información.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
