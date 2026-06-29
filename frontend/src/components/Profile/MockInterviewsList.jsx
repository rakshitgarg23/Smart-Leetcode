import React, { useState, useEffect } from 'react';
import api from '../../api';

const MockInterviewsList = ({ username }) => {
  const [candidateInterviews, setCandidateInterviews] = useState([]);
  const [interviewerInterviews, setInterviewerInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('candidate'); // 'candidate' | 'interviewer'

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const [candRes, intRes] = await Promise.all([
          api.get(`/api/interviews/candidate/${username}`),
          api.get(`/api/interviews/interviewer/${username}`)
        ]);
        setCandidateInterviews(candRes.data);
        setInterviewerInterviews(intRes.data);
      } catch (err) {
        console.error('Failed to fetch mock interviews:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, [username]);

  if (loading) {
    return <div className="animate-pulse text-gray-400 py-4">Loading mock interviews...</div>;
  }

  const renderInterviewCard = (interview, type) => {
    const isPass = interview.status === 'Pass';
    return (
      <div key={interview.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{interview.question_title}</h3>
            <p className="text-sm text-gray-400">
              {type === 'candidate' ? (
                <>Interviewer: <span className="text-blue-400 font-medium">{interview.host_username}</span></>
              ) : (
                <>Candidate: <span className="text-blue-400 font-medium">{interview.guest_username}</span></>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">{new Date(interview.created_at).toLocaleDateString()} {new Date(interview.created_at).toLocaleTimeString()}</p>
          </div>
          <div className={`px-4 py-1 rounded shadow-lg border font-bold uppercase tracking-widest text-sm ${
            isPass ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-red-900/30 border-red-500 text-red-400'
          }`}>
            {interview.status}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">Interviewer Feedback</h4>
            <div className="bg-gray-900/50 p-3 rounded text-sm text-gray-300 whitespace-pre-wrap border border-gray-700/50 italic font-serif">
              {interview.feedback || 'No feedback provided.'}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">Evaluation Rubric</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {interview.rubric && interview.rubric.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-sm bg-gray-900/30 p-2 rounded border border-gray-700/50">
                  <span className="mt-0.5">
                    {item.checked ? <span className="text-green-500">☑</span> : <span className="text-red-500">☒</span>}
                  </span>
                  <span className={`${item.checked ? 'text-gray-300' : 'text-gray-500 line-through'}`}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-12 bg-gray-900/50 p-8 rounded-xl border border-gray-700 shadow-2xl relative overflow-hidden">
      <h2 className="text-2xl font-extrabold text-white mb-2 flex items-center space-x-2">
        <span>Interview History</span>
      </h2>
      <p className="text-gray-400 text-sm mb-6">This section is strictly private and only visible to you.</p>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('candidate')}
          className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'candidate' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          As Candidate ({candidateInterviews.length})
        </button>
        <button
          onClick={() => setActiveTab('interviewer')}
          className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'interviewer' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          As Interviewer ({interviewerInterviews.length})
        </button>
      </div>

      {/* List */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === 'candidate' && (
          candidateInterviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">You haven't been interviewed as a candidate yet.</p>
          ) : (
            candidateInterviews.map(i => renderInterviewCard(i, 'candidate'))
          )
        )}
        
        {activeTab === 'interviewer' && (
          interviewerInterviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">You haven't interviewed anyone yet.</p>
          ) : (
            interviewerInterviews.map(i => renderInterviewCard(i, 'interviewer'))
          )
        )}
      </div>
    </div>
  );
};

export default MockInterviewsList;
