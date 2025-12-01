import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: 'USD' | 'VES') {
    return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
    }).format(amount)
}

export function generateWhatsAppLink(phone: string, message: string) {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
}
