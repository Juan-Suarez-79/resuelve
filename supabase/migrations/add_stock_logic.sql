-- Add stock_quantity to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- Update existing products to have some stock (optional, for dev)
UPDATE public.products SET stock_quantity = 100 WHERE stock_quantity = 0;

-- Create a function to handle checkout transaction
CREATE OR REPLACE FUNCTION create_order_with_stock_deduction(
    p_store_id UUID,
    p_buyer_name TEXT,
    p_buyer_phone TEXT,
    p_buyer_address TEXT,
    p_buyer_id UUID,
    p_total_usd NUMERIC,
    p_total_bs NUMERIC,
    p_payment_method TEXT,
    p_delivery_method TEXT,
    p_items JSONB
) RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_product_id UUID;
    v_quantity INTEGER;
    v_current_stock INTEGER;
BEGIN
    -- Check stock for all items first
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;
        
        SELECT stock_quantity INTO v_current_stock
        FROM public.products
        WHERE id = v_product_id;
        
        IF v_current_stock < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product %', v_product_id;
        END IF;
    END LOOP;

    -- Create Order
    INSERT INTO public.orders (
        store_id, buyer_name, buyer_phone, buyer_address, buyer_id,
        total_usd, total_bs, status, payment_method, delivery_method
    ) VALUES (
        p_store_id, p_buyer_name, p_buyer_phone, p_buyer_address, p_buyer_id,
        p_total_usd, p_total_bs, 'pending', p_payment_method, p_delivery_method
    ) RETURNING id INTO v_order_id;

    -- Insert Items and Deduct Stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_quantity := (v_item->>'quantity')::INTEGER;
        
        -- Insert Order Item
        INSERT INTO public.order_items (
            order_id, product_id, quantity, price_at_time_usd, title
        ) VALUES (
            v_order_id,
            v_product_id,
            v_quantity,
            (v_item->>'price_at_time_usd')::NUMERIC,
            (v_item->>'title')::TEXT
        );
        
        -- Deduct Stock
        UPDATE public.products
        SET stock_quantity = stock_quantity - v_quantity
        WHERE id = v_product_id;
    END LOOP;

    RETURN jsonb_build_object('id', v_order_id);
END;
$$ LANGUAGE plpgsql;
