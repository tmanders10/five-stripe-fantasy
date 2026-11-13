# TMA Challenge — Project Handoff Document

> **Purpose:** Complete context document for continuing development in a new Claude session. Read this alongside the GitHub repository and your Vercel/Supabase accounts.

---

## 1. Project Overview

**TMA Challenge** is a full-stack World Cup 2026 prediction competition app.

- **Live (prod):** `tma-challenge.vercel.app` → tracks `main` branch
- **Dev/staging:** `fsf-challenge.vercel.app` → tracks `develop` branch
- **GitHub:** `tmanders10/fsf-challenge`
- **Stack:** React 18 + Vite → Vercel (hosting) + Supabase (database + auth)
- **Admin email:** `todd.m.anderson@gmail.com` (is_admin = true in profiles table)

---

## 2. Repository Structure

```
/
├── index.html              # Browser tab title — "DEV: TMA Challenge" on develop, "TMA Challenge" on main
├── vite.config.js
├── package.json
├── src/
│   ├── App.jsx             # Entire app — ~4,100 lines, single-file React
│   └── main.jsx
├── public/
│   ├── guide.html          # Standalone user guide page
│   └── fsf-logo.png        # FSF English Muffin Cup logo (used in FSF theme)
├── PROJECT.md              # This file
├── SETUP.md                # Initial setup/deployment guide
├── supabase_schema.sql     # Full DB schema — run first on a fresh Supabase project
├── leagues_migration.sql   # Adds leagues table + is_admin to profiles
├── admin_upgrade.sql       # Adds is_admin column, sets todd as admin
├── scores_migration.sql    # Adds score1/score2 to match_results, theme to leagues
├── test_users.sql          # Creates 5 test users for Test League
├── test_users_family.sql   # Creates 5 test users for Family & Friends league
└── reset_tournament.sql    # Wipes all results/picks for a fresh start
```

---

## 3. Environment Variables

Set these in both Vercel projects (Settings → Environment Variables):

```
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
```

---

## 4. Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User display names, league assignment, is_admin flag |
| `leagues` | League name, invite_code, theme |
| `stage1_match_picks` | User's group stage match result picks |
| `stage1_group_picks` | User's group standings picks (1st/2nd per group) |
| `stage1_third_place_picks` | User's top-8 3rd place qualifier picks |
| `stage2_picks` | User's knockout bracket picks |
| `match_results` | Admin-entered results with score1/score2 |
| `group_standings` | Admin-entered or auto-calculated group standings |
| `app_settings` | Key/value settings (stage1_locked, stage2_locked, stage2_open) |

### Key SQL after initial schema

```sql
-- Required migrations (run in order if starting fresh):
-- 1. supabase_schema.sql
-- 2. leagues_migration.sql
-- 3. admin_upgrade.sql
-- 4. scores_migration.sql

-- Set admin user:
UPDATE public.profiles SET is_admin = true WHERE email = 'todd.m.anderson@gmail.com';

-- Add theme column to leagues (if not already present):
ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';

-- RLS policy for admin updating other users' league:
CREATE POLICY "admin_update_profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

### App Settings Keys
- `stage1_locked` — "true"/"false" — locks group stage picks
- `stage2_locked` — "true"/"false" — locks knockout picks, enables viewing others' picks
- `stage2_open` — "true"/"false" — opens knockout picks entry

---

## 5. App Architecture

### Single-file design
The entire app lives in `src/App.jsx` (~4,100 lines). This was a deliberate choice for simplicity — no component folders, no routing library. Navigation is handled by a `page` state variable.

### Top-level page components
```
App (session/auth shell)
├── AuthPage          — login/register
├── Leaderboard       — standings + your stats + league switcher (admin)
├── Stage1Picks       — group stage picks (matches + standings + 3rd place)
├── Stage2Picks       — knockout bracket picks
├── ResultsPage       — live match results + group standings tables
├── Insights          — pick distribution charts (locked until stage locks)
├── UserGuide         — in-app guide
└── AdminPanel        — full admin interface
    ├── Group Stage tab  — enter scores, auto-calculates standings
    ├── Standings tab    — manual standings override
    ├── Knockout tab     — bracket management + R32 auto-fill
    ├── Settings tab     — lock/unlock stages
    ├── Users tab        — league assignment + pick completion stats
    └── Leagues tab      — create/manage leagues + theme assignment
```

### Key global objects
```js
THEMES          // Theme definitions (default, fsf)
C               // Active theme — mutable object, updated by applyTheme()
applyTheme(name) // Clears C and applies named theme
GROUPS          // All 12 groups with 4 teams each
ALL_GROUP_MATCHES // All 72 group stage matches with dates/times
BRACKET_FEED    // Maps knockout slot IDs to their feeder slots
KNOCKOUT_ROUNDS // Round metadata (R32, R16, QF, SF, F)
TEAM_META       // Flag codes + kit colors for all 48 teams
```

---

## 6. Theme System

Two themes defined in `THEMES` constant at top of App.jsx:

### `default` — Big Soccer Challenge (Navy/Gold)
- Navy `#0B1F3A`, Gold `#EFB824`, cream background
- Title: "Big Soccer Challenge", nav short: "BSC"
- No logo

### `fsf` — FSF English Muffin Cup (Peach/Black)
- Peach `#E8936A` nav, near-black `#1a1a1a` accents, white background
- Title: "FSF English Muffin Cup", nav short: "FSF"
- Logo: `/fsf-logo.png` shown on both sides of hero title
- Italic Georgia serif font

### How themes apply
- Theme stored per league in `leagues.theme` column
- `applyTheme()` called on login (user's league) or when admin switches league view
- `themeKey` counter state in App forces nav/hero re-render on switch
- `C.navText`, `C.heroTitleColor`, `C.heroLogo` etc. are theme-specific optional keys

### Adding a new theme
1. Add entry to `THEMES` object in App.jsx
2. Add `<option>` to the theme `<select>` in `LeagueRow` and `LeaguesAdminTab` create form
3. Assign to a league via Admin → Leagues tab

---

## 7. Scoring System

### Group Stage
| Pick | Points |
|------|--------|
| Correct match result | +1 |
| Correct 1st place in group | +4 |
| Correct 2nd place in group | +3 |
| Right team, wrong position (1st/2nd) | +2 |
| 3rd place pick qualifies for R32 in ANY position | +1 |

**3rd place scoring note:** A team earns +1 if it qualifies for the Round of 32 as 1st, 2nd, OR as one of the best 8 3rd-place teams. Overperformers (picked as 3rd, finished 1st or 2nd) still earn the point.

### Knockout
| Round | Points |
|-------|--------|
| R32 | +2 |
| R16 | +4 |
| QF | +6 |
| SF | +8 |
| Final | +10 |

---

## 8. Key Workflows

### Entering group results (Admin)
1. Admin → Group Stage tab
2. Enter scores in the two number inputs per match
3. Result auto-derives from scores; standings auto-calculate after all 6 matches
4. FIFA tiebreakers applied: Points → GD → GF

### R32 bracket population
1. Admin → Knockout → **⚡ Auto-fill R32 from Standings**
2. Fills 8 fixed slots (runner-up vs runner-up, winner vs runner-up) automatically
3. 8 winner-vs-3rd-place slots left blank — assign manually via dropdown once FIFA announces
4. After R32 results entered, R16+ auto-populates as results are saved

### Locking stages (Admin → Settings)
- Lock Group Stage → freezes all group picks, enables viewing others' group picks
- Open Knockout → allows users to make knockout picks
- Lock Knockout → freezes knockout picks, enables viewing others' knockout picks, unlocks Insights

### League management
- Create leagues with invite codes via Admin → Leagues
- Users register with invite code → auto-assigned to league
- Admin can reassign users via Admin → Users tab
- Each league has its own leaderboard scope

---

## 9. Tournament Data

### Groups (A–L, 4 teams each, 48 teams total)
```
A: Mexico, South Korea, South Africa, Czechia
B: Canada, Switzerland, Qatar, Bosnia & Herz.
C: Brazil, Morocco, Scotland, Haiti
D: USA, Australia, Paraguay, Turkiye
E: Germany, Ecuador, Ivory Coast, Curacao
F: Netherlands, Japan, Tunisia, Sweden
G: Belgium, Iran, Egypt, New Zealand
H: Spain, Uruguay, Saudi Arabia, Cape Verde
I: France, Senegal, Norway, Iraq
J: Argentina, Austria, Algeria, Jordan
K: Portugal, Colombia, Uzbekistan, DR Congo
L: England, Croatia, Panama, Ghana
```

### Schedule
- Group stage: June 11 – June 26, 2026
- R32: June 27 – July 1
- R16: July 4–6
- QF: July 9–10
- SF: July 14–15
- Final: July 19, 2026

---

## 10. Known Limitations & Future Work

### R32 third-place slot assignment
The 8 winner-vs-3rd-place R32 slots require FIFA's official Annex C bracket assignment (495 possible combinations). These are left blank for manual assignment after group play — FIFA announces the bracket officially. The app provides a dropdown filtered to top-8 3rd-place teams only.

### Theme hot-switching
Themes apply via `applyTheme()` which mutates the `C` object. The nav/hero re-render via `themeKey` counter, but other page components only pick up the new theme on their next natural re-render (navigating away and back). A full reactive theme system would require moving `C` into React context.

### Mobile drag-and-drop
The 3rd place picker supports both ▲/▼ tap buttons (reliable on all devices) and HTML5 drag-and-drop (reliable on desktop, inconsistent on older Android). The tap buttons are the recommended mobile path.

### Multi-league admin
Admin always appears in all leagues' leaderboards regardless of league assignment. The leaderboard query uses `.or('league_id.eq.X,is_admin.eq.true')`.

---

## 11. Dev/Prod Workflow

```
develop branch → fsf-challenge.vercel.app  (DEV: TMA Challenge in tab)
main branch    → tma-challenge.vercel.app  (TMA Challenge in tab)
```

### To release a change
1. Make changes, test at `fsf-challenge.vercel.app`
2. Go to GitHub → Pull Requests → New Pull Request
3. base: `main` ← compare: `develop`
4. Update `index.html` title: remove `DEV: ` prefix
5. Merge → `tma-challenge.vercel.app` auto-deploys

### To start a new dev session with Claude
Share this file + the current `App.jsx` from GitHub. Key context to provide:
- "This is a World Cup 2026 prediction app — see PROJECT.md for full context"
- The specific file(s) you want to change
- Current issue or feature request

---

## 12. Files to Always Keep in Sync

When making changes, these files may need updates together:

| Change | Files affected |
|--------|---------------|
| Scoring rules | `App.jsx` (calcStage1Score, UserPicksModal calc, display logic) + `guide.html` + in-app guide section |
| New theme | `App.jsx` (THEMES object + LeagueRow select + LeaguesAdminTab select) |
| New nav page | `App.jsx` (nav map + page render switch) |
| Tournament data | `App.jsx` (GROUPS, ALL_GROUP_MATCHES, TEAM_META) |
| DB schema change | Migration SQL file + `App.jsx` queries |
