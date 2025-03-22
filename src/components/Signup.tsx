import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Mail, KeyRound, GraduationCap, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';

type UserType = 'student' | 'mentor';

export default function Signup() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        navigate('/complete-profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden">
        {/* Left Side - Info Panel */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 text-white md:w-2/5 flex flex-col justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-6">Join DoubtSync!</h2>
            <p className="mb-6">
              Connect with expert mentors or share your knowledge with eager students.
              Start your learning journey today!
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <UserRound className="w-6 h-6" />
              <span>Expert Mentors</span>
            </div>
            <div className="flex items-center space-x-3">
              <GraduationCap className="w-6 h-6" />
              <span>Dedicated Students</span>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="p-8 md:w-3/5">
          <div className="text-right mb-8">
            <button
              onClick={() => navigate('/login')}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 ml-auto"
            >
              <span>Already have an account? Login</span>
            </button>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Create Account</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Type Selection */}
              <div className="flex space-x-4 mb-6">
                <button
                  type="button"
                  className={`flex-1 py-3 rounded-lg transition-colors ${
                    userType === 'student'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setUserType('student')}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <GraduationCap className="w-5 h-5" />
                    <span>Student</span>
                  </div>
                </button>
                <button
                  type="button"
                  className={`flex-1 py-3 rounded-lg transition-colors ${
                    userType === 'mentor'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setUserType('mentor')}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Briefcase className="w-5 h-5" />
                    <span>Mentor</span>
                  </div>
                </button>
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}