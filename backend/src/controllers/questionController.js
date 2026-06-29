const supabase = require('../config/supabaseClient');

exports.getQuestions = async (req, res) => {
  try {
    const { topic_id, difficulty, userId } = req.query;
    
    let query = supabase.from('questions').select('id, title, topic_id, difficulty, description, test_cases, starter_code, cheatsheet');
    
    if (topic_id) {
      query = query.eq('topic_id', topic_id);
    }
    
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error } = await query;

    if (error) throw error;

    let solvedIds = new Set();
    if (userId) {
      const { data: solves } = await supabase
        .from('submissions')
        .select('question_id')
        .eq('user_id', userId)
        .eq('status', 'Accepted');
        
      if (solves) {
        solves.forEach(s => solvedIds.add(s.question_id));
      }
    }

    const enrichedData = data.map(q => ({
      ...q,
      is_solved: solvedIds.has(q.id)
    }));

    res.status(200).json(enrichedData);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Question not found' });

    // Exclude test cases from client response to prevent cheating, 
    // unless the client explicitly needs them. For now, returning everything.
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getRecommendation = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required for recommendations' });
    }

    // 1. Fetch user's submission history
    const { data: submissions, error: subError } = await supabase
      .from('submissions')
      .select('question_id, status, execution_time_ms, questions(topic_id)')
      .eq('user_id', userId);

    if (subError) throw subError;

    // 2. Identify Weakest Topic based on Failure Rate
    const topicStats = {};
    const solvedQuestions = new Set();

    if (submissions && submissions.length > 0) {
      submissions.forEach(sub => {
        const topicId = sub.questions?.topic_id;
        if (!topicId) return;

        if (!topicStats[topicId]) {
          topicStats[topicId] = { attempts: 0, failures: 0 };
        }

        topicStats[topicId].attempts += 1;
        if (sub.status !== 'Accepted') {
          topicStats[topicId].failures += 1;
        } else {
          solvedQuestions.add(sub.question_id);
        }
      });
    }

    let weakestTopicId = null;
    let highestFailureRate = -1;

    for (const [topicId, stats] of Object.entries(topicStats)) {
      const failureRate = stats.failures / stats.attempts;
      if (failureRate > highestFailureRate) {
        highestFailureRate = failureRate;
        weakestTopicId = topicId;
      }
    }

    // 3. Query questions table to return 1 unsolved question from the weakest topic (or any if no data)
    let query = supabase.from('questions').select('id, title, topic_id, difficulty, description');
    
    if (weakestTopicId) {
      query = query.eq('topic_id', weakestTopicId);
    }
    
    // Convert solved set to array for NOT IN filter
    if (solvedQuestions.size > 0) {
       // Supabase doesn't easily support NOT IN with huge arrays in select directly, 
       // but we can fetch candidates and filter, or use filter strings.
       // We'll fetch a batch and filter in memory for simplicity.
       query = query.limit(50); 
    }

    const { data: candidates, error: qError } = await query;
    if (qError) throw qError;

    let recommendation = null;
    if (candidates && candidates.length > 0) {
      // Find first unsolved
      recommendation = candidates.find(q => !solvedQuestions.has(q.id));
      
      // If all solved in the weak topic, fallback to any unsolved
      if (!recommendation) {
         const { data: fallbackCandidates } = await supabase.from('questions').select('id, title, topic_id, difficulty, description').limit(50);
         recommendation = fallbackCandidates.find(q => !solvedQuestions.has(q.id)) || fallbackCandidates[0];
      }
    }

    res.status(200).json({
      recommendation,
      weakestTopicId,
      reason: weakestTopicId ? `Based on your high failure rate in this topic.` : `Getting you started with a fresh topic.`
    });

  } catch (error) {
    console.error('Error generating recommendation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
