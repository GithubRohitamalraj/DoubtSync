import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';


interface MentorListProps {
  isStudent: boolean;
  currentUserId: string;
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

export default function MentorList({ isStudent }: Readonly<MentorListProps>) {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [searchTerm] = useState('');
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
        setFilteredMentors(processedMentors);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load mentors');
        console.error('Error fetching mentors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  useEffect(() => {
    // Filter mentors based on search term
    if (!searchTerm.trim()) {
      setFilteredMentors(mentors);
      return;
    }

    const lowerCaseSearch = searchTerm.toLowerCase();
    const results = mentors.filter(mentor => 
      mentor.full_name.toLowerCase().includes(lowerCaseSearch) ||
      mentor.expertise.toLowerCase().includes(lowerCaseSearch)
    );
    
    setFilteredMentors(results);
  }, [searchTerm, mentors]);

  // Get top mentors by rating
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
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 justify-center">
          <span className="text-yellow-500">🏆</span> Top Mentors
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {topMentors.map((mentor) => (
            <div key={mentor.id} className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer" onClick={() => navigate(`/mentor/${mentor.id}`)}>
              <div className="p-5 text-center">
              <img
  src={mentor.profile_image || '/default-avatar.png'}
  alt={mentor.full_name}
  className="w-24 h-24 rounded-full object-cover"
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
      
      {/* All Mentors Section */}
      <div className="pt-4">
        <h2 className="text-xl font-semibold mb-4 flex items-center justify-center">All Mentors</h2>
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
          {filteredMentors.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No mentors found matching "{searchTerm}"
            </div>
          ) : (
            filteredMentors.map((mentor) => (
              <div key={mentor.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={mentor.profile_image}
                      alt={mentor.full_name}
                      className="w-24 h-24 rounded-full object-cove"
                    />
                    {mentor.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium">{mentor.full_name}</h3>
                      <span className="ml-2 text-sm text-gray-500">•</span>
                      <span className="ml-2 text-sm text-gray-500">{mentor.expertise}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center text-yellow-400">
                        <span>★</span>
                        <span className="ml-1 text-gray-700">{(mentor.rating ?? 0).toFixed(1)}</span>
                      </div>
                      <span className="text-gray-500 text-sm">{mentor.doubts_solved} Doubts Solved</span>
                    </div>
                  </div>
                </div>
                
                {isStudent ? (
                  <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" onClick={() => navigate(`/mentor/${mentor.id}`)}>
                  View Profile
                </button>
                ) : (
                  <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" onClick={() => navigate(`/mentor/${mentor.id}`)}>
                    View Profile
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}