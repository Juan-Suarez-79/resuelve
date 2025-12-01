-- Create a view to get stores with their average ratings
CREATE OR REPLACE VIEW public.stores_with_ratings AS
SELECT
    s.id,
    s.owner_id,
    s.name,
    s.image_url,
    s.lat,
    s.lng,
    s.delivery_fee,
    s.category,
    s.is_open,
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

-- Grant access to the view (if needed, usually public is fine for views if underlying tables are accessible)
-- But since RLS is on tables, the view will respect them if invoked by user.
-- However, for public home page, we might want to ensure it works.
