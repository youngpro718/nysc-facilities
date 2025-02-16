-- Insert default inventory categories
INSERT INTO inventory_categories (id, name, color)
VALUES
  ('1', 'Office Supplies', '#4CAF50'),
  ('2', 'Furniture', '#2196F3'),
  ('3', 'Electronics', '#F44336'),
  ('4', 'Cleaning Supplies', '#9C27B0'),
  ('5', 'Safety Equipment', '#FF9800'),
  ('6', 'Tools', '#795548'),
  ('7', 'Maintenance', '#607D8B'),
  ('8', 'Miscellaneous', '#9E9E9E')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    color = EXCLUDED.color;
