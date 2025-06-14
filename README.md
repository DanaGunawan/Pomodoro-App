# ⏱️ Pomodoro-App DanaGunawan

A modern Pomodoro Timer built using **Next.js**, **TailwindCSS**, and **Supabase**. This app helps you stay focused and productive using the Pomodoro Technique, featuring user authentication, dark mode, analytics, and a leaderboard — all styled with a clean Web3-inspired glassmorphism UI.

---

## 🚀 Features

- ✅ User Registration & Login (Supabase Auth)
- 🌙 Dark Mode Toggle
- 📊 Productivity Analytics Page
- 🏆 Leaderboard System
- 🧼 Sleek Web3 Glassmorphism UI

---

## 🛠️ Tech Stack

- [Next.js](https://nextjs.org/) – React-based framework
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS
- [Supabase](https://supabase.com/) – Backend & Auth (Firebase alternative)
- [Lucide Icons](https://lucide.dev/) – Stylish icon set

---

## 📦 Installation & Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/DanaGunawan/Pomodoro-App.git
cd Pomodoro-App
2. Install Dependencies
bash
Copy
Edit
npm install
🔐 Supabase Configuration
Go to https://supabase.com and sign up.

Create a new project, then go to Settings → API and copy:

SUPABASE_URL

ANON_KEY

Create a .env.local file:

env
Copy
Edit
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
Use the SQL below to create your tables in Supabase:

sql
Copy
Edit
create table sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  started_at timestamp with time zone default now(),
  duration int
);

create table analytics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  date date,
  total_focus_time int
);

create table leaderboard (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  username text,
  total_minutes int
);
3. Start the Dev Server
bash
Copy
Edit
npm run dev
Open http://localhost:3000

📁 Folder Structure
pgsql
Copy
Edit
pomodoro-app/
├── app/
│   ├── page.tsx
│   ├── login/
│   ├── register/
│   ├── leaderboard/
│   └── analytics/
├── components/
├── lib/
├── public/
└── .env.local
👤 Author
Built with ❤️ by Dana Gunawan

📄 License
MIT License – use freely for personal or commercial projects.

yaml
Copy
Edit

---

### Option 2: Use GitHub's Web Editor
If you’re editing on **GitHub.com**:

1. Go to your repository.
2. Click the `README.md` file (or click **Add file → Create new file** if it doesn’t exist).
3. Paste the full text above.
4. Scroll down → Write a commit message → click **Commit new file**.

---

Let me know if you want me to give you the file directly in `.zip` or `.md` format.






