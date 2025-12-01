"use client";

import Link from "next/link";
import { WavyBackground } from "@/components/ui/wavy-background";

export default function WelcomePage() {
    return (
        <div className="min-h-screen bg-white relative overflow-hidden flex flex-col items-center justify-center p-6">
            <WavyBackground />

            <div className="relative z-10 w-full max-w-sm text-center flex flex-col items-center">
                {/* Logo Text */}
                <h1 className="text-5xl font-bold text-brand-red mb-2 tracking-tight">
                    Resuelve
                </h1>

                {/* Tagline */}
                <p className="text-gray-800 font-medium text-lg mb-12 leading-tight">
                    Tu mercado local en WhatsApp.<br />
                    Rápido y fácil.
                </p>

                {/* Buttons */}
                <div className="w-full space-y-4 mb-12">
                    <Link
                        href="/"
                        className="block w-full bg-brand-red text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 active:scale-[0.98] transition-transform border-2 border-brand-red"
                    >
                        <div className="text-sm opacity-90">Soy Comprador:</div>
                        <div className="text-lg">Ver Tiendas Cercanas</div>
                    </Link>

                    <Link
                        href="/signup?role=seller"
                        className="block w-full bg-white text-brand-red font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform border-2 border-brand-red"
                    >
                        <div className="text-sm opacity-90 text-gray-600">Soy Vendedor:</div>
                        <div className="text-lg">Crear mi Tienda Digital</div>
                    </Link>
                </div>

                {/* Footer Link */}
                <div className="text-sm text-gray-600">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" className="font-bold text-gray-900 hover:underline">
                        Iniciar Sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}
