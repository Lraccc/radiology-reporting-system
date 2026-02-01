/*
  # Hospital Radiology Management System Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text: 'rad_tech' or 'doctor')
      - `created_at` (timestamptz)
    
    - `cases`
      - `id` (uuid, primary key)
      - `case_number` (text, unique)
      - `patient_name` (text)
      - `patient_id` (text)
      - `study_type` (text: X-ray, CT, MRI, etc.)
      - `status` (text: 'pending', 'in_progress', 'completed')
      - `uploaded_by` (uuid, references profiles)
      - `assigned_to` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `media_files`
      - `id` (uuid, primary key)
      - `case_id` (uuid, references cases)
      - `file_name` (text)
      - `file_path` (text)
      - `file_type` (text: 'image' or 'video')
      - `file_size` (bigint)
      - `uploaded_at` (timestamptz)
    
    - `reports`
      - `id` (uuid, primary key)
      - `case_id` (uuid, references cases, unique)
      - `content` (text)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Profiles: Users can read all profiles, but only update their own
    - Cases: Rad techs can create/read all, doctors can read assigned cases
    - Media files: Rad techs can upload, both roles can view related cases
    - Reports: Doctors can create/edit reports for their assigned cases
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('rad_tech', 'doctor')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text UNIQUE NOT NULL,
  patient_name text NOT NULL,
  patient_id text NOT NULL,
  study_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  uploaded_by uuid REFERENCES profiles(id) NOT NULL,
  assigned_to uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rad techs can create cases"
  ON cases FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'rad_tech'
    )
  );

CREATE POLICY "Users can read their related cases"
  ON cases FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR assigned_to = auth.uid()
  );

CREATE POLICY "Users can update their related cases"
  ON cases FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid() OR assigned_to = auth.uid())
  WITH CHECK (uploaded_by = auth.uid() OR assigned_to = auth.uid());

-- Create media_files table
CREATE TABLE IF NOT EXISTS media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'video')),
  file_size bigint DEFAULT 0,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert media for cases they can access"
  ON media_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = media_files.case_id
      AND (cases.uploaded_by = auth.uid() OR cases.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Users can read media for their cases"
  ON media_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = media_files.case_id
      AND (cases.uploaded_by = auth.uid() OR cases.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Users can delete media for cases they uploaded"
  ON media_files FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = media_files.case_id
      AND cases.uploaded_by = auth.uid()
    )
  );

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE UNIQUE NOT NULL,
  content text DEFAULT '',
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can create reports for assigned cases"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'doctor'
    )
    AND EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = reports.case_id
      AND cases.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Users can read reports for their cases"
  ON reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = reports.case_id
      AND (cases.uploaded_by = auth.uid() OR cases.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Doctors can update their reports"
  ON reports FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cases_uploaded_by ON cases(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_media_files_case_id ON media_files(case_id);
CREATE INDEX IF NOT EXISTS idx_reports_case_id ON reports(case_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_cases_updated_at ON cases;
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();