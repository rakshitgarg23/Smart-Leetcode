import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import api from '../../api';

const fallbackCheatsheet = {
  optimalSolution: `// Optimal solution not available yet for this problem.`,
  timeComplexity: 'N/A',
  spaceComplexity: 'N/A',
  edgeCases: ['Check null/empty inputs', 'Check boundary constraints']
};

const defaultRubric = [
  { id: '1', text: 'Asked clarifying questions before starting', checked: false },
  { id: '2', text: 'Considered edge cases (empty inputs, nulls)', checked: false },
  { id: '3', text: 'Communicated thought process clearly', checked: false },
  { id: '4', text: 'Optimized the solution appropriately', checked: false },
  { id: '5', text: 'Code is clean and readable', checked: false }
];

const InterviewerPanel = ({ socket, roomId, initialQuestion, players }) => {
  const [candidateCode, setCandidateCode] = useState('// Waiting for candidate to start typing...');
  const [language, setLanguage] = useState('javascript');
  const [rubric, setRubric] = useState(defaultRubric);
  const [showEndModal, setShowEndModal] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Question management
  const [questions, setQuestions] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(initialQuestion || null);

  const editorRef = useRef(null);

  useEffect(() => {
    // Fetch available questions for the interviewer to pick
    const fetchQuestions = async () => {
      try {
        const response = await api.get('/api/questions');
        setQuestions(response.data);
      } catch (error) {
        console.error('Failed to fetch questions:', error);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('interview-code-update', (data) => {
      setCandidateCode(data.sourceCode);
      if (data.language) setLanguage(data.language);
    });

    socket.on('interview-question-updated', (data) => {
      setActiveQuestion(data.question);
    });

    return () => {
      socket.off('interview-code-update');
      socket.off('interview-question-updated');
    };
  }, [socket]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Listen for mouse clicks in the editor to emit cursor highlight
    editor.onMouseDown((e) => {
      if (e.target && e.target.position) {
        const lineNumber = e.target.position.lineNumber;
        socket.emit('cursor-highlight', { roomId, lineNumber });
      }
    });
  };

  const handleNudge = (hint) => {
    socket.emit('send-nudge', { roomId, hint });
  };

  const toggleRubricItem = (id) => {
    setRubric(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleEndSession = async (status) => {
    try {
      const hostUser = players?.find(p => p.role === 'Host');
      const guestUser = players?.find(p => p.role === 'Guest');

      await api.post('/api/interviews/save', {
        room_id: roomId,
        host_username: hostUser?.username || 'Unknown',
        guest_username: guestUser?.username || 'Unknown',
        question_title: activeQuestion?.title || 'Unknown',
        status,
        feedback: notes,
        rubric
      });
    } catch (err) {
      console.error('Failed to save interview session to database', err);
      alert('Failed to save interview session to database, but ending session anyway.');
    }

    socket.emit('end-session', {
      roomId,
      finalRubric: rubric,
      status, // 'Pass' or 'Fail'
      notes,
      finalCode: candidateCode
    });
    setShowEndModal(false);
  };

  const handleQuestionSelect = (e) => {
    const qId = e.target.value;
    if (!qId) return;
    const selectedQ = questions.find(q => q.id === parseInt(qId) || q.id === qId);
    if (selectedQ) {
      socket.emit('interview-set-question', { roomId, question: selectedQ });
      setActiveQuestion(selectedQ);
    }
  };

  const activeCheatsheet = activeQuestion?.cheatsheet || fallbackCheatsheet;

  return (
    <div className="flex h-full w-full">
      {/* Left Panel: Controls, Cheatsheet & Rubric */}
      <div className="w-1/3 flex flex-col bg-gray-900 border-r border-gray-700 overflow-y-auto">
        <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-blue-400">Interviewer Mode</h2>
            <p className="text-xs text-gray-400">You are evaluating the candidate</p>
          </div>
          <button 
            onClick={() => setShowEndModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded shadow-lg"
          >
            End Interview
          </button>
        </div>

        <div className="p-4 space-y-6">
          
          {/* Question Selector */}
          <section>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">Set Active Question</h3>
            <select 
              className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm focus:outline-none focus:border-blue-500"
              onChange={handleQuestionSelect}
              value={activeQuestion?.id || ''}
            >
              <option value="" disabled>-- Select a problem --</option>
              {questions.map(q => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>
          </section>

          {/* Nudge System */}
          <section>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Quick Nudges</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleNudge('Check edge cases')} className="px-3 py-1 bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-400 text-xs rounded border border-yellow-700">Check edge cases</button>
              <button onClick={() => handleNudge('Think about Time Complexity')} className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 text-xs rounded border border-blue-700">Time Complexity?</button>
              <button onClick={() => handleNudge('Can we optimize space?')} className="px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-400 text-xs rounded border border-purple-700">Space Complexity?</button>
            </div>
          </section>

          {/* Rubric */}
          <section>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Evaluation Rubric</h3>
            <div className="space-y-2">
              {rubric.map(item => (
                <label key={item.id} className="flex items-start space-x-3 cursor-pointer group">
                  <div className="mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={item.checked} 
                      onChange={() => toggleRubricItem(item.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                  <span className={`text-sm ${item.checked ? 'text-gray-400 line-through' : 'text-gray-200 group-hover:text-white'}`}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Cheatsheet */}
          <section>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">Solution Cheatsheet</h3>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-inner">
              {activeQuestion ? (
                <>
                  <h4 className="text-sm font-bold text-white mb-2">{activeQuestion.title}</h4>
                  
                  {activeQuestion.starter_code?.javascript && (
                     <div className="mb-4">
                       <h5 className="text-xs font-semibold text-green-400 mb-1">Starter Code (JS)</h5>
                       <pre className="text-xs text-gray-300 overflow-x-auto p-2 bg-gray-900 rounded border border-gray-700">
                         {activeQuestion.starter_code.javascript}
                       </pre>
                     </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-400 italic mb-2">Sourced directly from database!</p>
                    <h5 className="text-xs font-semibold text-green-400 mb-1">Optimal Solution</h5>
                    <pre className="text-xs text-gray-300 overflow-x-auto p-2 bg-gray-900 rounded mb-4">
                      {activeCheatsheet.optimalSolution}
                    </pre>
                    
                    <div className="mb-4">
                      <h5 className="text-xs font-semibold text-red-400 mb-1">Time Complexity</h5>
                      <p className="text-xs text-gray-300">{activeCheatsheet.timeComplexity}</p>
                    </div>

                    <div className="mb-4">
                      <h5 className="text-xs font-semibold text-yellow-400 mb-1">Space Complexity</h5>
                      <p className="text-xs text-gray-300">{activeCheatsheet.spaceComplexity}</p>
                    </div>

                    <div>
                      <h5 className="text-xs font-semibold text-purple-400 mb-1">Edge Cases</h5>
                      <ul className="list-disc list-inside text-xs text-gray-300">
                        {activeCheatsheet.edgeCases.map((ec, idx) => <li key={idx}>{ec}</li>)}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400 italic">Select a question to view cheatsheet.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Right Panel: Read-only Candidate Editor */}
      <div className="w-2/3 flex flex-col bg-[#1e1e1e]">
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
          <span className="text-sm font-bold text-gray-400 flex items-center space-x-2">
            <span>Candidate's Workspace</span>
            <span className="bg-red-900/50 text-red-400 text-xs px-2 py-0.5 rounded border border-red-800 uppercase tracking-wider">Read-Only</span>
          </span>
          <span className="text-xs text-gray-500 font-mono">Language: {language}</span>
        </div>
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={candidateCode}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              padding: { top: 16 },
              readOnly: true,
              cursorBlinking: 'solid'
            }}
          />
        </div>
      </div>

      {/* End Session Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">Submit Final Grade</h2>
            <p className="text-gray-400 text-sm mb-6">You are about to end the interview session. Please provide any final notes and determine the candidate's result.</p>
            
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Final feedback or notes on performance..."
              className="w-full h-32 bg-gray-900 border border-gray-700 rounded p-3 text-sm text-gray-200 mb-6 focus:outline-none focus:border-blue-500"
            />
            
            <div className="flex justify-between space-x-4">
              <button 
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded flex-1 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleEndSession('Fail')}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded flex-1 transition-colors"
              >
                Fail
              </button>
              <button 
                onClick={() => handleEndSession('Pass')}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded flex-1 transition-colors"
              >
                Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewerPanel;
