-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  doctor_name TEXT,
  prescription_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medication_reminders table
CREATE TABLE IF NOT EXISTS medication_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration_days INTEGER,
  start_date DATE NOT NULL,
  times TEXT[], -- Array of time strings like ["08:00", "20:00"]
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create storage bucket for prescriptions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('prescriptions', 'prescriptions', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for prescriptions
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prescriptions"
  ON prescriptions FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Users can insert their own prescriptions"
  ON prescriptions FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update their own prescriptions"
  ON prescriptions FOR UPDATE
  USING (auth.uid() = patient_id);

CREATE POLICY "Users can delete their own prescriptions"
  ON prescriptions FOR DELETE
  USING (auth.uid() = patient_id);

-- RLS Policies for medication_reminders
ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
  ON medication_reminders FOR SELECT
  USING (auth.uid() = patient_id);

CREATE POLICY "Users can insert their own reminders"
  ON medication_reminders FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Users can update their own reminders"
  ON medication_reminders FOR UPDATE
  USING (auth.uid() = patient_id);

CREATE POLICY "Users can delete their own reminders"
  ON medication_reminders FOR DELETE
  USING (auth.uid() = patient_id);

-- Storage policies for prescriptions bucket
CREATE POLICY "Users can upload their own prescriptions"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'prescriptions' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own prescriptions"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'prescriptions' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own prescriptions"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'prescriptions' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(prescription_date);
CREATE INDEX IF NOT EXISTS idx_reminders_patient_id ON medication_reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_reminders_active ON medication_reminders(patient_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_reminders_start_date ON medication_reminders(start_date);
