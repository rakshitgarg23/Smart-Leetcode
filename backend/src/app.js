const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const profileRoutes = require('./routes/profileRoutes');
const codeRoutes = require('./routes/codeRoutes');
const sparringRoutes = require('./routes/sparringRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const supabase = require('./config/supabaseClient');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/sparring', sparringRoutes);
app.use('/api/interviews', interviewRoutes);

// Keep-Alive Route (Ping DB to prevent Supabase project pause)
app.get('/api/keep-alive', async (req, res) => {
  try {
    // Lightweight query to keep the database awake
    const { error } = await supabase.from('users').select('id').limit(1);
    
    if (error) throw error;
    
    res.status(200).json({ status: 'ok', message: 'Backend and Database are awake.' });
  } catch (err) {
    console.error('Keep-alive ping failed:', err);
    res.status(500).json({ status: 'error', message: 'Failed to ping database.' });
  }
});

// Basic 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
