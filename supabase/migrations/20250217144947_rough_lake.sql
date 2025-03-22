/*
  # Create OTP table and functions

  1. New Tables
    - `otps`
      - `id` (uuid, primary key)
      - `email` (text)
      - `code` (text)
      - `created_at` (timestamp)
      - `expires_at` (timestamp)
      - `verified` (boolean)

  2. Security
    - Enable RLS on `otps` table
    - Add policy for inserting and selecting OTPs
*/

-- Create OTP table
CREATE TABLE IF NOT EXISTS otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create OTPs"
ON otps FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Users can verify their own OTPs"
ON otps FOR SELECT
TO anon
USING (
  verified = false AND 
  expires_at > now()
);

-- Function to generate and store OTP
CREATE OR REPLACE FUNCTION generate_otp(user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  generated_otp text;
BEGIN
  -- Generate a 6-digit OTP
  generated_otp := floor(random() * 900000 + 100000)::text;
  
  -- Delete any existing unverified OTPs for this email
  DELETE FROM otps 
  WHERE email = user_email 
  AND verified = false;
  
  -- Insert new OTP
  INSERT INTO otps (email, code, expires_at)
  VALUES (
    user_email,
    generated_otp,
    now() + interval '15 minutes'
  );
  
  RETURN generated_otp;
END;
$$;