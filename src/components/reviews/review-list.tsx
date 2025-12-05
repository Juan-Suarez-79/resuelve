"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Star, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    profiles: {
        full_name: string;
    };
}

interface ReviewListProps {
    productId: string;
    refreshTrigger: number;
}

export function ReviewList({ productId, refreshTrigger }: ReviewListProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchReviews() {
            // 1. Fetch reviews
            const { data: reviewsData, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('product_id', productId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching reviews:", error);
                setLoading(false);
                return;
            }

            if (!reviewsData || reviewsData.length === 0) {
                setReviews([]);
                setLoading(false);
                return;
            }

            // 2. Fetch profiles for these reviews
            const userIds = [...new Set(reviewsData.map((r: any) => r.user_id))];

            let reviewsWithProfiles = reviewsData;

            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', userIds);

                if (profilesData) {
                    const profilesMap = new Map(profilesData.map((p: any) => [p.id, p]));
                    reviewsWithProfiles = reviewsData.map((r: any) => ({
                        ...r,
                        profiles: profilesMap.get(r.user_id) || { full_name: 'Usuario Anónimo' }
                    }));
                } else {
                    // Fallback if profiles fetch fails
                    reviewsWithProfiles = reviewsData.map((r: any) => ({
                        ...r,
                        profiles: { full_name: 'Usuario Anónimo' }
                    }));
                }
            }

            setReviews(reviewsWithProfiles as Review[]);
            setLoading(false);
        }
        fetchReviews();
    }, [productId, refreshTrigger, supabase]);

    if (loading) return <div className="text-center py-8 text-gray-400">Cargando reseñas...</div>;

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">Aún no hay reseñas. ¡Sé el primero!</p>
            </div>
        );
    }

    const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="flex items-center gap-4 mb-8">
                <div className="text-5xl font-black text-gray-900 tracking-tight">{averageRating.toFixed(1)}</div>
                <div>
                    <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={cn(
                                    "w-5 h-5",
                                    averageRating >= star
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "fill-gray-200 text-gray-200"
                                )}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-gray-500 font-medium">{reviews.length} reseñas</p>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{review.profiles?.full_name || "Usuario Anónimo"}</p>
                                    <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={cn(
                                            "w-4 h-4",
                                            review.rating >= star
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "fill-gray-100 text-gray-100"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
