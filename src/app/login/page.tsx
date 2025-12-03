"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowLeft, Mail, Lock } from "lucide-react";
import { WavyBackground } from "@/components/ui/wavy-background";
import { MotionWrapper } from "@/components/ui/motion-wrapper";

import { Suspense } from "react";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect");
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (redirectUrl) {
                    router.push(redirectUrl);
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile?.role === 'seller') {
                    router.push('/seller');
                } else {
                    router.push('/');
                }
            } else {
                router.push('/');
            }
        }
    };

    return (
        <MotionWrapper className="relative z-10 w-full max-w-sm bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 mx-auto">
            <Link href="/welcome" className="inline-flex items-center text-gray-500 mb-8 hover:text-brand-red transition-colors group">
                <ArrowLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" /> Volver
            </Link>

            <div className="text-center mb-8 flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4 shadow-lg rounded-2xl overflow-hidden">
                    <Image src="/logo.jpg" alt="Resuelve" fill className="object-cover" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Bienvenido de nuevo</h1>
                <p className="text-gray-500 font-medium">Ingresa a tu cuenta para continuar</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <span className="font-bold">Error:</span> {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
                <div className="relative group">
                    <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-brand-red transition-colors" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Correo Electrónico"
                        className="w-full pl-12 pr-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all placeholder:text-gray-500 font-medium text-black"
                    />
                </div>
                <div className="relative group">
                    <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-brand-red transition-colors" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Contraseña"
                        className="w-full pl-12 pr-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all placeholder:text-gray-500 font-medium text-black"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-red text-white py-4 rounded-xl font-bold shadow-lg shadow-red-200 active:scale-[0.98] hover:bg-red-700 transition-all flex items-center justify-center text-lg mt-4"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Iniciar Sesión"}
                </button>
            </form>

            <div className="mt-8 text-center text-sm">
                <p className="text-gray-600">
                    ¿No tienes cuenta?{" "}
                    <Link href="/signup" className="text-brand-red font-bold hover:underline">
                        Regístrate aquí
                    </Link>
                </p>
                <p className="text-gray-600 mt-3">
                    ¿Quieres vender?{" "}
                    <Link href="/signup?role=seller" className="text-brand-red font-bold hover:underline">
                        Registra tu tienda
                    </Link>
                </p>
            </div>
        </MotionWrapper>
    );
}

export default function LoginPage() {
    return (
        <WavyBackground className="max-w-4xl mx-auto pb-40">
            <Suspense fallback={<div className="flex justify-center items-center min-h-[500px]"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>}>
                <LoginForm />
            </Suspense>
        </WavyBackground>
    );
}
