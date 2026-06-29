import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Problem from './pages/Problem';
import Problems from './pages/Problems';
import SparringArena from './pages/SparringArena';
import InterviewArena from './pages/InterviewArena';
import { useServerHeartbeat } from './hooks/useServerHeartbeat';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function AppContent() {
  // Mount the keep-alive heartbeat hook at the root level
  useServerHeartbeat();

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/problems" 
            element={
              <ProtectedRoute>
                <Problems />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/:username" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/problem/:id" 
            element={
              <ProtectedRoute>
                <Problem />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sparring/:roomId" 
            element={
              <ProtectedRoute>
                <SparringArena />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/interview/:roomId" 
            element={
              <ProtectedRoute>
                <InterviewArena />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
