import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, Star, Users, BookOpen, Trophy, UserRound, Settings, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User } from '../lib/types';
import MentorList from './MentorList';
import ConnectionsList from './ConnectionsList';
import ProfileView from './ProfileView';
import MentorLeaderboard from './MentorLeaderboard';
import MentorNotifications from './MentorNotifications';
import DynamicMessagePanel from './DynamicMessagePanel';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('mentors');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [notificationCount] = useState(0); // This can be fetched dynamically if needed

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser() as unknown as { data: { user: User } };
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
    };
    getUser();
  }, [navigate]);

  if (!user) return null;

  const isStudent = user.user_metadata?.user_type === 'student';
  const isMentor = user.user_metadata?.user_type === 'mentor';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">DoubtSync</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isMentor && (
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors relative ${
                    activeTab === 'notifications' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notificationCount}
                    </span>
                  )}
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors"
                >
                  <span className="text-blue-600 font-medium">
                    {user.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full"
                    >
                      <UserRound className="w-5 h-5 mr-2" />
                      View Profile
                    </button>
                    <button
                      onClick={() => navigate('/edit-profile')}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full"
                    >
                      <Settings className="w-5 h-5 mr-2" />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 w-full"
                    >Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Sidebar */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl text-blue-600 font-medium">
                    {user.user_metadata?.full_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{user.user_metadata?.full_name}</h2>
                  <p className="text-gray-600 capitalize">{user.user_metadata?.user_type}</p>
                </div>
              </div>

              <div className="space-y-2">
                {isStudent && (
                  <button
                    onClick={() => setActiveTab('mentors')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'mentors' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span>Find Mentors</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'messages' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Messages</span>
                </button>
                <button
                  onClick={() => setActiveTab('connections')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'connections' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <Star className="w-5 h-5" />
                  <span>Connections</span>
                </button>
                {!isStudent && (
                  <button
                    onClick={() => setActiveTab('resources')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'resources' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Resources</span>
                  </button>
                )}
              </div>

              {isStudent ? (
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Your Progress</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Doubts Solved</span>
                      <span className="font-medium">24</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Active Mentors</span>
                      <span className="font-medium">3</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Learning Streak</span>
                      <div className="flex items-center space-x-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">7 days</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isMentor ? (
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Your Rating</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Current Rating</span>
                      <span className="font-medium">4.8</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Doubts Solved</span>
                      <span className="font-medium">42</span>
                    </div>
                    {/* Additional mentor metrics here */}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {activeTab === 'mentors' && (
              <>
                {isStudent ? (
                  // Student view: Find mentors interface
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                      <h2 className="text-2xl font-semibold mb-6">Find Your Perfect Mentor</h2>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Search mentors by name or subject..."
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                    <MentorList currentUserId={user.id} isStudent={true} />
                  </div>
                ) : (
                  // Mentor view: Leaderboard and notifications
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                      <h2 className="text-2xl font-semibold mb-6">Top Mentor Leaderboard</h2>
                      <MentorLeaderboard isStudent={false} />
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'notifications' && isMentor && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-6">Connection Requests</h2>
                <MentorNotifications mentorId={user.id} />
              </div>
            )}

{activeTab === 'connections' && (
  <ConnectionsList 
    currentUserId={user.id}
    isStudent={isStudent}
    onSelectConnection={(connectionId) => {
      setSelectedConnectionId(connectionId);
      setActiveTab('messages');
    }}
  />
)}


            {activeTab === 'messages' && selectedConnectionId && (
              <DynamicMessagePanel
                currentUserId={user.id}
                connectionId={selectedConnectionId} onBack={function (): void {
                  throw new Error('Function not implemented.');
                } }              />
            )}

            {activeTab === 'profile' && <ProfileView />}
          </div>
        </div>
      </div>
    </div>
  );
}
