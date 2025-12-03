import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/ui/bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resuelve - Tu mercado local",
  description: "Conectando compradores y vendedores en Venezuela",
  manifest: "/manifest.json",
};

import { ToastProvider } from "@/components/ui/toast";

import { SupportButton } from "@/components/support-button";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 pb-16 md:pb-0`}
      >
        <ToastProvider>
          <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative overflow-hidden">
            {children}
            <SupportButton />
            <BottomNav />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
