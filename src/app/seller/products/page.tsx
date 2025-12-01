"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Edit, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/toast";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

export default function SellerProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        // Get store id first
        const { data: store } = await supabase
            .from('stores')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (store) {
            const { data: productsData } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', store.id)
                .order('created_at', { ascending: false });

            if (productsData) setProducts(productsData);
        }
        setLoading(false);
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este producto?")) return;

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            toast("Error al eliminar el producto", "error");
        } else {
            setProducts(products.filter(p => p.id !== id));
            toast("Producto eliminado", "success");
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <MotionWrapper className="p-4 max-w-lg mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/seller" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-brand-red transition-colors active:scale-95">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mis Productos</h1>
                    </div>
                    <Link
                        href="/seller/products/new"
                        className="bg-brand-red text-white px-4 py-2.5 rounded-full shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center gap-2 font-bold text-sm active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Nuevo</span>
                    </Link>
                </div>

                {/* Product List */}
                <div className="space-y-4">
                    {products.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                <Plus className="w-8 h-8 text-gray-300" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">No tienes productos aún.</p>
                                <p className="text-sm">Comienza agregando tu primer producto.</p>
                            </div>
                            <Link href="/seller/products/new" className="text-brand-red font-bold bg-red-50 px-6 py-2 rounded-full hover:bg-red-100 transition-colors">
                                Crear Producto
                            </Link>
                        </div>
                    ) : (
                        products.map((product) => (
                            <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-all group">
                                <div className="relative w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                    {product.image_url ? (
                                        <Image src={product.image_url} alt={product.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-xs text-gray-400 font-medium bg-gray-50">Sin Foto</div>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight mb-1 group-hover:text-brand-red transition-colors">{product.title}</h3>
                                        <p className="text-brand-red font-black text-lg">{formatCurrency(product.price_usd, 'USD')}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${product.in_stock ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                            {product.in_stock ? 'En Stock' : 'Agotado'}
                                        </span>
                                        {product.stock_quantity !== null && (
                                            <span className="text-xs text-gray-500 font-medium">
                                                {product.stock_quantity} un.
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col justify-between items-end pl-2 border-l border-gray-50">
                                    <Link
                                        href={`/seller/products/${product.id}/edit`}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        title="Editar"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </MotionWrapper>
        </div>
    );
}
