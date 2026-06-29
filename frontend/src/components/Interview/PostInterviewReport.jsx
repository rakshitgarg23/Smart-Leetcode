import React from 'react';
import { useNavigate } from 'react-router-dom';

const PostInterviewReport = ({ data }) => {
  const navigate = useNavigate();
  
  if (!data) return null;

  const { finalRubric, status, notes, finalCode } = data;
  const isPass = status === 'Pass';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start bg-gray-900 text-white p-8 overflow-y-auto">
      
      <div className="max-w-4xl w-full">
        {/* Header Section */}
        <div className={`p-6 rounded-t-xl border-b-0 border border-gray-700 shadow-lg ${isPass ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold mb-1">Interview Concluded</h1>
              <p className="text-gray-400 text-sm">Post-Interview Evaluation Report</p>
            </div>
            <div className={`px-6 py-2 rounded shadow-lg border text-2xl font-bold uppercase tracking-widest ${
              isPass 
                ? 'bg-green-600 border-green-500 text-white shadow-green-500/50' 
                : 'bg-red-600 border-red-500 text-white shadow-red-500/50'
            }`}>
              {status}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-gray-800 p-8 rounded-b-xl border border-gray-700 shadow-2xl space-y-8">
          
          {/* Interviewer Notes */}
          <section>
            <h2 className="text-lg font-bold text-gray-200 mb-3 border-b border-gray-700 pb-2 flex items-center space-x-2">
              <span>📝</span>
              <span>Interviewer Feedback</span>
            </h2>
            <div className="bg-gray-900/50 p-4 rounded text-gray-300 whitespace-pre-wrap font-serif italic border border-gray-700/50">
              {notes || "No additional feedback provided."}
            </div>
          </section>

          {/* Rubric Checklist */}
          <section>
            <h2 className="text-lg font-bold text-gray-200 mb-3 border-b border-gray-700 pb-2 flex items-center space-x-2">
              <span>✅</span>
              <span>Performance Rubric</span>
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {finalRubric.map(item => (
                <li key={item.id} className="flex items-start space-x-3 bg-gray-900/30 p-3 rounded border border-gray-700/50">
                  <span className="mt-0.5">
                    {item.checked ? (
                      <span className="text-green-500 text-lg">☑</span>
                    ) : (
                      <span className="text-red-500 text-lg">☒</span>
                    )}
                  </span>
                  <span className={`text-sm ${item.checked ? 'text-gray-200' : 'text-gray-500 line-through'}`}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Submitted Code */}
          <section>
            <h2 className="text-lg font-bold text-gray-200 mb-3 border-b border-gray-700 pb-2 flex items-center space-x-2">
              <span>💻</span>
              <span>Final Code Snapshot</span>
            </h2>
            <div className="bg-[#1e1e1e] p-4 rounded-lg border border-gray-700 shadow-inner overflow-x-auto">
              <pre className="text-sm font-mono text-gray-300">
                <code>{finalCode || "// No code was written."}</code>
              </pre>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex justify-end pt-4 border-t border-gray-700">
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg transition-transform hover:scale-105"
            >
              Return to Home
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default PostInterviewReport;
