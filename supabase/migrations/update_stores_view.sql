-- Update the view to include ALL necessary columns
CREATE OR REPLACE VIEW public.stores_with_ratings AS
SELECT
    s.id,
    s.owner_id,
    s.name,
    s.slug,
    s.image_url,
    s.lat,
    s.lng,
    s.delivery_fee,
    s.category,
    s.is_open,
    s.is_banned,
    s.is_verified,
    s.approval_status,
    s.plan_tier,
    s.boost_expires_at,
    s.phone_number,
    s.payment_info,
    s.exchange_rate_bs,
    s.created_at,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(r.id) as review_count
FROM
    public.stores s
LEFT JOIN
    public.reviews r ON s.id = r.store_id
GROUP BY
    s.id;
