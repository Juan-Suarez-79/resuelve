"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Phone, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { useToast } from "@/components/ui/toast";

export default function EditProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [userId, setUserId] = useState<string | null>(null);

    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        async function fetchProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUserId(user.id);

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setFullName(profile.full_name || "");
                setPhone(profile.phone || "");
            }
            setLoading(false);
        }
        fetchProfile();
    }, [supabase, router]);

    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);

        // Update Profile Table
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                phone: phone
            })
            .eq('id', userId);

        if (error) {
            toast("Error al actualizar perfil: " + error.message, "error");
        } else {
            // Update Auth Metadata (optional but good for consistency)
            await supabase.auth.updateUser({
                data: { full_name: fullName, phone: phone }
            });

            toast("Perfil actualizado correctamente", "success");
            router.push('/profile');
        }
        setSaving(false);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <MotionWrapper className="p-4 max-w-lg mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/profile" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-brand-red transition-colors active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Editar Perfil</h1>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Nombre Completo</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Tu nombre"
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-gray-900 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Teléfono</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Tu teléfono"
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-gray-900 transition-all"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-brand-red text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Guardar Cambios</>}
                    </button>
                </div>
            </MotionWrapper>
        </div>
    );
}
