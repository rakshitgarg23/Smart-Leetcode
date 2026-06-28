const supabase = require('../config/supabaseClient');
const { execSync } = require('child_process');
const fsModule = require('fs');
const path = require('path');
const os = require('os');
const { GoogleGenerativeAI } = require('@google/generative-ai');

function executeCodeLocally(language, sourceCode, stdin) {
  const tmpDir = os.tmpdir();
  const fileName = 'main_' + Date.now() + Math.floor(Math.random() * 1000);
  let result = { run: { code: 0, stdout: '', output: '' }, compile: { code: 0, output: '' } };

  try {
    if (language === 'javascript') {
      const filePath = path.join(tmpDir, fileName + '.js');
      fsModule.writeFileSync(filePath, sourceCode);
      try {
        result.run.stdout = execSync('node ' + filePath, { input: stdin, timeout: 3000, encoding: 'utf-8', stdio: 'pipe' });
      } catch (err) {
        result.run.code = err.status || 1;
        result.run.output = err.stderr || err.message;
      }
      if (fsModule.existsSync(filePath)) fsModule.unlinkSync(filePath);
    } else if (language === 'python') {
      const filePath = path.join(tmpDir, fileName + '.py');
      fsModule.writeFileSync(filePath, sourceCode);
      try {
        result.run.stdout = execSync('python ' + filePath, { input: stdin, timeout: 3000, encoding: 'utf-8', stdio: 'pipe' });
      } catch (err) {
        result.run.code = err.status || 1;
        result.run.output = err.stderr || err.message;
      }
      if (fsModule.existsSync(filePath)) fsModule.unlinkSync(filePath);
    } else if (language === 'cpp') {
      const filePath = path.join(tmpDir, fileName + '.cpp');
      const exePath = path.join(tmpDir, fileName + '.exe');
      fsModule.writeFileSync(filePath, sourceCode);
      try {
        execSync('g++ ' + filePath + ' -o ' + exePath, { timeout: 10000, encoding: 'utf-8', stdio: 'pipe' });
        try {
          result.run.stdout = execSync(exePath, { input: stdin, timeout: 3000, encoding: 'utf-8', stdio: 'pipe' });
        } catch (runErr) {
          result.run.code = runErr.status || 1;
          result.run.output = runErr.stderr || runErr.message;
        }
        if (fsModule.existsSync(exePath)) fsModule.unlinkSync(exePath);
      } catch (compileErr) {
        result.compile.code = compileErr.status || 1;
        result.compile.output = compileErr.stderr || compileErr.message;
      }
      if (fsModule.existsSync(filePath)) fsModule.unlinkSync(filePath);
    } else {
      result.run.code = 1;
      result.run.output = 'Language not supported locally';
    }
  } catch (e) {
    result.run.code = 1;
    result.run.output = 'Local execution wrapper failed: ' + e.message;
  }
  return result;
}

const PISTON_LANGUAGE_MAP = {
  'javascript': { language: 'javascript', version: '18.15.0' },
  'python': { language: 'python', version: '3.10.0' },
  'cpp': { language: 'c++', version: '10.2.0' },
  'java': { language: 'java', version: '15.0.2' },
};

const POINTS_MAP = {
  'Easy': 10,
  'Medium': 20,
  'Hard': 40
};

const HINT_PENALTY = 5;

exports.submitCode = async (req, res) => {
  try {
    const { userId, questionId, sourceCode, language, isRun, customInput } = req.body;

    if (!userId || !questionId || !sourceCode || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Fetch Question Data
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('test_cases, difficulty')
      .eq('id', questionId)
      .single();

    if (questionError || !question || !question.test_cases) {
      return res.status(404).json({ error: 'Question or test cases not found' });
    }

    // 2. Fetch hints used from DB tracking
    const { data: session } = await supabase
      .from('question_sessions')
      .select('hints_used')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle();

    const hintsUsed = session ? session.hints_used : 0;

    let testCases = [];
    if (isRun && customInput !== undefined && customInput.trim() !== '') {
      testCases = [{ input: customInput, expected_output: 'Custom Output Not Validated' }];
    } else {
      testCases = question.test_cases;
      if (isRun) {
        testCases = testCases.slice(0, 2); // Only run against first 2 test cases
      }
    }

    let allPassed = true;
    let compilationError = null;
    let passedCount = 0;
    const totalCount = testCases.length;
    let testResults = [];

    const langConfig = PISTON_LANGUAGE_MAP[language];
    if (!langConfig) return res.status(400).json({ error: 'Unsupported language' });

    // 3. Execute Code via Piston
    for (const testCase of testCases) {
      const result = executeCodeLocally(language, sourceCode, testCase.input);

      if (result.compile && result.compile.code !== 0) {
        compilationError = result.compile.output;
        allPassed = false;
        break;
      }

      if (result.run && result.run.code !== 0) {
        compilationError = result.run.output;
        allPassed = false;
        break; // Runtime errors abort execution
      }

      const actualOutput = (result.run.stdout || '').trim();
      const expectedOutput = (testCase.expected_output || '').trim();
      const isPassed = (isRun && customInput !== undefined && customInput.trim() !== '') ? true : (actualOutput === expectedOutput);

      testResults.push({
        input: testCase.input,
        expected: expectedOutput,
        actual: actualOutput,
        passed: isPassed
      });

      if (!isPassed) {
        allPassed = false;
        if (!isRun) break; // Break early on Submit to save compute
      } else {
        passedCount++;
      }
    }

    let status = 'Accepted';
    if (compilationError) status = 'Compilation Error';
    else if (!allPassed) status = 'Wrong Answer';

    let pointsEarned = 0;

    // Only log and score if this is an official submit
    if (!isRun) {
      // 4. Database Logging (Heatmap & History)
      const { error: submissionError } = await supabase.from('submissions').insert({
        user_id: userId,
        question_id: questionId,
        code: sourceCode,
        language: language,
        status: status,
        hints_used: hintsUsed
      });

      if (submissionError) console.error("Error logging submission:", submissionError);

      // 5. The Gamification & Scoring Math (Only if Accepted)
      let pointsEarned = 0;
      if (status === 'Accepted') {
        const { data: userStats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (userStats) {
          const { data: previousSolves } = await supabase
            .from('submissions')
            .select('id')
            .eq('user_id', userId)
            .eq('question_id', questionId)
            .eq('status', 'Accepted')
            .limit(2);

          const isFirstSolve = previousSolves && previousSolves.length === 1;

          if (isFirstSolve) {
            const { data: previousAccepted } = await supabase
              .from('submissions')
              .select('submitted_at')
              .eq('user_id', userId)
              .eq('status', 'Accepted')
              .order('submitted_at', { ascending: false })
              .limit(2);

            let newStreak = userStats.streak;

            if (previousAccepted && previousAccepted.length > 1) {
              const lastDate = new Date(previousAccepted[1].submitted_at);
              const currentDate = new Date();

              lastDate.setHours(0, 0, 0, 0);
              const today = new Date(currentDate);
              today.setHours(0, 0, 0, 0);

              const diffTime = Math.abs(today - lastDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays === 1) {
                newStreak += 1;
              } else if (diffDays > 1) {
                newStreak = 1;
              }
            } else {
              newStreak = 1;
            }

            const basePoints = POINTS_MAP[question.difficulty] || 10;

            // Apply Custom Logic for Visual Reward / Penalties based on Hints
            let multiplier = 1.0;
            if (hintsUsed === 0) {
              // Flawless - Maintains streak, full multiplier
              multiplier = 1.0;
            } else if (hintsUsed === 1) {
              // Slightly breaks clean status, reduces multiplier
              multiplier = 0.8;
            } else if (hintsUsed >= 2 && hintsUsed <= 3) {
              // Heavy point penalty
              multiplier = 0.5;
            } else if (hintsUsed >= 4) {
              // Breaks the streak entirely!
              newStreak = 0;
              multiplier = 0;
            }

            pointsEarned = Math.max(0, Math.floor(basePoints * newStreak * multiplier));

            const newTotalScore = userStats.total_score + pointsEarned;

            const updates = {
              streak: newStreak,
              total_score: newTotalScore,
              total_hints_used: userStats.total_hints_used + hintsUsed
            };

            if (question.difficulty === 'Easy') updates.easy_solved = userStats.easy_solved + 1;
            if (question.difficulty === 'Medium') updates.medium_solved = userStats.medium_solved + 1;
            if (question.difficulty === 'Hard') updates.hard_solved = userStats.hard_solved + 1;

            await supabase.from('user_stats').update(updates).eq('user_id', userId);

            // Clear hints tracker since problem is solved
            await supabase.from('question_sessions').delete().eq('user_id', userId).eq('question_id', questionId);
          }
        }
      }
    } // End of !isRun check

    res.status(200).json({
      status,
      message: status === 'Accepted' ? 'All test cases passed!' : 'Code execution failed',
      pointsEarned,
      passedCount,
      totalCount,
      details: {
        compilationError,
        testResults,
        failedTestCase: testResults.find(tr => !tr.passed)
      }
    });

  } catch (error) {
    console.error('Error in execution engine:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.generateHint = async (req, res) => {
  try {
    const { userId, questionId, sourceCode } = req.body;

    if (!userId || !questionId) {
      return res.status(400).json({ error: 'userId and questionId are required' });
    }

    // 1. Check if the user has already solved this question
    const { data: previousSolve } = await supabase
      .from('submissions')
      .select('id')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .eq('status', 'Accepted')
      .limit(1);

    if (previousSolve && previousSolve.length > 0) {
      return res.status(200).json({
        hint: "You have already solved this problem perfectly! No hints needed.",
        totalHintsUsed: 0,
        message: 'Already solved'
      });
    }

    // 2. Fetch Question Description to provide context to the AI
    const { data: question } = await supabase
      .from('questions')
      .select('title, description')
      .eq('id', questionId)
      .single();

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // 3. Call Google Gemini API
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert coding mentor helping a student solve a LeetCode-style problem.
Problem Title: ${question.title}
Problem Description: ${question.description}

Here is the student's current code:
\`\`\`
${sourceCode || "(Student hasn't written any code yet)"}
\`\`\`

Analyze their code and provide ONE short, encouraging hint. 
CRITICAL RULES:
1. DO NOT give them the direct answer or the full code.
2. Point out a specific logic flaw or edge case they missed, or suggest a data structure.
3. Keep it under 3 sentences. Be extremely concise and helpful.`;

    let newHint;
    try {
      const aiResult = await model.generateContent(prompt);
      newHint = aiResult.response.text();
    } catch (apiError) {
      console.warn("Google API failed, using fallback hint:", apiError.message);
      // Fallback hint based on question difficulty or general logic
      newHint = "AI API is temporarily unavailable for your region/key. Here is a general hint: Try breaking down the problem by writing out 2 or 3 simple test cases on paper, and see if a loop or hash map can simplify the logic!";
    }

    // 4. Track hints used in question_sessions
    const { data: session } = await supabase
      .from('question_sessions')
      .select('hints_used')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle();

    const currentHintsUsed = session ? session.hints_used : 0;
    const newHintsUsed = currentHintsUsed + 1;

    if (session) {
      await supabase.from('question_sessions').update({ hints_used: newHintsUsed }).eq('user_id', userId).eq('question_id', questionId);
    } else {
      await supabase.from('question_sessions').insert({ user_id: userId, question_id: questionId, hints_used: 1 });
    }

    res.status(200).json({
      hint: newHint,
      totalHintsUsed: newHintsUsed,
      message: 'AI Hint generated and penalty tracker incremented.'
    });

  } catch (error) {
    console.error('Error fetching hint from AI:', error);
    res.status(500).json({ error: error.message || 'Internal server error fetching AI hint' });
  }
};
