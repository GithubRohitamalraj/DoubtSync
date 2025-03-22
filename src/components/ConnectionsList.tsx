import { useState, useEffect } from 'react';
import { MessageCircle, UserCheck, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Connection {
  id: string;
  partner_full_name: string;
  partner_profile_image: string;
  partner_expertise: string;
  partner_rating: number;
  partner_doubts_solved: number;
  partner_online: boolean;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface ConnectionsListProps {
  currentUserId: string;
  isStudent: boolean;
  onSelectConnection: (connectionId: string) => void;
}

export default function ConnectionsList({ currentUserId, isStudent, onSelectConnection }: ConnectionsListProps) {
  const [connected, setConnected] = useState<Connection[]>([]);
  const [pending, setPending] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConnections = async () => {
      setLoading(true);
      try {
        console.log('Fetching connections...');

        const partnerJoin = isStudent
          ? 'profiles!connections_mentor_id_fk(id, full_name, profile_image, expertise, rating, doubts_solved, online)'
          : 'profiles!connections_student_id_fk(id, full_name, profile_image, expertise, rating, doubts_solved, online)';

        const filterColumn = isStudent ? 'student_id' : 'mentor_id';

        const { data, error } = await supabase
          .from('connections')
          .select(`id, status, created_at, ${partnerJoin}`)
          .eq(filterColumn, currentUserId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        console.log(`Fetched ${data.length} connections`);

        const formattedConnections = data.map((connection: any) => {
          const partnerProfile = connection.profiles || {};
          return {
            id: connection.id,
            partner_full_name: partnerProfile.full_name || 'Unknown',
            partner_profile_image: partnerProfile.profile_image || '/default-avatar.png',
            partner_expertise: partnerProfile.expertise || 'N/A',
            partner_rating: partnerProfile.rating ?? 0, // Ensuring rating is never null
            partner_doubts_solved: partnerProfile.doubts_solved ?? 0, // Ensuring doubts_solved is never null
            partner_online: partnerProfile.online ?? false, // Ensuring online status is never null
            status: connection.status,
            created_at: connection.created_at,
          };
        });

        setConnected(formattedConnections.filter(conn => conn.status === 'accepted'));
        setPending(formattedConnections.filter(conn => conn.status === 'pending'));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load connections');
        console.error('Error fetching connections:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [currentUserId, isStudent])

  const handleAccept = async (connectionId: string) => {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId);

    if (!error) {
      setPending(pending.filter(conn => conn.id !== connectionId));
      setConnected([...connected, pending.find(conn => conn.id === connectionId)!]);
    }
  };

  const handleReject = async (connectionId: string) => {
    const { error } = await supabase
      .from('connections')
      .update({ status: 'rejected' })
      .eq('id', connectionId);

    if (!error) {
      setPending(pending.filter(conn => conn.id !== connectionId));
    }
  };

  if (loading) return <div className="text-center py-8">Loading connections...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-semibold">{isStudent ? 'Your Mentors' : 'Your Students'}</h2>
      </div>

      {/* Connected People */}
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-4">Connected {isStudent ? 'Mentors' : 'Students'}</h3>
        {connected.length === 0 ? (
          <p className="text-gray-500">No connected {isStudent ? 'mentors' : 'students'} yet.</p>
        ) : (
          connected.map((connection) => (
            <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg mb-2">
              <div className="flex items-center space-x-4">
                <img src={connection.partner_profile_image} alt={connection.partner_full_name} className="w-12 h-12 rounded-full object-cover" />
                <div key={connection.id} onClick={() => navigate(`/mentor/${connection.id}`)}>
                  <h3 className="font-medium">{connection.partner_full_name}</h3>
                  <p className="text-sm text-gray-500">{connection.partner_expertise}</p>
                  <p className="text-xs text-gray-400">Connected on {new Date(connection.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button
                onClick={() => onSelectConnection(connection.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Pending Requests */}
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-4">{isStudent ? 'Pending Requests' : 'Requests to Approve'}</h3>
        {pending.length === 0 ? (
          <p className="text-gray-500">No pending requests.</p>
        ) : (
          pending.map((connection) => (
            <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg mb-2">
              <div className="flex items-center space-x-4">
                <img src={connection.partner_profile_image} alt={connection.partner_full_name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h3 className="font-medium">{connection.partner_full_name}</h3>
                  <p className="text-sm text-gray-500">{connection.partner_expertise}</p>
                  <p className="text-xs text-gray-400">Requested on {new Date(connection.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {isStudent ? (
                <p className="text-gray-600">Waiting for approval</p>
              ) : (
                <div className="flex space-x-2">
                  <button onClick={() => handleAccept(connection.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <UserCheck className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleReject(connection.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <UserX className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
