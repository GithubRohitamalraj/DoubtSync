import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';


interface MentorListProps {
  isStudent: boolean;
}

interface Mentor {
  id: string;
  full_name: string;
  profile_image: string;
  expertise: string;
  rating: number | null;
  doubts_solved: number | null;
  online: boolean | null;
}

export default function MentorLeaderboard({ }: Readonly<MentorListProps>) {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchMentors = async () => {
      try {
        console.log('Fetching mentors from database...');
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, profile_image, expertise, rating, doubts_solved, online')
          .eq('user_type', 'mentor');

        if (error) throw error;
        
        // Transform the data to ensure it has default values
        const processedMentors = (data || []).map(mentor => ({
          ...mentor,
          rating: mentor.rating || 0,
          doubts_solved: mentor.doubts_solved || 0,
          online: mentor.online || false
        }));
        
        console.log(`Fetched ${processedMentors.length} mentors from database`);
        setMentors(processedMentors);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load mentors');
        console.error('Error fetching mentors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);
  const topMentors = [...mentors]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 3);

  if (loading) return <div className="text-center py-8">Loading mentors...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  if (mentors.length === 0) return <div className="text-center py-8">No mentors found. Please check the database connection.</div>;

  return (
    <div className="space-y-8">
      
      {/* Top Mentors Section */}
      <div className="pt-6">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
          <span className="text-yellow-500">🏆</span> Top Mentors
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {topMentors.map((mentor) => (
            <div key={mentor.id} className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer" onClick={() => navigate(`/mentor/${mentor.id}`)} >
              <div className="p-5 text-center">
                <img
                  src={mentor.profile_image || '/default-avatar.png'}
                  alt={mentor.full_name}
                  className="w-20 h-20 rounded-full mx-auto object-cover mb-3"
                />
                <h3 className="text-lg font-medium">{mentor.full_name}</h3>
                <p className="text-sm text-gray-500 mb-2">{mentor.expertise}</p>
                <div className="flex items-center justify-center text-yellow-400 mb-1">
                  <span className="text-lg">⭐</span>
                  <span className="ml-1 font-medium text-gray-800">{(mentor.rating ?? 0).toFixed(1)}</span>
                </div>
                <p className="text-gray-600 text-sm">{mentor.doubts_solved} Doubts Solved</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}