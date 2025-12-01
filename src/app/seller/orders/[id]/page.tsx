"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Phone, MapPin, CheckCircle, XCircle, Truck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatCurrency, generateWhatsAppLink } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Order {
    id: string;
    buyer_name: string;
    buyer_phone: string;
    buyer_address: string;
    total_usd: number;
    total_bs: number;
    status: 'pending' | 'paid' | 'delivered' | 'cancelled';
    payment_ref: string;
    created_at: string;
    order_items: { quantity: number; title: string; price_at_time_usd: number }[];
}

import { useToast } from "@/components/ui/toast";

export default function OrderDetailsPage() {
    const { id } = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        async function fetchOrder() {
            const { data: orderData, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (quantity, title, price_at_time_usd)
                `)
                .eq('id', id)
                .single();

            if (error) {
                console.error("Error fetching order:", error);
                return;
            }
            setOrder(orderData);
            setLoading(false);
        }
        fetchOrder();
    }, [id, supabase]);

    const updateStatus = async (newStatus: string) => {
        setUpdating(true);
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            toast("Error actualizando estado", "error");
        } else {
            setOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
            toast("Estado actualizado correctamente", "success");
        }
        setUpdating(false);
    };

    if (loading) return <div className="p-4">Cargando...</div>;
    if (!order) return <div className="p-4">Pedido no encontrado</div>;

    const statusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        paid: "bg-green-100 text-green-800",
        delivered: "bg-blue-100 text-blue-800",
        cancelled: "bg-red-100 text-red-800"
    };

    const statusLabels = {
        pending: "Pendiente de Pago",
        paid: "Pagado / Verificado",
        delivered: "Entregado",
        cancelled: "Cancelado"
    };

    return (
        <div className="p-4 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/seller/orders" className="text-gray-600">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900">Pedido #{order.id.slice(0, 4)}</h1>
            </div>

            {/* Status Banner */}
            <div className={cn("p-4 rounded-xl mb-6 text-center font-bold text-lg", statusColors[order.status])}>
                Estado: {statusLabels[order.status]}
            </div>

            {/* Buyer Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
                <h2 className="font-bold text-gray-900 mb-4">Cliente</h2>
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <p className="font-bold text-lg">{order.buyer_name}</p>
                        {order.buyer_phone && <p className="text-gray-500 text-sm">{order.buyer_phone}</p>}
                    </div>
                    {order.buyer_phone && (
                        <a
                            href={`https://wa.me/${order.buyer_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm shadow-green-200 shadow-lg"
                        >
                            <Phone className="w-4 h-4" /> Chat
                        </a>
                    )}
                </div>
                {order.buyer_address && (
                    <div className="flex items-start gap-2 text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <p>{order.buyer_address}</p>
                    </div>
                )}
            </div>

            {/* Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
                <h2 className="font-bold text-gray-900 mb-4">Items</h2>
                <div className="space-y-4">
                    {order.order_items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                            <div className="flex items-center gap-3">
                                <span className="bg-gray-100 text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs">
                                    {item.quantity}x
                                </span>
                                <p className="font-medium text-gray-800">{item.title}</p>
                            </div>
                            <p className="font-bold text-gray-900">{formatCurrency(item.price_at_time_usd * item.quantity, 'USD')}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                        <span>Total USD:</span>
                        <span>{formatCurrency(order.total_usd, 'USD')}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Total Bs (Ref):</span>
                        <span>Bs. {order.total_bs.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Payment Ref */}
            {order.payment_ref && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                    <p className="text-xs text-blue-600 font-bold uppercase mb-1">Referencia de Pago</p>
                    <p className="text-lg font-mono text-blue-900">{order.payment_ref}</p>
                </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
                {order.status === 'pending' && (
                    <button
                        onClick={() => updateStatus('paid')}
                        disabled={updating}
                        className="w-full bg-brand-red text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" /> Marcar como Pagado
                    </button>
                )}

                {order.status === 'paid' && (
                    <button
                        onClick={() => updateStatus('delivered')}
                        disabled={updating}
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                    >
                        <Truck className="w-5 h-5" /> Marcar como Entregado
                    </button>
                )}

                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <button
                        onClick={() => updateStatus('cancelled')}
                        disabled={updating}
                        className="w-full bg-gray-100 text-gray-600 font-bold py-4 rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                    >
                        <XCircle className="w-5 h-5" /> Cancelar Pedido
                    </button>
                )}
            </div>
        </div>
    );
}
