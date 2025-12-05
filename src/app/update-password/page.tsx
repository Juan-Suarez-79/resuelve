"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Lock, CheckCircle } from "lucide-react";
import { WavyBackground } from "@/components/ui/wavy-background";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

function UpdatePasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // Check if we have a session (which happens after clicking the email link)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If no session, maybe the link is invalid or expired
                setError("El enlace de recuperación es inválido o ha expirado.");
            }
        };
        checkSession();
    }, [supabase]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
            setTimeout(() => {
                router.push('/');
            }, 3000);
        }
    };

    if (success) {
        return (
            <MotionWrapper className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 my-10 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Contraseña Actualizada!</h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Tu contraseña ha sido cambiada exitosamente. Serás redirigido al inicio en unos segundos.
                </p>

                <div className="space-y-3">
                    <Link
                        href="/"
                        className="block w-full bg-brand-red text-white py-4 rounded-xl font-bold shadow-lg shadow-red-200 active:scale-[0.98] hover:bg-red-700 transition-all"
                    >
                        Ir al Inicio
                    </Link>
                </div>
            </MotionWrapper>
        );
    }

    return (
        <MotionWrapper className="relative z-10 w-full max-w-sm bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 mx-auto">
            <div className="text-center mb-8 flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4 shadow-lg rounded-2xl overflow-hidden">
                    <Image src="/logo.jpg" alt="Resuelve" fill className="object-cover" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Nueva Contraseña</h1>
                <p className="text-gray-500 font-medium text-sm">Ingresa tu nueva contraseña segura</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <span className="font-bold">Error:</span> {error}
                </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-5">
                <div className="relative group">
                    <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-brand-red transition-colors" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Nueva Contraseña"
                        className="w-full pl-12 pr-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all placeholder:text-gray-500 font-medium text-black"
                    />
                </div>
                <div className="relative group">
                    <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-brand-red transition-colors" />
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Confirmar Nueva Contraseña"
                        className="w-full pl-12 pr-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all placeholder:text-gray-500 font-medium text-black"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-red text-white py-4 rounded-xl font-bold shadow-lg shadow-red-200 active:scale-[0.98] hover:bg-red-700 transition-all flex items-center justify-center text-lg mt-4"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Actualizar Contraseña"}
                </button>
            </form>
        </MotionWrapper>
    );
}

export default function UpdatePasswordPage() {
    return (
        <WavyBackground className="max-w-4xl mx-auto pb-40">
            <UpdatePasswordForm />
        </WavyBackground>
    );
}
