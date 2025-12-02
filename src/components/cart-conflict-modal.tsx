"use client";

import { AlertTriangle, X } from "lucide-react";
import { MotionWrapper } from "./ui/motion-wrapper";

interface CartConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClearAndAdd: () => void;
    currentStoreName: string;
    newStoreName: string;
}

export function CartConflictModal({
    isOpen,
    onClose,
    onClearAndAdd,
    currentStoreName,
    newStoreName
}: CartConflictModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-brand-red" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">¿Cambiar de tienda?</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Tu carrito tiene productos de <span className="font-bold text-gray-800">{currentStoreName}</span>.
                        Solo puedes pedir de una tienda a la vez.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        ¿Quieres vaciar el carrito y agregar este producto de <span className="font-bold text-gray-800">{newStoreName}</span>?
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onClearAndAdd}
                        className="flex-1 py-3 px-4 bg-brand-red text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-colors"
                    >
                        Vaciar y Agregar
                    </button>
                </div>
            </div>
        </div>
    );
}
