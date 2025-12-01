"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { WavyBackground } from "@/components/ui/wavy-background";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
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
        <div className="min-h-screen bg-white relative overflow-hidden flex flex-col items-center justify-center p-6">
            <WavyBackground />

            <div className="relative z-10 w-full max-w-sm">
                <Link href="/welcome" className="inline-flex items-center text-gray-500 mb-8 hover:text-brand-red transition-colors">
                    <ArrowLeft className="w-5 h-5 mr-1" /> Volver
                </Link>

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-brand-red mb-2">Iniciar Sesión</h1>
                    <p className="text-gray-600">Bienvenido de vuelta</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
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
                            placeholder="Contraseña"
                            className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-red text-white py-4 rounded-xl font-bold shadow-lg shadow-red-200 active:scale-[0.98] transition-all flex items-center justify-center text-lg"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Entrar"}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm">
                    <p className="text-gray-600">
                        ¿No tienes cuenta?{" "}
                        <Link href="/signup" className="text-brand-red font-bold hover:underline">
                            Regístrate
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
