-- Add sample keys for testing the Keys page
INSERT INTO keys (
  name, 
  type, 
  status, 
  total_quantity, 
  available_quantity, 
  is_passkey, 
  key_scope, 
  properties, 
  location_data,
  captain_office_copy,
  captain_office_notes
) VALUES 
-- Master keys
('Master Key - Building A', 'master', 'active', 2, 1, true, 'building', 
 '{"building": "100 Centre Street", "floors": "all", "access_level": "full"}',
 '{"building": "100 Centre Street", "location": "Security Office"}',
 1, 'Primary master key for building access'),

('Master Key - Building B', 'master', 'active', 2, 2, true, 'building',
 '{"building": "111 Centre Street", "floors": "all", "access_level": "full"}',
 '{"building": "111 Centre Street", "location": "Security Office"}',
 1, 'Primary master key for building access'),

-- Floor keys
('Floor 1 Key', 'floor', 'active', 5, 3, false, 'floor',
 '{"building": "100 Centre Street", "floor": 1, "access_level": "floor"}',
 '{"building": "100 Centre Street", "floor": 1, "location": "Reception"}',
 2, 'Access to all rooms on floor 1'),

('Floor 2 Key', 'floor', 'active', 5, 4, false, 'floor',
 '{"building": "100 Centre Street", "floor": 2, "access_level": "floor"}',
 '{"building": "100 Centre Street", "floor": 2, "location": "Security Desk"}',
 1, 'Access to all rooms on floor 2'),

-- Room keys
('Courtroom 1A Key', 'room', 'active', 3, 2, false, 'room',
 '{"building": "100 Centre Street", "room": "1A", "type": "courtroom"}',
 '{"building": "100 Centre Street", "room": "1A", "location": "Court Clerk"}',
 1, 'Main courtroom access'),

('Courtroom 2B Key', 'room', 'active', 3, 3, false, 'room',
 '{"building": "100 Centre Street", "room": "2B", "type": "courtroom"}',
 '{"building": "100 Centre Street", "room": "2B", "location": "Court Clerk"}',
 1, 'Secondary courtroom access'),

('Judge Chambers 101', 'room', 'active', 2, 1, false, 'room',
 '{"building": "100 Centre Street", "room": "101", "type": "chambers"}',
 '{"building": "100 Centre Street", "room": "101", "location": "Judicial Assistant"}',
 1, 'Private judge chambers'),

-- Office keys
('Clerk Office Key', 'office', 'active', 4, 2, false, 'office',
 '{"building": "100 Centre Street", "office": "Clerk", "department": "Court Administration"}',
 '{"building": "100 Centre Street", "office": "Clerk", "location": "Main Office"}',
 2, 'Court clerk office access'),

('Security Office Key', 'office', 'active', 3, 1, false, 'office',
 '{"building": "100 Centre Street", "office": "Security", "department": "Security"}',
 '{"building": "100 Centre Street", "office": "Security", "location": "Ground Floor"}',
 2, 'Security department office'),

-- Maintenance keys
('Maintenance Master', 'maintenance', 'active', 2, 1, true, 'building',
 '{"building": "all", "access_type": "maintenance", "areas": ["mechanical", "electrical", "janitorial"]}',
 '{"location": "Maintenance Office", "building": "100 Centre Street"}',
 1, 'Full building maintenance access'),

-- Storage keys
('Supply Room Key', 'storage', 'active', 3, 2, false, 'room',
 '{"building": "100 Centre Street", "room": "Supply Room", "type": "storage"}',
 '{"building": "100 Centre Street", "room": "Supply Room", "location": "Basement"}',
 1, 'Main supply storage access'),

('Evidence Room Key', 'storage', 'restricted', 2, 1, false, 'room',
 '{"building": "100 Centre Street", "room": "Evidence Room", "type": "evidence", "security_level": "high"}',
 '{"building": "100 Centre Street", "room": "Evidence Room", "location": "Basement Secure Area"}',
 1, 'High security evidence storage')

ON CONFLICT (name) DO NOTHING;
