"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Store, MapPin, Phone, CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import MapWrapper from "@/components/map-wrapper";
import { cn } from "@/lib/utils";

export default function RegisterStorePage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    // Form States
    const [storeName, setStoreName] = useState("");
    const [category, setCategory] = useState("otros");
    const [phone, setPhone] = useState("");
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [showMap, setShowMap] = useState(false);

    // Payment Methods State
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [newMethodType, setNewMethodType] = useState("pago_movil");
    const [newMethodDetails, setNewMethodDetails] = useState<any>({});

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function checkUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login?redirect=/register-store');
                return;
            }
            setUserId(user.id);

            // Check if already has store
            const { data: store } = await supabase
                .from('stores')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (store) {
                router.push('/seller');
            }
            setInitializing(false);
        }
        checkUser();
    }, [supabase, router]);

    const handleAddPaymentMethod = () => {
        setPaymentMethods([...paymentMethods, { type: newMethodType, details: newMethodDetails }]);
        setNewMethodDetails({});
        // Reset details based on type if needed, or just clear
    };

    const handleRemovePaymentMethod = (index: number) => {
        const newMethods = [...paymentMethods];
        newMethods.splice(index, 1);
        setPaymentMethods(newMethods);
    };

    const handleSubmit = async () => {
        if (!userId) return;
        setLoading(true);

        try {
            // 1. Update User Role to Seller
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ role: 'seller' })
                .eq('id', userId);

            if (profileError) throw new Error("Error actualizando perfil: " + profileError.message);

            // 2. Create Store
            const slug = storeName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.floor(Math.random() * 1000);

            const { data: storeData, error: storeError } = await supabase
                .from('stores')
                .insert({
                    owner_id: userId,
                    name: storeName,
                    slug: slug,
                    category: category,
                    phone_number: phone,
                    lat: lat,
                    lng: lng,
                    is_open: true,
                    delivery_fee: 0 // Default
                })
                .select()
                .single();

            if (storeError) throw new Error("Error creando tienda: " + storeError.message);

            // 3. Add Payment Methods
            if (paymentMethods.length > 0) {
                const methodsToInsert = paymentMethods.map(m => ({
                    store_id: storeData.id,
                    type: m.type,
                    details: m.details
                }));

                const { error: pmError } = await supabase
                    .from('payment_methods')
                    .insert(methodsToInsert);

                if (pmError) throw new Error("Error agregando métodos de pago: " + pmError.message);
            }

            // Success
            router.push('/seller');

        } catch (error: any) {
            alert(error.message);
            setLoading(false);
        }
    };

    if (initializing) {
        return <div className="min-h-screen flex justify-center items-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <MotionWrapper className="max-w-lg mx-auto p-6">
                <Link href="/cart" className="inline-flex items-center text-gray-500 mb-8 hover:text-brand-red transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Volver al Carrito
                </Link>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Progress Bar */}
                    <div className="bg-gray-100 h-2 w-full">
                        <div
                            className="bg-brand-red h-full transition-all duration-500 ease-out"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>

                    <div className="p-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Registra tu Tienda</h1>
                        <p className="text-gray-500 text-sm mb-8">Completa los datos para comenzar a vender.</p>

                        {/* STEP 1: Basic Info */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de la Tienda</label>
                                    <div className="relative">
                                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={storeName}
                                            onChange={(e) => setStoreName(e.target.value)}
                                            placeholder="Ej: Burger King Coro"
                                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-gray-900 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Categoría</label>
                                    <div className="relative">
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full pl-4 pr-10 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-gray-900 appearance-none transition-all"
                                        >
                                            <option value="otros">Otros</option>
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

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono de Contacto</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="Ej: 584121234567"
                                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-gray-900 transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        if (storeName && phone) setStep(2);
                                        else alert("Por favor completa todos los campos");
                                    }}
                                    className="w-full bg-brand-red text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all mt-4"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}

                        {/* STEP 2: Location */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Ubicación del Local</label>
                                    <div className="relative w-full h-64 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
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
                                                        <p className="text-green-700 font-bold mb-1">Ubicación Seleccionada</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                                                            <MapPin className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                        <p className="text-gray-400 font-medium">Define tu ubicación</p>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setShowMap(true)}
                                                    className="mt-4 bg-white border border-gray-200 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all text-gray-700"
                                                >
                                                    {lat ? "Cambiar Ubicación" : "Abrir Mapa"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {showMap && <p className="text-xs text-gray-500 text-center mt-2">Toca el mapa para ubicar tu tienda.</p>}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (lat && lng) setStep(3);
                                            else alert("Por favor selecciona una ubicación en el mapa");
                                        }}
                                        className="flex-1 bg-brand-red text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Payment Methods */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-4">Métodos de Pago Aceptados</label>

                                    {/* List of added methods */}
                                    {paymentMethods.length > 0 && (
                                        <div className="space-y-3 mb-6">
                                            {paymentMethods.map((m, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-100">
                                                    <div>
                                                        <p className="font-bold text-green-800 capitalize">
                                                            {m.type === 'pago_movil' ? 'Pago Móvil' : m.type}
                                                        </p>
                                                        <p className="text-xs text-green-600">
                                                            {m.type === 'pago_movil' ? `${m.details.bank} - ${m.details.phone}` : m.details.email || 'Detalles guardados'}
                                                        </p>
                                                    </div>
                                                    <button onClick={() => handleRemovePaymentMethod(idx)} className="text-red-500 text-sm font-bold">Eliminar</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add New Method Form */}
                                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                                        <h3 className="text-sm font-bold text-gray-900 mb-3">Agregar Nuevo Método</h3>
                                        <select
                                            value={newMethodType}
                                            onChange={(e) => setNewMethodType(e.target.value)}
                                            className="w-full p-3 rounded-xl border border-gray-200 mb-3 text-sm"
                                        >
                                            <option value="pago_movil">Pago Móvil</option>
                                            <option value="zelle">Zelle</option>
                                            <option value="binance">Binance</option>
                                            <option value="zinli">Zinli</option>
                                            <option value="cash">Efectivo</option>
                                        </select>

                                        <div className="space-y-3 mb-4">
                                            {newMethodType === 'pago_movil' && (
                                                <>
                                                    <input placeholder="Banco" className="w-full p-3 rounded-xl border border-gray-200 text-sm" onChange={e => setNewMethodDetails({ ...newMethodDetails, bank: e.target.value })} />
                                                    <input placeholder="Cédula" className="w-full p-3 rounded-xl border border-gray-200 text-sm" onChange={e => setNewMethodDetails({ ...newMethodDetails, id: e.target.value })} />
                                                    <input placeholder="Teléfono" className="w-full p-3 rounded-xl border border-gray-200 text-sm" onChange={e => setNewMethodDetails({ ...newMethodDetails, phone: e.target.value })} />
                                                </>
                                            )}
                                            {(newMethodType === 'zelle' || newMethodType === 'zinli') && (
                                                <input placeholder={`Correo ${newMethodType === 'zelle' ? 'Zelle' : 'Zinli'}`} className="w-full p-3 rounded-xl border border-gray-200 text-sm" onChange={e => setNewMethodDetails({ ...newMethodDetails, email: e.target.value })} />
                                            )}
                                            {newMethodType === 'binance' && (
                                                <input placeholder="Correo / Pay ID" className="w-full p-3 rounded-xl border border-gray-200 text-sm" onChange={e => setNewMethodDetails({ ...newMethodDetails, email: e.target.value })} />
                                            )}
                                        </div>

                                        <button
                                            onClick={handleAddPaymentMethod}
                                            className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl text-sm hover:bg-black transition-all"
                                        >
                                            Agregar a la Lista
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="flex-1 bg-brand-red text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Finalizar Registro"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </MotionWrapper>
        </div>
    );
}
