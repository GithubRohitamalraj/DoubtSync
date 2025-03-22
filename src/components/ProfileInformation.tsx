import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserRound, 
  Mail, 
  Phone, 
  MapPin, 
  Flag,
  FileCheck,
  LinkedinIcon,
  Upload
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfileFormData {
  // Common fields
  profileImage?: File;
  fullName: string;
  email: string;
  contactNumber: string;
  userType: 'mentor' | 'student';
  state: string;
  nationality: string;
  linkedinProfile?: string;

  // Mentor specific fields
  qualifications?: string;
  credentials?: File[];
  yearsOfExperience?: number;
  occupation?: string;
  companyName?: string;
  expertise?: string;

  // Student specific fields
  educationLevel?: 'school' | 'college' | 'university' | 'other';
  institutionName?: string;
  gradeYear?: string;
  areasOfInterest?: string;
  careerGoals?: string;
  mentorshipAreas?: string;
  githubProfile?: string;
}

const EDUCATION_LEVELS = ['school', 'college', 'university', 'other'];
const SCHOOL_GRADES = Array.from({ length: 12 }, (_, i) => `${i + 1}th Grade`);
const COLLEGE_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'];

export default function ProfileInformation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<'mentor' | 'student' | null>(null);
  const [profileData, setProfileData] = useState<ProfileFormData>({
    fullName: '',
    email: '',
    contactNumber: '',
    userType: 'student',
    state: '',
    nationality: ''
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [credentials, setCredentials] = useState<File[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      const userType = user.user_metadata?.user_type as 'mentor' | 'student';
      setUserType(userType);
      setProfileData(prev => ({ ...prev, userType, email: user.email ?? '' }));
    };
    checkUser();
  }, [navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCredentials(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("Submitting...");
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user || !user.id) throw new Error("No authenticated user found");
  
      console.log("User:", user);
  
      // Upload profile image
      let profileImageUrl = "";
      if (profileImage) {
        const { data: imageData, error: imageError } = await supabase.storage
          .from("profile-buckets")
          .upload(`${user.id}/profile.jpg`, profileImage, {
            cacheControl: "3600",
            upsert: true,
          });
  
        if (imageError) throw imageError;
        profileImageUrl = imageData?.path || "";
        console.log("Profile Image URL:", profileImageUrl);
      }
  
      // Upload credentials for mentors
      let credentialUrls: string[] = [];
      if (userType === "mentor" && credentials.length > 0) {
        for (const file of credentials) {
          const { data: credData, error: credError } = await supabase.storage
            .from("credentials")
            .upload(`${user.id}/${file.name}`, file, {
              cacheControl: "3600",
              upsert: true,
            });
          if (credError) throw credError;
          credentialUrls.push(credData.path);
        }
      }
  
      // Transform profileData keys to match your Supabase table schema
      const payload = {
        id: user.id,
        email: user.email,
        profile_image: profileImageUrl,
        credentials: credentialUrls,
        full_name: profileData.fullName,         // changed from fullName
        contact_number: profileData.contactNumber, // changed from contactNumber
        user_type: profileData.userType,           // changed from userType
        state: profileData.state,
        nationality: profileData.nationality,
        linkedin_profile: profileData.linkedinProfile, // changed from linkedinProfile
        qualifications: profileData.qualifications,
        years_of_experience: profileData.yearsOfExperience, // changed from yearsOfExperience
        occupation: profileData.occupation,
        company_name: profileData.companyName,     // changed from companyName
        expertise: profileData.expertise,
        education_level: profileData.educationLevel, // changed from educationLevel
        institution_name: profileData.institutionName, // changed from institutionName
        grade_year: profileData.gradeYear,         // changed from gradeYear
        areas_of_interest: profileData.areasOfInterest, // changed from areasOfInterest
        career_goals: profileData.careerGoals,       // changed from careerGoals
        mentorship_areas: profileData.mentorshipAreas, // changed from mentorshipAreas
        github_profile: profileData.githubProfile,   // changed from githubProfile
      };
  
      console.log("Submitting Payload:", payload);
  
      // Insert the profile record
      const { data, error: profileError } = await supabase
        .from("profiles")
        .insert([payload]);
  
      if (profileError) throw profileError;
  
      console.log("Profile created successfully:", data);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };    

  const renderMentorForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications</label>
        <input
          type="text"
          placeholder="e.g., PhD in Computer Science, MSc in Mathematics"
          value={profileData.qualifications ?? ''}
          onChange={(e) => setProfileData({ ...profileData, qualifications: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Professional Credentials
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
          <div className="space-y-1 text-center">
            <FileCheck className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                <span>Upload files</span>
                <input
                  type="file"
                  className="sr-only"
                  multiple
                  onChange={handleCredentialsChange}
                  accept=".pdf,.doc,.docx"
                  required
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PDF, DOC up to 10MB</p>
          </div>
        </div>
        {credentials.length > 0 && (
          <ul className="mt-2 space-y-1">
            {credentials.map((file, index) => (
              <li key={index} className="text-sm text-gray-600">
                {file.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
        <input
          type="number"
          min="0"
          placeholder="e.g., 5"
          value={profileData.yearsOfExperience ?? ''}
          onChange={(e) => setProfileData({ ...profileData, yearsOfExperience: parseInt(e.target.value) })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Current Role</label>
        <input
          type="text"
          placeholder="e.g., Senior Software Engineer"
          value={profileData.occupation ?? ''}
          onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Company/Institution</label>
        <input
          type="text"
          placeholder="e.g., Google"
          value={profileData.companyName ?? ''}
          onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Areas of Expertise</label>
        <textarea
          placeholder="List your skills, specializations, and areas of expertise"
          value={profileData.expertise ?? ''}
          onChange={(e) => setProfileData({ ...profileData, expertise: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          rows={4}
          required
        />
      </div>
    </div>
  );

  const renderStudentForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Education Level</label>
        <select
          value={profileData.educationLevel ?? ''}
          onChange={(e) => setProfileData({ 
            ...profileData, 
            educationLevel: e.target.value as 'school' | 'college' | 'university' | 'other'
          })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          required
        >
          <option value="">Select Education Level</option>
          {EDUCATION_LEVELS.map(level => (
            <option key={level} value={level}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Institution Name</label>
        <input
          type="text"
          placeholder="Enter your school/college name"
          value={profileData.institutionName ?? ''}
          onChange={(e) => setProfileData({ ...profileData, institutionName: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Grade/Year</label>
        <select
          value={profileData.gradeYear ?? ''}
          onChange={(e) => setProfileData({ ...profileData, gradeYear: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          required
        >
          <option value="">Select Grade/Year</option>
          {profileData.educationLevel === 'school' 
            ? SCHOOL_GRADES.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))
            : COLLEGE_YEARS.map(year => (
                <option key={year} value={year}>{year}</option>
              ))
          }
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Areas of Interest</label>
        <textarea
          placeholder="List subjects, skills, or topics you're interested in"
          value={profileData.areasOfInterest ?? ''}
          onChange={(e) => setProfileData({ ...profileData, areasOfInterest: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Career/Learning Goals</label>
        <textarea
          placeholder="Describe your career aspirations or learning objectives"
          value={profileData.careerGoals ?? ''}
          onChange={(e) => setProfileData({ ...profileData, careerGoals: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Looking for Mentorship in</label>
        <textarea
          placeholder="Specify subjects, skills, or areas where you need guidance"
          value={profileData.mentorshipAreas ?? ''}
          onChange={(e) => setProfileData({ ...profileData, mentorshipAreas: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          rows={3}
          required
        />
      </div>

      {profileData.educationLevel !== 'school' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">GitHub/Portfolio URL</label>
          <input
            type="url"
            placeholder="https://github.com/username"
            value={profileData.githubProfile ?? ''}
            onChange={(e) => setProfileData({ ...profileData, githubProfile: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      )}
    </div>
  );

  if (!userType) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-8">Complete Your Profile</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Common Fields */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a photo</span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={handleImageChange}
                          accept="image/*"
                          required
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                </div>
                {profileImage && (
                  <p className="mt-2 text-sm text-gray-600">{profileImage.name}</p>
                )}
              </div>

              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Email"
                  value={profileData.email}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-100"
                  disabled
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  placeholder="Contact Number"
                  value={profileData.contactNumber}
                  onChange={(e) => setProfileData({ ...profileData, contactNumber: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="State"
                  value={profileData.state}
                  onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div className="relative">
                <Flag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Nationality"
                  value={profileData.nationality}
                  onChange={(e) => setProfileData({ ...profileData, nationality: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div className="relative">
                <LinkedinIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="url"
                  placeholder="LinkedIn Profile URL"
                  value={profileData.linkedinProfile ?? ''}
                  onChange={(e) => setProfileData({ ...profileData, linkedinProfile: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Conditional Fields */}
            {userType === 'mentor' ? renderMentorForm() : renderStudentForm()}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Saving Profile...' : 'Complete Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}