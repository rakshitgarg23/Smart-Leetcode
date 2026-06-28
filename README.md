# 🚀 Smart Leetcode

**[Live link ](https://minileetcode-1.onrender.com/)**

Smart Leetcode is a modern, real-time web application built with **React, Node.js, and Supabase**. It allows users to practice coding algorithms, compete against others in real-time, and get hints from an AI tutor.

---

## 🎯 The Vision

Learning Data Structures and Algorithms on traditional platforms can often feel isolating, frustrating, and punishing. When you get stuck, your only option is usually to give up and read the solution, completely ruining the learning process. Smart Leetcode solves this by introducing a supportive **AI Mentor** to nudge you in the right direction, and **Multiplayer Sparring** to make coding social and competitive!

### Why Smart Leetcode?
While traditional platforms focus strictly on grinding out hundreds of problems, Smart Leetcode focuses on **gamification and active learning**:
1. **No More Reading Solutions:** Instead of giving up, our AI Mentor analyzes your exact code and gives you a tiny hint to help you solve it yourself.
2. **Visual Accountability:** We don't just track if you solved a problem; our custom Heatmap tracks *how cleanly* you solved it. Relying too heavily on AI hints will permanently turn your heatmap yellow or red, and break your streaks!
3. **Multiplayer by Default:** Coding shouldn't be lonely. Challenge a friend to a 1v1 battle, see their live progress, and race to the finish!

---

## ✨ Core Features

- **🏆 Practice Arena:** Solve a curated list of Easy, Medium, and Hard coding questions. Write code directly in the browser with Monaco Editor and run tests in real-time.
- **🧠 AI Mentor:** Click "Get a Hint" and our Google Gemini-powered AI Mentor will analyze your current code and give you a gentle nudge in the right direction!
- **⚔️ Sparring Mode (Multiplayer 1v1):** Challenge your friends to a coding battle! Create a room, share the link, and race to solve a random Medium difficulty question. See each other's live progress and submission results instantly via WebSockets (`Socket.io`).
- **📊 Detailed Profiles & Custom Heatmap:** Track your Global Score and Clean Streak. Your Activity Heatmap uses custom color-coding based on your reliance on hints (Green = Flawless, Yellow = Heavy Hint Usage, Red = Streak Broken).
- **⚖️ Profile Comparison:** Enter an opponent's username to get a side-by-side statistical comparison of your scores, streaks, and solved problem counts. 
- **🌐 Multi-Language Support:** Write and submit solutions in **JavaScript (Node.js)**, **Python 3**, **C++**, and **Java**.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React + Vite
- **Styling:** TailwindCSS
- **Code Editor:** `@monaco-editor/react`
- **Routing:** React Router DOM
- **Real-time:** `socket.io-client`

### Backend
- **Server:** Node.js + Express
- **Real-time:** `socket.io`
- **AI Integration:** `@google/generative-ai` (Gemini 1.5 Flash)
- **Database:** Supabase (PostgreSQL)
- **Code Execution:** Local child processes (Python/GCC via Docker)

---

## 🚀 How to Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/rakshitgarg23/Smart-Leetcode.git
cd SmartLeetcode
```

### 2. Set up the Backend
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
```

Start the backend server:
```bash
npm start
```
*(The backend will start on http://localhost:3000)*

### 3. Set up the Frontend
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_BACKEND_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the Vite development server:
```bash
npm run dev
```
*(The frontend will start on http://localhost:5173)*

---

## 🗄️ Database Setup (Supabase)

To set up your Supabase database, execute the SQL files found in the `database/` folder in your Supabase SQL Editor:
1. Run `database/schema.sql` to create the tables (`users`, `questions`, `submissions`, `question_sessions`).
2. Run `database/triggers.sql` to set up the automated triggers (like streak calculations and user registration).
3. Run `database/seed.sql` to populate your database with dummy questions and test data.
