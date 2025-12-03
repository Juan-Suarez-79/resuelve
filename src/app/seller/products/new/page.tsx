"use client";

import { ArrowLeft, Camera, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/components/ui/toast";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

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
    const { toast } = useToast();

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
                toast("La imagen es muy pesada. Máximo 5MB.", "error");
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

            toast(`Faltan campos obligatorios: ${missing.join(', ')}`, "error");
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
                toast("Error subiendo imagen: " + uploadError.message, "error");
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
            toast("Error guardando producto: " + error.message, "error");
        } else {
            toast("Producto creado exitosamente", "success");
            router.push('/seller/products');
        }
        setUploading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            <MotionWrapper className="p-4 max-w-lg mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/seller/products" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-brand-red transition-colors active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nuevo Producto</h1>
                </div>

                {/* Image Upload */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                    <label className="block group cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                        />
                        <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 h-64 flex flex-col items-center justify-center group-hover:bg-gray-100 group-hover:border-gray-300 transition-all relative overflow-hidden">
                            {imagePreview ? (
                                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Camera className="w-8 h-8 text-brand-red" />
                                    </div>
                                    <span className="text-gray-900 font-bold">Subir Foto Principal</span>
                                    <span className="text-gray-400 text-sm mt-1">Toca para seleccionar</span>
                                </>
                            )}
                            {imagePreview && (
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-white/90 text-gray-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg">Cambiar Foto</span>
                                </div>
                            )}
                        </div>
                    </label>
                </div>

                {/* Form Fields */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">
                            Nombre del Producto
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Hamburguesa Doble"
                            className="w-full px-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">
                            Descripción (Opcional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detalles sobre el producto..."
                            rows={3}
                            className="w-full px-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none transition-all resize-none font-medium text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">
                            Precio (USD $)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none transition-all text-xl font-bold text-gray-900 placeholder:text-gray-300"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-t border-gray-50 mt-4 pt-4">
                        <div>
                            <label className="text-sm font-bold text-gray-900 block">
                                Disponibilidad
                            </label>
                            <p className="text-xs text-gray-500">¿El producto está en stock?</p>
                        </div>
                        <button
                            onClick={() => setInStock(!inStock)}
                            className={cn(
                                "w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red",
                                inStock ? "bg-green-500" : "bg-gray-200"
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
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 z-50">
                    <div className="max-w-lg mx-auto">
                        <button
                            onClick={handleSave}
                            disabled={uploading}
                            className="w-full bg-brand-red text-white mb-12 font-bold py-4 rounded-2xl shadow-lg shadow-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> Guardar Producto</>}
                        </button>
                    </div>
                </div>
            </MotionWrapper>
        </div>
    );
}
