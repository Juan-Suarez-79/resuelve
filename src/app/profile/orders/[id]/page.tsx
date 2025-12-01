"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, MapPin, Phone, Store, Star, X, ShoppingBag, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, generateWhatsAppLink } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

export default function BuyerOrderDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [order, setOrder] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [existingReview, setExistingReview] = useState<any>(null);

    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

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

            // Fetch Review
            const { data: reviewData } = await supabase
                .from('reviews')
                .select('*')
                .eq('order_id', id)
                .single();

            if (reviewData) setExistingReview(reviewData);
            setLoading(false);
        }
        fetchOrder();
    }, [id, supabase, router]);

    const handleSubmitReview = async () => {
        if (!order?.store_id) {
            toast("Error: No se encontró el ID de la tienda", "error");
            return;
        }

        setSubmittingReview(true);
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('reviews').insert({
            order_id: id,
            user_id: user?.id,
            store_id: order.store_id,
            rating,
            comment
        });

        if (error) {
            console.error("Review Error:", error);
            toast("Error al enviar reseña: " + error.message, "error");
        } else {
            setExistingReview({ rating, comment });
            setShowReviewModal(false);
            toast("¡Gracias por tu reseña!", "success");
        }
        setSubmittingReview(false);
    };

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
        <div className="min-h-screen bg-gray-50 pb-32">
            <MotionWrapper className="p-4 max-w-lg mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/profile/orders" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-brand-red transition-colors active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Detalle del Pedido</h1>
                </div>

                {/* Status Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-medium text-sm">Estado</span>
                            <div className={`w-2 h-2 rounded-full ${order.status === 'pending' ? 'bg-yellow-500' :
                                    order.status === 'paid' ? 'bg-blue-500' :
                                        order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-500'
                                }`} />
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm
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
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-xs text-gray-400 font-mono mb-1">ID: #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-gray-400" />
                                {new Date(order.created_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Review Section */}
                {order.status === 'delivered' && (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
                        <h3 className="font-bold text-gray-900 mb-4 text-lg">Tu Opinión</h3>
                        {existingReview ? (
                            <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                                <div className="flex items-center gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-5 h-5 ${i < existingReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                                    ))}
                                </div>
                                <p className="text-gray-700 italic font-medium">"{existingReview.comment}"</p>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowReviewModal(true)}
                                className="w-full bg-brand-yellow text-gray-900 font-bold py-4 rounded-2xl shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-yellow-400"
                            >
                                <Star className="w-5 h-5" /> Calificar Tienda
                            </button>
                        )}
                    </div>
                )}

                {/* Store Info */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                            🏪
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{order.stores?.name}</h3>
                            <button onClick={handleContactSeller} className="text-brand-red text-sm font-bold flex items-center gap-1.5 mt-1 hover:underline">
                                <Phone className="w-4 h-4" /> Contactar Tienda
                            </button>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
                    <h3 className="font-bold text-gray-900 mb-6 text-lg flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-gray-400" /> Productos
                    </h3>
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-bold text-gray-900 text-base">{item.title}</p>
                                    <p className="text-sm text-gray-500 font-medium">Cantidad: {item.quantity}</p>
                                </div>
                                <p className="font-bold text-gray-900 text-lg">{formatCurrency(item.price_at_time_usd * item.quantity, 'USD')}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-xl text-gray-900">Total</span>
                            <span className="font-black text-2xl text-brand-red">{formatCurrency(order.total_usd, 'USD')}</span>
                        </div>
                        <div className="text-right text-sm text-gray-500 font-medium">
                            ~ {formatCurrency(order.total_bs, 'VES')}
                        </div>
                    </div>
                </div>

                {/* Delivery Info */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-400" /> Entrega
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-gray-900 font-medium text-base mb-1">{order.buyer_address}</p>
                        <p className="text-sm text-gray-500">{order.buyer_name}</p>
                    </div>
                </div>

                {/* Review Modal */}
                {showReviewModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-sm rounded-3xl p-8 animate-in zoom-in-95 duration-300 relative shadow-2xl">
                            <button onClick={() => setShowReviewModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>

                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Star className="w-8 h-8 text-yellow-600 fill-yellow-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Calificar Experiencia</h2>
                                <p className="text-gray-500 text-sm">¿Qué tal estuvo tu pedido con <span className="font-bold text-gray-700">{order.stores?.name}</span>?</p>
                            </div>

                            <div className="flex justify-center gap-3 mb-8">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="transition-all hover:scale-110 active:scale-95 focus:outline-none"
                                    >
                                        <Star className={`w-10 h-10 ${star <= rating ? "fill-yellow-400 text-yellow-400 drop-shadow-sm" : "text-gray-200"}`} />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Escribe un comentario (opcional)..."
                                className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-6 text-sm outline-none focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 resize-none transition-all"
                                rows={3}
                            />

                            <button
                                onClick={handleSubmitReview}
                                disabled={submittingReview}
                                className="w-full bg-brand-red text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 active:scale-[0.98] transition-all hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {submittingReview ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Enviar Calificación"}
                            </button>
                        </div>
                    </div>
                )}
            </MotionWrapper>
        </div>
    );
}
