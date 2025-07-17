-- Add sample lighting fixtures for demonstration with correct enum values
INSERT INTO lighting_fixtures (room_id, name, room_number, status, position, ballast_issue, reported_out_date) VALUES
-- PART 1 courtroom fixtures (room 1600)
('f990eb36-7bcb-4a77-8295-ab2640410d00', 'Main Ceiling 1', '1600', 'functional', 'ceiling', false, NULL),
('f990eb36-7bcb-4a77-8295-ab2640410d00', 'Main Ceiling 2', '1600', 'out', 'ceiling', true, '2025-01-15'),
('f990eb36-7bcb-4a77-8295-ab2640410d00', 'Judge Bench Light', '1600', 'functional', 'desk', false, NULL),
('f990eb36-7bcb-4a77-8295-ab2640410d00', 'Jury Box Light', '1600', 'flickering', 'recessed', false, '2025-01-20'),
('f990eb36-7bcb-4a77-8295-ab2640410d00', 'Gallery Light 1', '1600', 'functional', 'wall', false, NULL),
('f990eb36-7bcb-4a77-8295-ab2640410d00', 'Gallery Light 2', '1600', 'functional', 'wall', false, NULL),

-- PART 32 courtroom fixtures (room 1300)
('bb6c3805-95d3-45f9-b1b7-3e5963675b8d', 'Main Ceiling 1', '1300', 'functional', 'ceiling', false, NULL),
('bb6c3805-95d3-45f9-b1b7-3e5963675b8d', 'Main Ceiling 2', '1300', 'functional', 'ceiling', false, NULL),
('bb6c3805-95d3-45f9-b1b7-3e5963675b8d', 'Judge Bench Light', '1300', 'out', 'desk', true, '2025-01-10'),
('bb6c3805-95d3-45f9-b1b7-3e5963675b8d', 'Jury Box Light', '1300', 'functional', 'recessed', false, NULL),
('bb6c3805-95d3-45f9-b1b7-3e5963675b8d', 'Gallery Light 1', '1300', 'maintenance', 'wall', false, NULL),
('bb6c3805-95d3-45f9-b1b7-3e5963675b8d', 'Gallery Light 2', '1300', 'functional', 'wall', false, NULL)

ON CONFLICT (id) DO NOTHING;