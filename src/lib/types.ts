// Database types
export interface User {
  user_metadata: any;
  id: string;
  email: string;
  full_name: string;
  user_type: 'student' | 'mentor';
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  qualification?: string;
  institution?: string;
  experience?: string;
  expertise?: string[];
  hourly_rate?: number;
  grade?: string;
  subjects?: string[];
  learning_goals?: string;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  connection_id: string;
  other_user_id: string;
  other_user_name: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  unread_count: number;
}

export interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

// API response types
export interface ConnectionResponse {
  data: Connection[];
  error: Error | null;
}

export interface MessageResponse {
  data: Message[];
  error: Error | null;
}

export interface ProfileResponse {
  data: Profile | null;
  error: Error | null;
}