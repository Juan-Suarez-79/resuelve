"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, MapPin, Trash2, Home, Briefcase } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddressesPage() {
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newAddress, setNewAddress] = useState({ name: "", address: "" });
    const [saving, setSaving] = useState(false);

    const supabase = createClient();
    const router = useRouter();

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
        if (!newAddress.name || !newAddress.address) return;
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
        } else {
            alert("Error al guardar la dirección");
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
        }
    };

    return (
        <div className="p-4 pb-24 min-h-screen bg-gray-50">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/profile" className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-600 active:scale-90 transition-transform">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Mis Direcciones</h1>
            </div>

            {/* Address List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Cargando...</div>
                ) : addresses.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                        <MapPin className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>No tienes direcciones guardadas.</p>
                    </div>
                ) : (
                    addresses.map((addr) => (
                        <div key={addr.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
                            <div className="flex gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 shrink-0">
                                    {addr.name.toLowerCase().includes('casa') ? <Home className="w-5 h-5" /> :
                                        addr.name.toLowerCase().includes('trabajo') ? <Briefcase className="w-5 h-5" /> :
                                            <MapPin className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{addr.name}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">{addr.address}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(addr.id)}
                                className="text-gray-400 hover:text-red-500 p-2"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Add Button */}
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-24 right-4 bg-brand-red text-white w-14 h-14 rounded-full shadow-lg shadow-red-200 flex items-center justify-center active:scale-90 transition-transform z-20"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 animate-in slide-in-from-bottom-10">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva Dirección</h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Nombre (Ej: Casa, Oficina)</label>
                                <input
                                    type="text"
                                    value={newAddress.name}
                                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-red outline-none bg-gray-50"
                                    placeholder="Nombre del lugar"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Dirección Exacta</label>
                                <textarea
                                    value={newAddress.address}
                                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-red outline-none bg-gray-50 resize-none"
                                    rows={3}
                                    placeholder="Calle, Edificio, Número..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-brand-red shadow-lg shadow-red-200 disabled:opacity-50"
                            >
                                {saving ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
