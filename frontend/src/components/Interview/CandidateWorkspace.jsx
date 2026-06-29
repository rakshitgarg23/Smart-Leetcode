import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

const CandidateWorkspace = ({ socket, roomId, initialQuestion }) => {
  const [activeQuestion, setActiveQuestion] = useState(initialQuestion || null);
  const [language, setLanguage] = useState('javascript');
  const [sourceCode, setSourceCode] = useState('// Waiting for interviewer to pick a question...\n');
  const [dryRunText, setDryRunText] = useState('');
  const [toast, setToast] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [activeTab, setActiveTab] = useState('dry-run');
  const [activeResultCase, setActiveResultCase] = useState(0);

  const { user } = useAuth();

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const syncTimeoutRef = useRef(null);
  const decorationsRef = useRef([]);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    // If the interviewer picked a question and our code is still empty or default, set the starter code
    if (activeQuestion?.starter_code?.[language]) {
      setSourceCode(activeQuestion.starter_code[language]);
    }
  }, [activeQuestion, language]);

  useEffect(() => {
    if (!socket) return;

    socket.on('receive-nudge', (data) => {
      console.log('Nudge received:', data.hint);
      setToast(data.hint);
      
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      
      // Auto-hide toast after 5 seconds
      toastTimeoutRef.current = setTimeout(() => setToast(null), 5000);
    });

    socket.on('interview-question-updated', (data) => {
      setActiveQuestion(data.question);
    });

    socket.on('cursor-highlighted', (data) => {
      if (editorRef.current && monacoRef.current) {
        const { lineNumber } = data;
        
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
          {
            range: new monacoRef.current.Range(lineNumber, 1, lineNumber, 1),
            options: {
              isWholeLine: true,
              className: 'bg-yellow-500/20 border-l-4 border-yellow-500',
              glyphMarginClassName: 'bg-yellow-500'
            }
          }
        ]);

        // Reveal the line so the candidate sees it
        editorRef.current.revealLineInCenter(lineNumber);

        // Remove the highlight after 3 seconds
        setTimeout(() => {
          if (editorRef.current) {
            decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
          }
        }, 3000);
      }
    });

    return () => {
      socket.off('receive-nudge');
      socket.off('interview-question-updated');
      socket.off('cursor-highlighted');
    };
  }, [socket]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const handleCodeChange = (val) => {
    const newCode = val || '';
    setSourceCode(newCode);
    
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    
    // Throttle code sync to interviewer
    syncTimeoutRef.current = setTimeout(() => {
      socket.emit('interview-code-sync', {
        roomId,
        sourceCode: newCode,
        language
      });
    }, 500);
  };

  const handleSubmit = async (isRun = false) => {
    if (!activeQuestion || !sourceCode.trim()) return;
    
    setIsSubmitting(true);
    setExecutionResult(null);
    
    try {
      const response = await api.post('/api/code/submit', {
        userId: user.id,
        questionId: activeQuestion.id,
        sourceCode: sourceCode,
        language: language,
        isRun: isRun
      });
      setExecutionResult(response.data);
      if (isRun || !isRun) {
        setActiveTab('results');
        setActiveResultCase(0);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      setExecutionResult({
        status: 'Error',
        message: 'Failed to communicate with execution server.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#1e1e1e] relative">
      
      {/* Toast Notification for Nudges */}
      {toast && (
        <div className="absolute top-8 right-8 z-[9999] animate-bounce pointer-events-none">
          <div className="bg-yellow-600 text-white px-6 py-3 rounded-lg shadow-2xl border-2 border-yellow-400 flex items-center space-x-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-xs text-yellow-200 font-bold uppercase tracking-wider">Interviewer Hint</p>
              <p className="font-semibold text-lg">{toast}</p>
            </div>
          </div>
        </div>
      )}

      {/* Left Pane: Problem Description (Split Screen) */}
      <div className="w-[40%] flex flex-col border-r border-gray-700 bg-gray-800 h-full">
        <div className="px-6 py-4 bg-gray-900 border-b border-gray-800 shadow-md shrink-0 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-200 tracking-wider">Interview Session</span>
            <span className="text-xs text-red-400 font-mono flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>LIVE</span>
            </span>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {activeQuestion ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-4">{activeQuestion.title}</h1>
              <div 
                className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed" 
                dangerouslySetInnerHTML={{ __html: (activeQuestion.description || '').replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-blue-400 px-1 py-0.5 rounded font-mono text-sm">$1</code>').replace(/\n/g, '<br/>') }} 
              />
              {activeQuestion.test_cases && activeQuestion.test_cases.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-lg font-bold text-gray-200 border-b border-gray-700 pb-2">Examples</h3>
                  {activeQuestion.test_cases.slice(0, 2).map((tc, idx) => (
                    <div key={idx} className="bg-gray-900 rounded p-4 border border-gray-700 font-mono text-sm text-gray-300">
                      <p><span className="font-bold text-gray-400">Input:</span> {tc.input}</p>
                      <p className="mt-2"><span className="font-bold text-gray-400">Output:</span> {tc.expected_output}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="text-4xl">⏳</div>
              <p className="text-gray-400 font-medium">Waiting for your interviewer to assign a question...</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Code Editor & Execution Panel */}
      <div className="w-[60%] flex flex-col h-full">
        {/* Editor Toolbar */}
        <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 flex justify-between items-center shrink-0">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>

          <div className="space-x-3">
            <button 
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="px-5 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-bold rounded transition-colors border border-gray-700"
            >
              Run
            </button>
            <button 
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="px-6 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded transition-colors shadow-lg shadow-green-500/30"
            >
              {isSubmitting ? 'Running...' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 relative min-h-0">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={sourceCode}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 15,
              wordWrap: 'on',
              padding: { top: 16 },
              glyphMargin: true
            }}
          />
        </div>

        {/* Execution Console */}
        <div className="h-64 shrink-0 bg-gray-900 border-t border-gray-800 flex flex-col">
          <div className="flex bg-gray-800 border-b border-gray-700">
            <button 
              className={`px-4 py-2 text-sm font-bold ${activeTab === 'testcases' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
              onClick={() => setActiveTab('testcases')}
            >
              Testcases
            </button>
            <button 
              className={`px-4 py-2 text-sm font-bold ${activeTab === 'results' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
              onClick={() => setActiveTab('results')}
            >
              Test Result
            </button>
            <button 
              className={`px-4 py-2 text-sm font-bold flex items-center space-x-2 ${activeTab === 'dry-run' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
              onClick={() => setActiveTab('dry-run')}
            >
              <span>📝</span>
              <span>Dry-Run Scratchpad</span>
            </button>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto font-mono text-sm">
            {activeTab === 'testcases' && (
              <div className="space-y-4">
                {activeQuestion?.test_cases?.slice(0, 2).map((tc, idx) => (
                  <div key={idx} className="bg-gray-800 rounded p-3 border border-gray-700">
                    <span className="text-gray-500 block text-xs font-bold uppercase mb-1">Case {idx + 1} Input:</span>
                    <pre className="text-gray-300 whitespace-pre-wrap">{tc.input}</pre>
                  </div>
                ))}
                {!activeQuestion && <span className="text-gray-500">No test cases available.</span>}
              </div>
            )}

            {activeTab === 'results' && (
              <div>
                {!executionResult && !isSubmitting && (
                  <span className="text-gray-500">Run your code to see the output here.</span>
                )}
                
                {isSubmitting && (
                  <span className="text-blue-400 animate-pulse">Compiling and running tests...</span>
                )}

                {executionResult && (
                  <div className="space-y-4">
                    <div className="flex items-center flex-wrap gap-3">
                      <span className={`text-lg font-bold ${
                        executionResult.status === 'Accepted' ? 'text-green-500' : 
                        executionResult.status === 'Wrong Answer' ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        {executionResult.status}
                      </span>
                      
                      {executionResult.totalCount !== undefined && (
                        <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs border border-gray-700 font-medium">
                          {executionResult.passedCount} / {executionResult.totalCount} Test Cases Passed
                        </span>
                      )}
                    </div>

                    {executionResult.details?.compilationError ? (
                      <div className="p-3 bg-red-950/50 border border-red-900 rounded text-red-400 overflow-x-auto whitespace-pre-wrap">
                        {executionResult.details.compilationError}
                      </div>
                    ) : executionResult.details?.testResults ? (
                      <div>
                        {/* Case Pills */}
                        <div className="flex space-x-2 mb-4">
                          {executionResult.details.testResults.map((tr, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveResultCase(idx)}
                              className={`px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-2 ${activeResultCase === idx ? 'bg-gray-700 text-white' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}
                            >
                              <div className={`w-2 h-2 rounded-full ${tr.passed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span>Case {idx + 1}</span>
                            </button>
                          ))}
                        </div>
                        
                        {/* Selected Case Detail */}
                        {executionResult.details.testResults[activeResultCase] && (
                          <div className="space-y-3">
                            <div className="p-3 bg-gray-800 rounded border border-gray-700">
                              <span className="text-gray-500 block text-xs font-bold mb-1 uppercase tracking-wider">Input:</span>
                              <code className="text-gray-300">{executionResult.details.testResults[activeResultCase].input}</code>
                            </div>
                            <div className="p-3 bg-gray-800 rounded border border-gray-700">
                              <span className="text-gray-500 block text-xs font-bold mb-1 uppercase tracking-wider">Actual Output:</span>
                              <code className={executionResult.details.testResults[activeResultCase].passed ? "text-green-400" : "text-red-400"}>
                                {executionResult.details.testResults[activeResultCase].actual || ' '}
                              </code>
                            </div>
                            {executionResult.details.testResults[activeResultCase].expected !== 'Custom Output Not Validated' && (
                              <div className="p-3 bg-gray-800 rounded border border-gray-700">
                                <span className="text-gray-500 block text-xs font-bold mb-1 uppercase tracking-wider">Expected Output:</span>
                                <code className="text-green-400">{executionResult.details.testResults[activeResultCase].expected}</code>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : executionResult.details?.failedTestCase && (
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-800 rounded border border-gray-700">
                          <span className="text-gray-500 block text-xs font-bold mb-1 uppercase tracking-wider">Input:</span>
                          <code className="text-gray-300">{executionResult.details.failedTestCase.input}</code>
                        </div>
                        <div className="p-3 bg-gray-800 rounded border border-red-900/50">
                          <span className="text-gray-500 block text-xs font-bold mb-1 uppercase tracking-wider">Actual Output:</span>
                          <code className="text-red-400">{executionResult.details.failedTestCase.actual}</code>
                        </div>
                        <div className="p-3 bg-gray-800 rounded border border-gray-700">
                          <span className="text-gray-500 block text-xs font-bold mb-1 uppercase tracking-wider">Expected Output:</span>
                          <code className="text-green-400">{executionResult.details.failedTestCase.expected}</code>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'dry-run' && (
              <textarea 
                value={dryRunText}
                onChange={(e) => setDryRunText(e.target.value)}
                placeholder="Use this space to manually track variable states during your dry run...&#10;e.g. i=0, j=5, currentSum=10"
                className="w-full h-full bg-transparent text-green-400 font-mono text-sm focus:outline-none resize-none placeholder-gray-600 leading-relaxed"
                spellCheck="false"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateWorkspace;
