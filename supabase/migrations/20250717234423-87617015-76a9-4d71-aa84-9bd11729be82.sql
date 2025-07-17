-- Add foreign key relationship between supply_requests.requester_id and profiles.id
ALTER TABLE public.supply_requests 
ADD CONSTRAINT supply_requests_requester_id_fkey 
FOREIGN KEY (requester_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;