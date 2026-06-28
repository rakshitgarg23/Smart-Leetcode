const supabase = require('../config/supabaseClient');
const crypto = require('crypto');

exports.createRoom = async (req, res) => {
  try {
    const { userId, username } = req.body;
    
    // Generate unique room ID
    const roomId = crypto.randomBytes(4).toString('hex');
    
    // Pick a random 'Medium' question for the match
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id')
      .eq('difficulty', 'Medium');
      
    if (error || !questions || questions.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch questions pool' });
    }
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    
    res.status(200).json({ 
      roomId,
      questionId: randomQuestion.id,
      message: 'Room created successfully. Share the roomId to invite opponent.'
    });
  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({ error: 'Server error creating room' });
  }
};
