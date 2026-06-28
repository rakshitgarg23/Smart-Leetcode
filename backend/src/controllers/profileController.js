const supabase = require('../config/supabaseClient');

exports.getProfile = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Fetch user basic info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, is_public')
      .eq('username', username)
      .single();

    if (userError) throw userError;
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.is_public) return res.status(403).json({ error: 'This profile is private' });

    // Fetch user stats
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('streak, total_score, easy_solved, medium_solved, hard_solved, total_hints_used')
      .eq('user_id', user.id)
      .single();

    if (statsError) throw statsError;

    res.status(200).json({
      username: user.username,
      stats: stats || {
        streak: 0,
        total_score: 0,
        easy_solved: 0,
        medium_solved: 0,
        hard_solved: 0,
        total_hints_used: 0
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getHeatmap = async (req, res) => {
  try {
    const { username } = req.params;

    // Fetch user to get user_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (userError) throw userError;
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fetch submissions from last 365 days
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const { data: submissions, error: subError } = await supabase
      .from('submissions')
      .select('status, hints_used, submitted_at')
      .eq('user_id', user.id)
      .gte('submitted_at', oneYearAgo.toISOString());

    if (subError) throw subError;

    // Group by date (YYYY-MM-DD)
    const grouped = {};
    submissions.forEach(sub => {
      const date = new Date(sub.submitted_at).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { hasAccepted: false, minHintsAccepted: Infinity, hasAttempt: true, totalSubmissions: 0 };
      }
      
      grouped[date].totalSubmissions += 1;

      if (sub.status === 'Accepted') {
        grouped[date].hasAccepted = true;
        if (sub.hints_used < grouped[date].minHintsAccepted) {
          grouped[date].minHintsAccepted = sub.hints_used;
        }
      }
    });

    // Map to colors
    const heatmap = Object.keys(grouped).map(date => {
      const dayData = grouped[date];
      let color = 'red'; // Default if attempted but never accepted

      if (dayData.hasAccepted) {
        if (dayData.minHintsAccepted === 0) color = 'green';
        else if (dayData.minHintsAccepted === 1) color = 'greenish-yellow';
        else if (dayData.minHintsAccepted === 2 || dayData.minHintsAccepted === 3) color = 'yellow';
        else color = 'red'; // >= 4 hints
      }

      return { date, color, totalSubmissions: dayData.totalSubmissions };
    });

    res.status(200).json(heatmap);

  } catch (error) {
    console.error('Error fetching heatmap:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
