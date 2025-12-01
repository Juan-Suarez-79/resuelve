import { SellerBottomNav } from "@/components/ui/seller-bottom-nav";
import { SellerHeader } from "@/components/ui/seller-header";

export default function SellerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <SellerHeader />
            {children}
            <SellerBottomNav />
        </div>
    );
}
