import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ConnectionRequest {
  id: string;
  student_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  student_full_name: string;
  student_profile_image: string;
}

interface MentorNotificationsProps {
  mentorId: string;
}

// In MentorNotifications.tsx
export function useNotificationCount(mentorId: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { data, error } = await supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .eq('mentor_id', mentorId)
        .eq('status', 'pending');
      
      if (!error && data) {
        setCount(data.length);
      }
    };

    fetchCount();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('connections_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'connections' },
        fetchCount
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [mentorId]);

  return count;
}

export default function MentorNotifications({ mentorId }: MentorNotificationsProps) {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pending connection requests for the given mentor
  const fetchRequests = async () => {
    try {
      // This query assumes that your connections table has a foreign key (student_id) linked to profiles.id.
      // The alias "profiles!connections_student_id" allows joining the profiles table to get student details.
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          student_id,
          status,
          created_at,
          profiles!connections_student_id (
            full_name,
            profile_image
          )
        `)
        .eq('mentor_id', mentorId)
        .eq('status', 'pending');
      if (error) throw error;
      const formatted = (data || []).map((item: any) => ({
        id: item.id,
        student_id: item.student_id,
        status: item.status,
        created_at: item.created_at,
        student_full_name: item.profiles?.full_name,
        student_profile_image: item.profiles?.profile_image,
      }));
      setRequests(formatted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [mentorId]);

  // Function to accept a connection request
  const handleAccept = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', requestId);
      if (error) throw error;
      fetchRequests(); // Refresh the requests
    } catch (err) {
      alert('Failed to accept request');
    }
  };

  // Function to reject a connection request
  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'rejected' })
        .eq('id', requestId);
      if (error) throw error;
      fetchRequests(); // Refresh the requests
    } catch (err) {
      alert('Failed to reject request');
    }
  };

  if (loading) return <div>Loading notifications...</div>;
  if (error) return <div>Error: {error}</div>;
  if (requests.length === 0) return <div>No new connection requests</div>;

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div key={req.id} className="p-4 border rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={req.student_profile_image || '/default-avatar.png'}
              alt={req.student_full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-medium">{req.student_full_name}</p>
              <p className="text-sm text-gray-500">Sent a connection request</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleAccept(req.id)}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              Accept
            </button>
            <button
              onClick={() => handleReject(req.id)}
              className="px-3 py-1 bg-red-600 text-white rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
