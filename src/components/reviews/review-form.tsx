"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Star, Loader2, Send } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
    productId: string;
    storeId: string;
    onReviewSubmitted: () => void;
}

export function ReviewForm({ productId, storeId, onReviewSubmitted }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast("Por favor selecciona una calificación", "error");
            return;
        }

        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast("Debes iniciar sesión para dejar una reseña", "error");
            setLoading(false);
            return;
        }

        const { error } = await supabase
            .from('reviews')
            .insert({
                user_id: user.id,
                product_id: productId,
                store_id: storeId,
                rating,
                comment
            });

        if (error) {
            toast("Error al enviar reseña: " + error.message, "error");
        } else {
            toast("¡Gracias por tu opinión!", "success");
            setRating(0);
            setComment("");
            onReviewSubmitted();
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
            <h3 className="font-bold text-gray-900 mb-4">Escribe una reseña</h3>

            <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none transition-transform active:scale-90"
                    >
                        <Star
                            className={cn(
                                "w-8 h-8 transition-colors",
                                (hoverRating || rating) >= star
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-100 text-gray-300"
                            )}
                        />
                    </button>
                ))}
            </div>

            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="¿Qué te pareció este producto?"
                className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-red focus:ring-4 focus:ring-brand-red/5 outline-none font-medium text-gray-900 min-h-[100px] resize-none mb-4 transition-all"
            />

            <button
                type="submit"
                disabled={loading}
                className="bg-brand-red text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-red-200 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ml-auto"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Publicar Reseña</>}
            </button>
        </form>
    );
}
