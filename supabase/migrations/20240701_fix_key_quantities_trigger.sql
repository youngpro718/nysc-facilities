
-- This migration fixes the update_key_quantities trigger function to ensure it properly updates key quantities

CREATE OR REPLACE FUNCTION public.update_key_quantities()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.transaction_type = 'add' THEN
        UPDATE keys 
        SET 
            total_quantity = total_quantity + NEW.quantity,
            available_quantity = available_quantity + NEW.quantity
        WHERE id = NEW.key_id;
    ELSIF NEW.transaction_type = 'remove' THEN
        -- For remove, the quantity is negative at this point
        UPDATE keys 
        SET 
            total_quantity = total_quantity + NEW.quantity,
            available_quantity = available_quantity + NEW.quantity
        WHERE id = NEW.key_id;
    ELSIF NEW.transaction_type = 'adjustment' THEN
        UPDATE keys 
        SET 
            total_quantity = total_quantity + NEW.quantity,
            available_quantity = available_quantity + NEW.quantity
        WHERE id = NEW.key_id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS update_key_quantities_trigger ON key_stock_transactions;

CREATE TRIGGER update_key_quantities_trigger
AFTER INSERT ON key_stock_transactions
FOR EACH ROW
EXECUTE FUNCTION update_key_quantities();
