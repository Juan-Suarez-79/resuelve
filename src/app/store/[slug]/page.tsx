"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Search, MapPin, Loader2, X, Flag } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useGeolocation, calculateDistance } from "@/lib/hooks/use-geolocation";
import { useToast } from "@/components/ui/toast";

export default function StorePage() {
    const params = useParams();
    const slug = params.slug as string;
    const [store, setStore] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { location } = useGeolocation();
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    const [reviews, setReviews] = useState<any[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [submittingReport, setSubmittingReport] = useState(false);

    useEffect(() => {
        async function fetchStoreData() {
            // Check if slug is a UUID (legacy ID support)
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

            if (isUuid) {
                const { data: storeById } = await supabase
                    .from('stores')
                    .select('slug')
                    .eq('id', slug)
                    .single();

                if (storeById?.slug) {
                    router.replace(`/store/${storeById.slug}`);
                    return;
                }
            }

            // Fetch Store Details by Slug
            const { data: storeData, error: storeError } = await supabase
                .from('stores')
                .select('*')
                .eq('slug', slug)
                .single();

            if (storeError) {
                console.error("Error fetching store:", storeError);
                setLoading(false);
                return;
            }

            setStore(storeData);
            const storeId = storeData.id;

            // Fetch Products
            const { data: productsData } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', storeId)
                .eq('in_stock', true);

            if (productsData) setProducts(productsData);

            // Fetch Reviews
            const { data: reviewsData } = await supabase
                .from('reviews')
                .select('*, profiles(full_name)')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false });

            if (reviewsData) {
                setReviews(reviewsData);
                if (reviewsData.length > 0) {
                    const avg = reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewsData.length;
                    setAverageRating(avg);
                }
            }

            setLoading(false);
        }

        if (slug) {
            fetchStoreData();
        }
    }, [slug, supabase, router]);

    const handleSubmitReview = async () => {
        if (!store) return;
        setSubmittingReview(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast("Debes iniciar sesión para calificar", "error");
            setSubmittingReview(false);
            return;
        }

        const { error } = await supabase.from('reviews').insert({
            order_id: null, // General review
            user_id: user.id,
            store_id: store.id,
            rating,
            comment
        });

        if (error) {
            toast("Error al enviar reseña: " + error.message, "error");
        } else {
            toast("¡Gracias por tu reseña!", "success");
            setShowReviewModal(false);
            // Refresh reviews (simple way)
            window.location.reload();
        }
        setSubmittingReview(false);
    };

    const handleReportStore = async () => {
        if (!store) return;
        if (!reportReason.trim()) {
            toast("Por favor escribe una razón para el reporte", "error");
            return;
        }

        setSubmittingReport(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast("Debes iniciar sesión para reportar", "error");
            setSubmittingReport(false);
            return;
        }

        const { error } = await supabase.from('store_reports').insert({
            store_id: store.id,
            reporter_id: user.id,
            reason: reportReason
        });

        if (error) {
            toast("Error al enviar reporte: " + error.message, "error");
        } else {
            toast("Reporte enviado correctamente. Gracias por ayudarnos.", "success");
            setShowReportModal(false);
            setReportReason("");
        }
        setSubmittingReport(false);
    };

    const handleOpenLocation = async () => {
        if (!store?.lat || !store?.lng) {
            toast("Ubicación no disponible", "error");
            return;
        }

        // Track the click
        await supabase.rpc('increment_location_requests', { row_id: store.id });

        // Open Maps
        const url = `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`;
        window.open(url, '_blank');
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    if (!store) {
        return <div className="min-h-screen flex items-center justify-center">Tienda no encontrada</div>;
    }

    const distance = location && store.lat && store.lng
        ? calculateDistance(location.lat, location.lng, store.lat, store.lng).toFixed(1) + " km"
        : "N/A";

    return (
        <div className="pb-20 bg-gray-50 min-h-screen">
            {/* Header / Banner */}
            <div className="relative h-64 w-full bg-gray-900">
                {store.image_url ? (
                    <Image
                        src={store.image_url}
                        alt={store.name}
                        fill
                        className="object-cover opacity-80"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-red to-gray-900" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* Navigation Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                    <Link href="/" className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowReportModal(true)}
                            className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-red-500/50 transition-colors"
                            title="Reportar Tienda"
                        >
                            <Flag className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setShowReviewModal(true)}
                            className="bg-white/20 backdrop-blur-md px-3 py-2 rounded-full text-white hover:bg-white/30 transition-colors flex items-center gap-1 text-sm font-bold"
                        >
                            <Star className="w-4 h-4" /> Calificar
                        </button>
                    </div>
                </div>

                {/* Store Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h1 className="text-3xl font-bold mb-1">{store.name}</h1>
                    <div className="flex items-center gap-2 text-sm opacity-90 mb-3">
                        <span className="bg-brand-yellow text-black px-2 py-0.5 rounded font-bold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-black" /> {averageRating > 0 ? averageRating.toFixed(1) : "Nuevo"}
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {distance}
                        </span>
                        <span className="text-xs opacity-75">({reviews.length} reseñas)</span>
                    </div>

                    <button
                        onClick={handleOpenLocation}
                        className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-white/30 transition-all active:scale-95"
                    >
                        <MapPin className="w-4 h-4 text-brand-yellow" />
                        Ver en Google Maps
                    </button>
                </div>
            </div>

            {/* Info Bar */}
            <div className="bg-brand-yellow px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
                <span className="font-bold text-gray-900 text-sm">
                    Tasa Hoy: Bs. {store.exchange_rate_bs}
                </span>
                <span className="font-bold text-gray-900 text-sm flex items-center gap-1">
                    {store.is_open ? "Abierto" : "Cerrado"}
                    <div className={`w-2 h-2 rounded-full animate-pulse ${store.is_open ? "bg-green-600" : "bg-red-600"}`} />
                </span>
            </div>

            {/* Products Grid */}
            <div className="p-4">
                <h2 className="font-bold text-gray-900 mb-4">Menú / Catálogo</h2>
                {products.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Esta tienda aún no tiene productos.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                title={product.title}
                                priceUsd={product.price_usd}
                                imageUrl={product.image_url}
                                exchangeRate={store.exchange_rate_bs}
                                storeName={store.name}
                                storeId={store.id}
                            />
                        ))}
                    </div>
                )}

                {/* Reviews Section */}
                {reviews.length > 0 && (
                    <div className="mt-8">
                        <h2 className="font-bold text-gray-900 mb-4">Reseñas de Clientes</h2>
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-sm text-gray-900">Usuario</span>
                                        <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                                            ))}
                                        </div>
                                    </div>
                                    {review.comment && <p className="text-sm text-gray-600 italic">"{review.comment}"</p>}
                                    <p className="text-xs text-gray-400 mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-in zoom-in-95 relative">
                        <button onClick={() => setShowReviewModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Calificar Tienda</h2>
                        <p className="text-gray-500 text-sm text-center mb-6">Comparte tu experiencia con {store.name}</p>

                        <div className="flex justify-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="transition-transform active:scale-110"
                                >
                                    <Star className={`w-8 h-8 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Escribe un comentario (opcional)..."
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 mb-4 text-sm outline-none focus:border-brand-yellow resize-none"
                            rows={3}
                        />

                        <button
                            onClick={handleSubmitReview}
                            disabled={submittingReview}
                            className="w-full bg-brand-red text-white font-bold py-3 rounded-xl shadow-lg shadow-red-200 active:scale-[0.98] transition-transform"
                        >
                            {submittingReview ? "Enviando..." : "Enviar Calificación"}
                        </button>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-in zoom-in-95 relative">
                        <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                        <div className="flex flex-col items-center mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                                <Flag className="w-6 h-6 text-red-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Reportar Tienda</h2>
                            <p className="text-gray-500 text-sm text-center mt-1">
                                ¿Por qué quieres reportar a {store.name}?
                            </p>
                        </div>

                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Describe el problema (ej: estafa, productos ilegales, mala conducta)..."
                            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 resize-none transition-all"
                            rows={4}
                        />

                        <button
                            onClick={handleReportStore}
                            disabled={submittingReport}
                            className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl shadow-lg active:scale-[0.98] transition-transform hover:bg-black"
                        >
                            {submittingReport ? "Enviando..." : "Enviar Reporte"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
