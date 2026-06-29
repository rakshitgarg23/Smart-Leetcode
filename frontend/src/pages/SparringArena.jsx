import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_CODE = {
  javascript: 'function solve() {\n  // Write your code here\n}\n',
  python: 'def solve():\n    # Write your code here\n    pass\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}\n'
};

const SparringArena = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [question, setQuestion] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [sourceCode, setSourceCode] = useState(DEFAULT_CODE['javascript']);
  
  const [isOpponentPresent, setIsOpponentPresent] = useState(false);
  const [opponentStatus, setOpponentStatus] = useState('Waiting for opponent to join...');
  const [opponentCodeLength, setOpponentCodeLength] = useState(0);
  
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const [matchStatus, setMatchStatus] = useState('lobby'); // lobby, active, won, lost, draw
  const [executionResult, setExecutionResult] = useState(null);
  
  const socketRef = useRef(null);
  const syncTimeoutRef = useRef(null);

  // Initialize Match & Socket.io
  useEffect(() => {
    const questionId = searchParams.get('questionId');

    const fetchQuestion = async () => {
      try {
        if (!questionId) {
          // Fallback if no questionId provided (e.g. legacy or dev join without ID)
          const response = await api.get('/api/questions');
          if (response.data && response.data.length > 0) {
            setQuestion(response.data[0]); 
            setSourceCode(response.data[0].starter_code?.['javascript'] || DEFAULT_CODE['javascript']);
          }
        } else {
          const response = await api.get(`/api/questions/${questionId}`);
          setQuestion(response.data);
          setSourceCode(response.data.starter_code?.['javascript'] || DEFAULT_CODE['javascript']);
        }
      } catch (error) {
        console.error('Failed to fetch question');
      }
    };
    fetchQuestion();

    // Initialize Socket.io Connection
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    socketRef.current = io(backendUrl);
    const socket = socketRef.current;

    // Join Room
    socket.emit('join-room', {
      roomId,
      userId: user?.id,
      username: user?.user_metadata?.username || 'Guest'
    });

    // Listen for Player 2 joining (radar update)
    socket.on('player-joined', (data) => {
      if (data.userId !== user?.id) {
        setOpponentStatus(`${data.username || 'Opponent'} is ready!`);
      }
    });

    // Listen for Match Start (when both players are in the room)
    socket.on('match-started', (data) => {
      setIsOpponentPresent(true);
      setMatchStatus('active');
      
      // Determine opponent's username if available
      if (data.players) {
        const opponent = data.players.find(p => p.userId !== user?.id);
        if (opponent) {
          setOpponentStatus(`${opponent.username || 'Opponent'} is ready!`);
        } else {
          setOpponentStatus(`Opponent is ready!`);
        }
      } else {
        setOpponentStatus(`Opponent is ready!`);
      }
    });

    // Listen for Opponent Code Sync
    socket.on('code-update', (data) => {
      if (data.userId !== user?.id) {
        setOpponentCodeLength(data.sourceCode.length);
        setOpponentStatus('Opponent typing...');
        
        // Reset status after a few seconds of inactivity
        setTimeout(() => setOpponentStatus('Opponent thinking...'), 3000);
      }
    });

    // Listen for Opponent Submission Sync
    socket.on('submission-status', (data) => {
      if (data.userId !== user?.id) {
        if (data.status === 'RUNNING') {
          setOpponentStatus('Opponent is running test cases... ⏳');
        } else if (data.status === 'Accepted') {
          setMatchStatus('lost');
          setOpponentStatus('Opponent ACCEPTED! 🏆');
        } else {
          setOpponentStatus(`Opponent failed: ${data.status} ❌`);
        }
      }
    });

    // Cleanup: Disconnect socket on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, user?.id]);

  // Synchronized Timer
  useEffect(() => {
    if (matchStatus !== 'active') return;

    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          setMatchStatus('draw');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [matchStatus]);

  // Throttled Code Syncing
  const handleCodeChange = (val) => {
    const newCode = val || '';
    setSourceCode(newCode);
    
    if (matchStatus !== 'active') return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    
    // Throttle to sync every 2 seconds
    syncTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('code-sync', {
          roomId,
          userId: user?.id,
          sourceCode: newCode
        });
      }
    }, 2000);
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setSourceCode(question?.starter_code?.[newLang] || DEFAULT_CODE[newLang]);
  };

  const handleSubmit = async () => {
    if (!question || matchStatus !== 'active') return;
    
    setExecutionResult({ status: 'RUNNING', message: 'Running on execution engine...' });
    
    // Broadcast running status
    if (socketRef.current) {
      socketRef.current.emit('submit-sync', {
        roomId,
        userId: user?.id,
        status: 'RUNNING',
        message: 'Opponent is running tests'
      });
    }

    try {
      const response = await api.post('/api/code/submit', {
        userId: user?.id,
        questionId: question.id,
        sourceCode: sourceCode,
        language: language
      });
      
      const { status } = response.data;
      setExecutionResult(response.data);
      
      // Broadcast final status
      if (socketRef.current) {
        socketRef.current.emit('submit-sync', {
          roomId,
          userId: user?.id,
          status: status,
          message: status === 'Accepted' ? 'Opponent solved it!' : 'Opponent failed.'
        });
      }

      if (status === 'Accepted') {
        setMatchStatus('won');
      }
    } catch (error) {
      setExecutionResult({ status: 'Error', message: 'Execution failed.' });
      if (socketRef.current) {
        socketRef.current.emit('submit-sync', { roomId, userId: user?.id, status: 'Error', message: 'Error' });
      }
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (matchStatus === 'lobby') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 mb-6 animate-pulse">
          Sparring Arena
        </h2>
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-2xl text-center max-w-lg w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-6"></div>
          <h3 className="text-xl font-bold mb-4">Waiting for Challenger...</h3>
          <p className="text-gray-400 mb-6 text-sm">Share this link with your opponent to begin the match:</p>
          
          <div className="flex items-center space-x-2 mb-6">
            <div className="flex-1 p-3 bg-gray-900 rounded border border-gray-600 font-mono text-sm break-all text-blue-400 text-left">
              {window.location.href}
            </div>
            <button 
              onClick={handleCopy}
              className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-lg transition-colors whitespace-nowrap"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <button 
            onClick={() => {
              // Dev shortcut to forcefully start match without a second player connecting
              setIsOpponentPresent(true);
              setMatchStatus('active');
            }}
            className="mt-6 px-4 py-2 text-sm text-gray-500 hover:text-gray-300 mr-2"
          >
            [Dev: Force Start Match]
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

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-900 text-gray-200 font-sans">
      
      {/* Left Pane: Problem Description */}
      <div className="w-[45%] flex flex-col border-r border-gray-700 bg-gray-800">
        {/* Match Header */}
        <div className="px-6 py-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shadow-md">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="font-bold text-red-500 uppercase tracking-wider text-sm">Live Match</span>
          </div>
          <div className="font-mono text-2xl font-bold text-white tracking-widest flex-1 text-center">
            {formatTime(timeLeft)}
          </div>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-1.5 bg-red-900/50 hover:bg-red-800/80 text-red-300 font-bold rounded border border-red-800 transition-colors text-sm"
          >
            Exit Match
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {question ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-4">{question.title}</h1>
              <div className="prose prose-invert max-w-none text-gray-300 text-sm" 
                   dangerouslySetInnerHTML={{ __html: question.description.replace(/\n/g, '<br/>') }} />
            </>
          ) : (
            <p>Loading problem...</p>
          )}

          {/* Opponent Tracking Panel */}
          <div className="mt-8 border border-red-900/50 bg-gray-900/50 rounded-lg overflow-hidden">
            <div className="bg-red-900/30 px-4 py-2 border-b border-red-900/50">
              <h3 className="text-red-400 font-bold text-sm uppercase tracking-wider">Opponent Radar</h3>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center">
                  💻
                </div>
                <div>
                  <p className={`text-sm font-bold ${opponentStatus.includes('running') ? 'text-yellow-400 animate-pulse' : opponentStatus.includes('ACCEPTED') ? 'text-green-500' : 'text-gray-300'}`}>
                    {opponentStatus}
                  </p>
                  <p className="text-xs text-gray-500">Code length: {opponentCodeLength} chars</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Code Editor & Console */}
      <div className="w-[55%] flex flex-col bg-[#1e1e1e] relative">
        
        {/* Match Resolution Overlay */}
        {(matchStatus === 'won' || matchStatus === 'lost' || matchStatus === 'draw') && (
          <div className="absolute inset-0 z-50 bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
            <h2 className={`text-6xl font-black mb-4 uppercase tracking-tighter ${
              matchStatus === 'won' ? 'text-green-500' : matchStatus === 'lost' ? 'text-red-500' : 'text-yellow-500'
            }`}>
              {matchStatus === 'won' ? 'Victory!' : matchStatus === 'lost' ? 'Defeat!' : 'Draw!'}
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              {matchStatus === 'won' ? 'You solved it before your opponent.' : 
               matchStatus === 'lost' ? 'Your opponent finished first.' : 
               'Time ran out for both fighters.'}
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg transition-transform hover:scale-105"
            >
              Return to Lobby
            </button>
          </div>
        )}

        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <select 
            value={language} 
            onChange={handleLanguageChange}
            disabled={matchStatus !== 'active'}
            className="bg-gray-700 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="python">Python 3</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
          
          <button 
            onClick={handleSubmit}
            disabled={executionResult?.status === 'RUNNING' || matchStatus !== 'active'}
            className="px-6 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded transition-colors shadow shadow-green-500/30"
          >
            {executionResult?.status === 'RUNNING' ? 'Running...' : 'Submit & Win'}
          </button>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language}
            theme="vs-dark"
            value={sourceCode}
            onChange={handleCodeChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              padding: { top: 16 },
              readOnly: matchStatus !== 'active'
            }}
          />
        </div>

        {/* Execution Console */}
        <div className="h-48 bg-gray-900 border-t border-gray-700 flex flex-col">
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Battle Console</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto font-mono text-sm">
            {!executionResult && (
              <span className="text-gray-500">Run your code to execute tests...</span>
            )}
            
            {executionResult?.status === 'RUNNING' && (
              <span className="text-blue-400 animate-pulse">Running test cases...</span>
            )}

            {executionResult && executionResult.status !== 'RUNNING' && (
              <div className="space-y-1">
                <span className={`font-bold ${
                  executionResult.status === 'Accepted' ? 'text-green-500' : 
                  executionResult.status === 'Wrong Answer' ? 'text-red-500' : 'text-yellow-500'
                }`}>
                  [{executionResult.status}]
                </span>
                <p className="text-gray-300">{executionResult.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default SparringArena;
