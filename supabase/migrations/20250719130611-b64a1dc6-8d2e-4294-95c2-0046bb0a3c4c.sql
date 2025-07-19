-- Update existing items to assign proper category IDs based on item names
UPDATE inventory_items 
SET category_id = '00ce4229-1b61-421e-b182-5e660ab56c3f' -- Office Supplies
WHERE category_id IS NULL 
AND (
  name ILIKE '%paper%' OR 
  name ILIKE '%pen%' OR 
  name ILIKE '%pencil%' OR 
  name ILIKE '%clip%' OR 
  name ILIKE '%staple%' OR 
  name ILIKE '%binder%' OR 
  name ILIKE '%label%' OR 
  name ILIKE '%divider%' OR 
  name ILIKE '%tab%' OR 
  name ILIKE '%guide%' OR 
  name ILIKE '%folder%' OR 
  name ILIKE '%envelope%' OR 
  name ILIKE '%rubber band%' OR 
  name ILIKE '%punch%' OR
  name ILIKE '%supplies%'
);

-- Update electronics items
UPDATE inventory_items 
SET category_id = '3de5dc94-ee5f-4453-acb0-52f18f7853c7' -- Electronics
WHERE category_id IS NULL 
AND (
  name ILIKE '%batter%' OR 
  name ILIKE '%electronic%' OR 
  name ILIKE '%cable%' OR 
  name ILIKE '%adapter%' OR 
  name ILIKE '%charger%'
);

-- Update furniture items  
UPDATE inventory_items 
SET category_id = '10e9d1ce-af52-4820-9eb0-401f6b324a3f' -- Furniture
WHERE category_id IS NULL 
AND (
  name ILIKE '%chair%' OR 
  name ILIKE '%desk%' OR 
  name ILIKE '%table%' OR 
  name ILIKE '%furniture%'
);

-- Update safety equipment items
UPDATE inventory_items 
SET category_id = 'b6128437-1b49-477e-b677-f156c45e84e3' -- Safety Equipment  
WHERE category_id IS NULL 
AND (
  name ILIKE '%safety%' OR 
  name ILIKE '%security%' OR 
  name ILIKE '%emergency%' OR 
  name ILIKE '%fire%' OR 
  name ILIKE '%first aid%'
);