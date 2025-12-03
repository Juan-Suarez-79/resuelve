"use client";

import { useCart } from "@/lib/store/cart";
import { formatCurrency, generateWhatsAppLink, getExchangeRate } from "@/lib/utils";
import { Trash2, MessageCircle, MapPin, User, Minus, Plus, AlertTriangle, CreditCard, Truck, Store, Copy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

import { useToast } from "@/components/ui/toast";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

export default function CartPage() {
    const { items, removeItem, updateQuantity, totalUsd, clearCart } = useCart();
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [storePaymentMethods, setStorePaymentMethods] = useState<any[]>([]);
    const [loadingMethods, setLoadingMethods] = useState(false);
    const [exchangeRate, setExchangeRate] = useState(0);
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [storeLocation, setStoreLocation] = useState<{ lat: number, lng: number } | null>(null);

    const supabase = createClient();
    const subtotal = totalUsd();
    const finalDeliveryFee = deliveryMethod === 'delivery' ? deliveryFee : 0;
    const total = subtotal + finalDeliveryFee;

    // Fetch payment methods, exchange rate, delivery fee, and saved addresses
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const rate = await getExchangeRate();
            setExchangeRate(rate);

            if (user) {
                // Fetch Saved Addresses
                const { data: addresses } = await supabase
                    .from('addresses')
                    .select('*')
                    .eq('user_id', user.id);
                if (addresses) setSavedAddresses(addresses);
            }

            if (items.length > 0) {
                const firstStoreId = items[0].storeId;
                setLoadingMethods(true);

                // Fetch Payment Methods
                const { data: methods } = await supabase
                    .from('payment_methods')
                    .select('*')
                    .eq('store_id', firstStoreId);

                if (methods) setStorePaymentMethods(methods);

                // Fetch Store Delivery Fee & Location
                const { data: store } = await supabase
                    .from('stores')
                    .select('delivery_fee, lat, lng')
                    .eq('id', firstStoreId)
                    .single();

                if (store) {
                    setDeliveryFee(store.delivery_fee || 0);
                    if (store.lat && store.lng) {
                        setStoreLocation({ lat: store.lat, lng: store.lng });
                    }
                }

                setLoadingMethods(false);
            }
        };
        init();
    }, [items, supabase]);

    const handleCheckout = async () => {
        if (items.length === 0) return;

        if (!name) {
            toast("Por favor ingresa tu nombre.", "error");
            return;
        }
        if (!phone) {
            toast("Por favor ingresa tu teléfono.", "error");
            return;
        }
        if (deliveryMethod === 'delivery' && !address) {
            toast("Por favor ingresa tu dirección de entrega.", "error");
            return;
        }
        if (!paymentMethod) {
            toast("Por favor selecciona un método de pago.", "error");
            return;
        }

        const storeId = items[0].storeId;
        const { data: { user } } = await supabase.auth.getUser();
        const exchangeRate = await getExchangeRate();
        const storeTotalUsd = subtotal;

        const orderPayload = {
            p_store_id: storeId,
            p_buyer_name: name,
            p_buyer_phone: phone,
            p_buyer_address: deliveryMethod === 'delivery' ? address : 'Pick Up',
            p_buyer_id: user?.id || null,
            p_total_usd: storeTotalUsd,
            p_total_bs: storeTotalUsd * exchangeRate,
            p_payment_method: paymentMethod,
            p_delivery_method: deliveryMethod,
            p_items: items.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                price_at_time_usd: item.priceUsd,
                title: item.title
            }))
        };

        console.log("Payload:", orderPayload);
        // Call RPC function
        const { data: order, error: orderError } = await supabase.rpc('create_order_with_stock_deduction', orderPayload);

        if (orderError) {
            console.error("Error creating order:", JSON.stringify(orderError, null, 2));
            toast("Error al procesar el pedido: " + (orderError.message || "Error desconocido"), "error");
            return;
        }

        // Generate WhatsApp Link
        const { data: store } = await supabase
            .from('stores')
            .select('phone_number')
            .eq('id', storeId)
            .single();

        const phoneStore = store?.phone_number || "584120000000";

        const itemsList = items
            .map((item) => "- " + item.quantity + "x " + item.title + " ($" + item.priceUsd + ")")
            .join("\n");

        const paymentLabel = paymentMethod === 'pago_movil' ? 'Pago Móvil' :
            paymentMethod === 'zelle' ? 'Zelle' :
                paymentMethod === 'binance' ? 'Binance' : 'Efectivo';

        const storeTotalBs = storeTotalUsd * exchangeRate;
        let message = "*Hola, quiero procesar el siguiente pedido:*\n\n" + itemsList + "\n\n";
        message += `*Total: $${storeTotalUsd.toFixed(2)} / Bs ${storeTotalBs.toFixed(2)}*\n\n`;

        message += "*Método de pago:* " + paymentLabel + "\n";

        if (['zelle', 'pago_movil', 'binance'].includes(paymentMethod)) {
            message += "Adjunto captura del pago en un momento.\n";
        }

        message += "*Método de entrega:* " + (deliveryMethod === 'delivery' ? 'Delivery' : 'Pick Up') + "\n";

        if (deliveryMethod === 'delivery') {
            message += "Adjunto mi ubicación en un momento.\n";
            message += "Mi dirección escrita es: " + address;
        } else {
            message += "Por favor envíame la ubicación para retirar.";
        }

        const waLink = generateWhatsAppLink(phoneStore, message);

        clearCart();
        window.open(waLink, "_blank");
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast("Copiado al portapapeles", "success");
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] px-4 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Trash2 className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h2>
                <Link href="/" className="bg-brand-red text-white px-6 py-3 rounded-full font-medium shadow-lg shadow-red-200">
                    Ir a comprar
                </Link>
            </div>
        );
    }

    const selectedPaymentDetails = storePaymentMethods.find(m => m.type === paymentMethod)?.details;

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            <MotionWrapper className="p-4 max-w-lg mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">Tu Pedido</h1>

                {/* Cart Items */}
                <div className="space-y-4 mb-8">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <Link href={`/store/${item.storeId}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 block group">
                                {item.imageUrl ? (
                                    <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300"><Trash2 className="w-6 h-6" /></div>
                                )}
                            </Link>
                            <div className="flex-1">
                                <Link href={`/store/${item.storeId}`}>
                                    <h3 className="font-bold text-gray-900 leading-tight mb-1 hover:text-brand-red transition-colors line-clamp-2">{item.title}</h3>
                                </Link>
                                <div className="flex flex-col">
                                    <span className="font-extrabold text-brand-red text-lg">{formatCurrency(item.priceUsd, "USD")}</span>
                                    <span className="text-sm font-bold text-gray-600">≈ {formatCurrency(item.priceUsd * exchangeRate, "VES")}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1 bg-gray-50 rounded-xl p-1.5 border border-gray-100">
                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 active:scale-90 transition-all"><Plus className="w-4 h-4" /></button>
                                <span className="w-8 text-center font-bold text-sm text-gray-900 py-1">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 active:scale-90 transition-all"><Minus className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Checkout Form */}
                <div className="space-y-6">

                    {/* 1. Datos Básicos */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg">
                            <div className="p-2 bg-red-50 rounded-lg text-brand-red">
                                <User className="w-5 h-5" />
                            </div>
                            Datos Personales
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Nombre Completo</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Juan Pérez"
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none bg-gray-50 transition-all font-medium text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Teléfono</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Ej: 04121234567"
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none bg-gray-50 transition-all font-medium text-gray-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. Método de Entrega */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg">
                            <div className="p-2 bg-red-50 rounded-lg text-brand-red">
                                <Truck className="w-5 h-5" />
                            </div>
                            Método de Entrega
                        </h3>

                        <div className="flex gap-3 mb-6">
                            <button
                                onClick={() => setDeliveryMethod('delivery')}
                                className={`flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${deliveryMethod === 'delivery' ? 'bg-brand-red text-white shadow-lg shadow-red-200 scale-[1.02]' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                            >
                                <Truck className="w-5 h-5" /> Delivery
                            </button>
                            <button
                                onClick={() => setDeliveryMethod('pickup')}
                                className={`flex-1 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${deliveryMethod === 'pickup' ? 'bg-brand-red text-white shadow-lg shadow-red-200 scale-[1.02]' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                            >
                                <Store className="w-5 h-5" /> Pick Up
                            </button>
                        </div>

                        {deliveryMethod === 'delivery' && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                {savedAddresses.length > 0 && (
                                    <div className="mb-5">
                                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Mis Direcciones</label>
                                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                            {savedAddresses.map((addr) => (
                                                <button
                                                    key={addr.id}
                                                    onClick={() => setAddress(addr.address)}
                                                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${address === addr.address ? 'bg-red-50 border-brand-red text-brand-red ring-2 ring-brand-red/20' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                                >
                                                    {addr.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Dirección Exacta</label>
                                <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Ej: Av. Principal, Edif. Azul, Apto 4B"
                                    rows={3}
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none bg-gray-50 resize-none transition-all font-medium text-gray-900"
                                />
                            </div>
                        )}

                        {deliveryMethod === 'pickup' && storeLocation && (
                            <div className="mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                <button
                                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${storeLocation.lat},${storeLocation.lng}`, '_blank')}
                                    className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors border border-blue-100"
                                >
                                    <MapPin className="w-4 h-4" />
                                    Ver ubicación del negocio
                                </button>
                                <p className="text-xs text-gray-400 text-center mt-2">
                                    Te redirigiremos a Google Maps para ver la ubicación exacta.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 3. Método de Pago */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg">
                            <div className="p-2 bg-red-50 rounded-lg text-brand-red">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            Método de Pago
                        </h3>

                        {loadingMethods ? (
                            <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-gray-200 border-t-brand-red rounded-full animate-spin" />
                                <span className="text-sm font-medium">Cargando métodos...</span>
                            </div>
                        ) : storePaymentMethods.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-sm font-medium">La tienda no ha configurado métodos de pago.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {storePaymentMethods.map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.type)}
                                        className={`py-4 px-3 rounded-2xl text-sm font-bold border transition-all duration-300 ${paymentMethod === method.type ? 'border-brand-red bg-red-50 text-brand-red shadow-md scale-[1.02]' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300'}`}
                                    >
                                        {method.type === 'pago_movil' ? 'Pago Móvil' :
                                            method.type === 'zelle' ? 'Zelle' :
                                                method.type === 'binance' ? 'Binance' : 'Efectivo'}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Payment Details Preview */}
                        {selectedPaymentDetails && (
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Datos para el pago:</h4>
                                <div className="text-sm text-gray-800 space-y-3">
                                    {paymentMethod === 'pago_movil' && (
                                        <>
                                            <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                                                <p><span className="font-bold text-gray-500 text-xs uppercase block mb-0.5">Banco</span> {selectedPaymentDetails.bank}</p>
                                                <button onClick={() => copyToClipboard(selectedPaymentDetails.bank)} className="text-brand-red text-xs font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors">Copiar</button>
                                            </div>
                                            <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                                                <p><span className="font-bold text-gray-500 text-xs uppercase block mb-0.5">Cédula</span> {selectedPaymentDetails.id}</p>
                                                <button onClick={() => copyToClipboard(selectedPaymentDetails.id)} className="text-brand-red text-xs font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors">Copiar</button>
                                            </div>
                                            <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                                                <p><span className="font-bold text-gray-500 text-xs uppercase block mb-0.5">Teléfono</span> {selectedPaymentDetails.phone}</p>
                                                <button onClick={() => copyToClipboard(selectedPaymentDetails.phone)} className="text-brand-red text-xs font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors">Copiar</button>
                                            </div>
                                        </>
                                    )}
                                    {paymentMethod === 'zelle' && (
                                        <>
                                            <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                                                <p><span className="font-bold text-gray-500 text-xs uppercase block mb-0.5">Correo</span> {selectedPaymentDetails.email}</p>
                                                <button onClick={() => copyToClipboard(selectedPaymentDetails.email)} className="text-brand-red text-xs font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors">Copiar</button>
                                            </div>
                                            <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                                                <p><span className="font-bold text-gray-500 text-xs uppercase block mb-0.5">Titular</span> {selectedPaymentDetails.name}</p>
                                                <button onClick={() => copyToClipboard(selectedPaymentDetails.name)} className="text-brand-red text-xs font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors">Copiar</button>
                                            </div>
                                        </>
                                    )}
                                    {paymentMethod === 'binance' && (
                                        <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                                            <p><span className="font-bold text-gray-500 text-xs uppercase block mb-0.5">Correo/ID</span> {selectedPaymentDetails.email}</p>
                                            <button onClick={() => copyToClipboard(selectedPaymentDetails.email)} className="text-brand-red text-xs font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors">Copiar</button>
                                        </div>
                                    )}
                                    {paymentMethod === 'cash' && (
                                        <p className="font-medium text-gray-600 italic">Pagarás en efectivo al momento de la entrega.</p>
                                    )}
                                </div>

                                {paymentMethod !== 'cash' && (
                                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex gap-3 items-start">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-yellow-800 leading-relaxed">
                                            <span className="font-bold block mb-1">Importante</span>
                                            Tu pedido será procesado una vez verifiquemos el capture y confirmemos el pago.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Promo Banner */}
                    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 rounded-3xl shadow-xl text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-white text-sm font-medium mb-4 relative z-10">
                            Gestiona tu negocio como <span className="font-bold text-brand-red">{items[0]?.storeName || "esta tienda"}</span> usando Resuelve.
                        </p>
                        <Link href="/register-store" className="inline-block text-xs bg-white text-gray-900 px-5 py-2.5 rounded-full font-bold hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all shadow-lg relative z-10">
                            Registra tu tienda aquí
                        </Link>
                    </div>

                    {/* Summary */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-500 text-sm font-medium">Subtotal</span>
                            <div className="text-right">
                                <div className="font-bold text-gray-900">{formatCurrency(subtotal, "USD")}</div>
                                <div className="text-sm text-gray-500 font-medium">{formatCurrency(subtotal * exchangeRate, "VES")}</div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mb-5">
                            <span className="text-gray-500 text-sm font-medium">Delivery Fee</span>
                            <div className="text-right">
                                <div className="font-bold text-gray-900">{formatCurrency(finalDeliveryFee, "USD")}</div>
                                <div className="text-sm text-gray-500 font-medium">{formatCurrency(finalDeliveryFee * exchangeRate, "VES")}</div>
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-5 flex justify-between items-center">
                            <span className="font-extrabold text-xl text-gray-900">Total</span>
                            <div className="text-right space-y-1">
                                <div className="flex items-center justify-end gap-2">
                                    <div className="font-black text-3xl text-brand-red tracking-tight">{formatCurrency(total, "USD")}</div>
                                    <button onClick={() => copyToClipboard(total.toString())} className="p-1.5 bg-red-50 text-brand-red rounded-lg hover:bg-red-100 transition-colors" title="Copiar monto en USD">
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <div className="text-lg font-bold text-gray-700">{formatCurrency(total * exchangeRate, "VES")}</div>
                                    <button onClick={() => copyToClipboard((total * exchangeRate).toFixed(2))} className="p-1 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 transition-colors" title="Copiar monto en VES">
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </MotionWrapper>

            {/* Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-30 pb-8">
                <div className="max-w-lg mx-auto pb-12">
                    <button
                        onClick={handleCheckout}
                        className="w-full bg-brand-red text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-red-200 flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-red-700 transition-all"
                    >
                        <MessageCircle className="w-6 h-6 fill-white/20 text-white" />
                        Finalizar Compra
                    </button>
                </div>
            </div>
        </div>
    );
}
