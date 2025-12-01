"use client";

import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function NewProductPage() {
    const [inStock, setInStock] = useState(true);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);

    const supabase = createClient();
    const router = useRouter();

    const [fetchingStore, setFetchingStore] = useState(true);

    useEffect(() => {
        async function fetchStore() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            const { data: store } = await supabase
                .from('stores')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (store) {
                setStoreId(store.id);
            } else {
                console.error("No store found for user:", user.id);
            }
            setFetchingStore(false);
        }
        fetchStore();
    }, [supabase, router]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Size check (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("La imagen es muy pesada. Máximo 5MB.");
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!storeId || !title || !price) {
            const missing = [];
            if (!storeId) missing.push("Tienda no encontrada (Contacte soporte)");
            if (!title) missing.push("Nombre del producto");
            if (!price) missing.push("Precio");

            alert(`Faltan campos obligatorios: \n- ${missing.join('\n- ')}`);
            return;
        }
        setUploading(true);

        let imageUrl = null;

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${storeId}/${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(fileName, imageFile);

            if (uploadError) {
                alert("Error subiendo imagen: " + uploadError.message);
                setUploading(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(fileName);

            imageUrl = publicUrl;
        }

        const { error } = await supabase.from('products').insert({
            store_id: storeId,
            title,
            description,
            price_usd: parseFloat(price),
            image_url: imageUrl,
            in_stock: inStock,
            category: 'General' // Default for now
        });

        if (error) {
            alert("Error guardando producto: " + error.message);
        } else {
            router.push('/seller');
        }
        setUploading(false);
    };

    return (
        <div className="p-4 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/seller" className="text-gray-600">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900">Nuevo Producto</h1>
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
                            <span className="text-brand-red font-medium">Subir Foto Principal</span>
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
                        placeholder="Ej: Hamburguesa Doble"
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
                        placeholder="Detalles sobre el producto..."
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
                        placeholder="0.00"
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
                    disabled={uploading}
                    className="w-full bg-brand-red text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 active:scale-[0.98] transition-transform flex items-center justify-center"
                >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Producto"}
                </button>
            </div>
        </div>
    );
}
