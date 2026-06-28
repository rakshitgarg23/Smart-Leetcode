import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const Problems = () => {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await api.get('/api/questions');
        setQuestions(response.data);
      } catch (error) {
        console.error('Failed to fetch questions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  if (isLoading) {
    return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-white">Loading problems...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-900 text-gray-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Practice Problems</h1>
        
        {questions.length === 0 ? (
          <div className="text-gray-400">No problems found in the database.</div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-750 border-b border-gray-700">
                  <th className="px-6 py-4 font-semibold text-gray-300">Title</th>
                  <th className="px-6 py-4 font-semibold text-gray-300">Difficulty</th>
                  <th className="px-6 py-4 font-semibold text-gray-300 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, idx) => (
                  <tr key={q.id} className={`border-b border-gray-750 hover:bg-gray-750 transition-colors ${idx % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-800'}`}>
                    <td className="px-6 py-4 text-white font-medium">{q.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold 
                        ${q.difficulty === 'Easy' ? 'bg-green-900/50 text-green-400 border border-green-800' : 
                          q.difficulty === 'Medium' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-800' : 
                          'bg-red-900/50 text-red-400 border border-red-800'}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/problem/${q.id}`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors text-sm shadow-md shadow-blue-500/20"
                      >
                        Solve
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Problems;
