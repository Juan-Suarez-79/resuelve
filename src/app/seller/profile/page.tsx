"use client";

import { useEffect, useState } from "react";

import { ArrowLeft, MapPin, Loader2, Save, Camera, Trash2, Plus, X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getExchangeRate } from "@/lib/utils";
import MapWrapper from "@/components/map-wrapper";
import { useToast } from "@/components/ui/toast";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

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
        <div className="min-h-screen bg-gray-50 pb-32">
            <MotionWrapper className="p-4 max-w-lg mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/seller" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-brand-red transition-colors active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Configuración</h1>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOpen ? 'bg-green-100' : 'bg-red-100'}`}>
                                <span className="text-xl">{isOpen ? "🟢" : "🔴"}</span>
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900 text-lg">Estado de la Tienda</h2>
                                <p className="text-sm text-gray-500 font-medium">{isOpen ? "Abierto - Recibiendo pedidos" : "Cerrado - No visible"}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red ${isOpen ? 'bg-green-500' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${isOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Image Upload Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <Camera className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="font-bold text-gray-900 text-lg">Logo / Portada</h2>
                    </div>

                    <label className="block group cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                        />
                        <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 h-48 flex flex-col items-center justify-center group-hover:bg-gray-100 group-hover:border-gray-300 transition-all relative overflow-hidden">
                            {imagePreview ? (
                                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Camera className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <span className="text-gray-500 font-medium">Toca para subir foto</span>
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

                {/* Category Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                            <span className="text-xl">🏷️</span>
                        </div>
                        <h2 className="font-bold text-gray-900 text-lg">Categoría</h2>
                    </div>
                    <div className="relative">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-gray-900 appearance-none transition-all"
                        >
                            <option value="otros">Seleccionar Categoría</option>
                            <option value="ropa">Ropa</option>
                            <option value="comida">Comida</option>
                            <option value="servicios">Servicios</option>
                            <option value="repuestos">Repuestos</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                {/* Exchange Rate Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                            <span className="text-xl">💵</span>
                        </div>
                        <h2 className="font-bold text-gray-900 text-lg">Tasa BCV</h2>
                    </div>

                    <div className="relative mb-4">
                        <input
                            type="number"
                            value={rate}
                            readOnly
                            className="w-full text-5xl font-black text-gray-900 border-b-2 border-gray-100 bg-transparent outline-none py-4 text-center cursor-not-allowed tracking-tight"
                        />
                        <span className="absolute right-4 bottom-6 text-gray-400 font-bold">Bs/USD</span>
                    </div>

                    <div className="bg-blue-50 text-blue-700 text-sm p-4 rounded-xl font-medium flex items-start gap-3">
                        <span className="text-lg">ℹ️</span>
                        <p className="leading-snug">La tasa de cambio es fija y se actualiza automáticamente según el BCV (DolarAPI).</p>
                    </div>
                </div>

                {/* Location Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-orange-600" />
                        </div>
                        <h2 className="font-bold text-gray-900 text-lg">Ubicación</h2>
                    </div>

                    <div className="relative w-full h-64 bg-gray-100 rounded-2xl overflow-hidden mb-4 border border-gray-200 shadow-inner">
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
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <MapPin className="w-6 h-6 text-green-600" />
                                        </div>
                                        <p className="text-green-700 font-bold mb-1">Ubicación Guardada</p>
                                        <p className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded border border-gray-200">{lat.toFixed(4)}, {lng.toFixed(4)}</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <MapPin className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p className="text-gray-400 font-medium">No se ha definido ubicación</p>
                                    </div>
                                )}
                                <button
                                    onClick={() => setShowMap(true)}
                                    className="mt-4 bg-white border border-gray-200 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 text-gray-700"
                                >
                                    {lat ? "Editar Ubicación" : "Abrir Mapa"}
                                </button>
                            </div>
                        )}
                    </div>

                    {showMap && (
                        <p className="text-xs text-gray-500 text-center bg-gray-50 py-2 rounded-lg">
                            Toca en el mapa para mover el pin a tu ubicación exacta.
                        </p>
                    )}
                </div>

                {/* Phone Number Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                            <span className="text-xl">📱</span>
                        </div>
                        <h2 className="font-bold text-gray-900 text-lg">WhatsApp</h2>
                    </div>
                    <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej: 584121234567"
                        className="w-full px-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-gray-900 transition-all placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-500 mt-3 ml-1">
                        Formato internacional sin símbolos (Ej: 58...)
                    </p>
                </div>

                {/* Delivery Fee Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
                            <span className="text-xl">🛵</span>
                        </div>
                        <h2 className="font-bold text-gray-900 text-lg">Delivery</h2>
                    </div>
                    <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">$</span>
                        <input
                            type="number"
                            value={deliveryFee}
                            onChange={(e) => setDeliveryFee(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-10 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-bold text-2xl text-gray-900 transition-all placeholder:text-gray-300"
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-3 ml-1">
                        Costo fijo de envío en Dólares. Deja en 0 si es gratis.
                    </p>
                </div>

                {/* Payment Methods Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-24">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                            <span className="text-xl">💳</span>
                        </div>
                        <h2 className="font-bold text-gray-900 text-lg">Métodos de Pago</h2>
                    </div>

                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        Configura los métodos de pago que aceptas. Estos se mostrarán al cliente al finalizar la compra.
                    </p>

                    <div className="space-y-3 mb-4">
                        {storeId ? (
                            <PaymentMethodsList storeId={storeId} />
                        ) : (
                            <div className="text-center py-4 text-gray-400">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                <p className="text-sm">Cargando información de la tienda...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Save Button */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 z-50">
                    <div className="max-w-lg mx-auto pb-12">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-brand-red text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> Guardar Cambios</>}
                        </button>
                    </div>
                </div>
            </MotionWrapper>
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

    if (loading) return <div className="text-sm text-gray-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Cargando métodos...</div>;

    return (
        <>
            {methods.map((m) => (
                <div key={m.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-gray-200 transition-colors">
                    <div>
                        <p className="font-bold text-gray-900 capitalize flex items-center gap-2">
                            {m.type === 'pago_movil' && '📱 Pago Móvil'}
                            {m.type === 'zelle' && '🇺🇸 Zelle'}
                            {m.type === 'zinli' && '🟣 Zinli'}
                            {m.type === 'binance' && '🟡 Binance'}
                            {m.type === 'cash' && '💵 Efectivo'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                            {m.type === 'pago_movil' ? `${m.details.bank} • ${m.details.phone}` :
                                m.type === 'zelle' ? m.details.email :
                                    m.type === 'zinli' ? m.details.email :
                                        m.type === 'binance' ? m.details.email : 'Pago al entregar'}
                        </p>
                    </div>
                    <button
                        onClick={() => handleDelete(m.id)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                        title="Eliminar"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            ))}

            {methods.length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 mb-2">
                    <p className="text-gray-400 text-sm">No has registrado métodos de pago.</p>
                </div>
            )}

            <button
                onClick={() => setShowModal(true)}
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 mt-2"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 animate-in slide-in-from-bottom-10 zoom-in-95 duration-300 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-gray-900">Agregar Método</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6 text-gray-500" /></button>
                </div>

                <div className="space-y-5 mb-8">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Tipo de Pago</label>
                        <div className="relative">
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-gray-900 appearance-none transition-all"
                            >
                                <option value="pago_movil">Pago Móvil</option>
                                <option value="zelle">Zelle</option>
                                <option value="zinli">Zinli</option>
                                <option value="binance">Binance</option>
                                <option value="cash">Efectivo</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    {type === 'pago_movil' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <input
                                placeholder="Banco"
                                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-gray-900 transition-all placeholder:text-gray-400"
                                onChange={e => setDetails({ ...details, bank: e.target.value })}
                            />
                            <input
                                placeholder="Cédula"
                                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-gray-900 transition-all placeholder:text-gray-400"
                                onChange={e => setDetails({ ...details, id: e.target.value })}
                            />
                            <input
                                placeholder="Teléfono"
                                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-gray-900 transition-all placeholder:text-gray-400"
                                onChange={e => setDetails({ ...details, phone: e.target.value })}
                            />
                        </div>
                    )}

                    {(type === 'zelle' || type === 'zinli') && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <input
                                placeholder="Correo Electrónico"
                                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-gray-900 transition-all placeholder:text-gray-400"
                                onChange={e => setDetails({ ...details, email: e.target.value })}
                            />
                            <input
                                placeholder="Nombre del Titular"
                                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-gray-900 transition-all placeholder:text-gray-400"
                                onChange={e => setDetails({ ...details, name: e.target.value })}
                            />
                        </div>
                    )}

                    {type === 'binance' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <input
                                placeholder="Correo / Pay ID"
                                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-gray-900 transition-all placeholder:text-gray-400"
                                onChange={e => setDetails({ ...details, email: e.target.value })}
                            />
                        </div>
                    )}

                    {type === 'cash' && (
                        <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm font-medium flex gap-3 animate-in fade-in slide-in-from-top-2">
                            <span className="text-lg">ℹ️</span>
                            El pago en efectivo se coordina al momento de la entrega.
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-brand-red text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 active:scale-[0.98] transition-all hover:bg-red-700"
                >
                    {loading ? "Guardando..." : "Agregar Método"}
                </button>
            </div>
        </div>
    );
}
