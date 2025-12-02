"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/lib/store/cart";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

import { CartConflictModal } from "@/components/cart-conflict-modal";

export default function ProductDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const supabase = createClient();
    const { addItem, items, clearCart } = useCart();
    const { toast } = useToast();

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showConflictModal, setShowConflictModal] = useState(false);

    useEffect(() => {
        async function fetchProduct() {
            if (!id) return;
            const { data, error } = await supabase
                .from('products')
                .select('*, stores(id, name, exchange_rate_bs)')
                .eq('id', id)
                .single();

            if (error) {
                toast("Error al cargar producto", "error");
                router.push('/');
                return;
            }
            setProduct(data);
            checkFavorite(data.id);
            setLoading(false);
        }
        fetchProduct();
    }, [id]);

    const checkFavorite = async (productId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('favorites').select('*').eq('user_id', user.id).eq('product_id', productId).single();
        if (data) setIsFavorite(true);
    };

    const toggleFavorite = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast("Debes iniciar sesión", "error");
            return;
        }

        if (isFavorite) {
            await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', product.id);
            setIsFavorite(false);
            toast("Eliminado de favoritos", "success");
        } else {
            await supabase.from('favorites').insert({ user_id: user.id, product_id: product.id });
            setIsFavorite(true);
            toast("Agregado a favoritos", "success");
        }
    };

    const handleAddToCart = () => {
        if (items.length > 0 && items[0].storeId !== product.store_id) {
            setShowConflictModal(true);
            return;
        }
        addToCart();
    };

    const addToCart = () => {
        addItem({
            id: product.id,
            title: product.title,
            priceUsd: product.price_usd,
            storeName: product.stores.name,
            storeId: product.store_id,
            quantity: quantity,
            imageUrl: product.image_url
        });
        toast("Producto agregado al carrito", "success");
    };

    const handleClearAndAdd = () => {
        clearCart();
        addToCart();
        setShowConflictModal(false);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" /></div>;
    if (!product) return null;

    const priceBs = product.price_usd * (product.stores?.exchange_rate_bs || 0);

    return (
        <div className="min-h-screen bg-white pb-24">
            <CartConflictModal
                isOpen={showConflictModal}
                onClose={() => setShowConflictModal(false)}
                onClearAndAdd={handleClearAndAdd}
                currentStoreName={items[0]?.storeName || "otra tienda"}
                newStoreName={product.stores.name}
            />
            {/* Header Image */}
            <div className="relative h-[40vh] w-full bg-gray-100">
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-900" />
                </button>
                {product.image_url ? (
                    <Image src={product.image_url} alt={product.title} fill className="object-cover" />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                        <ShoppingBag className="w-12 h-12" />
                    </div>
                )}
            </div>

            <MotionWrapper className="px-5 -mt-6 relative z-10 bg-white rounded-t-[2rem] pt-8">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <Link href={`/store/${product.store_id}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-red bg-red-50 px-2.5 py-1 rounded-full mb-3 hover:bg-red-100 transition-colors">
                            <Store className="w-3 h-3" />
                            {product.stores?.name}
                        </Link>
                        <h1 className="text-2xl font-black text-gray-900 leading-tight mb-2">{product.title}</h1>
                    </div>
                    <button
                        onClick={toggleFavorite}
                        className={`p-3 rounded-full shadow-sm border transition-all ${isFavorite ? 'bg-red-50 border-red-100 text-brand-red' : 'bg-white border-gray-100 text-gray-400 hover:text-brand-red'}`}
                    >
                        <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                </div>

                <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-black text-gray-900">{formatCurrency(product.price_usd, "USD")}</span>
                    <span className="text-sm font-medium text-gray-500">≈ {formatCurrency(priceBs, "VES")}</span>
                </div>

                <div className="prose prose-sm text-gray-500 mb-8 leading-relaxed">
                    <p>{product.description || "Sin descripción disponible."}</p>
                </div>

                {/* Quantity & Add */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 safe-area-bottom z-50">
                    <div className="max-w-md mx-auto flex gap-4 pb-12">
                        <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-200 px-2">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-brand-red active:scale-90 transition-all"
                            >
                                <Minus className="w-5 h-5" />
                            </button>
                            <span className="w-8 text-center font-bold text-lg text-gray-900">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-brand-red active:scale-90 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            className="flex-1 bg-brand-red text-white font-bold rounded-2xl shadow-lg shadow-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            Agregar al Carrito
                        </button>
                    </div>
                </div>
            </MotionWrapper>
        </div>
    );
}
