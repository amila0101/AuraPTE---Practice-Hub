INSERT INTO storage.buckets (id, name, public) VALUES ('question-images', 'question-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view question images" ON storage.objects FOR SELECT USING (bucket_id = 'question-images');
CREATE POLICY "Service role can upload question images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'question-images');