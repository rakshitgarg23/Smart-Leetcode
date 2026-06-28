import { useState } from 'react';
import api from '../api';

const CompareModal = ({ isOpen, onClose, currentUserData }) => {
  const [opponentUsername, setOpponentUsername] = useState('');
  const [opponentData, setOpponentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!opponentUsername.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.get(`/api/profile/${opponentUsername}`);
      setOpponentData(response.data);
    } catch (err) {
      setError('Player not found or is set to private.');
      setOpponentData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getWinnerClass = (myVal, oppVal) => {
    if (myVal > oppVal) return 'text-green-400 font-bold';
    if (myVal < oppVal) return 'text-red-400 font-bold';
    return 'text-gray-300 font-bold';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-gray-900">
          <h2 className="text-2xl font-bold text-white">Compare Profiles</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSearch} className="flex space-x-3 mb-8">
            <input 
              type="text" 
              placeholder="Enter opponent's username..."
              value={opponentUsername}
              onChange={(e) => setOpponentUsername(e.target.value)}
              className="flex-1 bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            />
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Compare'}
            </button>
          </form>

          {error && <div className="text-red-400 mb-6 font-medium">{error}</div>}

          {opponentData && currentUserData && (
            <div className="grid grid-cols-3 gap-4 text-center">
              {/* Table Headers */}
              <div className="col-span-1"></div>
              <div className="col-span-1 p-4 bg-blue-900/30 border border-blue-800 rounded-t-lg">
                <h3 className="text-xl font-bold text-blue-400">{currentUserData.username}</h3>
                <span className="text-xs text-blue-300 uppercase">You</span>
              </div>
              <div className="col-span-1 p-4 bg-red-900/30 border border-red-800 rounded-t-lg">
                <h3 className="text-xl font-bold text-red-400">{opponentData.username}</h3>
                <span className="text-xs text-red-300 uppercase">Opponent</span>
              </div>

              {/* Rows */}
              {[
                { label: 'Global Score', key: 'total_score' },
                { label: 'Clean Streak (Days)', key: 'streak' },
                { label: 'Easy Solved', key: 'easy_solved' },
                { label: 'Medium Solved', key: 'medium_solved' },
                { label: 'Hard Solved', key: 'hard_solved' },
                { label: 'Total Hints Used', key: 'total_hints_used', lowerIsBetter: true }
              ].map(({ label, key, lowerIsBetter }) => {
                let myVal = currentUserData.stats[key] || 0;
                let oppVal = opponentData.stats[key] || 0;
                
                let myClass = getWinnerClass(lowerIsBetter ? -myVal : myVal, lowerIsBetter ? -oppVal : oppVal);
                let oppClass = getWinnerClass(lowerIsBetter ? -oppVal : oppVal, lowerIsBetter ? -myVal : myVal);

                return (
                  <div key={key} className="contents">
                    <div className="col-span-1 p-4 bg-gray-900 flex items-center justify-start border-t border-gray-700">
                      <span className="text-gray-400 font-bold text-sm uppercase tracking-wider">{label}</span>
                    </div>
                    <div className={`col-span-1 p-4 bg-gray-800 border-t border-gray-700 ${myClass}`}>
                      {myVal}
                    </div>
                    <div className={`col-span-1 p-4 bg-gray-800 border-t border-gray-700 ${oppClass}`}>
                      {oppVal}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompareModal;
