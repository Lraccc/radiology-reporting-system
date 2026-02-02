/*
  # Add Doctor Connections for Rad Techs
  
  1. Changes
    - Create 'rad_tech_doctor_connections' table to store connections between rad techs and doctors
    - Only rad techs can add doctors to their connection list
    - This will be used to filter doctor dropdown in Create New Case modal
    
  2. Security
    - Enable RLS on the table
    - Rad techs can manage their own connections
    - Users can read connections where they are involved
*/

-- Create rad_tech_doctor_connections table
CREATE TABLE IF NOT EXISTS rad_tech_doctor_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rad_tech_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(rad_tech_id, doctor_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_connections_rad_tech ON rad_tech_doctor_connections(rad_tech_id);
CREATE INDEX IF NOT EXISTS idx_connections_doctor ON rad_tech_doctor_connections(doctor_id);

ALTER TABLE rad_tech_doctor_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Rad techs can insert their own connections
CREATE POLICY "Rad techs can add connections"
ON rad_tech_doctor_connections FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = rad_tech_id AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'rad_tech'
  )
);

-- Policy: Rad techs can view their own connections
CREATE POLICY "Rad techs can view own connections"
ON rad_tech_doctor_connections FOR SELECT
TO authenticated
USING (
  auth.uid() = rad_tech_id OR auth.uid() = doctor_id
);

-- Policy: Rad techs can delete their own connections
CREATE POLICY "Rad techs can delete own connections"
ON rad_tech_doctor_connections FOR DELETE
TO authenticated
USING (
  auth.uid() = rad_tech_id AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'rad_tech'
  )
);
