-- Seed data for court parts
INSERT INTO court_parts (part_code, description)
VALUES 
  ('1', 'Supreme Court Part 1'),
  ('2', 'Supreme Court Part 2'),
  ('3', 'Supreme Court Part 3'),
  ('4', 'Supreme Court Part 4'),
  ('5', 'Supreme Court Part 5'),
  ('6', 'Supreme Court Part 6'),
  ('7', 'Supreme Court Part 7'),
  ('8', 'Supreme Court Part 8'),
  ('9', 'Supreme Court Part 9'),
  ('10', 'Supreme Court Part 10'),
  ('11', 'Supreme Court Part 11'),
  ('12', 'Supreme Court Part 12'),
  ('13', 'Supreme Court Part 13'),
  ('14', 'Supreme Court Part 14'),
  ('15', 'Supreme Court Part 15'),
  ('16', 'Supreme Court Part 16'),
  ('17', 'Supreme Court Part 17'),
  ('18', 'Supreme Court Part 18'),
  ('19', 'Supreme Court Part 19'),
  ('20', 'Supreme Court Part 20'),
  ('IA', 'Individual Assignment Part'),
  ('TAP', 'Trial Assignment Part'),
  ('RJI', 'Request for Judicial Intervention'),
  ('STP', 'Special Term Part'),
  ('COM', 'Commercial Division')
ON CONFLICT (id) DO NOTHING;
