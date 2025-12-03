import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";

export function HeroSection() {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-red to-red-600 text-white shadow-xl mx-4 mb-6">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                </svg>
            </div>

            <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left space-y-2 max-w-md">
                    <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white mb-2 border border-white/20">
                        <span className="animate-pulse">🔥</span>
                        <span>Lo mejor de Coro en un solo lugar</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                        Pide lo que quieras, <br />
                        <span className="text-yellow-300">cuando quieras.</span>
                    </h1>
                    <p className="text-red-100 font-medium text-sm sm:text-base leading-relaxed">
                        Explora cientos de tiendas, restaurantes y servicios locales con delivery rápido y seguro.
                    </p>
                </div>

                <div className="flex-shrink-0">
                    <Link
                        href="/search"
                        className="group bg-white text-brand-red px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-900/20 flex items-center gap-2 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        Explorar Tiendas
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
