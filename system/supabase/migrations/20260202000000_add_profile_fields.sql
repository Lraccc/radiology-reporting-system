/*
  # Add Profile Fields for User Profile Page
  
  1. Changes
    - Add `mobile_number` field to profiles table
    - Add `profile_picture_url` field to profiles table
    
  2. Notes
    - mobile_number is optional (can be null)
    - profile_picture_url stores the path to the profile picture in Supabase Storage
*/

-- Add mobile_number and profile_picture_url to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mobile_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_mobile_number ON profiles(mobile_number);
