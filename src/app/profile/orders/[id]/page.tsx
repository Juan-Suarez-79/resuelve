"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, MapPin, Phone, Store } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, generateWhatsAppLink } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";

export default function BuyerOrderDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [order, setOrder] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function fetchOrder() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch Order
            const { data: orderData, error } = await supabase
                .from('orders')
                .select('*, stores(name, phone_number, image_url)')
                .eq('id', id)
                .single();

            if (error || !orderData) {
                console.error(error);
                return;
            }

            setOrder(orderData);

            // Fetch Items
            const { data: itemsData } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', id);

            if (itemsData) setItems(itemsData);
            setLoading(false);
        }
        fetchOrder();
    }, [id, supabase, router]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    if (!order) return <div>Pedido no encontrado</div>;

    const handleContactSeller = () => {
        if (!order.stores?.phone_number) return;
        const message = `Hola, tengo una consulta sobre mi pedido #${order.id.slice(0, 4)}`;
        const link = generateWhatsAppLink(order.stores.phone_number, message);
        window.open(link, '_blank');
    };

    return (
        <div className="p-4 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/profile/orders" className="text-gray-600">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900">Detalle del Pedido</h1>
            </div>

            {/* Status Card */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500 text-sm">Estado</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold
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
                <p className="text-xs text-gray-400">ID: {order.id}</p>
                <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
            </div>

            {/* Store Info */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Store className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{order.stores?.name}</h3>
                        <button onClick={handleContactSeller} className="text-brand-red text-xs font-bold flex items-center gap-1">
                            <Phone className="w-3 h-3" /> Contactar Tienda
                        </button>
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
                <h3 className="font-bold text-gray-900 mb-4">Productos</h3>
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
                            <div>
                                <p className="font-medium text-gray-900">{item.title}</p>
                                <p className="text-xs text-gray-500">x{item.quantity}</p>
                            </div>
                            <p className="font-bold text-gray-900">{formatCurrency(item.price_at_time_usd * item.quantity, 'USD')}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-xl text-brand-red">{formatCurrency(order.total_usd, 'USD')}</span>
                </div>
                <div className="text-right text-sm text-gray-500">
                    ~ {formatCurrency(order.total_bs, 'VES')}
                </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Entrega
                </h3>
                <p className="text-sm text-gray-600">{order.buyer_address}</p>
                <p className="text-xs text-gray-400 mt-1">{order.buyer_name}</p>
            </div>
        </div>
    );
}
