-- Create storage bucket for term PDFs if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('term-pdfs', 'term-pdfs', true)
ON CONFLICT (id) DO NOTHING;