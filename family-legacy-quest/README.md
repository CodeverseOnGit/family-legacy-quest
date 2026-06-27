# 📖 Family Legacy Quest

A warm, emotional family storytelling platform where families preserve memories, share stories, complete challenges, and build a living family timeline together.

> Think: **Facebook Groups** + **Duolingo Gamification** + **Family Scrapbook** — focused entirely on memory preservation.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📖 Story Sharing | Rich stories with cover photos, tags, prompts |
| 📅 Animated Timeline | Chronological family scrapbook grouped by year/month |
| 🏆 Quest System | Family challenges that earn points |
| ⭐ Points & Badges | Gamified engagement with 4 progressive badges |
| 👨‍👩‍👧‍👦 Family Spaces | Private groups with invite codes |
| 🔔 Realtime Notifications | Live updates via Supabase Realtime |
| 💬 Comments & Reactions | 6 emoji reactions + threaded comments |
| 🔍 Search | Debounced search across titles, content, tags |
| 250 Story Prompts | Weekly rotating prompts for inspiration |
| 📱 Fully Responsive | Grandparent-friendly on any device |

---

## 🛠 Tech Stack

- **React 19** + **Vite** — frontend
- **React Router v6** — routing
- **TanStack React Query** — server state
- **Zustand** — client state
- **Framer Motion** — animations
- **Supabase** — auth, database, storage, realtime
- **Pure CSS** with CSS variables — no Tailwind

---

## 🚀 Complete Setup Walkthrough

### Step 1 — Create a Supabase Project

1. Go to **[supabase.com](https://supabase.com)** and sign in (or create a free account)
2. Click **"New project"**
3. Fill in:
   - **Name:** `family-legacy-quest` (or any name)
   - **Database Password:** choose a strong password and **save it** — you'll need it later
   - **Region:** choose the closest to your users
4. Click **"Create new project"**
5. Wait ~2 minutes for the project to spin up

---

### Step 2 — Run the Database Schema

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `schema.sql` from this project root
4. **Copy the entire contents** of `schema.sql`
5. **Paste** it into the SQL Editor
6. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
7. You should see: `Success. No rows returned`

This creates all tables, indexes, RLS policies, the auto-profile trigger, and seed data (badges + quests).

---

### Step 3 — Create Storage Buckets

You need two storage buckets: one for story cover images and one for avatars.

#### Create the `story-images` bucket:
1. In Supabase dashboard, click **"Storage"** in the left sidebar
2. Click **"New bucket"**
3. Set the name to exactly: `story-images`
4. Toggle **"Public bucket"** to **ON**
5. Click **"Save"**

#### Create the `avatars` bucket:
1. Click **"New bucket"** again
2. Set the name to exactly: `avatars`
3. Toggle **"Public bucket"** to **ON**
4. Click **"Save"**

#### Set Storage Policies for `story-images`:
1. Click the `story-images` bucket
2. Click **"Policies"** tab
3. Click **"New policy"** → **"For full customization"**
4. **Policy name:** `allow_authenticated_uploads`
5. **Allowed operation:** INSERT
6. **Policy definition:**
   ```sql
   auth.uid() is not null
   ```
7. Click **"Review"** → **"Save policy"**

8. Add another policy → **"For full customization"**
9. **Policy name:** `allow_public_select`
10. **Allowed operation:** SELECT
11. **Policy definition:**
    ```sql
    true
    ```
12. Click **"Review"** → **"Save policy"**

13. Add one more policy for UPDATE:
    - **Policy name:** `allow_authenticated_update`
    - **Allowed operation:** UPDATE
    - **Policy definition:** `auth.uid() is not null`

#### Set Storage Policies for `avatars`:
Repeat the exact same three policies above for the `avatars` bucket.

---

### Step 4 — Get Your API Credentials

1. In Supabase, click **"Project Settings"** (gear icon, bottom of left sidebar)
2. Click **"API"** in the settings menu
3. You'll see:
   - **Project URL** — looks like `https://abcdefghijk.supabase.co`
   - **Project API keys** → copy the `anon` / `public` key

---

### Step 5 — Configure Environment Variables

1. Navigate to the `frontend/` folder of this project
2. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` in any text editor and fill in your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   Replace the placeholder values with the ones from Step 4.

---

### Step 6 — Install Dependencies & Run

```bash
# Navigate to the frontend directory
cd frontend

# Install all dependencies
npm install

# Start the development server
npm run dev
```

The app will open at **http://localhost:3000**

---

### Step 7 — Create Your Account & Family

1. Open http://localhost:3000 — you'll be redirected to `/login`
2. Click **"Create one"** to sign up
3. Fill in your name, email, and password
4. Check your email for a **confirmation link** from Supabase and click it
   > ⚠️ You must confirm your email before you can sign in. Check spam if you don't see it.
5. Sign in with your credentials
6. You'll land on the **Dashboard**
7. Click **"My Family"** in the sidebar
8. Click **"Create a Family"**, enter a name, and click **"Create Family"**
9. Share the 6-character invite code with family members so they can join

---

### Step 8 (Optional) — Invite Email Confirmation

By default, Supabase requires email confirmation. For easier testing:

1. Go to Supabase → **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** to OFF for development
3. Toggle it back ON before deploying to production

---

## 📧 Configuring Email (Production)

For production use, set up a custom SMTP server:

1. Supabase → **Project Settings** → **Authentication** → **SMTP Settings**
2. Enter your SMTP details (SendGrid, Mailgun, Resend, etc.)
3. This ensures password reset and confirmation emails are reliably delivered

---

## 🏗 Building for Production

```bash
cd frontend
npm run build
```

Output is in `frontend/dist/`. Deploy to:
- **Vercel:** drag the `dist` folder or connect your GitHub repo
- **Netlify:** drag the `dist` folder or connect GitHub
- **Cloudflare Pages:** connect GitHub, build command `npm run build`, output `dist`

For all platforms, set the same environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) in the deployment settings.

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.jsx
│   │   └── shared/
│   │       ├── LoadingScreen.jsx
│   │       └── LoadingScreen.css
│   ├── data/
│   │   └── prompts.js          ← 250 story prompts
│   ├── layouts/
│   │   ├── AppLayout.jsx       ← Main app shell with sidebar
│   │   └── AuthLayout.jsx      ← Auth pages shell
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── FamilyPage.jsx
│   │   ├── StoriesPage.jsx
│   │   ├── StoryDetailPage.jsx
│   │   ├── CreateStoryPage.jsx
│   │   ├── TimelinePage.jsx
│   │   ├── QuestsPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── NotificationsPage.jsx
│   ├── services/
│   │   ├── supabase.js         ← Supabase client
│   │   ├── auth.js
│   │   ├── profiles.js
│   │   ├── families.js
│   │   ├── stories.js
│   │   ├── quests.js
│   │   └── notifications.js
│   ├── store/
│   │   └── authStore.js        ← Zustand global state
│   ├── styles/
│   │   └── global.css          ← CSS variables & utilities
│   ├── App.jsx                 ← Router
│   └── main.jsx                ← Entry point
├── index.html
├── vite.config.js
├── package.json
└── .env.example
schema.sql                      ← Complete Supabase schema
README.md
```

---

## 🎮 Points System

| Action | Points |
|---|---|
| Share a story | +20 |
| Add a comment | +5 |
| Add a reaction | +1 |
| Complete a quest | +50 (varies) |

## 🏅 Badge Thresholds

| Badge | Stories Required |
|---|---|
| Storyteller | 10 |
| Historian | 25 |
| Legacy Keeper | 50 |
| Memory Master | 100 |

---

## 🔒 Security Notes

- All data is protected by Supabase Row Level Security (RLS)
- Users can only see stories from their own family
- No cross-family data leakage is possible at the database level
- Invite codes are randomly generated 6-character alphanumeric strings
- Avatar and story images are stored in Supabase Storage with auth-gated upload policies

---

## 🐛 Troubleshooting

**"Missing Supabase environment variables"**
→ Make sure you created `frontend/.env` (not just `.env.example`) with your real credentials

**Stories/family data not loading**
→ Verify the SQL schema ran successfully. Check Supabase → Table Editor — all tables should exist.

**Images not uploading**
→ Confirm both storage buckets exist with exact names `story-images` and `avatars`, and that they are set to Public.

**Email confirmation not arriving**
→ Check spam folder, or disable email confirmation in Supabase Auth settings for development.

**Realtime notifications not working**
→ Ensure `supabase_realtime` publication is enabled: run `alter publication supabase_realtime add table public.notifications;` in the SQL editor.

**"Permission denied" errors**
→ RLS policies may not have run correctly. Re-run the schema SQL and look for errors in the output.

---

## 📜 License

MIT — free to use, modify, and deploy for personal or commercial use.
