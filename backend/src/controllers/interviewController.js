const supabase = require('../config/supabaseClient');

// Save a new mock interview
exports.saveInterview = async (req, res) => {
  try {
    const { room_id, host_username, guest_username, question_title, status, feedback, rubric } = req.body;

    if (!room_id || !host_username || !guest_username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('mock_interviews')
      .insert([{ room_id, host_username, guest_username, question_title, status, feedback, rubric }])
      .select();

    if (error) {
      console.error('Supabase error inserting interview:', error);
      return res.status(500).json({ error: error.message });
    }

    // Attempt to update stats asynchronously (don't block the response)
    if (status === 'Pass') {
      (async () => {
        try {
          // 1. Get User IDs
          const [{ data: hostUser }, { data: guestUser }, { data: question }] = await Promise.all([
            supabase.from('users').select('id').eq('username', host_username).single(),
            supabase.from('users').select('id').eq('username', guest_username).single(),
            supabase.from('questions').select('id, difficulty').eq('title', question_title).single()
          ]);

          if (hostUser && guestUser) {
            const hostId = hostUser.id;
            const guestId = guestUser.id;
            const difficulty = question ? question.difficulty : 'Medium'; // fallback

            // 2. Fetch current stats
            const [{ data: hostStats }, { data: guestStats }] = await Promise.all([
              supabase.from('user_stats').select('*').eq('user_id', hostId).single(),
              supabase.from('user_stats').select('*').eq('user_id', guestId).single()
            ]);

            // 3. Update Host (+20 points for interviewing)
            if (hostStats) {
              await supabase.from('user_stats').update({
                total_score: hostStats.total_score + 20
              }).eq('user_id', hostId);
            }

            // Check if Guest has already solved this problem (Mock or Practice)
            const [{ data: prevMocks }, { data: prevSubs }] = await Promise.all([
              supabase.from('mock_interviews').select('id').eq('guest_username', guest_username).eq('question_title', question_title).eq('status', 'Pass').limit(2),
              question ? supabase.from('submissions').select('id').eq('user_id', guestId).eq('question_id', question.id).eq('status', 'Accepted').limit(1) : { data: null }
            ]);

            const hasSolvedMock = prevMocks && prevMocks.length > 1; // >1 because current pass is already inserted
            const hasSolvedPractice = prevSubs && prevSubs.length > 0;
            const isFirstSolve = !hasSolvedMock && !hasSolvedPractice;

            // 4. Update Guest (Score + Solved count based on difficulty) IF first solve
            if (guestStats && isFirstSolve) {
              let points = 10;
              const updates = {};
              
              if (difficulty === 'Easy') {
                points = 10;
                updates.easy_solved = guestStats.easy_solved + 1;
              } else if (difficulty === 'Medium') {
                points = 20;
                updates.medium_solved = guestStats.medium_solved + 1;
              } else if (difficulty === 'Hard') {
                points = 30;
                updates.hard_solved = guestStats.hard_solved + 1;
              }

              updates.total_score = guestStats.total_score + points;
              await supabase.from('user_stats').update(updates).eq('user_id', guestId);
            }
          }
        } catch (statsErr) {
          console.error("Failed to update stats after interview:", statsErr);
        }
      })();
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Server error saving interview:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Get interviews where user is the candidate (guest)
exports.getCandidateInterviews = async (req, res) => {
  try {
    const { username } = req.params;
    const { data, error } = await supabase
      .from('mock_interviews')
      .select('*')
      .eq('guest_username', username)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching candidate interviews:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

// Get interviews where user is the interviewer (host)
exports.getInterviewerInterviews = async (req, res) => {
  try {
    const { username } = req.params;
    const { data, error } = await supabase
      .from('mock_interviews')
      .select('*')
      .eq('host_username', username)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching interviewer interviews:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};
