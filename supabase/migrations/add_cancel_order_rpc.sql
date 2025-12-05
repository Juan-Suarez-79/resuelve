-- Function to cancel an order and restore stock
CREATE OR REPLACE FUNCTION cancel_order_and_restore_stock(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_status TEXT;
    v_item RECORD;
BEGIN
    -- Check current status
    SELECT status INTO v_order_status FROM public.orders WHERE id = p_order_id;
    
    IF v_order_status = 'cancelled' THEN
        RAISE EXCEPTION 'Order is already cancelled';
    END IF;

    -- Update order status
    UPDATE public.orders SET status = 'cancelled' WHERE id = p_order_id;

    -- Restore stock for each item
    FOR v_item IN 
        SELECT product_id, quantity 
        FROM public.order_items 
        WHERE order_id = p_order_id
    LOOP
        -- Update product stock
        UPDATE public.products
        SET 
            stock_quantity = stock_quantity + v_item.quantity,
            in_stock = CASE 
                WHEN (stock_quantity + v_item.quantity) > 0 THEN true 
                ELSE in_stock 
            END
        WHERE id = v_item.product_id;
    END LOOP;
END;
$$;
