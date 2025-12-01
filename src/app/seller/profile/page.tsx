"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Loader2, Save, Camera } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getExchangeRate } from "@/lib/utils";
import MapWrapper from "@/components/map-wrapper";
import { useToast } from "@/components/ui/toast";

export default function SellerConfigPage() {
    const { toast } = useToast();
    const [rate, setRate] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [deliveryFee, setDeliveryFee] = useState<string>("");
    const [category, setCategory] = useState<string>("otros");
    const [paymentInfo, setPaymentInfo] = useState<string>("");
    const [isOpen, setIsOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch Store
            const { data: store } = await supabase
                .from('stores')
                .select('*')
                .eq('owner_id', user.id)
                .single();

            if (store) {
                setPhone(store.phone_number || "");
                setDeliveryFee(store.delivery_fee?.toString() || "0");
                setCategory(store.category || "otros");
                setPaymentInfo(store.payment_info || "");
                setIsOpen(store.is_open);
                setStoreId(store.id);
                setLat(store.lat);
                setLng(store.lng);
                if (store.image_url) setImagePreview(store.image_url);
            }

            // Fetch Official Rate
            const officialRate = await getExchangeRate();
            setRate(officialRate.toString());

            setLoading(false);
        }
        fetchData();
    }, [supabase, router]);

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
        if (!storeId) return;
        setSaving(true);

        let imageUrl = imagePreview;

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `store-logo-${storeId}-${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('products') // Reusing products bucket
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
            .from('stores')
            .update({
                exchange_rate_bs: parseFloat(rate),
                phone_number: phone,
                delivery_fee: parseFloat(deliveryFee) || 0,
                category: category,
                payment_info: paymentInfo,
                is_open: isOpen,
                lat: lat,
                lng: lng,
                image_url: imageUrl
            })
            .eq('id', storeId);

        if (error) {
            toast("Error al guardar: " + error.message, "error");
        } else {
            toast("Cambios guardados correctamente", "success");
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
                <Link href="/" className="text-gray-600">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-gray-900">Configuración de Tienda</h1>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{isOpen ? "🟢" : "🔴"}</span>
                    <div>
                        <h2 className="font-bold text-gray-900">Estado de la Tienda</h2>
                        <p className="text-xs text-gray-500">{isOpen ? "Abierto - Recibiendo pedidos" : "Cerrado - No visible"}</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOpen ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            {/* Image Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
                <div className="flex items-center gap-2 mb-4">
                    <Camera className="w-5 h-5 text-gray-900" />
                    <h2 className="font-bold text-gray-900">Logo / Foto de Portada</h2>
                </div>

                <label className="block">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                    />
                    <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors relative overflow-hidden">
                        {imagePreview ? (
                            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                        ) : (
                            <>
                                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-gray-500 text-sm">Toca para subir foto</span>
                            </>
                        )}
                    </div>
                </label>
            </div>

            {/* Category Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🏷️</span>
                    <h2 className="font-bold text-gray-900">Categoría de la Tienda</h2>
                </div>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red outline-none"
                >
                    <option value="otros">Seleccionar Categoría</option>
                    <option value="ropa">Ropa</option>
                    <option value="comida">Comida</option>
                    <option value="servicios">Servicios</option>
                    <option value="repuestos">Repuestos</option>
                </select>
            </div>

            {/* Exchange Rate Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">💵</span>
                    <h2 className="font-bold text-gray-900">Tasa de Cambio (Oficial BCV)</h2>
                </div>

                <div className="relative mb-3">
                    <input
                        type="number"
                        value={rate}
                        readOnly
                        className="w-full text-4xl font-bold text-gray-500 border-b-2 border-gray-100 bg-transparent outline-none py-2 text-center cursor-not-allowed"
                    />
                    <span className="absolute right-4 bottom-4 text-gray-400 font-medium">Bs. ($)</span>
                </div>

                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg font-medium flex items-center gap-2">
                    <span className="text-lg">ℹ️</span>
                    La tasa se actualiza automáticamente según el BCV. No es necesario cambiarla manualmente.
                </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-gray-900" />
                    <h2 className="font-bold text-gray-900">Ubicación del Negocio</h2>
                </div>

                <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden mb-4 border border-gray-200">
                    {showMap ? (
                        <MapWrapper
                            initialLat={lat || undefined}
                            initialLng={lng || undefined}
                            onLocationSelect={(newLat, newLng) => {
                                setLat(newLat);
                                setLng(newLng);
                            }}
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                            {lat && lng ? (
                                <div className="text-center">
                                    <p className="text-green-600 font-bold mb-2">Ubicación Guardada</p>
                                    <p className="text-xs text-gray-500">{lat.toFixed(4)}, {lng.toFixed(4)}</p>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">No se ha definido ubicación</p>
                            )}
                            <button
                                onClick={() => setShowMap(true)}
                                className="mt-4 bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50"
                            >
                                {lat ? "Editar Ubicación" : "Abrir Mapa"}
                            </button>
                        </div>
                    )}
                </div>

                {showMap && (
                    <p className="text-xs text-gray-500 text-center">
                        Toca en el mapa para mover el pin a tu ubicación exacta.
                    </p>
                )}
            </div>

            {/* Phone Number Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">📱</span>
                    <h2 className="font-bold text-gray-900">WhatsApp para Pedidos</h2>
                </div>
                <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 584121234567"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red outline-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                    Formato internacional sin símbolos (Ej: 58...)
                </p>
            </div>

            {/* Delivery Fee Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🛵</span>
                    <h2 className="font-bold text-gray-900">Costo de Delivery</h2>
                </div>
                <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-500 font-bold">$</span>
                    <input
                        type="number"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red outline-none font-bold text-lg"
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Costo fijo de envío en Dólares. Deja en 0 si es gratis o a convenir.
                </p>
            </div>

            {/* Payment Methods Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">💳</span>
                    <h2 className="font-bold text-gray-900">Métodos de Pago</h2>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                    Configura los métodos de pago que aceptas. Estos se mostrarán al cliente al finalizar la compra.
                </p>

                <div className="space-y-3 mb-4">
                    <PaymentMethodsList storeId={storeId} />
                </div>
            </div>

            {/* Save Button */}
            <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-md mx-auto">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-brand-red text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Guardar Otros Cambios</>}
                </button>
            </div>
        </div>
    );
}

function PaymentMethodsList({ storeId }: { storeId: string | null }) {
    const [methods, setMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const supabase = createClient();

    const fetchMethods = async () => {
        if (!storeId) return;
        const { data } = await supabase.from('payment_methods').select('*').eq('store_id', storeId);
        if (data) setMethods(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchMethods();
    }, [storeId]);

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este método?")) return;
        await supabase.from('payment_methods').delete().eq('id', id);
        fetchMethods();
    };

    if (loading) return <div className="text-sm text-gray-400">Cargando métodos...</div>;

    return (
        <>
            {methods.map((m) => (
                <div key={m.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                        <p className="font-bold text-gray-900 capitalize">{m.type.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-500">
                            {m.type === 'pago_movil' ? `${m.details.bank} - ${m.details.phone}` :
                                m.type === 'zelle' ? m.details.email :
                                    m.type === 'binance' ? m.details.email : 'Efectivo'}
                        </p>
                    </div>
                    <button onClick={() => handleDelete(m.id)} className="text-red-500 p-2">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}

            <button
                onClick={() => setShowModal(true)}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
            >
                <Plus className="w-5 h-5" />
                Agregar Método de Pago
            </button>

            {showModal && (
                <AddPaymentMethodModal
                    storeId={storeId!}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        fetchMethods();
                    }}
                />
            )}
        </>
    );
}

import { Trash2, Plus, X } from "lucide-react";

function AddPaymentMethodModal({ storeId, onClose, onSuccess }: { storeId: string, onClose: () => void, onSuccess: () => void }) {
    const [type, setType] = useState('pago_movil');
    const [details, setDetails] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleSubmit = async () => {
        setLoading(true);
        const { error } = await supabase.from('payment_methods').insert({
            store_id: storeId,
            type,
            details
        });
        setLoading(false);
        if (error) alert(error.message);
        else onSuccess();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-in slide-in-from-bottom-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Agregar Método</h3>
                    <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tipo</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50"
                        >
                            <option value="pago_movil">Pago Móvil</option>
                            <option value="zelle">Zelle</option>
                            <option value="binance">Binance</option>
                            <option value="cash">Efectivo</option>
                        </select>
                    </div>

                    {type === 'pago_movil' && (
                        <>
                            <input
                                placeholder="Banco"
                                className="w-full p-3 rounded-xl border border-gray-200"
                                onChange={e => setDetails({ ...details, bank: e.target.value })}
                            />
                            <input
                                placeholder="Cédula"
                                className="w-full p-3 rounded-xl border border-gray-200"
                                onChange={e => setDetails({ ...details, id: e.target.value })}
                            />
                            <input
                                placeholder="Teléfono"
                                className="w-full p-3 rounded-xl border border-gray-200"
                                onChange={e => setDetails({ ...details, phone: e.target.value })}
                            />
                        </>
                    )}

                    {type === 'zelle' && (
                        <>
                            <input
                                placeholder="Correo Electrónico"
                                className="w-full p-3 rounded-xl border border-gray-200"
                                onChange={e => setDetails({ ...details, email: e.target.value })}
                            />
                            <input
                                placeholder="Nombre del Titular"
                                className="w-full p-3 rounded-xl border border-gray-200"
                                onChange={e => setDetails({ ...details, name: e.target.value })}
                            />
                        </>
                    )}

                    {type === 'binance' && (
                        <input
                            placeholder="Correo / Pay ID"
                            className="w-full p-3 rounded-xl border border-gray-200"
                            onChange={e => setDetails({ ...details, email: e.target.value })}
                        />
                    )}

                    {type === 'cash' && (
                        <p className="text-sm text-gray-500">El pago en efectivo se coordina al momento de la entrega.</p>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-brand-red text-white font-bold py-3 rounded-xl"
                >
                    {loading ? "Guardando..." : "Agregar Método"}
                </button>
            </div>
        </div>
    );
}
