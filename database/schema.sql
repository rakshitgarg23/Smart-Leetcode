-- Enums
CREATE TYPE difficulty_level AS ENUM ('Easy', 'Medium', 'Hard');
CREATE TYPE submission_status AS ENUM ('Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error');
CREATE TYPE match_status AS ENUM ('Pending', 'Active', 'Completed', 'Cancelled');

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Stats (For quick profile loading & scoring)
CREATE TABLE user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    streak INT DEFAULT 0,
    total_score INT DEFAULT 0,
    easy_solved INT DEFAULT 0,
    medium_solved INT DEFAULT 0,
    hard_solved INT DEFAULT 0,
    total_hints_used INT DEFAULT 0
);

-- Topics
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Questions
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) UNIQUE NOT NULL,
    topic_id INT REFERENCES topics(id) ON DELETE SET NULL,
    difficulty difficulty_level NOT NULL,
    description TEXT NOT NULL,
    test_cases JSONB NOT NULL, -- Format: [{ input: "...", expected_output: "..." }]
    starter_code JSONB DEFAULT '{}'::jsonb, -- Format: { "cpp": "...", "javascript": "...", "python": "..." }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions (Powers the Dynamic Heatmap and Analytics)
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    status submission_status NOT NULL,
    execution_time_ms INT,
    hints_used INT DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sparring Matches
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player1_id UUID REFERENCES users(id),
    player2_id UUID REFERENCES users(id),
    question_id UUID REFERENCES questions(id),
    status match_status DEFAULT 'Pending',
    winner_id UUID REFERENCES users(id) NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_submissions_user_date ON submissions(user_id, submitted_at);
CREATE INDEX idx_questions_topic_difficulty ON questions(topic_id, difficulty);
CREATE INDEX idx_users_username ON users(username);

-- Active session tracking for AI Hints
CREATE TABLE question_sessions (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    hints_used INT DEFAULT 0,
    PRIMARY KEY (user_id, question_id)
);
