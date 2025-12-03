"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Store, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import Image from "next/image";

export default function OrdersPage() {
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

            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    stores (name, image_url),
                    order_items (*)
                `)
                .eq('buyer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching orders:", error);
            } else {
                setOrders(data || []);
            }
            setLoading(false);
        }
        fetchOrders();
    }, [supabase, router]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'accepted': return 'bg-blue-100 text-blue-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'accepted': return 'Aceptado';
            case 'completed': return 'Completado';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white p-4 sticky top-0 z-10 shadow-sm flex items-center gap-4">
                <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900">Mis Pedidos</h1>
            </div>

            <div className="p-4 max-w-lg mx-auto space-y-4">
                {orders.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">No tienes pedidos aún</h2>
                        <p className="text-gray-500 text-sm mb-6">Explora las tiendas y realiza tu primera compra.</p>
                        <Link href="/" className="bg-brand-red text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-red-200">
                            Ir a comprar
                        </Link>
                    </div>
                ) : (
                    orders.map((order, index) => (
                        <MotionWrapper key={order.id} delay={index * 0.05}>
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-hidden">
                                {/* Header: Store & Status */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden relative">
                                            {order.stores?.image_url ? (
                                                <Image src={order.stores.image_url} alt={order.stores.name} fill className="object-cover" />
                                            ) : (
                                                <Store className="w-5 h-5 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm">{order.stores?.name || "Tienda Desconocida"}</h3>
                                            <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(order.status)}`}>
                                        {getStatusLabel(order.status)}
                                    </span>
                                </div>

                                {/* Items Preview */}
                                <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
                                    {order.order_items.slice(0, 2).map((item: any) => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="text-gray-600"><span className="font-bold text-gray-900">{item.quantity}x</span> {item.title}</span>
                                            <span className="font-medium text-gray-900">{formatCurrency(item.price_at_time_usd, "USD")}</span>
                                        </div>
                                    ))}
                                    {order.order_items.length > 2 && (
                                        <p className="text-xs text-gray-400 font-medium italic">+ {order.order_items.length - 2} productos más...</p>
                                    )}
                                </div>

                                {/* Footer: Total & Action */}
                                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase">Total</p>
                                        <p className="text-lg font-black text-brand-red">{formatCurrency(order.total_usd, "USD")}</p>
                                    </div>
                                    {/* Future: Link to details page */}
                                    {/* <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                        <ChevronRight className="w-5 h-5 text-gray-600" />
                                    </button> */}
                                </div>
                            </div>
                        </MotionWrapper>
                    ))
                )}
            </div>
        </div>
    );
}
