import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full flex flex-col items-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-brand-red" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
                <p className="text-gray-500 mb-6">
                    Lo sentimos, la página que buscas no existe o ha sido movida.
                </p>
                <Link
                    href="/"
                    className="w-full bg-brand-red text-white py-3 rounded-xl font-bold shadow-lg shadow-red-200 active:scale-[0.98] transition-transform"
                >
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
}
