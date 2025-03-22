import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  contact_number: string;
  user_type: 'mentor' | 'student';
  profile_image: string;
  state: string;
  nationality: string;
  linkedin_profile?: string;
  qualifications?: string;
  credentials?: string[];
  years_of_experience?: number;
  occupation?: string;
  company_name?: string;
  expertise?: string;
  education_level?: string;
  institution_name?: string;
  grade_year?: string;
  areas_of_interest?: string;
  career_goals?: string;
  mentorship_areas?: string;
  github_profile?: string;
}

export default function MentorProfileView() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Fetch the mentor's profile using the id from URL parameters
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!id) throw new Error("No mentor id provided");
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  // Fetch the currently logged in user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        setCurrentUser(data.user);
      }
    };
    fetchCurrentUser();
  }, []);

  // Determine if the fetched profile belongs to a mentor
  const isMentorProfile = profile ? profile.user_type === 'mentor' : false;

  // Function to send a connection request
  const handleConnect = async () => {
    try {
      if (!currentUser) throw new Error("User not authenticated");
      // Insert a connection record with status 'pending'
      const { error } = await supabase
        .from('connections')
        .insert([{ student_id: currentUser.id, mentor_id: profile?.id, status: 'pending' }])
        .select();
      if (error) throw error;
      alert('Connection request sent!');
    } catch (err) {
      console.error('Error connecting with mentor:', err);
      alert('Failed to send connection request. Please try again.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return <div>No profile found</div>;
  if (!isMentorProfile) return <div>Mentor not found</div>;

  return (
    <div className="p-6">
      <div className="flex items-center space-x-6 mb-8">
        {profile.profile_image ? (
          <img
            src={
              supabase.storage
                .from('profile-images')
                .getPublicUrl(profile.profile_image).data.publicUrl
            }
            alt={profile.full_name}
            className="w-24 h-24 rounded-full object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-3xl text-blue-600 font-medium">
              {profile.full_name[0].toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h3 className="text-2xl font-semibold">{profile.full_name}</h3>
          <p className="text-gray-600">{profile.email}</p>
          <p className="text-gray-600 capitalize">{profile.user_type}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Contact Information</h4>
          <div className="space-y-3">
            {profile.linkedin_profile && (
              <div>
                <label className="text-sm text-gray-600">LinkedIn</label>
                <p className="font-medium">
                  <a
                    href={profile.linkedin_profile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Profile
                  </a>
                </p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-600">Location</label>
              <p className="font-medium">{profile.state}, {profile.nationality}</p>
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Professional Information</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Qualifications</label>
              <p className="font-medium">{profile.qualifications}</p>
            </div>
            {profile.years_of_experience && (
              <div>
                <label className="text-sm text-gray-600">Experience</label>
                <p className="font-medium">{profile.years_of_experience} years</p>
              </div>
            )}
            {profile.occupation && (
              <div>
                <label className="text-sm text-gray-600">Current Role</label>
                <p className="font-medium">{profile.occupation}</p>
              </div>
            )}
            {profile.company_name && (
              <div>
                <label className="text-sm text-gray-600">Company</label>
                <p className="font-medium">{profile.company_name}</p>
              </div>
            )}
            {profile.expertise && (
              <div>
                <label className="text-sm text-gray-600">Areas of Expertise</label>
                <p className="font-medium">{profile.expertise}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {profile.credentials && profile.credentials.length > 0 && (
        <div className="mt-8">
          <h4 className="font-medium text-gray-900 mb-4">Credentials</h4>
          <div className="grid grid-cols-2 gap-4">
            {profile.credentials.map((credential, index) => (
              <a
                key={index}
                href={
                  supabase.storage
                    .from('credentials')
                    .getPublicUrl(credential).data.publicUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-blue-600">View Document {index + 1}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Only show the Connect button if the logged-in user is a student */}
      {currentUser && currentUser.user_metadata?.user_type === 'student' && (
        <button 
          onClick={handleConnect}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Connect
        </button>
      )}
    </div>
  );
}
