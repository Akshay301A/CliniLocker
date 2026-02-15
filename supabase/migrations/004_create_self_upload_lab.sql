-- Create the "Self Upload" lab for patient self-uploads
-- This lab is used when patients upload their own reports (not from a lab)

-- Insert the "Self Upload" lab if it doesn't exist
INSERT INTO public.labs (name, email)
VALUES ('Self Upload', 'self-upload@cliniLocker.app')
ON CONFLICT DO NOTHING;

-- Verify it was created
SELECT id, name, email, created_at 
FROM public.labs 
WHERE name = 'Self Upload';
