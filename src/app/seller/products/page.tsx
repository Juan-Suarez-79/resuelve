"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Edit, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function SellerProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

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
            alert("Error al eliminar");
        } else {
            setProducts(products.filter(p => p.id !== id));
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    return (
        <div className="p-4 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/seller" className="text-gray-600">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900">Mis Productos</h1>
                </div>
                <Link
                    href="/seller/products/new"
                    className="bg-brand-red text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors"
                >
                    <Plus className="w-6 h-6" />
                </Link>
            </div>

            {/* Product List */}
            <div className="space-y-4">
                {products.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <p>No tienes productos aún.</p>
                        <Link href="/seller/products/new" className="text-brand-red font-bold mt-2 inline-block">
                            Crear el primero
                        </Link>
                    </div>
                ) : (
                    products.map((product) => (
                        <div key={product.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3">
                            <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {product.image_url ? (
                                    <Image src={product.image_url} alt={product.title} fill className="object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-xs text-gray-400">No img</div>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900 line-clamp-1">{product.title}</h3>
                                    <p className="text-brand-red font-bold">{formatCurrency(product.price_usd, 'USD')}</p>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${product.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {product.in_stock ? 'Stock' : 'Agotado'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col justify-between items-end">
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                {/* Edit button placeholder - for full implementation would link to edit page */}
                                <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                                    <Edit className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
