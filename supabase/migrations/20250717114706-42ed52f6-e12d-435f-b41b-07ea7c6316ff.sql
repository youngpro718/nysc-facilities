-- Add sample lighting fixtures for demonstration
INSERT INTO lighting_fixtures (room_id, name, room_number, status, position, ballast_issue, reported_out_date) VALUES
-- PART 1 courtroom fixtures
('f990eb36-7bcb-4a77-8295-ab2640410d00', 'Main Ceiling 1', '1600', 'functional', 'center', false, NULL),
('f990eb36-7bcb-4a77-8295-ab2640410d00', 'Main Ceiling 2', '1600', 'out', 'center', true, '2025-01-15'),
('f990eb36-7bcb-4a77-8295-ab2640410d00', 'Judge Bench Light', '1600', 'functional', 'judge_bench', false, NULL),
('f990eb36-7bcb-4a77-8295-ab2640410d00', 'Jury Box Light', '1600', 'flickering', 'jury_box', false, '2025-01-20'),
('f990eb36-7bcb-4a77-8295-ab2640410d00', 'Gallery Light 1', '1600', 'functional', 'gallery', false, NULL),
('f990eb36-7bcb-4a77-8295-ab2640410d00', 'Gallery Light 2', '1600', 'functional', 'gallery', false, NULL),

-- PART 32 courtroom fixtures  
('bb6c3805-95d3-45f9-b1b7-3e5963675b8d', 'Main Ceiling 1', '1300', 'functional', 'center', false, NULL),
('bb6c3805-95d3-45f9-b1b7-3e5963675b8d', 'Main Ceiling 2', '1300', 'functional', 'center', false, NULL),
('bb6c3805-95d3-45f9-b1b7-3e5963675b8d', 'Judge Bench Light', '1300', 'out', 'judge_bench', true, '2025-01-10'),
('bb6c3805-95d3-45f9-b1b7-3e5963675b8d', 'Jury Box Light', '1300', 'functional', 'jury_box', false, NULL),
('bb6c3805-95d3-45f9-b1b7-3e5963675b8d', 'Gallery Light 1', '1300', 'maintenance', 'gallery', false, NULL),
('bb6c3805-95d3-45f9-b1b7-3e5963675b8d', 'Gallery Light 2', '1300', 'functional', 'gallery', false, NULL)

ON CONFLICT (id) DO NOTHING;