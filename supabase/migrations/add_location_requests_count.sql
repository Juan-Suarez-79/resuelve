-- Add location_requests_count column to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS location_requests_count INTEGER DEFAULT 0;

-- Create RPC function to safely increment the counter
CREATE OR REPLACE FUNCTION increment_location_requests(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE stores
  SET location_requests_count = location_requests_count + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
