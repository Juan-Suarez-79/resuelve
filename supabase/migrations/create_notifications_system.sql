-- Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    type TEXT DEFAULT 'info', -- info, success, warning, error
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Trigger Function to Notify Buyer on Order Status Change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status <> NEW.status THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            NEW.buyer_id,
            'Actualización de Pedido',
            'Tu pedido #' || substring(NEW.id::text, 1, 4) || ' ha cambiado a estado: ' || 
            CASE 
                WHEN NEW.status = 'paid' THEN 'Pagado'
                WHEN NEW.status = 'delivered' THEN 'Entregado'
                WHEN NEW.status = 'cancelled' THEN 'Cancelado'
                ELSE NEW.status
            END,
            CASE 
                WHEN NEW.status = 'paid' THEN 'success'
                WHEN NEW.status = 'delivered' THEN 'success'
                WHEN NEW.status = 'cancelled' THEN 'error'
                ELSE 'info'
            END,
            '/profile/orders'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.buyer_id IS NOT NULL)
EXECUTE FUNCTION public.notify_order_status_change();
