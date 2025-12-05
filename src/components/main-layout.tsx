"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/ui/bottom-nav";
import { SupportButton } from "@/components/support-button";
import { cn } from "@/lib/utils";

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    return (
        <div className={cn(
            "min-h-screen bg-white relative overflow-hidden",
            isAdmin ? "w-full" : "max-w-md mx-auto shadow-2xl"
        )}>
            {children}
            {!isAdmin && (
                <>
                    <SupportButton />
                    <BottomNav />
                </>
            )}
        </div>
    );
}
