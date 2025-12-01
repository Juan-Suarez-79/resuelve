
"use client";

import { useCart } from "@/lib/store/cart";
import { formatCurrency, generateWhatsAppLink, getExchangeRate } from "@/lib/utils";
import { Trash2, MessageCircle, MapPin, User, Minus, Plus, AlertTriangle, CreditCard, Truck, Store } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CartPage() {
    const { items, removeItem, updateQuantity, totalUsd, clearCart } = useCart();
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

                // Fetch Store Delivery Fee
                const { data: store } = await supabase
                    .from('stores')
                    .select('delivery_fee')
                    .eq('id', firstStoreId)
                    .single();

                if (store) setDeliveryFee(store.delivery_fee || 0);

                setLoadingMethods(false);
            }
        };
        init();
    }, [items, supabase]);

    const handleCheckout = async () => {
        if (items.length === 0) return;

        if (!name) {
            alert("Por favor ingresa tu nombre.");
            return;
        }
        if (!phone) {
            alert("Por favor ingresa tu teléfono.");
            return;
        }
        if (deliveryMethod === 'delivery' && !address) {
            alert("Por favor ingresa tu dirección de entrega.");
            return;
        }
        if (!paymentMethod) {
            alert("Por favor selecciona un método de pago.");
            return;
        }

        // Group items by storeId
        const storeGroups: { [key: string]: typeof items } = {};
        items.forEach(item => {
            if (!storeGroups[item.storeId]) storeGroups[item.storeId] = [];
            storeGroups[item.storeId].push(item);
        });

        const storeIds = Object.keys(storeGroups);
        let firstLink = "";

        const { data: { user } } = await supabase.auth.getUser();
        const exchangeRate = await getExchangeRate();

        for (const storeId of storeIds) {
            const storeItems = storeGroups[storeId];
            const storeTotalUsd = storeItems.reduce((acc, item) => acc + (item.priceUsd * item.quantity), 0);

            const orderPayload = {
                store_id: storeId,
                buyer_name: name,
                buyer_phone: phone,
                buyer_address: deliveryMethod === 'delivery' ? address : 'Pick Up',
                buyer_id: user?.id || null,
                total_usd: storeTotalUsd,
                total_bs: storeTotalUsd * exchangeRate,
                status: 'pending',
                payment_method: paymentMethod,
                delivery_method: deliveryMethod
            };

            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert(orderPayload)
                .select()
                .single();

            if (orderError || !order) {
                console.error("Error creating order:", orderError);
                alert("Error al procesar el pedido. Intenta de nuevo.");
                return;
            }

            // 2. Create Order Items
            const orderItemsData = storeItems.map(item => ({
                order_id: order.id,
                product_id: item.id,
                quantity: item.quantity,
                price_at_time_usd: item.priceUsd,
                title: item.title
            }));

            await supabase.from('order_items').insert(orderItemsData);

            // 3. Generate WhatsApp Link
            if (!firstLink) {
                const { data: store } = await supabase
                    .from('stores')
                    .select('phone_number')
                    .eq('id', storeId)
                    .single();

                const phone = store?.phone_number || "584120000000";

                const itemsList = storeItems
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

                firstLink = generateWhatsAppLink(phone, message);
            }
        }

        clearCart();
        if (firstLink) window.open(firstLink, "_blank");
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
        <div className="p-4 pb-32 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Tu Pedido</h1>

            {/* Cart Items */}
            <div className="space-y-4 mb-8">
                {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {item.imageUrl ? (
                                <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300"><Trash2 className="w-6 h-6" /></div>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 leading-tight mb-1">{item.title}</h3>
                            <div className="flex flex-col">
                                <span className="font-bold text-brand-red">{formatCurrency(item.priceUsd, "USD")}</span>
                                <span className="text-xs text-gray-500">{formatCurrency(item.priceUsd * exchangeRate, "VES")}</span>
                            </div>
                        </div>
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 active:scale-90 transition-transform"><Minus className="w-3 h-3" /></button>
                            <span className="w-8 text-center font-bold text-sm text-gray-900">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 active:scale-90 transition-transform"><Plus className="w-3 h-3" /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Checkout Form */}
            <div className="space-y-6">

                {/* 1. Datos Básicos */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-brand-red" /> Datos Personales
                    </h3>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Nombre Completo</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Juan Pérez"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-red outline-none bg-gray-50 mb-3"
                        />
                        <label className="block text-xs font-bold text-gray-500 mb-1">Teléfono</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Ej: 04121234567"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-red outline-none bg-gray-50"
                        />
                    </div>
                </div>

                {/* 2. Método de Entrega */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-brand-red" /> Método de Entrega
                    </h3>

                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setDeliveryMethod('delivery')}
                            className={`flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors ${deliveryMethod === 'delivery' ? 'bg-brand-red text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
                        >
                            <Truck className="w-4 h-4" /> Delivery
                        </button>
                        <button
                            onClick={() => setDeliveryMethod('pickup')}
                            className={`flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors ${deliveryMethod === 'pickup' ? 'bg-brand-red text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}
                        >
                            <Store className="w-4 h-4" /> Pick Up
                        </button>
                    </div>

                    {deliveryMethod === 'delivery' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            {savedAddresses.length > 0 && (
                                <div className="mb-3">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Mis Direcciones Guardadas</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                        {savedAddresses.map((addr) => (
                                            <button
                                                key={addr.id}
                                                onClick={() => setAddress(addr.address)}
                                                className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium border transition-colors ${address === addr.address ? 'bg-red-50 border-brand-red text-brand-red' : 'bg-white border-gray-200 text-gray-600'}`}
                                            >
                                                {addr.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <label className="block text-xs font-bold text-gray-500 mb-1">Dirección Exacta</label>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Ej: Av. Principal, Edif. Azul, Apto 4B"
                                rows={2}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-red outline-none bg-gray-50 resize-none"
                            />
                        </div>
                    )}
                </div>

                {/* 3. Método de Pago */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-brand-red" /> Método de Pago
                    </h3>

                    {loadingMethods ? (
                        <div className="text-center py-4 text-gray-400">Cargando métodos...</div>
                    ) : storePaymentMethods.length === 0 ? (
                        <div className="text-center py-4 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            La tienda no ha configurado métodos de pago.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {storePaymentMethods.map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.type)}
                                    className={`py-3 px-2 rounded-xl text-sm font-medium border transition-all ${paymentMethod === method.type ? 'border-brand-red bg-red-50 text-brand-red' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
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
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in">
                            <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Datos para el pago:</h4>
                            <div className="text-sm text-gray-800 space-y-1">
                                {paymentMethod === 'pago_movil' && (
                                    <>
                                        <p><span className="font-semibold">Banco:</span> {selectedPaymentDetails.bank}</p>
                                        <p><span className="font-semibold">Cédula:</span> {selectedPaymentDetails.id}</p>
                                        <p><span className="font-semibold">Teléfono:</span> {selectedPaymentDetails.phone}</p>
                                    </>
                                )}
                                {paymentMethod === 'zelle' && (
                                    <>
                                        <p><span className="font-semibold">Correo:</span> {selectedPaymentDetails.email}</p>
                                        <p><span className="font-semibold">Titular:</span> {selectedPaymentDetails.name}</p>
                                    </>
                                )}
                                {paymentMethod === 'binance' && (
                                    <p><span className="font-semibold">Correo/ID:</span> {selectedPaymentDetails.email}</p>
                                )}
                                {paymentMethod === 'cash' && (
                                    <p>Pagarás en efectivo al momento de la entrega.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-500 text-sm">Subtotal</span>
                        <div className="text-right">
                            <div className="font-bold text-gray-900">{formatCurrency(subtotal, "USD")}</div>
                            <div className="text-xs text-gray-500">{formatCurrency(subtotal * exchangeRate, "VES")}</div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-500 text-sm">Delivery Fee</span>
                        <div className="text-right">
                            <div className="font-bold text-gray-900">{formatCurrency(deliveryFee, "USD")}</div>
                            <div className="text-xs text-gray-500">{formatCurrency(deliveryFee * exchangeRate, "VES")}</div>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                        <span className="font-bold text-lg text-gray-900">Total a Pagar</span>
                        <div className="text-right">
                            <div className="font-bold text-2xl text-brand-red">{formatCurrency(total, "USD")}</div>
                            <div className="text-sm font-bold text-gray-600">{formatCurrency(total * exchangeRate, "VES")}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Button */}
            <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-md mx-auto z-30">
                <button
                    onClick={handleCheckout}
                    className="w-full bg-[#D32F2F] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                    <MessageCircle className="w-6 h-6 fill-white text-white" />
                    Finalizar Compra
                </button>
            </div>
        </div>
    );
}
