"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, MapPin, Trash2, Home, Briefcase, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

export default function AddressesPage() {
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newAddress, setNewAddress] = useState({ name: "", address: "" });
    const [saving, setSaving] = useState(false);

    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) setAddresses(data);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!newAddress.name || !newAddress.address) {
            toast("Por favor completa todos los campos", "error");
            return;
        }
        setSaving(true);

        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('addresses')
            .insert({
                user_id: user?.id,
                name: newAddress.name,
                address: newAddress.address
            });

        if (!error) {
            setNewAddress({ name: "", address: "" });
            setShowModal(false);
            fetchAddresses();
            toast("Dirección guardada exitosamente", "success");
        } else {
            toast("Error al guardar la dirección", "error");
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta dirección?")) return;

        const { error } = await supabase
            .from('addresses')
            .delete()
            .eq('id', id);

        if (!error) {
            fetchAddresses();
            toast("Dirección eliminada", "success");
        } else {
            toast("Error al eliminar la dirección", "error");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            <MotionWrapper className="p-4 max-w-lg mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/profile" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-brand-red transition-colors active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mis Direcciones</h1>
                </div>

                {/* Address List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>
                    ) : addresses.length === 0 ? (
                        <div className="text-center py-12 px-6 bg-white rounded-3xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Sin direcciones</h3>
                            <p className="text-gray-500 text-sm">Agrega una dirección para tus pedidos.</p>
                        </div>
                    ) : (
                        addresses.map((addr) => (
                            <div key={addr.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-all">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-500 shrink-0 group-hover:bg-brand-red/10 group-hover:text-brand-red transition-colors">
                                        {addr.name.toLowerCase().includes('casa') ? <Home className="w-6 h-6" /> :
                                            addr.name.toLowerCase().includes('trabajo') ? <Briefcase className="w-6 h-6" /> :
                                                <MapPin className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg mb-1">{addr.name}</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">{addr.address}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(addr.id)}
                                    className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Button */}
                <button
                    onClick={() => setShowModal(true)}
                    className="fixed bottom-8 right-8 bg-brand-red text-white w-16 h-16 rounded-full shadow-lg shadow-red-200 flex items-center justify-center active:scale-90 transition-transform z-40 hover:bg-red-700"
                >
                    <Plus className="w-8 h-8" />
                </button>

                {/* Add Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-3xl p-8 animate-in slide-in-from-bottom-10 zoom-in-95 duration-300 relative shadow-2xl">
                            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-400" />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-brand-red/10 rounded-full flex items-center justify-center">
                                    <MapPin className="w-6 h-6 text-brand-red" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Nueva Dirección</h2>
                            </div>

                            <div className="space-y-5 mb-8">
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={newAddress.name}
                                        onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                                        className="w-full px-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                        placeholder="Ej: Casa, Oficina"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2 ml-1">Dirección Exacta</label>
                                    <textarea
                                        value={newAddress.address}
                                        onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                                        className="w-full px-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none transition-all resize-none font-medium text-gray-900 placeholder:text-gray-400"
                                        rows={3}
                                        placeholder="Calle, Edificio, Número..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 rounded-2xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 py-4 rounded-2xl font-bold text-white bg-brand-red shadow-lg shadow-red-200 hover:bg-red-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </MotionWrapper>
        </div>
    );
}
