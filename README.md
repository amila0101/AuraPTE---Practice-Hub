# AuraPTE — AI-Powered PTE Academic & Core Practice Hub

AuraPTE is a state-of-the-art practice platform designed specifically for **PTE Academic** and **PTE Core** test takers worldwide. Built with cutting-edge AI scoring engines, precise acoustic analysis, and deterministic evaluation algorithms, AuraPTE provides realistic exam simulations and instant feedback across all 20 PTE question types.

---

## ✨ Features & Capabilities

### 🎤 Speaking (Neural ASR & Acoustic Analysis)
- **Read Aloud (RA):** Evaluates spoken content against target passages using Longest Common Subsequence (LCS) algorithms, while measuring Words Per Minute (WPM), hesitation penalties, and phoneme-level confidence.
- **Repeat Sentence (RS):** Audits short-term recall and oral fluency.
- **Describe Image (DI) & Re-tell Lecture (RL):** Assesses pacing, pronunciation, and structural coherence.
- **Answer Short Question (ASQ):** Instant verbal accuracy validation.

### ✍️ Writing (Deep AI Evaluation)
- **Summarize Written Text (SWT) & Write Essay (WE):** Employs Google Gemini neural evaluation combined with strict deterministic length, grammar, vocabulary, and structure checks.

### 📖 Reading & 🎧 Listening (Deterministic Engine)
- **All Question Types Covered:** Fill in the Blanks (FIB), Multiple Choice, Re-order Paragraphs, Summarize Spoken Text, Write from Dictation, and more.
- **Scoring Consistency:** Exactly mirrors official Pearson PTE scoring guidelines (partial credit and negative marking where applicable).

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion
- **Backend & Database:** Supabase (PostgreSQL, Auth, Edge Functions)
- **AI Engine:** AssemblyAI (Acoustic ASR & Phoneme Confidence) + Google Gemini (Deep Semantic Analysis)
- **PWA Ready:** Fully installable as a Progressive Web App across desktop and mobile devices.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/aurapte-practice-hub.git
cd aurapte-practice-hub
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL="your-supabase-project-url"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
```

### 4. Run Development Server
Start the local Vite development server:
```bash
npm run dev
```

---

## ☁️ Deployment

AuraPTE is optimized for rapid deployment on **Cloudflare Pages**, **Netlify**, or **Vercel**.

1. Connect your GitHub repository to your hosting provider.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Configure environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).

---

## ❤️ Credits & Attribution

Designed and engineered by **[Avantrix](https://avantrix.tech)**.  
Built for PTE test takers worldwide.

---
© 2026 AuraPTE. All rights reserved.
