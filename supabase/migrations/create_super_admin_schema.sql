-- Add is_super_admin to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Add admin control fields to stores
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'vip'
ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMP WITH TIME ZONE;

-- Create a policy to allow super admins to do ANYTHING
-- Note: This requires enabling RLS on the tables if not already enabled, 
-- and adding a policy that checks for is_super_admin.

-- For simplicity in this migration, we will assume existing policies might need adjustment
-- or we can rely on the application logic to check is_super_admin before performing actions,
-- but ideally, RLS should enforce it.

-- Example RLS Policy for Super Admins (Generic approach)
-- You would need to apply this to every table you want to protect.
-- For now, we will rely on the middleware/layout check for UI access, 
-- and ensure the update queries work for the authenticated user if they are super admin.

-- However, standard RLS usually blocks updates if not owner. 
-- We should add a policy for Super Admins to update ANY store.

CREATE POLICY "Super Admins can update any store" 
ON stores 
FOR UPDATE 
USING (
  (SELECT is_super_admin FROM profiles WHERE id = auth.uid()) = TRUE
);

CREATE POLICY "Super Admins can delete any store" 
ON stores 
FOR DELETE 
USING (
  (SELECT is_super_admin FROM profiles WHERE id = auth.uid()) = TRUE
);
