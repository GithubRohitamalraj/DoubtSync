import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, KeyRound, GraduationCap, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';

type UserType = 'student' | 'mentor';

export default function Login() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;

      if (data.user) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
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
            <h2 className="text-3xl font-bold mb-6">Welcome Back!</h2>
            <p className="mb-6">
              Join our learning platform where mentors and students connect for 
              an enriching educational experience.
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

        {/* Right Side - Login Form */}
        <div className="p-8 md:w-3/5">
          <div className="text-right mb-8">
            <button
              onClick={() => navigate('/signup')}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 ml-auto"
            >
              <span>Need an account? Sign up</span>
            </button>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Login</h2>
            
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
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
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

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-blue-600 hover:text-blue-800">
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Signing in...' : `Login as ${userType === 'student' ? 'Student' : 'Mentor'}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}