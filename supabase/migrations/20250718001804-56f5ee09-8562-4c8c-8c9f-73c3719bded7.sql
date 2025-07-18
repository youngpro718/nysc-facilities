-- Add foreign key constraint between supply_requests and profiles
ALTER TABLE supply_requests 
ADD CONSTRAINT fk_supply_requests_requester_id 
FOREIGN KEY (requester_id) REFERENCES profiles(id) ON DELETE CASCADE;