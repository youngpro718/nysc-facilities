-- Enhanced Supply Room Management System
-- This migration creates the necessary tables for comprehensive supply room management

-- Create inventory_items table for real inventory tracking
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_threshold INTEGER NOT NULL DEFAULT 0,
    maximum_stock INTEGER NOT NULL DEFAULT 100,
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    supplier VARCHAR(255),
    storage_location VARCHAR(255),
    last_restocked TIMESTAMP WITH TIME ZONE,
    monthly_usage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create supply_request_status_history table for tracking status changes
CREATE TABLE IF NOT EXISTS supply_request_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES supply_requests(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Update supply_requests table to include new fields for enhanced tracking
ALTER TABLE supply_requests 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS pickup_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update supply_request_items to include fulfillment tracking
ALTER TABLE supply_request_items 
ADD COLUMN IF NOT EXISTS quantity_fulfilled INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS item_name VARCHAR(255);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_current_stock ON inventory_items(current_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_items_minimum_threshold ON inventory_items(minimum_threshold);
CREATE INDEX IF NOT EXISTS idx_supply_request_status_history_request_id ON supply_request_status_history(request_id);
CREATE INDEX IF NOT EXISTS idx_supply_request_status_history_changed_at ON supply_request_status_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_supply_requests_assigned_to ON supply_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_supply_requests_status ON supply_requests(status);

-- Insert sample inventory items
INSERT INTO inventory_items (name, description, category, current_stock, minimum_threshold, maximum_stock, unit_cost, supplier, storage_location, monthly_usage) VALUES
('Ballpoint Pens (Blue)', 'Standard blue ballpoint pens', 'Office Supplies', 150, 50, 500, 0.75, 'Office Depot', 'Shelf A1', 45),
('Copy Paper (8.5x11)', 'White copy paper, 500 sheets per ream', 'Office Supplies', 25, 10, 100, 4.99, 'Staples', 'Storage Room B', 30),
('File Folders (Manila)', 'Standard manila file folders', 'Office Supplies', 200, 25, 300, 0.15, 'Office Depot', 'Shelf A2', 20),
('Sticky Notes (3x3)', 'Yellow sticky note pads', 'Office Supplies', 80, 20, 150, 1.25, 'Amazon Business', 'Shelf A1', 15),
('Staples', 'Standard office staples', 'Office Supplies', 50, 15, 100, 2.50, 'Staples', 'Drawer C1', 8),
('Paper Clips', 'Standard paper clips, box of 100', 'Office Supplies', 30, 10, 75, 1.99, 'Office Depot', 'Drawer C1', 5),
('Highlighters (Yellow)', 'Yellow highlighter markers', 'Office Supplies', 40, 15, 100, 1.50, 'Amazon Business', 'Shelf A1', 12),
('Binders (1 inch)', '1-inch 3-ring binders', 'Office Supplies', 25, 10, 50, 3.99, 'Staples', 'Shelf B1', 8),
('Printer Toner (HP LaserJet)', 'Black toner cartridge for HP LaserJet printers', 'Printer Supplies', 5, 2, 15, 89.99, 'HP Direct', 'Supply Cabinet', 3),
('Hand Sanitizer', '8oz hand sanitizer bottles', 'Cleaning Supplies', 20, 10, 50, 2.99, 'Local Supplier', 'Cleaning Closet', 25),
('Tissues (Box)', 'Facial tissue boxes', 'Office Supplies', 15, 5, 30, 1.49, 'Costco', 'Storage Room B', 10),
('Rubber Bands', 'Assorted rubber bands', 'Office Supplies', 20, 5, 40, 2.25, 'Office Depot', 'Drawer C1', 3);

-- Create RLS policies for inventory_items
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Supply room staff and admins can manage inventory
CREATE POLICY "Supply room staff can manage inventory" ON inventory_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.department = 'Supply Department' OR profiles.role = 'admin')
        )
    );

-- All authenticated users can view inventory (for requesting supplies)
CREATE POLICY "All users can view inventory" ON inventory_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create RLS policies for supply_request_status_history
ALTER TABLE supply_request_status_history ENABLE ROW LEVEL SECURITY;

-- Users can view status history for their own requests
CREATE POLICY "Users can view their request status history" ON supply_request_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM supply_requests 
            WHERE supply_requests.id = supply_request_status_history.request_id 
            AND supply_requests.requester_id = auth.uid()
        )
    );

-- Supply room staff can view and manage all status history
CREATE POLICY "Supply room staff can manage status history" ON supply_request_status_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.department = 'Supply Department' OR profiles.role = 'admin')
        )
    );

-- Supply room staff can insert status history
CREATE POLICY "Supply room staff can insert status history" ON supply_request_status_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.department = 'Supply Department' OR profiles.role = 'admin')
        )
    );

-- Create function to automatically update inventory when items are fulfilled
CREATE OR REPLACE FUNCTION update_inventory_on_fulfillment()
RETURNS TRIGGER AS $$
BEGIN
    -- If quantity_fulfilled is being updated, adjust inventory
    IF NEW.quantity_fulfilled IS DISTINCT FROM OLD.quantity_fulfilled THEN
        -- Find the inventory item by name (assuming item_name matches inventory name)
        UPDATE inventory_items 
        SET current_stock = current_stock - (NEW.quantity_fulfilled - COALESCE(OLD.quantity_fulfilled, 0)),
            updated_at = NOW()
        WHERE name = NEW.item_name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory updates
DROP TRIGGER IF EXISTS trigger_update_inventory_on_fulfillment ON supply_request_items;
CREATE TRIGGER trigger_update_inventory_on_fulfillment
    AFTER UPDATE ON supply_request_items
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_fulfillment();

-- Create function to automatically add status history when supply request status changes
CREATE OR REPLACE FUNCTION add_status_history_on_request_update()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed, add to history
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO supply_request_status_history (request_id, status, changed_by, changed_at)
        VALUES (NEW.id, NEW.status, auth.uid(), NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status history
DROP TRIGGER IF EXISTS trigger_add_status_history ON supply_requests;
CREATE TRIGGER trigger_add_status_history
    AFTER UPDATE ON supply_requests
    FOR EACH ROW
    EXECUTE FUNCTION add_status_history_on_request_update();

-- Update the supply_requests status enum to include new statuses
-- Note: This might need to be done carefully in production
DO $$ 
BEGIN
    -- Add new status values if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'submitted' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'request_status')) THEN
        ALTER TYPE request_status ADD VALUE 'submitted';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'received' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'request_status')) THEN
        ALTER TYPE request_status ADD VALUE 'received';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'processing' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'request_status')) THEN
        ALTER TYPE request_status ADD VALUE 'processing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ready' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'request_status')) THEN
        ALTER TYPE request_status ADD VALUE 'ready';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'picked_up' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'request_status')) THEN
        ALTER TYPE request_status ADD VALUE 'picked_up';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'completed' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'request_status')) THEN
        ALTER TYPE request_status ADD VALUE 'completed';
    END IF;
EXCEPTION
    WHEN others THEN
        -- If request_status type doesn't exist, create it
        CREATE TYPE request_status AS ENUM ('submitted', 'received', 'processing', 'ready', 'picked_up', 'completed', 'cancelled');
        
        -- Update supply_requests table to use the enum if it's not already
        ALTER TABLE supply_requests 
        ALTER COLUMN status TYPE request_status USING status::request_status;
END $$;

COMMENT ON TABLE inventory_items IS 'Real-time inventory tracking for supply room items';
COMMENT ON TABLE supply_request_status_history IS 'Tracks all status changes for supply requests with timestamps and notes';
COMMENT ON COLUMN supply_requests.assigned_to IS 'Supply room staff member assigned to fulfill this request';
COMMENT ON COLUMN supply_requests.pickup_location IS 'Where the requester should pick up fulfilled items';
COMMENT ON COLUMN supply_requests.completed_at IS 'Timestamp when the request was fully completed';
COMMENT ON COLUMN supply_request_items.quantity_fulfilled IS 'Actual quantity provided to the requester';
COMMENT ON COLUMN supply_request_items.unit_cost IS 'Cost per unit for budget tracking';
COMMENT ON COLUMN supply_request_items.item_name IS 'Name of the requested item for inventory matching';
