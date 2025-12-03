"use client";

import { MessageCircleQuestion } from "lucide-react";
import Link from "next/link";

export function SupportButton() {
    const whatsappNumber = "584245111967";
    const message = encodeURIComponent("Hola, necesito soporte técnico con la aplicación Resuelve.");
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

    return (
        <Link
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-20 right-4 z-40 bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
            title="Soporte Técnico"
        >
            <MessageCircleQuestion className="w-6 h-6" />
        </Link>
    );
}
