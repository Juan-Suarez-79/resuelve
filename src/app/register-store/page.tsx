"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Store, MapPin, Phone, CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import MapWrapper from "@/components/map-wrapper";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export default function RegisterStorePage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    // Form States
    const [storeName, setStoreName] = useState("");
    const [category, setCategory] = useState("otros");
    const [phone, setPhone] = useState("");
    const [fullName, setFullName] = useState("");
    const [cedula, setCedula] = useState("");
    const [cedulaPhoto, setCedulaPhoto] = useState<File | null>(null);
    const [selfiePhoto, setSelfiePhoto] = useState<File | null>(null);

    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [showMap, setShowMap] = useState(false);

    // Payment Methods State
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [newMethodType, setNewMethodType] = useState("pago_movil");
    const [newMethodDetails, setNewMethodDetails] = useState<any>({});

    const [success, setSuccess] = useState(false);
    const { toast } = useToast();

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

            // 1. Upload Cedula Photo
            let cedulaPhotoUrl = null;
            if (cedulaPhoto) {
                const fileExt = cedulaPhoto.name.split('.').pop();
                const fileName = `cedula-${userId}-${Math.random()}.${fileExt}`;
                const { error: uploadError, data: uploadData } = await supabase.storage
                    .from('kyc-documents')
                    .upload(fileName, cedulaPhoto);

                if (uploadError) throw new Error("Error subiendo foto de cédula: " + uploadError.message);
                cedulaPhotoUrl = uploadData.path;
            }

            // 2. Upload Selfie Photo
            let selfiePhotoUrl = null;
            if (selfiePhoto) {
                const fileExt = selfiePhoto.name.split('.').pop();
                const fileName = `selfie-${userId}-${Math.random()}.${fileExt}`;
                const { error: uploadError, data: uploadData } = await supabase.storage
                    .from('kyc-documents')
                    .upload(fileName, selfiePhoto);

                if (uploadError) throw new Error("Error subiendo selfie: " + uploadError.message);
                selfiePhotoUrl = uploadData.path;
            }

            // 3. Update User Profile (Role, Name, Cedula, Photos)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    role: 'seller',
                    full_name: fullName,
                    cedula: cedula,
                    cedula_photo_url: cedulaPhotoUrl,
                    selfie_holding_id_url: selfiePhotoUrl
                })
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
                    delivery_fee: 0,
                    approval_status: 'pending' // Explicitly set to pending
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
            setSuccess(true);

        } catch (error: any) {
            toast(error.message, "error");
            setLoading(false);
        }
    };

    if (initializing) {
        return <div className="min-h-screen flex justify-center items-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <MotionWrapper className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl text-center border border-gray-100">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">¡Solicitud Enviada!</h1>
                    <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                        Hemos recibido tu solicitud correctamente. Tu tienda está ahora en proceso de <span className="text-gray-900 font-bold">revisión manual</span> para garantizar la seguridad de la plataforma.
                    </p>
                    <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-sm text-gray-400 font-mono">
                        Estado: Pendiente de Aprobación
                    </div>
                    <button
                        onClick={() => router.push('/seller')}
                        className="w-full bg-brand-red text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-[0.98]"
                    >
                        Ir al Panel de Vendedor
                    </button>
                </MotionWrapper>
            </div>
        );
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

                        {/* STEP 1: Basic Info & KYC */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                    <h3 className="font-bold text-blue-800 text-sm mb-1">Verificación de Identidad</h3>
                                    <p className="text-xs text-blue-600">Para garantizar la seguridad, necesitamos tus datos reales. Estos no serán públicos.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nombre y Apellido</label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Ej: Juan Pérez"
                                            className="w-full px-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-black placeholder:text-gray-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Cédula de Identidad</label>
                                        <input
                                            type="text"
                                            value={cedula}
                                            onChange={(e) => setCedula(e.target.value)}
                                            placeholder="Ej: V-12345678"
                                            className="w-full px-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-black placeholder:text-gray-500 transition-all"
                                        />
                                    </div>
                                </div>



                                <div className="h-px bg-gray-100 my-4" />

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Foto de la Cédula</label>
                                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setCedulaPhoto(e.target.files[0]);
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {cedulaPhoto ? (
                                            <div className="flex items-center gap-2 text-green-600 font-bold">
                                                <CheckCircle2 className="w-6 h-6" />
                                                <span>{cedulaPhoto.name}</span>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-500">
                                                <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                <p className="text-sm font-medium">Sube una foto clara de tu cédula</p>
                                                <p className="text-xs text-gray-400">Formatos: JPG, PNG</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Selfie con Cédula</label>
                                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setSelfiePhoto(e.target.files[0]);
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {selfiePhoto ? (
                                            <div className="flex items-center gap-2 text-green-600 font-bold">
                                                <CheckCircle2 className="w-6 h-6" />
                                                <span>{selfiePhoto.name}</span>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-500">
                                                <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <span className="text-xl">🤳</span>
                                                </div>
                                                <p className="text-sm font-medium">Sube una selfie sosteniendo tu cédula</p>
                                                <p className="text-xs text-gray-400">Asegúrate de que tu rostro y la cédula sean visibles</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 my-4" />

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de la Tienda</label>
                                    <div className="relative">
                                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={storeName}
                                            onChange={(e) => setStoreName(e.target.value)}
                                            placeholder="Ej: Burger King Coro"
                                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-black placeholder:text-gray-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Categoría</label>
                                    <div className="relative">
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full pl-4 pr-10 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-black transition-all appearance-none"
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
                                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-black placeholder:text-gray-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        if (storeName && phone && fullName && cedula && cedulaPhoto && selfiePhoto) setStep(2);
                                        else toast("Por favor completa todos los campos, incluyendo las fotos de verificación.", "error");
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
                                            else toast("Por favor selecciona una ubicación en el mapa", "error");
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
                                                    <input placeholder="Banco" className="w-full p-3 rounded-xl border border-gray-200 text-sm text-black placeholder:text-gray-500" onChange={e => setNewMethodDetails({ ...newMethodDetails, bank: e.target.value })} />
                                                    <input placeholder="Cédula" className="w-full p-3 rounded-xl border border-gray-200 text-sm text-black placeholder:text-gray-500" onChange={e => setNewMethodDetails({ ...newMethodDetails, id: e.target.value })} />
                                                    <input placeholder="Teléfono" className="w-full p-3 rounded-xl border border-gray-200 text-sm text-black placeholder:text-gray-500" onChange={e => setNewMethodDetails({ ...newMethodDetails, phone: e.target.value })} />
                                                </>
                                            )}
                                            {(newMethodType === 'zelle' || newMethodType === 'zinli') && (
                                                <input placeholder={`Correo ${newMethodType === 'zelle' ? 'Zelle' : 'Zinli'}`} className="w-full p-3 rounded-xl border border-gray-200 text-sm text-black placeholder:text-gray-500" onChange={e => setNewMethodDetails({ ...newMethodDetails, email: e.target.value })} />
                                            )}
                                            {newMethodType === 'binance' && (
                                                <input placeholder="Correo / Pay ID" className="w-full p-3 rounded-xl border border-gray-200 text-sm text-black placeholder:text-gray-500" onChange={e => setNewMethodDetails({ ...newMethodDetails, email: e.target.value })} />
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
