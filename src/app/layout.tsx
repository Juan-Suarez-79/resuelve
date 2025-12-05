import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MainLayout } from "@/components/main-layout";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://resuelve.app'),
  title: {
    default: "Resuelve - Tu mercado local",
    template: "%s | Resuelve",
  },
  description: "Conectando compradores y vendedores en Venezuela. Encuentra productos, servicios y tiendas cerca de ti.",
  manifest: "/manifest.json",
  keywords: ["mercado", "venezuela", "compras", "tiendas", "delivery", "coro"],
  authors: [{ name: "Resuelve Team" }],
  creator: "Resuelve",
  publisher: "Resuelve",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Resuelve - Tu mercado local",
    description: "Conectando compradores y vendedores en Venezuela.",
    url: 'https://resuelve.app',
    siteName: 'Resuelve',
    locale: 'es_VE',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg', // Ensure this image exists in public folder
        width: 1200,
        height: 630,
        alt: 'Resuelve - Tu mercado local',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Resuelve - Tu mercado local",
    description: "Conectando compradores y vendedores en Venezuela.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Resuelve",
  },
  icons: {
    icon: '/icon-192.png',
    shortcut: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ffffff',
};

import { ToastProvider } from "@/components/ui/toast";



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('Service Worker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 pb-16 md:pb-0`}
      >
        <ToastProvider>
          <MainLayout>
            {children}
          </MainLayout>
          <Analytics />
        </ToastProvider>
      </body>
    </html>
  );
}
