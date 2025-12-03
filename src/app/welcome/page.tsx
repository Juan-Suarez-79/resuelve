"use client";

import Link from "next/link";
import Image from "next/image";
import { WavyBackground } from "@/components/ui/wavy-background";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { ShoppingBag, Store, ArrowRight, LogIn } from "lucide-react";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle } from "lucide-react";

function WelcomeContent() {
    const searchParams = useSearchParams();
    const checkEmail = searchParams.get("check_email");

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6">
            <WavyBackground className="max-w-4xl mx-auto pb-40" />

            <MotionWrapper className="relative z-10 w-full max-w-sm bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white/50 mx-auto">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative w-28 h-28 mb-6 shadow-2xl rounded-3xl overflow-hidden ring-4 ring-white/50">
                        <Image src="/logo.jpg" alt="Resuelve Logo" fill className="object-cover" priority />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Resuelve</h1>
                    <p className="text-gray-600 font-medium text-lg leading-relaxed text-center px-2">
                        Tu mercado local en WhatsApp.<br />
                        <span className="text-brand-red font-bold">Rápido, fácil y seguro.</span>
                    </p>
                </div>

                {checkEmail && (
                    <div className="mb-8 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-blue-900 text-sm mb-1">Verifica tu correo</h3>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Hemos enviado un enlace de confirmación a tu email. Por favor revísalo para activar tu cuenta.
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-4 mb-10">
                    <Link
                        href="/"
                        className="group relative block w-full bg-brand-red text-white p-1 rounded-2xl shadow-lg shadow-red-200 active:scale-[0.98] transition-all hover:shadow-red-300"
                    >
                        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative flex items-center p-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm">
                                <ShoppingBag className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="text-xs font-bold text-red-100 uppercase tracking-wider mb-0.5">Soy Comprador</div>
                                <div className="text-lg font-bold">Ver Tiendas</div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>

                    <Link
                        href="/signup?role=seller"
                        className="group relative block w-full bg-white text-gray-900 p-1 rounded-2xl shadow-lg border border-gray-100 active:scale-[0.98] transition-all hover:border-brand-red/30 hover:shadow-xl"
                    >
                        <div className="relative flex items-center p-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-brand-red/10 transition-colors">
                                <Store className="w-6 h-6 text-gray-600 group-hover:text-brand-red transition-colors" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Soy Vendedor</div>
                                <div className="text-lg font-bold group-hover:text-brand-red transition-colors">Crear Tienda</div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-brand-red group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                </div>

                {/* Footer Link */}
                <div className="text-center border-t border-gray-200/60 pt-6">
                    <p className="text-sm text-gray-500 mb-2">¿Ya tienes una cuenta?</p>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 text-brand-red font-bold hover:underline py-2 px-4 rounded-xl hover:bg-red-50 transition-colors"
                    >
                        <LogIn className="w-4 h-4" />
                        Iniciar Sesión
                    </Link>
                </div>
            </MotionWrapper>
        </div>
    );
}

export default function WelcomePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <WelcomeContent />
        </Suspense>
    );
}
