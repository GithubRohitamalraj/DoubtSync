-- Schema for the messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  attachment_url TEXT
);

-- Add indexes for faster querying
CREATE INDEX idx_messages_connection_id ON messages(connection_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Add RLS policies for the messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own messages
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy to allow users to insert messages only if they are the sender
CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Policy to allow users to update only the read status of messages they receive
-- Using a different approach that doesn't require OLD reference in the policy
CREATE POLICY "Users can update read status of messages they receive" ON messages
  FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Create function to prevent updates to fields other than is_read
CREATE OR REPLACE FUNCTION prevent_message_content_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content != OLD.content OR 
     NEW.connection_id != OLD.connection_id OR
     NEW.sender_id != OLD.sender_id OR
     NEW.receiver_id != OLD.receiver_id OR
     NEW.created_at != OLD.created_at THEN
    RAISE EXCEPTION 'Only the is_read field can be updated';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent content updates
CREATE TRIGGER before_message_update
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION prevent_message_content_update();

-- Create function to validate that users can only send messages within their connections
CREATE OR REPLACE FUNCTION validate_message_connection()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user is part of the connection (either student or mentor)
  IF NOT EXISTS (
    SELECT 1 FROM connections
    WHERE id = NEW.connection_id
    AND status = 'accepted'
    AND (student_id = NEW.sender_id OR mentor_id = NEW.sender_id)
  ) THEN
    RAISE EXCEPTION 'User is not part of this connection or connection is not accepted';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to validate connections before message insertion
CREATE TRIGGER before_message_insert
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION validate_message_connection();