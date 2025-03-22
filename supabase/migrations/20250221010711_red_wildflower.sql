/*
  # Create profiles table and storage

  1. New Tables
    - `profiles`
      - Common fields for both mentors and students
      - Specific fields for each user type
      - References to uploaded files
  
  2. Storage
    - Create buckets for profile images and credentials
    
  3. Security
    - Enable RLS
    - Add policies for profile access and updates
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL,
  email text NOT NULL,
  contact_number text NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('mentor', 'student')),
  profile_image text,
  state text NOT NULL,
  nationality text NOT NULL,
  linkedin_profile text,
  
  -- Mentor specific fields
  qualifications text,
  credentials text[],
  years_of_experience integer,
  occupation text,
  company_name text,
  expertise text,
  
  -- Student specific fields
  education_level text CHECK (education_level IN ('school', 'college', 'university', 'other')),
  institution_name text,
  grade_year text,
  areas_of_interest text,
  career_goals text,
  mentorship_areas text,
  github_profile text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create storage buckets
INSERT INTO storage.buckets (id, name)
VALUES 
  ('profile-images', 'Profile Images'),
  ('credentials', 'Professional Credentials')
ON CONFLICT DO NOTHING;

-- Policies for profiles table
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policies for storage
CREATE POLICY "Users can upload their own profile image"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload their own credentials"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'credentials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own uploads"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


