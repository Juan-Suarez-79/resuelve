"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, CheckCircle2, Loader2, Camera, UserSquare2 } from "lucide-react";
import Link from "next/link";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { useToast } from "@/components/ui/toast";
import Image from "next/image";

export default function KYCPage() {
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [cedula, setCedula] = useState("");
    const [cedulaPhoto, setCedulaPhoto] = useState<File | null>(null);
    const [selfiePhoto, setSelfiePhoto] = useState<File | null>(null);
    const [currentCedulaUrl, setCurrentCedulaUrl] = useState<string | null>(null);
    const [currentSelfieUrl, setCurrentSelfieUrl] = useState<string | null>(null);
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
                .select('cedula, cedula_photo_url, selfie_holding_id_url')
                .eq('id', user.id)
                .single();

            if (profile) {
                setCedula(profile.cedula || "");
                setCurrentCedulaUrl(profile.cedula_photo_url);
                setCurrentSelfieUrl(profile.selfie_holding_id_url);
            }
            setLoading(false);
        }
        fetchProfile();
    }, [supabase, router]);

    const handleUpload = async () => {
        if (!userId) return;
        if (!cedula) {
            toast("Ingresa tu número de cédula", "error");
            return;
        }
        // If no new photos and no existing photos, block
        if ((!cedulaPhoto && !currentCedulaUrl) || (!selfiePhoto && !currentSelfieUrl)) {
            toast("Debes subir ambas fotos", "error");
            return;
        }

        setUploading(true);
        try {
            let newCedulaUrl = currentCedulaUrl;
            let newSelfieUrl = currentSelfieUrl;

            // Upload Cedula
            if (cedulaPhoto) {
                const fileExt = cedulaPhoto.name.split('.').pop();
                const fileName = `${userId}/cedula-${Date.now()}.${fileExt}`;
                console.log('Uploading Cedula:', fileName, 'User:', userId);
                const { error: uploadError, data } = await supabase.storage
                    .from('kyc-documents')
                    .upload(fileName, cedulaPhoto, { upsert: true });

                if (uploadError) throw uploadError;
                newCedulaUrl = data.path;
            }

            // Upload Selfie
            if (selfiePhoto) {
                const fileExt = selfiePhoto.name.split('.').pop();
                const fileName = `${userId}/selfie-${Date.now()}.${fileExt}`;
                console.log('Uploading Selfie:', fileName, 'User:', userId);
                const { error: uploadError, data } = await supabase.storage
                    .from('kyc-documents')
                    .upload(fileName, selfiePhoto, { upsert: true });

                if (uploadError) throw uploadError;
                newSelfieUrl = data.path;
            }

            // Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    cedula: cedula,
                    cedula_photo_url: newCedulaUrl,
                    selfie_holding_id_url: newSelfieUrl
                })
                .eq('id', userId);

            if (updateError) throw updateError;

            // Update Store Status to Pending (Re-verification)
            const { error: storeError } = await supabase
                .from('stores')
                .update({ approval_status: 'pending' })
                .eq('owner_id', userId);

            if (storeError) throw storeError;

            toast("Documentos enviados correctamente", "success");
            // Refresh to show new state
            window.location.reload();

        } catch (error: any) {
            console.error(error);
            toast("Error al subir documentos: " + error.message, "error");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>;

    const isVerified = currentCedulaUrl && currentSelfieUrl && cedula;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <MotionWrapper className="p-4 max-w-lg mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/seller" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-brand-red transition-colors active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Verificación KYC</h1>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isVerified ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            {isVerified ? <CheckCircle2 className="w-6 h-6" /> : <UserSquare2 className="w-6 h-6" />}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-lg">Identidad</h2>
                            <p className="text-xs text-gray-500 font-medium">{isVerified ? "Documentos enviados" : "Verificación requerida"}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Cedula Input */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Número de Cédula</label>
                            <input
                                type="text"
                                value={cedula}
                                onChange={(e) => setCedula(e.target.value)}
                                placeholder="V-12345678"
                                className="w-full px-4 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-gray-900 transition-all placeholder:text-gray-400"
                            />
                        </div>

                        {/* Cedula Photo */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Foto de la Cédula</label>
                            <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files && setCedulaPhoto(e.target.files[0])}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                {cedulaPhoto ? (
                                    <div className="flex flex-col items-center text-green-600">
                                        <CheckCircle2 className="w-8 h-8 mb-2" />
                                        <span className="text-sm font-bold text-center px-4">{cedulaPhoto.name}</span>
                                        <span className="text-xs text-gray-400 mt-1">Toca para cambiar</span>
                                    </div>
                                ) : currentCedulaUrl ? (
                                    <div className="flex flex-col items-center text-blue-600">
                                        <CheckCircle2 className="w-8 h-8 mb-2" />
                                        <span className="text-sm font-bold">Documento cargado</span>
                                        <span className="text-xs text-gray-400 mt-1">Toca para actualizar</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400 group-hover:text-gray-600 transition-colors">
                                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                                            <Camera className="w-6 h-6" />
                                        </div>
                                        <span className="text-sm font-bold">Subir foto frontal</span>
                                        <span className="text-xs mt-1">JPG, PNG (Max 5MB)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selfie Photo */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Selfie con Cédula</label>
                            <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files && setSelfiePhoto(e.target.files[0])}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                {selfiePhoto ? (
                                    <div className="flex flex-col items-center text-green-600">
                                        <CheckCircle2 className="w-8 h-8 mb-2" />
                                        <span className="text-sm font-bold text-center px-4">{selfiePhoto.name}</span>
                                        <span className="text-xs text-gray-400 mt-1">Toca para cambiar</span>
                                    </div>
                                ) : currentSelfieUrl ? (
                                    <div className="flex flex-col items-center text-blue-600">
                                        <CheckCircle2 className="w-8 h-8 mb-2" />
                                        <span className="text-sm font-bold">Selfie cargada</span>
                                        <span className="text-xs text-gray-400 mt-1">Toca para actualizar</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400 group-hover:text-gray-600 transition-colors">
                                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                                            <span className="text-2xl">🤳</span>
                                        </div>
                                        <span className="text-sm font-bold">Subir selfie sosteniendo cédula</span>
                                        <span className="text-xs mt-1">Rostro y cédula visibles</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full bg-brand-red text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Upload className="w-5 h-5" /> Guardar Documentos</>}
                </button>

                <p className="text-center text-xs text-gray-400 mt-6 px-6">
                    Tus documentos son almacenados de forma segura y solo son visibles por el equipo de administración para fines de verificación.
                </p>
            </MotionWrapper>
        </div>
    );
}
