# 🚀 Smart Leetcode

**[Live link ](https://minileetcode-1.onrender.com/)**

---
Smart Leetcode is a modern, real-time web application built with **React, Node.js, and Supabase**. It allows users to practice coding algorithms, compete against others in real-time, conduct structured mock interviews, and receive targeted hints from an AI tutor.

---

## 🎯 The Vision

Learning Data Structures and Algorithms on traditional platforms can often feel isolating, frustrating, and punishing. When you get stuck, your only option is usually to give up and read the solution, completely ruining the learning process. Smart Leetcode solves this by introducing a supportive **AI Mentor** to nudge you in the right direction, **Multiplayer Sparring** to make coding social, and **Mock Interview** rooms to prepare for real-world technical screens!

### Why Smart Leetcode?
While traditional platforms focus strictly on grinding out hundreds of problems, Smart Leetcode focuses on **gamification and active learning**:
1. **No More Reading Solutions:** Instead of giving up, our AI Mentor analyzes your exact code and gives you a tiny hint to help you solve it yourself.
2. **Visual Accountability:** We don't just track if you solved a problem; our custom Heatmap tracks *how cleanly* you solved it. Relying too heavily on AI hints will permanently turn your heatmap yellow or red, and break your streaks!
3. **Multiplayer & Collaborative by Default:** Coding shouldn't be lonely. Challenge a friend to a 1v1 battle or conduct a formal Mock Interview with real-time code synchronization.

---

## 🏛️ Project Architecture

Smart Leetcode is built with a highly scalable, decoupled architecture to handle real-time synchronization, secure code execution, and data persistence:

- **Client Layer (React + Vite):** A responsive, single-page application utilizing `react-router-dom` for navigation, `@monaco-editor/react` for a rich IDE experience, and TailwindCSS for a sleek, dark-themed UI.
- **WebSocket Layer (Socket.io):** Handles low-latency, bi-directional communication. Dedicated "Rooms" are dynamically provisioned for Sparring and Mock Interviews, ensuring keystroke-level code synchronization and live presence indicators without overloading the REST API.
- **API & Gamification Engine (Node.js/Express):** A stateless backend handling authentication, dynamic scoring logic (factoring in difficulty, streak multipliers, and hint penalties), and routing AI requests.
- **AI Integration (Google Gemini 1.5 Flash):** Prompt-engineered to act as a strict mentor. It ingests the user's current code string and the problem context to generate highly contextual, concise nudges without revealing the answer.
- **Persistence Layer (Supabase/PostgreSQL):** Relational database managing user profiles, complex stats aggregations, interview rubrics, and historical submission logging via automated triggers.
- **Code Execution:** User code is securely executed via isolated local child processes, supporting multiple languages (Node.js, Python 3, C++, Java) and comparing output against structured test cases.

---

## ✨ Core Features

- **🏆 Practice Arena:** Solve a curated list of Easy, Medium, and Hard coding questions. Write code directly in the browser and run tests in real-time. Automatically tracks solved questions with visual checkmarks.
- **🧠 AI Mentor:** Click "Get a Hint" and our Google Gemini-powered AI Mentor will analyze your current code and give you a gentle nudge in the right direction!
- **👔 Mock Interview Mode:** Simulate a real tech-screen! Invite a peer into a dedicated Interview Room. The Interviewer has full control to assign questions, view the candidate's live code, fill out an interactive evaluation rubric, and submit a final Pass/Fail grade with private feedback.
- **⚔️ Sparring Mode (Multiplayer 1v1):** Challenge your friends to a coding battle! Create a room, share the link, and race to solve a random Medium difficulty question. See each other's live progress and submission results instantly.
- **📊 Detailed Profiles & Custom Heatmap:** Track your Global Score and Clean Streak. Your Activity Heatmap uses custom color-coding based on your reliance on hints (Green = Flawless, Yellow = Heavy Hint Usage, Red = Streak Broken). Includes a private Interview History log.
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
