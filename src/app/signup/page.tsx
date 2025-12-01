"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { WavyBackground } from "@/components/ui/wavy-background";
import { cn } from "@/lib/utils";

function SignupForm() {
    const searchParams = useSearchParams();
    const initialRole = searchParams.get("role") === "seller" ? "seller" : "buyer";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState<"buyer" | "seller">(initialRole);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                },
            },
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        if (authData.user) {
            // Profile and Store are created automatically by the Supabase Trigger
            if (role === 'seller') {
                router.push('/seller');
            } else {
                router.push('/');
            }
        }
        setLoading(false);
    };

    return (
        <div className="relative z-10 w-full max-w-sm">
            <Link href="/welcome" className="inline-flex items-center text-gray-500 mb-6 hover:text-brand-red transition-colors">
                <ArrowLeft className="w-5 h-5 mr-1" /> Volver
            </Link>

            <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-brand-red mb-2">Crear Cuenta</h1>
                <p className="text-gray-600">Únete a Resuelve</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
                {/* Role Selection */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                        type="button"
                        onClick={() => setRole("buyer")}
                        className={cn(
                            "p-3 rounded-xl border-2 transition-all font-bold text-sm",
                            role === "buyer"
                                ? "border-brand-red bg-red-50 text-brand-red"
                                : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"
                        )}
                    >
                        Comprador
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole("seller")}
                        className={cn(
                            "p-3 rounded-xl border-2 transition-all font-bold text-sm",
                            role === "seller"
                                ? "border-brand-yellow bg-yellow-50 text-yellow-800 border-brand-yellow"
                                : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"
                        )}
                    >
                        Vendedor
                    </button>
                </div>

                <div>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Nombre Completo"
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all placeholder:text-gray-400"
                    />
                </div>
                <div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Correo Electrónico"
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all placeholder:text-gray-400"
                    />
                </div>
                <div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Contraseña"
                        className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all placeholder:text-gray-400"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-red text-white py-4 rounded-xl font-bold shadow-lg shadow-red-200 active:scale-[0.98] transition-all flex items-center justify-center text-lg"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Registrarse"}
                </button>
            </form>

            <div className="mt-8 text-center text-sm">
                <p className="text-gray-600">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" className="text-brand-red font-bold hover:underline">
                        Inicia Sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-white relative overflow-hidden flex flex-col items-center justify-center p-6">
            <WavyBackground />
            <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin text-brand-red" /></div>}>
                <SignupForm />
            </Suspense>
        </div>
    );
}
