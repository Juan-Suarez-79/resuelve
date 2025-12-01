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

export async function getExchangeRate(): Promise<number> {
    try {
        const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { next: { revalidate: 3600 } });
        const data = await res.json();
        return data.promedio || 38.5; // Fallback to 38.5 if API fails
    } catch (error) {
        console.error("Error fetching exchange rate:", error);
        return 38.5;
    }
}
