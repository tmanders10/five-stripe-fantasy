# FSF Challenge — Setup Guide
## 2026 FIFA World Cup Prediction Competition

---

## What you're deploying

| Layer | Tech | Cost |
|-------|------|------|
| Frontend | React + Vite | Free (Vercel) |
| Database | Supabase (PostgreSQL) | Free tier |
| Hosting | Vercel | Free tier |
| Auth | Supabase Auth (email/password) | Free |

---

## Step 1 — Create your Supabase project

1. Go to **https://supabase.com** and sign in (or create a free account)
2. Click **"New Project"**
3. Name it `fsf-challenge`, choose a region close to you (e.g. US East), set a database password
4. Wait ~2 minutes for the project to provision

### Run the database schema

5. In your Supabase project, go to **SQL Editor** (left sidebar)
6. Click **"New query"**
7. Open the file `supabase_schema.sql` from this project folder
8. Paste the entire contents into the editor
9. Click **"Run"** — you should see "Success" for each statement

### Get your API keys

10. Go to **Project Settings > API** (gear icon in the sidebar)
11. Copy:
    - **Project URL** → looks like `https://abcdefgh.supabase.co`
    - **anon / public key** → the long `eyJ...` string

### Configure Auth

12. Go to **Authentication > Providers** → confirm Email is enabled
13. Go to **Authentication > Email Templates** → optional: customize welcome email
14. Go to **Authentication > URL Configuration**:
    - Set **Site URL** to your Vercel URL (you'll get this in Step 3 — come back to this)
    - For now, add `http://localhost:5173` as an allowed redirect URL

---

## Step 2 — Set up the repo

### Option A: Using GitHub Desktop (recommended if new to Git)

1. Download and install **GitHub Desktop** from desktop.github.com
2. Go to **File > New Repository**
3. Name: `fsf-challenge`, choose a local path
4. Click **Create Repository**
5. Copy all files from this folder into that new repository folder
6. In GitHub Desktop, write a commit message ("Initial commit") and click **Commit to main**
7. Click **Publish repository** (keep it Private if you prefer)

### Option B: Using the terminal

```bash
cd /path/to/this/folder
git init
git add .
git commit -m "Initial commit"
# Create a new repo on github.com named fsf-challenge, then:
git remote add origin https://github.com/YOUR_USERNAME/fsf-challenge.git
git branch -M main
git push -u origin main
```

---

## Step 3 — Deploy to Vercel

1. Go to **https://vercel.com** and sign in with GitHub
2. Click **"Add New Project"**
3. Find and select your `fsf-challenge` repository
4. Vercel will auto-detect it as a Vite project — the defaults are correct
5. **Before clicking Deploy**, expand **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_ADMIN_PASSWORD` | Your chosen admin password |

6. Click **Deploy**
7. Wait ~1 minute. You'll get a URL like `https://fsf-challenge.vercel.app`

### Update Supabase with your live URL

8. Go back to **Supabase > Authentication > URL Configuration**
9. Set **Site URL** to your Vercel URL (e.g. `https://fsf-challenge.vercel.app`)
10. Add it to **Redirect URLs** as well

---

## Step 4 — Test locally (optional but recommended)

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local and add your Supabase URL and anon key

# Run dev server
npm run dev
# Open http://localhost:5173
```

---

## Step 5 — Verify everything works

1. Open your Vercel URL
2. Register a test account
3. Check Supabase **Table Editor > profiles** — you should see the new user
4. Go to **Stage 1**, make some picks, click **Save Picks**
5. Check **Table Editor > picks** — your picks should be stored as JSONB
6. Go to **Admin** (password: whatever you set in `VITE_ADMIN_PASSWORD`)
7. Enter a match result and click **Save Match Results**
8. Check **Leaderboard** — should reflect the scored points

---

## How to update the app going forward

Any time you push a commit to GitHub, Vercel automatically redeploys. So the workflow is:

1. Make code changes
2. `git add . && git commit -m "description" && git push`
3. Vercel deploys in ~1 minute

---

## Admin Workflow — During the Tournament

### Stage 1 (Group Stage, June 11–26)
- After each matchday, go to **Admin > Match Results**
- Click the winning team (or DRAW) for each completed match
- Click **Save Match Results**
- The leaderboard updates automatically

- When all group play is done, go to **Admin > Group Finishes**
- Enter the official 1st and 2nd place finisher for each group
- Enter the 8 best third-place teams
- Save

### Between Stage 1 and Stage 2 (~June 26 – July 1)
- Go to **Admin > Bracket & KO Results**
- For each Round of 32 match, enter the label (e.g. "1A vs 2B") and both teams
- Click **Publish Bracket & Open Stage 2**
- Users will now see Stage 2 picks

### Stage 2 (Knockout, July 1–19)
- After each round, go to **Admin > Bracket & KO Results**
- Click the winner for each completed match
- Click **Save KO Results**

---

## Database Tables (for reference)

| Table | Purpose |
|-------|---------|
| `profiles` | Display name + email per user |
| `picks` | All user picks (stage1 + stage2 as JSONB) |
| `results` | Official results (single row, admin-entered) |
| `bracket` | Published knockout bracket (single row) |

---

## Scoring Reference

### Stage 1
- Correct match result: **1 pt**
- Correct 1st place group pick: **3 pts**
- Correct 2nd place group pick: **2 pts**
- Picked top-2 team but wrong position: **1 pt**
- Correct 3rd-place qualifier pick: **1 pt**

### Stage 2
- Round of 32: **2 pts**
- Round of 16: **4 pts**  
- Quarterfinal: **8 pts**
- Semifinal: **12 pts**
- Final: **16 pts**

### Maximum possible: 276 points

---

## Troubleshooting

**"Invalid API key" error on login**
→ Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly in Vercel's environment variables. Redeploy after adding them.

**Users can register but data isn't saving**
→ Check Supabase SQL Editor for RLS policy errors. Make sure you ran the full `supabase_schema.sql` script.

**Admin panel changes not scoring**
→ Confirm you clicked the Save button after entering results. Check the `results` table in Supabase Table Editor.

**Stage 2 not showing for users**
→ You need to publish the bracket first in Admin > Bracket. Until the bracket row has data, Stage 2 shows a "not yet open" message.
