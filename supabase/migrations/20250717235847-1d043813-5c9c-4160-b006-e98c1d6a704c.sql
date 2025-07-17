-- First check if the foreign key exists
DO $$
BEGIN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'supply_requests_requester_id_fkey' 
        AND table_name = 'supply_requests'
    ) THEN
        ALTER TABLE public.supply_requests 
        ADD CONSTRAINT supply_requests_requester_id_fkey 
        FOREIGN KEY (requester_id) 
        REFERENCES public.profiles(id) 
        ON DELETE CASCADE;
    END IF;
END $$;