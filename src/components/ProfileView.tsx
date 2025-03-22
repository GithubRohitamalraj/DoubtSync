import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Settings } from 'lucide-react';

interface Profile {
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

export default function ProfileView() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
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
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return <div>No profile found</div>;

  const isMentor = profile.user_type === 'mentor';

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Profile</h2>
        <button
          onClick={() => navigate('/edit-profile')}
          className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>Edit Profile</span>
        </button>
      </div>

      <div className="p-6">
        <div className="flex items-center space-x-6 mb-8">
          {profile.profile_image ? (
            <img
              src={`${supabase.storage.from('profile-images').getPublicUrl(profile.profile_image).data.publicUrl}`}
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
                    <a href={profile.linkedin_profile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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

          {isMentor ? (
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
          ) : (
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Academic Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Education Level</label>
                  <p className="font-medium capitalize">{profile.education_level}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Institution</label>
                  <p className="font-medium">{profile.institution_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Grade/Year</label>
                  <p className="font-medium">{profile.grade_year}</p>
                </div>
                {profile.areas_of_interest && (
                  <div>
                    <label className="text-sm text-gray-600">Areas of Interest</label>
                    <p className="font-medium">{profile.areas_of_interest}</p>
                  </div>
                )}
                {profile.github_profile && (
                  <div>
                    <label className="text-sm text-gray-600">GitHub</label>
                    <p className="font-medium">
                      <a href={profile.github_profile} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Profile
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {isMentor && profile.credentials && profile.credentials.length > 0 && (
          <div className="mt-8">
            <h4 className="font-medium text-gray-900 mb-4">Credentials</h4>
            <div className="grid grid-cols-2 gap-4">
              {profile.credentials.map((credential, index) => (
                <a
                  key={index}
                  href={`${supabase.storage.from('credentials').getPublicUrl(credential).data.publicUrl}`}
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
      </div>
    </div>
  );
}