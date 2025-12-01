"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import MapWrapper from "@/components/map-wrapper";

export default function SellerConfigPage() {
    const [rate, setRate] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [paymentInfo, setPaymentInfo] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [showMap, setShowMap] = useState(false);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function fetchStore() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: store, error } = await supabase
                .from('stores')
                .select('*')
                .eq('owner_id', user.id)
                .single();

            if (store) {
                setRate(store.exchange_rate_bs?.toString() || "");
                setPhone(store.phone_number || "");
                setPaymentInfo(store.payment_info || "");
                setStoreId(store.id);
                setLat(store.lat);
                setLng(store.lng);
            }
            setLoading(false);
        }
        fetchStore();
    }, [supabase, router]);

    const handleSave = async () => {
        if (!storeId) return;
        setSaving(true);

        const { error } = await supabase
            .from('stores')
            .update({
                exchange_rate_bs: parseFloat(rate),
                phone_number: phone,
                payment_info: paymentInfo,
                lat: lat,
                lng: lng
            })
            .eq('id', storeId);

        if (error) {
            alert("Error al guardar: " + error.message);
        } else {
            alert("Cambios guardados correctamente");
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

            {/* Exchange Rate Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">💵</span>
                    <h2 className="font-bold text-gray-900">Tasa de Cambio (Hoy)</h2>
                </div>

                <div className="relative mb-3">
                    <input
                        type="number"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        placeholder="0.00"
                        className="w-full text-4xl font-bold text-brand-red border-b-2 border-gray-200 focus:border-brand-red outline-none py-2 text-center"
                    />
                    <span className="absolute right-4 bottom-4 text-gray-500 font-medium">Bs. por Dólar ($)</span>
                </div>

                <div className="bg-brand-yellow/20 text-yellow-800 text-xs p-3 rounded-lg font-medium">
                    Esto actualizará todos tus precios en Bs automáticamente
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

            {/* Payment Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">💳</span>
                    <h2 className="font-bold text-gray-900">Datos de Pago Móvil</h2>
                </div>
                <textarea
                    value={paymentInfo}
                    onChange={(e) => setPaymentInfo(e.target.value)}
                    placeholder="Banco, Cédula, Teléfono..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                    Esta información se mostrará al cliente al finalizar la compra.
                </p>
            </div>

            {/* Save Button */}
            <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-md mx-auto">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-brand-red text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Guardar Cambios</>}
                </button>
            </div>
        </div>
    );
}
