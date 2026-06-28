import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        if (!username) {
          setErrorMsg('Username is required for signup.');
          setLoading(false);
          return;
        }
        
        // Pass username in user_metadata so our Postgres trigger catches it
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }
          }
        });
        if (error) throw error;
        
        // Successful signup often logs you in automatically if email verification is off
        // Or you can show a message to verify email. For this app, we'll navigate.
        navigate('/');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <h2 className="text-3xl font-bold mb-6 text-center text-white">
          {isSignUp ? 'Create an Account' : 'Sign In'}
        </h2>
        
        {errorMsg && (
          <div className="mb-4 p-3 rounded bg-red-900/50 border border-red-500 text-red-300 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500" 
              required
            />
          )}
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500" 
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500" 
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded transition-colors shadow-lg hover:shadow-blue-500/50"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
