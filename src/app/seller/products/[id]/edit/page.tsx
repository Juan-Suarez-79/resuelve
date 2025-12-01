"use client";

import { ArrowLeft, Camera, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

export default function EditProductPage() {
    const { id } = useParams();
    const [inStock, setInStock] = useState(true);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Get store to verify ownership
            const { data: store } = await supabase
                .from('stores')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (!store) {
                router.push('/seller');
                return;
            }
            setStoreId(store.id);

            // Get Product
            const { data: product, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .eq('store_id', store.id) // Ensure it belongs to this store
                .single();

            if (error || !product) {
                alert("Producto no encontrado");
                router.push('/seller/products');
                return;
            }

            setTitle(product.title);
            setDescription(product.description || "");
            setPrice(product.price_usd.toString());
            setInStock(product.in_stock);
            if (product.image_url) setImagePreview(product.image_url);

            setLoading(false);
        }
        fetchData();
    }, [id, supabase, router]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert("La imagen es muy pesada. Máximo 5MB.");
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!title || !price) {
            alert("Por favor completa los campos obligatorios.");
            return;
        }
        setSaving(true);

        let imageUrl = imagePreview;

        if (imageFile && storeId) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${storeId}/${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(fileName, imageFile);

            if (uploadError) {
                alert("Error subiendo imagen: " + uploadError.message);
                setSaving(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(fileName);

            imageUrl = publicUrl;
        }

        const { error } = await supabase
            .from('products')
            .update({
                title,
                description,
                price_usd: parseFloat(price),
                image_url: imageUrl,
                in_stock: inStock
            })
            .eq('id', id);

        if (error) {
            alert("Error actualizando producto: " + error.message);
        } else {
            router.push('/seller/products');
        }
        setSaving(false);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    return (
        <div className="p-4 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/seller/products" className="text-gray-600">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900">Editar Producto</h1>
            </div>

            {/* Image Upload */}
            <label className="block">
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                />
                <div className="bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 h-48 flex flex-col items-center justify-center mb-6 cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden">
                    {imagePreview ? (
                        <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    ) : (
                        <>
                            <Camera className="w-10 h-10 text-brand-red mb-2" />
                            <span className="text-brand-red font-medium">Cambiar Foto</span>
                        </>
                    )}
                </div>
            </label>

            {/* Form Fields */}
            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Nombre del Producto
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Descripción (Opcional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Precio (USD $)
                    </label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all text-lg font-semibold"
                    />
                </div>

                <div className="flex items-center justify-between py-2">
                    <label className="text-sm font-bold text-gray-700">
                        ¿Hay Stock?
                    </label>
                    <button
                        onClick={() => setInStock(!inStock)}
                        className={cn(
                            "w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out",
                            inStock ? "bg-brand-red" : "bg-gray-300"
                        )}
                    >
                        <div
                            className={cn(
                                "w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out",
                                inStock ? "translate-x-6" : "translate-x-0"
                            )}
                        />
                    </button>
                </div>
            </div>

            {/* Save Button */}
            <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-md mx-auto">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-brand-red text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Guardar Cambios</>}
                </button>
            </div>
        </div>
    );
}
