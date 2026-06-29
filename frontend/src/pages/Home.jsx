import { Link } from 'react-router-dom';

const Home = () => {
  const demoRoomId = Math.random().toString(36).substring(7);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-6 text-center tracking-tight">
        Welcome to Smart Leetcode
      </h1>
      <p className="text-xl text-gray-400 max-w-2xl text-center mb-8">
        A highly gamified, free competitive programming platform. Master algorithms, challenge friends, and build your ultimate coding streak.
      </p>

      <div className="flex gap-4">
        <Link 
          to="/problems"
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg transition-transform hover:scale-105"
        >
          Start Coding
        </Link>
        <Link 
          to={`/interview/${demoRoomId}`}
          className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg transition-transform hover:scale-105"
        >
          Mock Interview
        </Link>
      </div>
    </div>
  );
};

export default Home;
