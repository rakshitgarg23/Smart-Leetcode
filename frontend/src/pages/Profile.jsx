import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import Heatmap from '../components/Heatmap';
import { useAuth } from '../context/AuthContext';
import CompareModal from '../components/CompareModal';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isChallenging, setIsChallenging] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch basic stats and heatmap concurrently
        const [profileRes, heatmapRes] = await Promise.all([
          api.get(`/api/profile/${username}`),
          api.get(`/api/profile/${username}/heatmap`)
        ]);

        setProfileData(profileRes.data);
        setHeatmapData(heatmapRes.data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading Profile...</div>;
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-red-500 mb-2">Access Denied</h2>
        <p className="text-gray-400">{error || 'Profile not found or is set to private.'}</p>
      </div>
    );
  }

  const { stats } = profileData;

  const handleSparringChallenge = async () => {
    try {
      setIsChallenging(true);
      const res = await api.post('/api/sparring/create', {
        userId: user?.id,
        username: user?.user_metadata?.username
      });
      // Pass the generated questionId via query string
      navigate(`/sparring/${res.data.roomId}?questionId=${res.data.questionId}`);
    } catch (err) {
      console.error('Failed to create sparring room', err);
      alert('Failed to start challenge.');
    } finally {
      setIsChallenging(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8 mt-10 mb-20 font-sans">
      
      {/* Profile Header & Stats */}
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-2xl relative overflow-hidden">
        {/* Aesthetic background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-1">{profileData.username}</h1>
            <p className="text-blue-400 font-medium tracking-wide uppercase text-sm">Competitive Programmer</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button 
              onClick={() => setIsCompareModalOpen(true)}
              className="px-5 py-2 rounded font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/50 transition-all transform hover:-translate-y-0.5"
            >
              Compare Profile
            </button>
            <button 
              onClick={handleSparringChallenge}
              disabled={isChallenging}
              className="px-5 py-2 rounded font-bold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white shadow-lg hover:shadow-red-500/50 transition-all transform hover:-translate-y-0.5"
            >
              {isChallenging ? 'Creating Match...' : 'Challenge to Sparring'}
            </button>
          </div>
        </div>

        {/* Global Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center shadow-inner col-span-2 md:col-span-1">
            <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-xs mb-2">Global Score</h3>
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">{stats.total_score}</p>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center shadow-inner col-span-2 md:col-span-1">
            <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-xs mb-2">Clean Streak</h3>
            <p className="text-4xl font-black text-white">{stats.streak} <span className="text-sm font-medium text-gray-500">days</span></p>
          </div>
          
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center shadow-inner">
            <h3 className="text-green-500 font-semibold uppercase tracking-wider text-xs mb-2">Easy Solved</h3>
            <p className="text-3xl font-bold text-gray-100">{stats.easy_solved}</p>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center shadow-inner">
            <h3 className="text-yellow-500 font-semibold uppercase tracking-wider text-xs mb-2">Medium Solved</h3>
            <p className="text-3xl font-bold text-gray-100">{stats.medium_solved}</p>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center shadow-inner">
            <h3 className="text-red-500 font-semibold uppercase tracking-wider text-xs mb-2">Hard Solved</h3>
            <p className="text-3xl font-bold text-gray-100">{stats.hard_solved}</p>
          </div>
        </div>

        {/* Total Hints Used Metric */}
        <div className="text-right">
          <p className="text-sm text-gray-500">Total AI Hints Consumed: <span className="text-blue-400 font-bold">{stats.total_hints_used}</span></p>
        </div>
      </div>

      {/* Dynamic Heatmap */}
      <Heatmap data={heatmapData} />

      <CompareModal 
        isOpen={isCompareModalOpen} 
        onClose={() => setIsCompareModalOpen(false)} 
        currentUserData={profileData} 
      />
    </div>
  );
};

export default Profile;
