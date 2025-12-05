"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowLeft, Mail, Lock, User, Phone } from "lucide-react";
import { WavyBackground } from "@/components/ui/wavy-background";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { cn } from "@/lib/utils";

function SignupForm() {
    const searchParams = useSearchParams();
    const [role, setRole] = useState<"buyer" | "seller">("buyer");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            setLoading(false);
            return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: 'https://resuelveve.vercel.app/?verified=true',
                data: {
                    full_name: fullName,
                    phone: phone,
                    role: role
                }
            }
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        if (authData.user) {
            setSuccess(true);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <MotionWrapper className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 my-10 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                    <Mail className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Revisa tu correo!</h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Hemos enviado un enlace de confirmación a <span className="font-bold text-gray-900">{email}</span>.
                    <br /><br />
                    Por favor, haz clic en el enlace para activar tu cuenta y comenzar a usar Resuelve.
                </p>

                <div className="space-y-3">
                    <Link
                        href="/login"
                        className="block w-full bg-brand-red text-white py-4 rounded-xl font-bold shadow-lg shadow-red-200 active:scale-[0.98] hover:bg-red-700 transition-all"
                    >
                        Ir a Iniciar Sesión
                    </Link>
                    <button
                        onClick={() => setSuccess(false)}
                        className="block w-full text-gray-500 font-medium py-2 hover:text-gray-700"
                    >
                        Volver al registro
                    </button>
                </div>
            </MotionWrapper>
        );
    }

    return (
        <MotionWrapper className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 my-10">
            <Link href="/welcome" className="inline-flex items-center text-gray-500 mb-6 hover:text-brand-red transition-colors group">
                <ArrowLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" /> Volver
            </Link>

            <div className="text-center mb-8 flex flex-col items-center">
                <div className="relative w-20 h-20 mb-4 shadow-lg rounded-2xl overflow-hidden">
                    <Image src="/logo.jpg" alt="Resuelve" fill className="object-cover" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Crear Cuenta</h1>
                <p className="text-gray-500 font-medium">Únete a la comunidad de Resuelve</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <span className="font-bold">Error:</span> {error}
                </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
                {/* Role Selection */}


                <div className="relative group">
                    <User className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-brand-red transition-colors" />
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Nombre Completo"
                        className="w-full pl-12 pr-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all placeholder:text-gray-500 font-medium text-black"
                    />
                </div>
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
                <div className="relative group">
                    <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-brand-red transition-colors" />
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Confirmar Contraseña"
                        className="w-full pl-12 pr-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all placeholder:text-gray-500 font-medium text-black"
                    />
                </div>
                <div className="relative group">
                    <Phone className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-brand-red transition-colors" />
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="Teléfono"
                        className="w-full pl-12 pr-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/10 outline-none transition-all placeholder:text-gray-500 font-medium text-black"
                    />
                </div>


                <div className="flex items-start gap-2 mb-4 pt-2">
                    <input
                        type="checkbox"
                        id="terms"
                        required
                        className="mt-1 w-4 h-4 text-brand-red border-gray-300 rounded focus:ring-brand-red"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600 leading-tight">
                        Acepto los <Link href="/terms" className="text-brand-red font-bold hover:underline" target="_blank">Términos y Condiciones</Link> y la <Link href="/privacy" className="text-brand-red font-bold hover:underline" target="_blank">Política de Privacidad</Link>.
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-red text-white py-4 rounded-xl font-bold shadow-lg shadow-red-200 active:scale-[0.98] hover:bg-red-700 transition-all flex items-center justify-center text-lg"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Registrarse"}
                </button>
            </form>

            <div className="mt-6 text-center text-sm">
                <p className="text-gray-600">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" className="text-brand-red font-bold hover:underline">
                        Inicia Sesión
                    </Link>
                </p>
            </div>
        </MotionWrapper>
    );
}

export default function SignupPage() {
    return (
        <WavyBackground className="max-w-4xl mx-auto pb-40">
            <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin text-brand-red" /></div>}>
                <SignupForm />
            </Suspense>
        </WavyBackground>
    );
}
