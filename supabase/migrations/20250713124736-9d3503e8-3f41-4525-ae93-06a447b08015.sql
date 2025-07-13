-- Give the current user admin access
INSERT INTO user_roles (user_id, role)
VALUES ('4fbaf107-c81b-4442-af1d-cbe965736fe3', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;