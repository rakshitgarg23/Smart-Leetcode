import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import InterviewerPanel from '../components/Interview/InterviewerPanel';
import CandidateWorkspace from '../components/Interview/CandidateWorkspace';
import PostInterviewReport from '../components/Interview/PostInterviewReport';

const InterviewArena = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [role, setRole] = useState(null); // 'Host' | 'Guest'
  const [sessionState, setSessionState] = useState('lobby'); // 'lobby', 'active', 'ended'
  
  const [initialQuestion, setInitialQuestion] = useState(null);
  const [players, setPlayers] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    // Prevent accidental page refreshes/closes
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Join Room
    newSocket.emit('interview-join', {
      roomId,
      userId: user?.id,
      username: user?.user_metadata?.username || 'Guest'
    });

    // Listen for role assignment
    newSocket.on('interview-role-assigned', (data) => {
      setRole(data.role);
    });

    // Listen for match start
    newSocket.on('interview-started', (data) => {
      if (data?.currentQuestion) {
        setInitialQuestion(data.currentQuestion);
      }
      if (data?.players) {
        setPlayers(data.players);
      }
      setSessionState('active');
    });

    // Listen for end session
    newSocket.on('session-ended', (data) => {
      setReportData(data);
      setSessionState('ended');
    });

    return () => {
      newSocket.disconnect();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId, user?.id]);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (sessionState === 'lobby') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-6 animate-pulse">
          Mock Interview Lobby
        </h2>
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-2xl text-center max-w-lg w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-6"></div>
          <h3 className="text-xl font-bold mb-4">
            {role === 'Host' ? 'Waiting for Candidate to join...' : 'Waiting for Interviewer...'}
          </h3>
          <p className="text-gray-400 mb-6 text-sm">Share this link to invite the other party:</p>
          
          <div className="flex items-center space-x-2 mb-6">
            <div className="flex-1 p-3 bg-gray-900 rounded border border-gray-600 font-mono text-sm break-all text-blue-400 text-left">
              {window.location.href}
            </div>
            <button 
              onClick={handleCopy}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg transition-colors whitespace-nowrap"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          
          <button 
            onClick={() => setSessionState('active')} // Dev bypass
            className="mt-6 px-4 py-2 text-sm text-gray-500 hover:text-gray-300 mr-2"
          >
            [Dev: Force Start]
          </button>
          <button 
            onClick={() => navigate('/')}
            className="mt-6 px-4 py-2 text-sm text-red-400 hover:text-red-300"
          >
            Exit Lobby
          </button>
        </div>
      </div>
    );
  }

  if (sessionState === 'ended') {
    return <PostInterviewReport data={reportData} />;
  }

  // Active Session
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-900 text-white font-sans overflow-hidden">
      {role === 'Host' ? (
        <InterviewerPanel socket={socket} roomId={roomId} initialQuestion={initialQuestion} players={players} />
      ) : (
        <CandidateWorkspace socket={socket} roomId={roomId} initialQuestion={initialQuestion} />
      )}
    </div>
  );
};

export default InterviewArena;
