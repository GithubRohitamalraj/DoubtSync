import { supabase } from './supabase';
import type { Connection, Message, User } from './types';

export async function getConnections(): Promise<Connection[]> {
  const { data, error } = await supabase
    .rpc('get_user_connections', {
      user_id: (await supabase.auth.getUser()).data.user?.id
    });

  if (error) throw error;
  return data;
}

export async function getMessages(connectionId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('connection_id', connectionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function sendMessage(connectionId: string, content: string): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      connection_id: connectionId,
      sender_id: (await supabase.auth.getUser()).data.user?.id,
      content
    })
    .single();

  if (error) throw error;
  return data;
}

export async function markMessageRead(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId);

  if (error) throw error;
}

export async function searchMentors(query: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_type', 'mentor')
    .ilike('full_name', `%${query}%`);

  if (error) throw error;
  return data;
}

export async function connectWithMentor(mentorId: string): Promise<void> {
  const { error } = await supabase
    .from('connections')
    .insert({
      student_id: (await supabase.auth.getUser()).data.user?.id,
      mentor_id: mentorId
    });

  if (error) throw error;
}

export async function updateConnectionStatus(
  connectionId: string,
  status: 'accepted' | 'rejected'
): Promise<void> {
  const { error } = await supabase
    .from('connections')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', connectionId);

  if (error) throw error;
}