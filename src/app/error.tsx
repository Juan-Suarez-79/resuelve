'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border border-gray-100">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-brand-red" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Ups! Algo salió mal</h2>
                <p className="text-gray-500 mb-8 text-sm">
                    Ha ocurrido un error inesperado. Estamos trabajando para solucionarlo.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => reset()}
                        className="w-full bg-brand-red text-white py-3 rounded-xl font-bold shadow-lg shadow-red-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Intentar de nuevo
                    </button>

                    <Link
                        href="/"
                        className="block w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                        Volver al Inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
