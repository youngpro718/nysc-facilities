
CREATE OR REPLACE FUNCTION assign_key_if_available(key_id UUID, occupant_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key_record RECORD;
  assignment_record RECORD;
BEGIN
  -- Start transaction
  BEGIN
    -- Lock the key record for update
    SELECT * INTO key_record
    FROM keys
    WHERE id = key_id
    FOR UPDATE;
    
    -- Verify key is available
    IF key_record.available_quantity <= 0 OR key_record.status != 'available' THEN
      RAISE EXCEPTION 'Key is not available for assignment';
    END IF;
    
    -- Update key quantities
    UPDATE keys
    SET 
      available_quantity = available_quantity - 1,
      status = CASE 
        WHEN available_quantity - 1 = 0 THEN 'assigned'
        ELSE status 
      END
    WHERE id = key_id
    RETURNING * INTO key_record;
    
    -- Create assignment
    INSERT INTO key_assignments (
      key_id,
      occupant_id,
      assigned_at
    )
    VALUES (
      key_id,
      occupant_id,
      CURRENT_TIMESTAMP
    )
    RETURNING * INTO assignment_record;
    
    -- Return combined result
    RETURN json_build_object(
      'key', key_record,
      'assignment', assignment_record
    );
  END;
END;
$$;
