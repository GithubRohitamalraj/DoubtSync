/*
  # Add mentor-student connection system

  1. New Tables
    - `connections`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references auth.users)
      - `mentor_id` (uuid, references auth.users)
      - `status` (text: pending, accepted, rejected)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `messages`
      - `id` (uuid, primary key)
      - `connection_id` (uuid, references connections)
      - `sender_id` (uuid, references auth.users)
      - `content` (text)
      - `created_at` (timestamp)
      - `read_at` (timestamp, nullable)

  2. Security
    - Enable RLS on both tables
    - Add policies for students and mentors
*/

-- Create connections table
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES auth.users(id) NOT NULL,
  mentor_id uuid REFERENCES auth.users(id) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, mentor_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES connections(id) NOT NULL,
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Enable RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Connections policies
CREATE POLICY "Students can create connection requests"
  ON connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = mentor_id
      AND raw_user_meta_data->>'user_type' = 'mentor'
    )
  );

CREATE POLICY "Users can view their own connections"
  ON connections
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (student_id, mentor_id)
  );

CREATE POLICY "Mentors can update connection status"
  ON connections
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = mentor_id
  )
  WITH CHECK (
    auth.uid() = mentor_id AND
    status IN ('accepted', 'rejected')
  );

-- Messages policies
CREATE POLICY "Users can send messages to their connections"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM connections
      WHERE id = connection_id
      AND status = 'accepted'
      AND auth.uid() IN (student_id, mentor_id)
    )
  );

CREATE POLICY "Users can view messages from their connections"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM connections
      WHERE id = connection_id
      AND auth.uid() IN (student_id, mentor_id)
    )
  );

CREATE POLICY "Users can update read status of received messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM connections
      WHERE id = connection_id
      AND auth.uid() IN (student_id, mentor_id)
      AND auth.uid() != sender_id
    )
  )
  WITH CHECK (
    read_at IS NOT NULL
  );

-- Function to get user type
CREATE OR REPLACE FUNCTION get_user_type(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    raw_user_meta_data->>'user_type',
    'student'
  )::text
  FROM auth.users
  WHERE id = user_id;
$$;

-- Function to get user's connections
CREATE OR REPLACE FUNCTION get_user_connections(user_id uuid)
RETURNS TABLE (
  connection_id uuid,
  other_user_id uuid,
  other_user_name text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  unread_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH user_connections AS (
    SELECT 
      c.id,
      CASE 
        WHEN c.student_id = user_id THEN c.mentor_id
        ELSE c.student_id
      END as other_id,
      c.status,
      c.created_at,
      c.updated_at
    FROM connections c
    WHERE user_id IN (c.student_id, c.mentor_id)
  ),
  unread_messages AS (
    SELECT 
      m.connection_id,
      COUNT(*) as unread
    FROM messages m
    WHERE m.read_at IS NULL
    AND m.sender_id != user_id
    GROUP BY m.connection_id
  )
  SELECT 
    uc.id as connection_id,
    uc.other_id as other_user_id,
    (u.raw_user_meta_data->>'full_name')::text as other_user_name,
    uc.status,
    uc.created_at,
    uc.updated_at,
    COALESCE(um.unread, 0) as unread_count
  FROM user_connections uc
  LEFT JOIN auth.users u ON u.id = uc.other_id
  LEFT JOIN unread_messages um ON um.connection_id = uc.id;
$$;