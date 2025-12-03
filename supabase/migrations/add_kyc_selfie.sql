-- Add selfie_holding_id_url to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS selfie_holding_id_url TEXT;
