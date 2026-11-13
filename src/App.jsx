import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── 1. CENTRALIZED SCORING RULES ─────────────────────────────────────────────
const SCORING_RULES = {
  STAGE1: {
    WILD_CARD_WIN: 3,        // +3 pts for correct Wild Card winner (WC_E, WC_W)
    ROUND1_GAME_WIN: 1,      // +1 pt per correct Round 1 game winner (G1, G2, G3)
    SERIES_WINNER: 3,        // +3 pts for picking the advancing team in a Best-of-3 series
    EXACT_SERIES_LENGTH: 1,  // +1 bonus pt (+4 total) if Series Winner AND length ('2-0' or '2-1') match
  },
  STAGE2: {
    CSF: 4,  // Conference Semifinals (4 matches)
    CF: 8,   // Conference Finals (2 matches)
    CUP: 16, // MLS Cup Final (1 match)
  },
};

// ── 2. TOURNAMENT DATA (MLS CUP PLAYOFFS) ────────────────────────────────────
const WILD_CARDS = {
  WC_E: { matchId: "WC_E", conf: "EAST", label: "East Wild Card (#8 vs #9)", seed8: "CF Montréal", seed9: "Atlanta United", date: "Oct 22", time: "7:30 PM ET" },
  WC_W: { matchId: "WC_W", conf: "WEST", label: "West Wild Card (#8 vs #9)", seed8: "Vancouver Whitecaps", seed9: "Portland Timbers", date: "Oct 23", time: "10:30 PM ET" },
};

// 8 Best-of-3 Round One Series (stored in group_code)
const GROUPS = {
  E_S1: ["Inter Miami", "East Wild Card Winner"],
  E_S2: ["Columbus Crew", "NY Red Bulls"],
  E_S3: ["FC Cincinnati", "NYCFC"],
  E_S4: ["Orlando City", "Charlotte FC"],
  W_S1: ["LAFC", "West Wild Card Winner"],
  W_S2: ["LA Galaxy", "Colorado Rapids"],
  W_S3: ["Real Salt Lake", "Minnesota United"],
  W_S4: ["Seattle Sounders", "Houston Dynamo"],
};

const SERIES_LABELS = {
  WC_E: "East Wild Card (#8 vs #9)",
  WC_W: "West Wild Card (#8 vs #9)",
  E_S1: "East Series 1 (#1 vs #8/9)",
  E_S2: "East Series 2 (#2 vs #7)",
  E_S3: "East Series 3 (#3 vs #6)",
  E_S4: "East Series 4 (#4 vs #5)",
  W_S1: "West Series 1 (#1 vs #8/9)",
  W_S2: "West Series 2 (#2 vs #7)",
  W_S3: "West Series 3 (#3 vs #6)",
  W_S4: "West Series 4 (#4 vs #5)",
};

const ALL_TEAMS = [
  "Inter Miami", "Columbus Crew", "FC Cincinnati", "Orlando City",
  "Charlotte FC", "NYCFC", "NY Red Bulls", "CF Montréal", "Atlanta United",
  "LAFC", "LA Galaxy", "Real Salt Lake", "Seattle Sounders",
  "Houston Dynamo", "Minnesota United", "Colorado Rapids", "Vancouver Whitecaps", "Portland Timbers",
].sort();

const COUNTRY_ABBR = {
  "Inter Miami": "MIA", "Columbus Crew": "CLB", "FC Cincinnati": "CIN", "Orlando City": "ORL",
  "Charlotte FC": "CLT", "NYCFC": "NYC", "NY Red Bulls": "RBNY", "CF Montréal": "MTL", "Atlanta United": "ATL",
  "LAFC": "LAFC", "LA Galaxy": "LA", "Real Salt Lake": "RSL", "Seattle Sounders": "SEA",
  "Houston Dynamo": "HOU", "Minnesota United": "MIN", "Colorado Rapids": "COL",
  "Vancouver Whitecaps": "VAN", "Portland Timbers": "POR",
  "East Wild Card Winner": "E-WC", "West Wild Card Winner": "W-WC",
};

// All 26 Stage 1 fixtures (2 Wild Card matches + 24 Round One Best-of-3 games)
const ALL_GROUP_MATCHES = [
  // Wild Card Round
  { matchId: "WC_E",    group: "WC_E", isWildCard: true,  gameNum: 1, team1: "CF Montréal",           team2: "Atlanta United",        date: "Oct 22", time: "7:30 PM ET" },
  { matchId: "WC_W",    group: "WC_W", isWildCard: true,  gameNum: 1, team1: "Vancouver Whitecaps",   team2: "Portland Timbers",      date: "Oct 23", time: "10:30 PM ET" },

  // Round One — Game 1 (Higher Seed Hosts)
  { matchId: "E_S1_G1", group: "E_S1", isWildCard: false, gameNum: 1, team1: "Inter Miami",           team2: "East Wild Card Winner", date: "Oct 25", time: "8:30 PM ET" },
  { matchId: "W_S2_G1", group: "W_S2", isWildCard: false, gameNum: 1, team1: "LA Galaxy",             team2: "Colorado Rapids",       date: "Oct 26", time: "11:00 PM ET" },
  { matchId: "E_S4_G1", group: "E_S4", isWildCard: false, gameNum: 1, team1: "Orlando City",          team2: "Charlotte FC",          date: "Oct 27", time: "7:30 PM ET" },
  { matchId: "W_S1_G1", group: "W_S1", isWildCard: false, gameNum: 1, team1: "LAFC",                  team2: "West Wild Card Winner", date: "Oct 27", time: "9:45 PM ET" },
  { matchId: "E_S3_G1", group: "E_S3", isWildCard: false, gameNum: 1, team1: "FC Cincinnati",         team2: "NYCFC",                 date: "Oct 28", time: "6:45 PM ET" },
  { matchId: "W_S4_G1", group: "W_S4", isWildCard: false, gameNum: 1, team1: "Seattle Sounders",      team2: "Houston Dynamo",        date: "Oct 28", time: "9:00 PM ET" },
  { matchId: "E_S2_G1", group: "E_S2", isWildCard: false, gameNum: 1, team1: "Columbus Crew",         team2: "NY Red Bulls",          date: "Oct 29", time: "6:45 PM ET" },
  { matchId: "W_S3_G1", group: "W_S3", isWildCard: false, gameNum: 1, team1: "Real Salt Lake",        team2: "Minnesota United",      date: "Oct 29", time: "9:00 PM ET" },

  // Round One — Game 2 (Lower Seed Hosts)
  { matchId: "E_S4_G2", group: "E_S4", isWildCard: false, gameNum: 2, team1: "Charlotte FC",          team2: "Orlando City",          date: "Nov 1",  time: "7:30 PM ET" },
  { matchId: "W_S2_G2", group: "W_S2", isWildCard: false, gameNum: 2, team1: "Colorado Rapids",       team2: "LA Galaxy",             date: "Nov 1",  time: "9:30 PM ET" },
  { matchId: "E_S3_G2", group: "E_S3", isWildCard: false, gameNum: 2, team1: "NYCFC",                 team2: "FC Cincinnati",         date: "Nov 2",  time: "5:00 PM ET" },
  { matchId: "E_S1_G2", group: "E_S1", isWildCard: false, gameNum: 2, team1: "East Wild Card Winner", team2: "Inter Miami",           date: "Nov 2",  time: "7:00 PM ET" },
  { matchId: "W_S3_G2", group: "W_S3", isWildCard: false, gameNum: 2, team1: "Minnesota United",      team2: "Real Salt Lake",        date: "Nov 2",  time: "9:00 PM ET" },
  { matchId: "E_S2_G2", group: "E_S2", isWildCard: false, gameNum: 2, team1: "NY Red Bulls",          team2: "Columbus Crew",         date: "Nov 3",  time: "4:30 PM ET" },
  { matchId: "W_S4_G2", group: "W_S4", isWildCard: false, gameNum: 2, team1: "Houston Dynamo",        team2: "Seattle Sounders",      date: "Nov 3",  time: "6:30 PM ET" },
  { matchId: "W_S1_G2", group: "W_S1", isWildCard: false, gameNum: 2, team1: "West Wild Card Winner", team2: "LAFC",                  date: "Nov 3",  time: "8:45 PM ET" },

  // Round One — Game 3 (If Necessary — Higher Seed Hosts)
  { matchId: "W_S1_G3", group: "W_S1", isWildCard: false, gameNum: 3, team1: "LAFC",                  team2: "West Wild Card Winner", date: "Nov 8",  time: "10:00 PM ET" },
  { matchId: "E_S3_G3", group: "E_S3", isWildCard: false, gameNum: 3, team1: "FC Cincinnati",         team2: "NYCFC",                 date: "Nov 9",  time: "4:00 PM ET" },
  { matchId: "E_S4_G3", group: "E_S4", isWildCard: false, gameNum: 3, team1: "Orlando City",          team2: "Charlotte FC",          date: "Nov 9",  time: "6:00 PM ET" },
  { matchId: "E_S1_G3", group: "E_S1", isWildCard: false, gameNum: 3, team1: "Inter Miami",           team2: "East Wild Card Winner", date: "Nov 9",  time: "8:00 PM ET" },
  { matchId: "E_S2_G3", group: "E_S2", isWildCard: false, gameNum: 3, team1: "Columbus Crew",         team2: "NY Red Bulls",          date: "Nov 10", time: "5:00 PM ET" },
  { matchId: "W_S3_G3", group: "W_S3", isWildCard: false, gameNum: 3, team1: "Real Salt Lake",        team2: "Minnesota United",      date: "Nov 10", time: "7:00 PM ET" },
  { matchId: "W_S2_G3", group: "W_S2", isWildCard: false, gameNum: 3, team1: "LA Galaxy",             team2: "Colorado Rapids",       date: "Nov 10", time: "9:00 PM ET" },
  { matchId: "W_S4_G3", group: "W_S4", isWildCard: false, gameNum: 3, team1: "Seattle Sounders",      team2: "Houston Dynamo",        date: "Nov 10", time: "10:30 PM ET" },
];

const KNOCKOUT_ROUNDS = [
  { round: "CSF", label: "Conference Semifinals", points: SCORING_RULES.STAGE2.CSF, slots: 4 },
  { round: "CF",  label: "Conference Finals",     points: SCORING_RULES.STAGE2.CF,  slots: 2 },
  { round: "CUP", label: "MLS Cup Final",         points: SCORING_RULES.STAGE2.CUP, slots: 1 },
];

const BRACKET_FEED = {
  CF_1:  ["CSF_1", "CSF_2"], // East Final
  CF_2:  ["CSF_3", "CSF_4"], // West Final
  CUP_1: ["CF_1",  "CF_2"],  // MLS Cup
};

const TEAM_META = {
  "Inter Miami":            { seed: 1, regPts: 74, flag: "us", c1: "rgba(247,181,205,0.55)", c2: "rgba(35,31,32,0.45)",    c3: "rgba(247,181,205,0.55)", border: "#f7b5cd" },
  "Columbus Crew":          { seed: 2, regPts: 66, flag: "us", c1: "rgba(254,209,0,0.55)",   c2: "rgba(0,0,0,0.45)",       c3: "rgba(254,209,0,0.55)",   border: "#e5b800" },
  "FC Cincinnati":          { seed: 3, regPts: 59, flag: "us", c1: "rgba(0,48,135,0.45)",    c2: "rgba(254,80,0,0.50)",    c3: "rgba(0,48,135,0.45)",    border: "#fe5000" },
  "Orlando City":           { seed: 4, regPts: 52, flag: "us", c1: "rgba(99,52,146,0.48)",   c2: "rgba(240,210,131,0.48)", c3: "rgba(99,52,146,0.48)",   border: "#633492" },
  "Charlotte FC":           { seed: 5, regPts: 51, flag: "us", c1: "rgba(0,133,202,0.48)",   c2: "rgba(16,24,32,0.40)",    c3: "rgba(0,133,202,0.48)",   border: "#0085ca" },
  "NYCFC":                  { seed: 6, regPts: 50, flag: "us", c1: "rgba(108,173,223,0.52)", c2: "rgba(4,30,66,0.42)",     c3: "rgba(241,85,36,0.45)",   border: "#6caddf" },
  "NY Red Bulls":           { seed: 7, regPts: 47, flag: "us", c1: "rgba(237,30,54,0.48)",   c2: "rgba(255,209,0,0.48)",   c3: "rgba(0,47,108,0.42)",    border: "#ed1e36" },
  "CF Montréal":            { seed: 8, regPts: 43, flag: "ca", c1: "rgba(0,51,161,0.45)",    c2: "rgba(0,0,0,0.42)",       c3: "rgba(158,162,162,0.40)", border: "#0033a1" },
  "Atlanta United":         { seed: 9, regPts: 40, flag: "us", c1: "rgba(162,11,42,0.50)",   c2: "rgba(35,31,32,0.48)",    c3: "rgba(199,159,92,0.50)",  border: "#a20b2a" },
  "LAFC":                   { seed: 1, regPts: 64, flag: "us", c1: "rgba(0,0,0,0.48)",       c2: "rgba(195,158,109,0.55)", c3: "rgba(0,0,0,0.48)",       border: "#c39e6d" },
  "LA Galaxy":              { seed: 2, regPts: 64, flag: "us", c1: "rgba(0,36,93,0.48)",     c2: "rgba(255,210,0,0.52)",   c3: "rgba(0,36,93,0.48)",     border: "#00245d" },
  "Real Salt Lake":         { seed: 3, regPts: 59, flag: "us", c1: "rgba(179,8,56,0.48)",    c2: "rgba(1,58,129,0.45)",    c3: "rgba(241,203,0,0.50)",   border: "#b30838" },
  "Seattle Sounders":       { seed: 4, regPts: 57, flag: "us", c1: "rgba(93,151,65,0.52)",   c2: "rgba(0,85,149,0.45)",    c3: "rgba(93,151,65,0.52)",   border: "#5d9741" },
  "Houston Dynamo":         { seed: 5, regPts: 54, flag: "us", c1: "rgba(255,107,0,0.52)",   c2: "rgba(16,24,32,0.42)",    c3: "rgba(255,107,0,0.52)",   border: "#ff6b00" },
  "Minnesota United":       { seed: 6, regPts: 52, flag: "us", c1: "rgba(140,210,244,0.52)", c2: "rgba(35,31,32,0.45)",    c3: "rgba(140,210,244,0.52)", border: "#8cd2f4" },
  "Colorado Rapids":        { seed: 7, regPts: 50, flag: "us", c1: "rgba(138,36,50,0.48)",   c2: "rgba(138,183,233,0.50)", c3: "rgba(138,36,50,0.48)",   border: "#8a2432" },
  "Vancouver Whitecaps":    { seed: 8, regPts: 47, flag: "ca", c1: "rgba(0,36,94,0.48)",     c2: "rgba(156,194,234,0.45)", c3: "rgba(0,36,94,0.48)",     border: "#00245e" },
  "Portland Timbers":       { seed: 9, regPts: 47, flag: "us", c1: "rgba(0,72,43,0.50)",     c2: "rgba(214,154,0,0.50)",   c3: "rgba(0,72,43,0.50)",     border: "#00482b" },
  "East Wild Card Winner":  { seed: "WC", regPts: 40, flag: "us", c1: "rgba(120,120,120,0.3)", c2: "rgba(180,180,180,0.3)", c3: "rgba(120,120,120,0.3)", border: "#888" },
  "West Wild Card Winner":  { seed: "WC", regPts: 47, flag: "us", c1: "rgba(120,120,120,0.3)", c2: "rgba(180,180,180,0.3)", c3: "rgba(120,120,120,0.3)", border: "#888" },
};

// ── 3. THEMES (FSF Peach-Orange & Near-Black Default) ────────────────────────
const THEMES = {
  default: {
    navy: "#E8936A", navyMid: "#1a1a1a",
    gold: "#1a1a1a", goldLight: "#2d2d2d",
    bg: "#ffffff", white: "#ffffff",
    green: "#1D9E75", red: "#dc2626",
    text: "#1a1a1a", textMuted: "#6b7280", border: "#e5e7eb",
    navText: "#ffffff",
    heroTitleColor: "#ffffff",
    heroSubColor: "rgba(255,255,255,0.88)",
    heroNameColor: "#ffffff",
    heroTitle: "FSF MLS Cup Challenge",
    heroSub: "Audi MLS Cup Playoffs — Every Match, Every Series.",
    heroLogo: "/fsf-logo.png",
    navTitle: "FSF MLS Cup",
    navTitleShort: "FSF",
    fontSerif: true,
  },
  fsf: {
    navy: "#E8936A", navyMid: "#1a1a1a",
    gold: "#1a1a1a", goldLight: "#2d2d2d",
    bg: "#ffffff", white: "#ffffff",
    green: "#1D9E75", red: "#dc2626",
    text: "#1a1a1a", textMuted: "#6b7280", border: "#e5e7eb",
    navText: "#ffffff",
    heroTitleColor: "#ffffff",
    heroSubColor: "rgba(255,255,255,0.88)",
    heroNameColor: "#ffffff",
    heroTitle: "FSF MLS Cup Challenge",
    heroSub: "Audi MLS Cup Playoffs — Every Match, Every Series.",
    heroLogo: "/fsf-logo.png",
    navTitle: "FSF MLS Cup",
    navTitleShort: "FSF",
    fontSerif: true,
  },
  navy: {
    navy: "#0B1F3A", navyMid: "#1A3354",
    gold: "#EFB824", goldLight: "#FAD55A",
    bg: "#F5F5F0", white: "#ffffff",
    green: "#1D9E75", red: "#dc2626",
    text: "#1a1a2e", textMuted: "#64748b", border: "#e2e8f0",
    heroTitle: "MLS Cup Playoffs Challenge",
    heroSub: "Every Match, Every Series, One Cup.",
    navTitle: "MLS Cup Challenge",
    navTitleShort: "MLS",
    fontSerif: false,
  },
};

const C = { ...THEMES.default };
function applyTheme(name) {
  const t = THEMES[name] || THEMES.default;
  Object.keys(C).forEach((k) => { delete C[k]; });
  Object.assign(C, t);
}

// ── 4. SCORING & SERIES HELPERS ──────────────────────────────────────────────
function getResolvedMatchTeams(m, matchPicks = {}, matchResults = {}) {
  let t1 = m.team1;
  let t2 = m.team2;
  const resolveWC = (wcId, placeholder) => {
    const res = matchResults[wcId];
    if (res?.result) {
      return res.result === "team1" ? WILD_CARDS[wcId].seed8 : WILD_CARDS[wcId].seed9;
    }
    const pick = matchPicks[wcId];
    if (pick === "team1") return WILD_CARDS[wcId].seed8;
    if (pick === "team2") return WILD_CARDS[wcId].seed9;
    return placeholder;
  };
  if (t1 === "East Wild Card Winner") t1 = resolveWC("WC_E", t1);
  if (t2 === "East Wild Card Winner") t2 = resolveWC("WC_E", t2);
  if (t1 === "West Wild Card Winner") t1 = resolveWC("WC_W", t1);
  if (t2 === "West Wild Card Winner") t2 = resolveWC("WC_W", t2);
  return [t1, t2];
}

// Checks if Game 1 and Game 2 picks result in a 2-0 sweep (remembering Home/Away flip in Game 2)
function isSeriesSweep(seriesId, matchPicks) {
  const g1 = matchPicks[`${seriesId}_G1`];
  const g2 = matchPicks[`${seriesId}_G2`];
  if (!g1 || !g2) return false;
  return (g1 === "team1" && g2 === "team2") || (g1 === "team2" && g2 === "team1");
}

function calcSeriesWins(seriesId, matchPicks, matchResults = {}) {
  const g1Match = ALL_GROUP_MATCHES.find((m) => m.matchId === `${seriesId}_G1`);
  if (!g1Match) return [];
  const [highSeed, lowSeed] = getResolvedMatchTeams(g1Match, matchPicks, matchResults);
  const wins = { [highSeed]: 0, [lowSeed]: 0 };
  const seriesMatches = ALL_GROUP_MATCHES.filter((m) => m.group === seriesId).sort((a, b) => a.gameNum - b.gameNum);

  for (const m of seriesMatches) {
    if (m.gameNum === 3 && (wins[highSeed] === 2 || wins[lowSeed] === 2)) break;
    const pick = matchPicks[m.matchId];
    if (!pick) continue;
    const [t1, t2] = getResolvedMatchTeams(m, matchPicks, matchResults);
    if (pick === "team1") wins[t1] = (wins[t1] || 0) + 1;
    else if (pick === "team2") wins[t2] = (wins[t2] || 0) + 1;
  }
  return [
    { team: highSeed, pts: wins[highSeed] || 0 },
    { team: lowSeed,  pts: wins[lowSeed]  || 0 },
  ].sort((a, b) => b.pts - a.pts);
}

function deriveSeriesOutcome(sorted) {
  if (sorted.length < 2) return { winner: null, length: null, needsGame3: false };
  const [leader, trailer] = sorted;
  if (leader.pts === 2) {
    return {
      winner: leader.team,
      length: trailer.pts === 0 ? "2-0" : "2-1",
      needsGame3: trailer.pts === 1,
    };
  }
  return {
    winner: null,
    length: null,
    needsGame3: leader.pts === 1 && trailer.pts === 1,
  };
}

function calcStage1Score(matchPicks, groupPicks, results, standings) {
  let score = 0, correct = 0;
  for (const pick of matchPicks) {
    const result = results.find((r) => r.match_id === pick.match_id);
    if (result?.result && result.result === pick.pick) {
      const isWC = pick.match_id === "WC_E" || pick.match_id === "WC_W";
      score += isWC ? SCORING_RULES.STAGE1.WILD_CARD_WIN : SCORING_RULES.STAGE1.ROUND1_GAME_WIN;
      correct += 1;
    }
  }
  for (const gp of groupPicks) {
    const st = standings.find((s) => s.group_code === gp.group_code);
    if (!st || !st.first_place) continue;
    if (gp.first_place === st.first_place) {
      score += SCORING_RULES.STAGE1.SERIES_WINNER;
      correct += 1;
      if (gp.second_place && gp.second_place === st.second_place) {
        score += SCORING_RULES.STAGE1.EXACT_SERIES_LENGTH;
        correct += 1;
      }
    }
  }
  return { score, correct };
}

function calcStage2Score(s2picks, results) {
  let score = 0, correct = 0;
  const pts = SCORING_RULES.STAGE2;
  for (const pick of s2picks) {
    const result = results.find((r) => r.match_id === pick.slot_id);
    if (result?.result) {
      const winner = result.result === "team1" ? result.team1 : result.result === "team2" ? result.team2 : null;
      const round = pick.round || (pick.slot_id ? pick.slot_id.replace(/_\d+$/, "") : null);
      if (winner && winner === pick.picked_team) {
        score += pts[round] || 0;
        correct += 1;
      }
    }
  }
  return { score, correct };
}

// ── 5. SHARED UI COMPONENTS ──────────────────────────────────────────────────
const styles = {
  app: { fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: "100vh", color: C.text },
  nav: {
    background: C.navy, color: C.white, padding: "0 1.5rem",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    height: "60px", position: "sticky", top: 0, zIndex: 100,
    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
  },
  navLogo: { fontSize: "18px", fontWeight: 700, color: C.gold, letterSpacing: "-0.5px", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "clamp(50px,20vw,220px)", flexShrink: 0 },
  navLinks: { display: "flex", gap: "2px", alignItems: "center", overflowX: "auto", padding: "0 8px", scrollbarWidth: "none" },
  navBtn: (active) => ({
    background: active ? C.gold : "transparent", color: active ? C.white : (C.navText || C.white),
    border: "none", borderRadius: "6px", padding: "6px 14px",
    fontSize: "13px", fontWeight: active ? 700 : 500, cursor: "pointer",
  }),
  hero: {
    background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`,
    color: C.white, padding: "2.5rem 1.5rem 2rem", textAlign: "center",
  },
  heroTitle: { fontSize: "clamp(1.8rem,5vw,2.75rem)", fontWeight: 800, color: C.gold, margin: "0 0 0.5rem", letterSpacing: "-0.5px" },
  heroSub: { fontSize: "clamp(0.85rem,3vw,1rem)", color: "rgba(255,255,255,0.8)", margin: "0 0 1.25rem" },
  container: { maxWidth: "960px", margin: "0 auto", padding: "clamp(0.75rem, 3vw, 1.5rem)" },
  card: { background: C.white, borderRadius: "12px", padding: "clamp(0.75rem,3vw,1.5rem)", border: `1px solid ${C.border}`, marginBottom: "1rem" },
  cardTitle: { fontSize: "15px", fontWeight: 700, color: C.text, margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  input: {
    width: "100%", padding: "10px 14px", borderRadius: "8px",
    border: `1px solid ${C.border}`, fontSize: "14px", background: C.white,
    color: C.text, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  },
  label: { fontSize: "13px", fontWeight: 500, color: C.textMuted, display: "block", marginBottom: "5px" },
  btnPrimary: {
    background: C.gold, color: C.white, border: "none", borderRadius: "8px",
    padding: "10px 20px", fontSize: "14px", fontWeight: 700, cursor: "pointer",
  },
  btnSecondary: {
    background: "transparent", color: C.text, border: `1px solid ${C.border}`,
    borderRadius: "8px", padding: "10px 20px", fontSize: "14px", cursor: "pointer",
  },
  btnDanger: {
    background: C.red, color: C.white, border: "none", borderRadius: "8px",
    padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
  },
  badge: (color, bg) => ({
    display: "inline-block", padding: "3px 10px", borderRadius: "20px",
    fontSize: "12px", fontWeight: 700, background: bg, color: color,
  }),
  statCard: { background: C.navyMid, borderRadius: "10px", padding: "1rem 1.25rem", textAlign: "center" },
  statLabel: { fontSize: "11px", color: C.navText || C.gold, margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },
  statVal: { fontSize: "2rem", fontWeight: 800, color: C.white, margin: 0 },
  tab: (active) => ({
    padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
    cursor: "pointer", border: "none",
    background: active ? C.navyMid : "transparent", color: active ? C.white : C.textMuted,
  }),
  select: {
    padding: "8px 12px", borderRadius: "8px", border: `1px solid ${C.border}`,
    fontSize: "13px", background: C.white, color: C.text, cursor: "pointer",
    fontFamily: "inherit", outline: "none", width: "100%",
  },
  alert: (type) => ({
    padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "1rem",
    background: type === "error" ? "#fef2f2" : type === "success" ? "#f0fdf4" : "#fffbeb",
    color: type === "error" ? C.red : type === "success" ? C.green : "#92400e",
    border: `1px solid ${type === "error" ? "#fecaca" : type === "success" ? "#bbf7d0" : "#fde68a"}`,
  }),
};

function Alert({ type, msg }) {
  if (!msg) return null;
  return <div style={styles.alert(type)}>{msg}</div>;
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.navy, animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function TeamBtn({ team, selected, onClick, style = {}, resultState = null, disabled = false }) {
  const isMobile = useIsMobile();
  const meta = TEAM_META[team] || { seed: "", flag: "us", c1: "rgba(100,100,100,0.25)", c2: "rgba(150,150,150,0.20)", c3: "rgba(100,100,100,0.25)", border: "#999" };
  const pg = "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)";

  const isCorrect = resultState === "correct";
  const isWrong   = resultState === "wrong";
  const isWinner  = resultState === "winner";

  const borderColor = isCorrect ? "#1D9E75"
                    : isWrong   ? "#fca5a5"
                    : selected  ? meta.border
                    : C.border;
  const borderWidth = (isCorrect || isWrong || selected) ? "2px" : "1px";
  const bg = isCorrect ? "rgba(29,158,117,0.06)"
           : isWrong   ? "rgba(220,38,38,0.04)"
           : C.white;
  const showStripes = selected || isCorrect;
  const stripeWidth = isMobile ? 44 : 72;
  const stripeRight = isMobile ? 6 : 10;

  return (
    <button
      onClick={(resultState || disabled) ? undefined : onClick}
      style={{
        flex: 1, display: "flex", alignItems: "center", gap: isMobile ? "6px" : "8px",
        padding: isMobile ? "9px 8px" : "10px 14px", borderRadius: "8px", fontSize: "13px",
        fontWeight: (selected || isCorrect || isWinner) ? 700 : 500,
        cursor: (resultState || disabled) ? "default" : "pointer", textAlign: "left",
        border: `${borderWidth} solid ${borderColor}`,
        background: bg, color: C.text,
        position: "relative", overflow: "hidden", minWidth: 0,
        opacity: disabled ? 0.45 : 1,
        transition: "all 0.1s", ...style,
      }}
    >
      {meta.seed && (
        <span style={{
          fontSize: "10px", fontWeight: 800, padding: "2px 5px", borderRadius: "4px",
          background: "#1a1a1a", color: "#fff", flexShrink: 0,
        }}>#{meta.seed}</span>
      )}
      <span style={{
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        textDecoration: isWrong ? "line-through" : "none",
        color: isWrong ? C.textMuted : C.text,
        flex: (isWinner || isCorrect) ? "none" : 1,
        zIndex: 1,
      }}>{team}</span>
      {(isWinner || isCorrect) && (
        <span style={{
          fontSize: "11px", fontWeight: 700, color: "#1D9E75", flexShrink: 0,
          zIndex: 1, position: "relative", marginLeft: "auto",
          paddingRight: showStripes ? `${stripeWidth - 18}px` : "4px",
        }}>{isMobile ? "✓" : "Winner"}</span>
      )}
      {showStripes && (
        <div style={{ position: "absolute", right: `${stripeRight}px`, top: 0, bottom: 0, width: `${stripeWidth}px`, display: "flex", gap: "3px", pointerEvents: "none", alignItems: "stretch" }}>
          <div style={{ flex: 1, background: meta.c1, clipPath: pg }} />
          <div style={{ flex: 1, background: meta.c2, clipPath: pg }} />
          <div style={{ flex: 1, background: meta.c3, clipPath: pg }} />
        </div>
      )}
    </button>
  );
}

function AppNav({ page, setPage, isAdmin, setShowAdmin, themeKey }) {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    ["leaderboard", "Leaderboard"],
    ["stage1", "Round 1 & WC"],
    ["stage2", "Final 8 Bracket"],
    ["results", "Results"],
    ["insights", "Insights"],
    ["guide", "Guide"],
  ];
  const handleNav = (id) => { setPage(id); setMenuOpen(false); };
  return (
    <>
      <nav key={`nav-${themeKey}`} style={{ ...styles.nav, background: C.navy, position: "relative", zIndex: 200 }}>
        <span
          style={{
            ...styles.navLogo,
            color: C.navText || C.gold,
            fontFamily: C.fontSerif ? "'Georgia','Times New Roman',serif" : "'DM Sans',sans-serif",
            fontStyle: C.fontSerif ? "italic" : "normal",
          }}
          onClick={() => handleNav("leaderboard")}
        >
          {C.navTitle || "FSF MLS Cup"}
        </span>
        {isMobile ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: C.navText || C.white }}>
              {navItems.find(([id]) => id === page)?.[1] || ""}
            </span>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", color: C.navText || C.white, fontSize: "20px" }}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        ) : (
          <div style={styles.navLinks}>
            {navItems.map(([id, label]) => (
              <button key={id} style={styles.navBtn(page === id)} onClick={() => handleNav(id)}>{label}</button>
            ))}
            {isAdmin && <button style={{ ...styles.navBtn(false), marginLeft: "8px", border: "1px solid rgba(255,255,255,0.4)" }} onClick={() => setShowAdmin(true)}>Admin</button>}
            <button style={styles.navBtn(false)} onClick={() => supabase.auth.signOut()}>Sign Out</button>
          </div>
        )}
      </nav>
      {isMobile && menuOpen && (
        <div style={{ position: "fixed", top: "60px", left: 0, right: 0, zIndex: 199, background: C.navyMid, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
          {navItems.map(([id, label]) => (
            <button key={id} onClick={() => handleNav(id)} style={{
              display: "block", width: "100%", textAlign: "left", padding: "14px 20px",
              background: page === id ? C.navy : "transparent", border: "none",
              borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: "15px",
              fontWeight: page === id ? 700 : 400, color: "#fff", cursor: "pointer",
            }}>{label}</button>
          ))}
          {isAdmin && (
            <button onClick={() => { setShowAdmin(true); setMenuOpen(false); }} style={{
              display: "block", width: "100%", textAlign: "left", padding: "14px 20px",
              background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.08)",
              fontSize: "15px", color: "#fff", cursor: "pointer",
            }}>Admin Panel</button>
          )}
          <button onClick={() => supabase.auth.signOut()} style={{
            display: "block", width: "100%", textAlign: "left", padding: "14px 20px",
            background: "transparent", border: "none", fontSize: "15px", color: "rgba(255,255,255,0.6)", cursor: "pointer",
          }}>Sign Out</button>
        </div>
      )}
    </>
  );
}

// ── 6. AUTH SCREEN ───────────────────────────────────────────────────────────
function AuthScreen({ registrationOpen = true }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [inviteCode, setInviteCode] = useState("mls26");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  async function handleSubmit() {
    setError(""); setLoading(true);
    try {
      if (mode === "register") {
        if (!inviteCode.trim()) throw new Error("An invite code is required to create an account.");
        const { data: league, error: le } = await supabase
          .from("leagues").select("id,name").eq("invite_code", inviteCode.trim().toLowerCase()).single();
        if (le || !league) throw new Error("Invalid invite code. Default code is: mls26");
        const { data: authData, error: e } = await supabase.auth.signUp({
          email, password: pass, options: { data: { display_name: name } }
        });
        if (e) throw e;
        if (authData?.user?.id) {
          await new Promise((r) => setTimeout(r, 600));
          await supabase.from("profiles").upsert({
            id: authData.user.id, display_name: name, email, league_id: league.id
          }, { onConflict: "id" });
        }
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (e) throw e;
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ ...styles.app, display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ ...styles.hero, background: C.navy }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "18px", marginBottom: "0.5rem" }}>
          {C.heroLogo && <img src={C.heroLogo} alt="Logo" style={{ width: "64px", height: "64px", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
          <div style={{ ...styles.heroTitle, margin: 0, fontFamily: C.fontSerif ? "'Georgia','Times New Roman',serif" : "inherit", fontStyle: C.fontSerif ? "italic" : "normal", color: C.heroTitleColor || C.white }}>
            {C.heroTitle}
          </div>
          {C.heroLogo && <img src={C.heroLogo} alt="Logo" style={{ width: "64px", height: "64px", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
        </div>
        <div style={{ ...styles.heroSub, color: C.heroSubColor }}>{C.heroSub}</div>
      </div>

      <div style={{ ...styles.container, maxWidth: "420px", width: "100%" }}>
        <div style={styles.card}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
            {["login", ...(registrationOpen ? ["register"] : [])].map((m) => (
              <button key={m} style={styles.tab(mode === m)} onClick={() => setMode(m)}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>
          <Alert type="error" msg={error} />
          {mode === "register" && (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label style={styles.label}>Display Name</label>
                <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name on the leaderboard" />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={styles.label}>League Invite Code</label>
                <input style={styles.input} value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="mls26" />
              </div>
            </>
          )}
          <div style={{ marginBottom: "1rem" }}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
          </div>
          <button style={{ ...styles.btnPrimary, width: "100%" }} onClick={handleSubmit} disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button onClick={() => setShowGuide(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: C.textMuted, textDecoration: "underline" }}>
              How does the MLS Cup Playoffs Challenge work?
            </button>
          </div>
        </div>
      </div>

      {showGuide && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, overflowY: "auto", display: "flex", justifyContent: "center", padding: "2rem 1rem" }} onClick={() => setShowGuide(false)}>
          <div style={{ background: C.bg, borderRadius: "16px", width: "100%", maxWidth: "680px", height: "fit-content", padding: "1.5rem" }} onClick={(e) => e.stopPropagation()}>
            <UserGuide embedded />
            <button style={{ ...styles.btnPrimary, width: "100%", marginTop: "1rem" }} onClick={() => setShowGuide(false)}>Close Guide</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 7. STAGE 1 PICKS (WILD CARD + ROUND ONE BEST-OF-3 SERIES) ────────────────
function Stage1Picks({ userId, locked, matchResultsCache = [], standingsCache = [] }) {
  const [activeConf, setActiveConf] = useState("EAST");
  const [viewMode, setViewMode] = useState("series"); // 'series' or 'date'
  const [matchPicks, setMatchPicks] = useState({});
  const [groupPicks, setGroupPicks] = useState({});
  const [matchResults, setMatchResults] = useState({});
  const [standings, setStandings] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: mp }, { data: gp }] = await Promise.all([
        supabase.from("stage1_match_picks").select("match_id,pick").eq("user_id", userId),
        supabase.from("stage1_group_picks").select("group_code,first_place,second_place").eq("user_id", userId),
      ]);
      const mpMap = {}; (mp || []).forEach((p) => (mpMap[p.match_id] = p.pick));
      setMatchPicks(mpMap);
      const gpMap = {}; (gp || []).forEach((p) => (gpMap[p.group_code] = { first: p.first_place, second: p.second_place }));
      setGroupPicks(gpMap);

      const mrMap = {};
      matchResultsCache.filter((r) => r.stage === "group").forEach((r) => (mrMap[r.match_id] = r));
      setMatchResults(mrMap);
      const stMap = {};
      standingsCache.forEach((s) => (stMap[s.group_code] = s));
      setStandings(stMap);
      setLoading(false);
    }
    load();
  }, [userId, matchResultsCache, standingsCache]);

  async function pickMatch(matchId, pick) {
    if (locked) return;
    const match = ALL_GROUP_MATCHES.find((m) => m.matchId === matchId);
    if (!match) return;

    const nextPicks = { ...matchPicks, [matchId]: pick };
    const [t1, t2] = getResolvedMatchTeams(match, nextPicks, matchResults);

    // If this is a Round 1 Series match, check if Game 1 + Game 2 produced a 2-0 sweep
    if (!match.isWildCard) {
      const seriesId = match.group;
      const sweep = isSeriesSweep(seriesId, nextPicks);
      if (sweep && nextPicks[`${seriesId}_G3`]) {
        delete nextPicks[`${seriesId}_G3`];
        await supabase.from("stage1_match_picks").delete().eq("user_id", userId).eq("match_id", `${seriesId}_G3`);
      }
    }

    setMatchPicks(nextPicks);
    setSaveStatus((prev) => ({ ...prev, [matchId]: "saving" }));

    try {
      await supabase.from("stage1_match_picks").upsert({
        user_id: userId, match_id: matchId, group_code: match.group,
        team1: t1, team2: t2, pick,
      }, { onConflict: "user_id,match_id" });

      // Auto-derive Series Winner & Series Length ('2-0' or '2-1') for Round 1 Series
      if (!match.isWildCard) {
        const seriesId = match.group;
        const sorted = calcSeriesWins(seriesId, nextPicks, matchResults);
        const { winner, length } = deriveSeriesOutcome(sorted);
        if (winner && length) {
          setGroupPicks((prev) => ({ ...prev, [seriesId]: { first: winner, second: length } }));
          await supabase.from("stage1_group_picks").upsert({
            user_id: userId, group_code: seriesId,
            first_place: winner, second_place: length,
          }, { onConflict: "user_id,group_code" });
        } else {
          setGroupPicks((prev) => ({ ...prev, [seriesId]: { first: "", second: "" } }));
        }
      }
      setSaveStatus((prev) => ({ ...prev, [matchId]: "saved" }));
    } catch {
      setSaveStatus((prev) => ({ ...prev, [matchId]: "error" }));
    }
  }

  if (loading) return <Spinner />;

  const wcPickedCount = ["WC_E", "WC_W"].filter((id) => matchPicks[id]).length;
  const clinchedSeriesCount = Object.keys(GROUPS).filter((sId) => groupPicks[sId]?.first && groupPicks[sId]?.second).length;

  const confWildCard = activeConf === "EAST" ? WILD_CARDS.WC_E : WILD_CARDS.WC_W;
  const confSeriesIds = Object.keys(GROUPS).filter((k) => k.startsWith(activeConf === "EAST" ? "E_" : "W_"));

  function renderMatchRow(m) {
    const [t1, t2] = getResolvedMatchTeams(m, matchPicks, matchResults);
    const userPick = matchPicks[m.matchId];
    const actualRes = matchResults[m.matchId]?.result;
    const hasResult = !!actualRes;

    // Check if Game 3 is unneeded because user picked a 2-0 sweep
    const sweep = !m.isWildCard && m.gameNum === 3 && isSeriesSweep(m.group, matchPicks);
    if (sweep && !hasResult) {
      return (
        <div key={m.matchId} style={{ padding: "10px 14px", borderRadius: "8px", background: "#f8fafc", border: `1px dashed ${C.border}`, textAlign: "center", fontSize: "12px", color: C.textMuted, fontStyle: "italic" }}>
          Game 3 (If Necessary) — Not needed based on your 2–0 sweep pick
        </div>
      );
    }

    const t1State = !hasResult ? null : userPick === "team1" ? (actualRes === "team1" ? "correct" : "wrong") : actualRes === "team1" ? "winner" : null;
    const t2State = !hasResult ? null : userPick === "team2" ? (actualRes === "team2" ? "correct" : "wrong") : actualRes === "team2" ? "winner" : null;
    const maxPts = m.isWildCard ? SCORING_RULES.STAGE1.WILD_CARD_WIN : SCORING_RULES.STAGE1.ROUND1_GAME_WIN;
    const earnedPts = hasResult && userPick === actualRes ? `+${maxPts}` : null;

    return (
      <div key={m.matchId} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: C.navyMid, background: `${C.navy}25`, padding: "2px 8px", borderRadius: "4px" }}>
            {m.isWildCard ? "WILD CARD (SINGLE ELIM.)" : `GAME ${m.gameNum}${m.gameNum === 3 ? " (IF NECESSARY)" : ""}`}
          </span>
          <span style={{ fontSize: "11px", color: C.textMuted }}>{m.date} · {m.time}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TeamBtn team={t1} selected={!hasResult && userPick === "team1"} resultState={t1State} onClick={() => pickMatch(m.matchId, "team1")} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "42px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: C.textMuted }}>vs</span>
            {hasResult && (
              <span style={{ fontSize: "11px", fontWeight: 700, color: earnedPts ? C.green : C.textMuted }}>
                {earnedPts ? `✓ ${earnedPts}` : "✗ +0"}
              </span>
            )}
          </div>
          <TeamBtn team={t2} selected={!hasResult && userPick === "team2"} resultState={t2State} onClick={() => pickMatch(m.matchId, "team2")} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {locked && <div style={styles.alert("warning")}>Stage 1 (Wild Card & Round One) picks are locked!</div>}

      {/* Top Progress Boxes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "1.25rem" }}>
        <div style={{ ...styles.card, background: C.navyMid, color: C.white, marginBottom: 0, textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: C.navy, fontWeight: 700 }}>WILD CARD PICKS</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{wcPickedCount}<span style={{ fontSize: "1rem", opacity: 0.5 }}>/2</span></div>
        </div>
        <div style={{ ...styles.card, background: C.navyMid, color: C.white, marginBottom: 0, textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: C.navy, fontWeight: 700 }}>ROUND 1 SERIES CLINCHED</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{clinchedSeriesCount}<span style={{ fontSize: "1rem", opacity: 0.5 }}>/8</span></div>
        </div>
      </div>

      {/* Conference & View Switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {["EAST", "WEST"].map((conf) => (
            <button key={conf} style={styles.tab(activeConf === conf && viewMode === "series")} onClick={() => { setActiveConf(conf); setViewMode("series"); }}>
              {conf === "EAST" ? "Eastern Conference" : "Western Conference"}
            </button>
          ))}
        </div>
        <button
          style={styles.tab(viewMode === "date")}
          onClick={() => setViewMode(viewMode === "date" ? "series" : "date")}
        >
          📅 {viewMode === "date" ? "Back to Series View" : "View All by Date"}
        </button>
      </div>

      {viewMode === "date" ? (
        <div style={styles.card}>
          <div style={styles.cardTitle}>All Wild Card & Round One Fixtures (Chronological)</div>
          {ALL_GROUP_MATCHES.map((m) => renderMatchRow(m))}
        </div>
      ) : (
        <>
          {/* Wild Card Card */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              {confWildCard.label}
              <span style={styles.badge(C.white, C.navyMid)}>+{SCORING_RULES.STAGE1.WILD_CARD_WIN} pts</span>
            </div>
            {renderMatchRow(ALL_GROUP_MATCHES.find((m) => m.matchId === confWildCard.matchId))}
          </div>

          {/* 4 Best-of-3 Series Cards */}
          {confSeriesIds.map((seriesId) => {
            const sMatches = ALL_GROUP_MATCHES.filter((m) => m.group === seriesId).sort((a, b) => a.gameNum - b.gameNum);
            const gp = groupPicks[seriesId] || {};
            const actualSt = standings[seriesId] || {};
            const hasSeriesResult = !!actualSt.first_place;
            const winnerCorrect = hasSeriesResult && gp.first === actualSt.first_place;
            const lengthCorrect = winnerCorrect && gp.second === actualSt.second_place;

            return (
              <div key={seriesId} style={styles.card}>
                <div style={styles.cardTitle}>
                  <span>{SERIES_LABELS[seriesId]} — Best-of-3</span>
                  <span style={styles.badge(C.white, C.navyMid)}>
                    +{SCORING_RULES.STAGE1.SERIES_WINNER} pts Series · +{SCORING_RULES.STAGE1.EXACT_SERIES_LENGTH} pt Length
                  </span>
                </div>
                {sMatches.map((m) => renderMatchRow(m))}

                {/* Auto-derived Series Summary Banner */}
                <div style={{
                  marginTop: "12px", padding: "10px 14px", borderRadius: "8px",
                  background: gp.first ? `${C.navy}15` : "#f8fafc",
                  border: `1px solid ${hasSeriesResult ? (winnerCorrect ? C.green : "#fca5a5") : C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px",
                }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>Your Predicted Series Outcome</div>
                    {gp.first ? (
                      <div style={{ fontSize: "14px", fontWeight: 800, color: C.text }}>
                        Advancing: {gp.first} ({gp.second})
                      </div>
                    ) : (
                      <div style={{ fontSize: "13px", color: C.textMuted, fontStyle: "italic" }}>
                        Pick Game 1 & Game 2 above to lock series winner
                      </div>
                    )}
                  </div>
                  {hasSeriesResult && (
                    <div style={{ fontSize: "12px", fontWeight: 700, color: winnerCorrect ? C.green : C.red }}>
                      {winnerCorrect
                        ? `✓ Series Winner (+${SCORING_RULES.STAGE1.SERIES_WINNER})${lengthCorrect ? ` + Exact ${actualSt.second_place} (+${SCORING_RULES.STAGE1.EXACT_SERIES_LENGTH})` : ""}`
                        : `✗ Actual: ${actualSt.first_place} (${actualSt.second_place})`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ── 8. STAGE 2 PICKS (FINAL 8 SINGLE-ELIMINATION BRACKET) ────────────────────
function Stage2Picks({ userId, locked, stage2Open, knockoutBracket, koResultsCache = [] }) {
  const [picks, setPicks] = useState({});
  const [koResults, setKoResults] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: s2data } = await supabase.from("stage2_picks").select("slot_id,picked_team").eq("user_id", userId);
      const map = {}; (s2data || []).forEach((p) => (map[p.slot_id] = p.picked_team));
      setPicks(map);
      const rmap = {};
      koResultsCache.forEach((r) => (rmap[r.match_id] = { result: r.result, team1: r.team1, team2: r.team2 }));
      setKoResults(rmap);
      setLoading(false);
    }
    load();
  }, [userId, koResultsCache]);

  function getSlotTeams(slotId) {
    const feedSlots = BRACKET_FEED[slotId];
    if (!feedSlots) {
      const slot = knockoutBracket.find((s) => s.slotId === slotId);
      return [slot?.team1 || "", slot?.team2 || ""];
    }
    const [feedA, feedB] = feedSlots;
    return [picks[feedA] || null, picks[feedB] || null];
  }

  function makePick(slotId, team) {
    if (locked) return;
    setPicks((prev) => {
      const next = { ...prev, [slotId]: team };
      function clearDownstream(sid) {
        for (const [downSlot, feedSlots] of Object.entries(BRACKET_FEED)) {
          if (feedSlots.includes(sid)) {
            const [t1, t2] = [next[feedSlots[0]] || null, next[feedSlots[1]] || null];
            if (next[downSlot] && next[downSlot] !== t1 && next[downSlot] !== t2) {
              next[downSlot] = "";
              clearDownstream(downSlot);
            }
          }
        }
      }
      clearDownstream(slotId);
      return next;
    });
  }

  async function saveAll() {
    if (locked) return;
    setSaving(true); setMsg({ type: "", text: "" });
    try {
      for (const [slotId, team] of Object.entries(picks)) {
        if (!team) continue;
        const round = slotId.replace(/_\d+$/, "");
        await supabase.from("stage2_picks").upsert(
          { user_id: userId, slot_id: slotId, round, picked_team: team },
          { onConflict: "user_id,slot_id" }
        );
      }
      setMsg({ type: "success", text: "Final 8 Knockout Bracket picks saved!" });
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    finally { setSaving(false); }
  }

  if (!stage2Open) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔒</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>Final 8 Knockout Bracket Not Yet Open</div>
          <p style={{ color: C.textMuted, fontSize: "14px" }}>
            Stage 2 opens as soon as the Round One Best-of-3 series finish and the 8 Conference Semifinalists are set.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <Spinner />;
  const filledSlots = knockoutBracket.filter((s) => picks[s.slotId]).length;

  return (
    <div style={styles.container}>
      {locked && <div style={styles.alert("warning")}>Stage 2 Knockout Bracket picks are locked!</div>}
      <Alert type={msg.type} msg={msg.text} />

      <div style={{ ...styles.card, background: C.navyMid, color: C.white, marginBottom: "1.25rem", textAlign: "center" }}>
        <div style={{ fontSize: "11px", color: C.navy, fontWeight: 700 }}>BRACKET PICKS COMPLETED</div>
        <div style={{ fontSize: "2rem", fontWeight: 800 }}>{filledSlots}<span style={{ fontSize: "1rem", opacity: 0.5 }}>/{knockoutBracket.length}</span></div>
      </div>

      {KNOCKOUT_ROUNDS.map(({ round, label, points }) => {
        const roundSlots = knockoutBracket.filter((s) => s.round === round);
        return (
          <div key={round} style={styles.card}>
            <div style={styles.cardTitle}>
              {label}
              <span style={styles.badge(C.white, C.navyMid)}>+{points} pts each</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {roundSlots.map((slot) => {
                const [t1, t2] = getSlotTeams(slot.slotId);
                const picked = picks[slot.slotId] || "";
                const bothKnown = t1 && t2;
                const koResult = koResults[slot.slotId];
                const hasResult = !!(koResult?.result);
                const actualWinner = hasResult ? (koResult.result === "team1" ? koResult.team1 : koResult.team2) : null;
                const userCorrect = hasResult && picked === actualWinner;

                const t1State = !hasResult ? null : picked === t1 ? (userCorrect ? "correct" : "wrong") : actualWinner === t1 ? "winner" : null;
                const t2State = !hasResult ? null : picked === t2 ? (userCorrect ? "correct" : "wrong") : actualWinner === t2 ? "winner" : null;

                return (
                  <div key={slot.slotId}>
                    <div style={{ fontSize: "11px", color: C.textMuted, fontWeight: 700, marginBottom: "4px" }}>{slot.label}</div>
                    {!bothKnown ? (
                      <div style={{ padding: "10px", borderRadius: "8px", background: "#f8fafc", border: `1px solid ${C.border}`, textAlign: "center", fontSize: "13px", color: C.textMuted, fontStyle: "italic" }}>
                        Select winners in the previous round to populate this matchup
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <TeamBtn team={t1} selected={!hasResult && picked === t1} resultState={t1State} onClick={() => makePick(slot.slotId, t1)} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: C.textMuted }}>vs</span>
                        <TeamBtn team={t2} selected={!hasResult && picked === t2} resultState={t2State} onClick={() => makePick(slot.slotId, t2)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {!locked && (
        <button style={{ ...styles.btnPrimary, width: "100%" }} onClick={saveAll} disabled={saving}>
          {saving ? "Saving..." : "Save All Knockout Bracket Picks"}
        </button>
      )}
    </div>
  );
}

// ── 9. LEADERBOARD ───────────────────────────────────────────────────────────
function Leaderboard({ currentUserId, leagueId, leagueName, isAdmin, resultsVersion }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [
        { data: allProfiles },
        { data: s1match },
        { data: s1group },
        { data: s2picks },
        { data: freshResults },
        { data: freshStandings },
      ] = await Promise.all([
        supabase.from("profiles").select("id, display_name, is_admin, league_id"),
        supabase.from("stage1_match_picks").select("user_id,match_id,pick"),
        supabase.from("stage1_group_picks").select("user_id,group_code,first_place,second_place"),
        supabase.from("stage2_picks").select("user_id,slot_id,round,picked_team"),
        supabase.from("match_results").select("match_id,result,team1,team2,stage"),
        supabase.from("group_standings").select("*"),
      ]);

      const profiles = leagueId
        ? (allProfiles || []).filter((p) => p.league_id === leagueId || p.is_admin)
        : (allProfiles || []);

      const board = profiles.map((p) => {
        const s1 = calcStage1Score(
          (s1match || []).filter((x) => x.user_id === p.id),
          (s1group || []).filter((x) => x.user_id === p.id),
          freshResults || [],
          freshStandings || []
        );
        const s2 = calcStage2Score((s2picks || []).filter((x) => x.user_id === p.id), freshResults || []);
        return {
          ...p,
          s1score: s1.score,
          s2score: s2.score,
          total: s1.score + s2.score,
          correctPicks: s1.correct + s2.correct,
        };
      }).sort((a, b) => b.total - a.total || b.correctPicks - a.correctPicks || (a.display_name || "").localeCompare(b.display_name || ""));

      let rank = 1;
      for (let i = 0; i < board.length; i++) {
        if (i > 0 && board[i].total === board[i - 1].total && board[i].correctPicks === board[i - 1].correctPicks) {
          board[i].rank = board[i - 1].rank;
        } else {
          board[i].rank = rank;
        }
        rank++;
      }
      setRows(board);
      setLoading(false);
    }
    load();
  }, [leagueId, resultsVersion]);

  if (loading) return <Spinner />;
  const me = rows.find((r) => r.id === currentUserId);

  return (
    <div style={styles.container}>
      {me && (
        <div style={{ background: C.navy, borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: C.white }}>YOUR STANDING</span>
            {leagueName && <span style={{ fontSize: "12px", color: C.white, background: "rgba(0,0,0,0.2)", padding: "2px 10px", borderRadius: "12px" }}>{leagueName}</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {[["RANK", `#${me.rank}`], ["TOTAL PTS", me.total], ["ROUND 1 & WC", me.s1score], ["FINAL 8 BRACKET", me.s2score]].map(([l, v]) => (
              <div key={l} style={styles.statCard}>
                <div style={styles.statLabel}>{l}</div>
                <div style={styles.statVal}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.cardTitle}>Standings</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {["Rank", "Player", "Round 1 & WC", "Final 8", "Total", "Correct"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: h === "Player" ? "left" : "center", fontSize: "12px", color: C.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, background: r.id === currentUserId ? `${C.navy}18` : "transparent" }}>
                  <td style={{ padding: "10px", textAlign: "center", fontWeight: 700 }}>
                    {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                  </td>
                  <td style={{ padding: "10px", fontWeight: r.id === currentUserId ? 700 : 500 }}>
                    {r.display_name} {r.id === currentUserId && <span style={{ fontSize: "11px", color: C.navy }}>(you)</span>}
                  </td>
                  <td style={{ padding: "10px", textAlign: "center" }}>{r.s1score}</td>
                  <td style={{ padding: "10px", textAlign: "center" }}>{r.s2score}</td>
                  <td style={{ padding: "10px", textAlign: "center", fontWeight: 800 }}>{r.total}</td>
                  <td style={{ padding: "10px", textAlign: "center", color: C.textMuted }}>{r.correctPicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── 10. RESULTS & INSIGHTS & GUIDE ───────────────────────────────────────────
function ResultsPage({ matchResultsCache = [], standingsCache = [], koResultsCache = [] }) {
  const mrMap = {}; matchResultsCache.forEach((r) => (mrMap[r.match_id] = r));
  const stMap = {}; standingsCache.forEach((s) => (stMap[s.group_code] = s));

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Round One Series Summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
          {Object.keys(GROUPS).map((sId) => {
            const st = stMap[sId];
            return (
              <div key={sId} style={{ padding: "10px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, background: st?.first_place ? "rgba(29,158,117,0.06)" : "#f8fafc" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: C.textMuted }}>{SERIES_LABELS[sId]}</div>
                <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "4px" }}>
                  {st?.first_place ? `✓ ${st.first_place} (${st.second_place})` : "In Progress / Upcoming"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Match-by-Match Results</div>
        {ALL_GROUP_MATCHES.map((m) => {
          const res = mrMap[m.matchId];
          const [t1, t2] = getResolvedMatchTeams(m, {}, mrMap);
          return (
            <div key={m.matchId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: "13px" }}>
              <span style={{ fontWeight: res?.result === "team1" ? 700 : 400, flex: 1 }}>{t1}</span>
              <span style={{ padding: "2px 10px", fontWeight: 700, color: res?.result ? C.green : C.textMuted }}>
                {res?.result ? (res.score1 !== null ? `${res.score1} – ${res.score2}` : (res.result === "team1" ? `${t1} Win` : `${t2} Win`)) : `${m.date} · ${m.time}`}
              </span>
              <span style={{ fontWeight: res?.result === "team2" ? 700 : 400, flex: 1, textAlign: "right" }}>{t2}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Insights({ stage1Locked }) {
  const [picks, setPicks] = useState([]);
  useEffect(() => {
    if (!stage1Locked) return;
    supabase.from("stage1_group_picks").select("group_code,first_place,second_place").then(({ data }) => setPicks(data || []));
  }, [stage1Locked]);

  if (!stage1Locked) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔒</div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>League Insights Unlock After Kickoff</div>
          <p style={{ fontSize: "14px", color: C.textMuted }}>Once Stage 1 locks, see who your league picked to win every Best-of-3 series.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Round One Series Winner Consensus</div>
        {Object.keys(GROUPS).map((sId) => {
          const sPicks = picks.filter((p) => p.group_code === sId && p.first_place);
          const counts = {};
          sPicks.forEach((p) => { counts[p.first_place] = (counts[p.first_place] || 0) + 1; });
          return (
            <div key={sId} style={{ marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>{SERIES_LABELS[sId]}</div>
              {Object.entries(counts).map(([team, cnt]) => {
                const pct = sPicks.length ? Math.round((cnt / sPicks.length) * 100) : 0;
                return (
                  <div key={team} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", marginBottom: "4px" }}>
                    <span style={{ width: "180px" }}>{team}</span>
                    <div style={{ flex: 1, height: "8px", background: C.border, borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: C.navy }} />
                    </div>
                    <span style={{ fontWeight: 700, minWidth: "42px", textAlign: "right" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UserGuide({ embedded = false }) {
  const sections = [
    {
      title: "Two-Stage MLS Cup Playoffs Format",
      items: [
        "Stage 1 covers the Wild Card Round (2 single-elimination games) and Round One Best-of-3 Series (8 series across East and West).",
        "Stage 2 opens once the Round One series conclude and the Final 8 teams are set for the single-elimination Conference Semifinals, Conference Finals, and MLS Cup.",
      ],
    },
    {
      title: "Stage 1 Scoring (Wild Card & Round One)",
      items: [
        `Wild Card Winners: +${SCORING_RULES.STAGE1.WILD_CARD_WIN} points per correct pick.`,
        `Round One Match Winners (Games 1, 2, 3): +${SCORING_RULES.STAGE1.ROUND1_GAME_WIN} point per game.`,
        `Series Advancing Team: +${SCORING_RULES.STAGE1.SERIES_WINNER} points per series.`,
        `Exact Series Length Bonus: +${SCORING_RULES.STAGE1.EXACT_SERIES_LENGTH} bonus point (+4 total for the series) if you pick the advancing team AND whether they win in 2–0 or 2–1.`,
        "Every MLS Playoff game produces a winner (straight to PK shootouts if tied after 90 minutes). If you pick the same team to win Game 1 and Game 2, Game 3 automatically locks as a 2–0 sweep!",
      ],
    },
    {
      title: "Stage 2 Scoring (Final 8 Knockout Bracket)",
      items: [
        `Conference Semifinals (4 matches): +${SCORING_RULES.STAGE2.CSF} points each.`,
        `Conference Finals (2 matches): +${SCORING_RULES.STAGE2.CF} points each.`,
        `MLS Cup Champion: +${SCORING_RULES.STAGE2.CUP} points.`,
      ],
    },
  ];

  const body = sections.map((s) => (
    <div key={s.title} style={styles.card}>
      <div style={styles.cardTitle}>{s.title}</div>
      <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
        {s.items.map((it, i) => <li key={i} style={{ fontSize: "14px", marginBottom: "6px", lineHeight: 1.5 }}>{it}</li>)}
      </ul>
    </div>
  ));
  return embedded ? <div>{body}</div> : <div style={styles.container}>{body}</div>;
}

// ── 11. ADMIN PANEL ──────────────────────────────────────────────────────────
function AdminPanel({ onClose, onResultsChange }) {
  const [activeTab, setActiveTab] = useState("results");
  const [results, setResults] = useState([]);
  const [standings, setStandings] = useState([]);
  const [settings, setSettings] = useState({});
  const [bracket, setBracket] = useState([]);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    const [{ data: r }, { data: s }, { data: se }, { data: b }] = await Promise.all([
      supabase.from("match_results").select("*"),
      supabase.from("group_standings").select("*"),
      supabase.from("app_settings").select("*"),
      supabase.from("match_results").select("*").in("stage", ["CSF", "CF", "CUP"]),
    ]);
    setResults(r || []);
    setStandings(s || []);
    const sMap = {}; (se || []).forEach((x) => (sMap[x.key] = x.value));
    setSettings(sMap);
    setBracket(b || []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function recordStage1Result(m, resultWinner) {
    const mrMap = {}; results.forEach((r) => (mrMap[r.match_id] = r));
    const [t1, t2] = getResolvedMatchTeams(m, {}, mrMap);
    const data = {
      match_id: m.matchId, stage: "group", group_code: m.group,
      team1: t1, team2: t2, result: resultWinner, updated_at: new Date().toISOString(),
    };
    await supabase.from("match_results").upsert(data, { onConflict: "match_id" });
    const nextResults = [...results.filter((r) => r.match_id !== m.matchId), data];
    setResults(nextResults);

    // If Round 1 series reaches 2 wins for either team, auto-save official series outcome to group_standings
    if (!m.isWildCard) {
      const seriesPicksSim = {};
      nextResults.filter((r) => r.group_code === m.group && r.result).forEach((r) => (seriesPicksSim[r.match_id] = r.result));
      const nextMrMap = {}; nextResults.forEach((r) => (nextMrMap[r.match_id] = r));
      const sorted = calcSeriesWins(m.group, seriesPicksSim, nextMrMap);
      const { winner, length } = deriveSeriesOutcome(sorted);
      if (winner && length) {
        const stData = { group_code: m.group, first_place: winner, second_place: length, updated_at: new Date().toISOString() };
        await supabase.from("group_standings").upsert(stData, { onConflict: "group_code" });
        setStandings((prev) => [...prev.filter((s) => s.group_code !== m.group), stData]);
        setMsg({ type: "success", text: `${winner} clinches ${m.group} (${length})!` });
      } else {
        setMsg({ type: "success", text: `Saved ${m.matchId} winner.` });
      }
    } else {
      setMsg({ type: "success", text: `Saved Wild Card (${m.matchId}) winner.` });
    }
    if (onResultsChange) onResultsChange();
  }

  async function autoPopulateCSF() {
    const stMap = {}; standings.forEach((s) => (stMap[s.group_code] = s));
    const CSF_TEMPLATE = [
      ["CSF_1", stMap["E_S1"]?.first_place || "", stMap["E_S4"]?.first_place || ""],
      ["CSF_2", stMap["E_S2"]?.first_place || "", stMap["E_S3"]?.first_place || ""],
      ["CSF_3", stMap["W_S1"]?.first_place || "", stMap["W_S4"]?.first_place || ""],
      ["CSF_4", stMap["W_S2"]?.first_place || "", stMap["W_S3"]?.first_place || ""],
    ];
    for (const [slotId, t1, t2] of CSF_TEMPLATE) {
      await supabase.from("match_results").upsert(
        { match_id: slotId, stage: "CSF", team1: t1, team2: t2, result: null },
        { onConflict: "match_id" }
      );
    }
    await loadAll();
    if (onResultsChange) onResultsChange();
    setMsg({ type: "success", text: "Conference Semifinals populated from Round One series winners!" });
  }

  async function recordStage2Result(slotId, round, winnerOpt, t1, t2) {
    const winner = winnerOpt === "team1" ? t1 : t2;
    await supabase.from("match_results").upsert(
      { match_id: slotId, stage: round, team1: t1, team2: t2, result: winnerOpt },
      { onConflict: "match_id" }
    );
    // Cascade to Conference Finals / MLS Cup
    for (const [downSlot, feedSlots] of Object.entries(BRACKET_FEED)) {
      if (!feedSlots.includes(slotId)) continue;
      const [feedA, feedB] = feedSlots;
      const existingDown = bracket.find((b) => b.match_id === downSlot) || {};
      const newT1 = feedA === slotId ? winner : (existingDown.team1 || "");
      const newT2 = feedB === slotId ? winner : (existingDown.team2 || "");
      const downRound = downSlot.replace(/_\d+$/, "");
      await supabase.from("match_results").upsert(
        { match_id: downSlot, stage: downRound, team1: newT1, team2: newT2, result: null },
        { onConflict: "match_id" }
      );
    }
    await loadAll();
    if (onResultsChange) onResultsChange();
    setMsg({ type: "success", text: `${winner} advances!` });
  }

  async function updateSetting(key, value) {
    await supabase.from("app_settings").upsert({ key, value }, { onConflict: "key" });
    setSettings((p) => ({ ...p, [key]: value }));
    setMsg({ type: "success", text: `Setting "${key}" updated to ${value}.` });
    if (onResultsChange) onResultsChange();
  }

  const mrMap = {}; results.forEach((r) => (mrMap[r.match_id] = r));
  const bracketMap = {}; bracket.forEach((b) => (bracketMap[b.match_id] = b));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", overflowY: "auto", zIndex: 250, padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto", ...styles.card }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ fontSize: "18px", fontWeight: 800 }}>Admin Panel — MLS Cup Playoffs</div>
          <button style={styles.btnSecondary} onClick={onClose}>Close</button>
        </div>
        <Alert type={msg.type} msg={msg.text} />

        <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {[["results", "Stage 1 Results"], ["knockout", "Stage 2 Bracket"], ["settings", "Settings"]].map(([id, label]) => (
            <button key={id} style={styles.tab(activeTab === id)} onClick={() => setActiveTab(id)}>{label}</button>
          ))}
        </div>

        {loading ? <Spinner /> : (
          <>
            {activeTab === "results" && (
              <div>
                {ALL_GROUP_MATCHES.map((m) => {
                  const res = mrMap[m.matchId];
                  const [t1, t2] = getResolvedMatchTeams(m, {}, mrMap);
                  return (
                    <div key={m.matchId} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, minWidth: "70px", color: C.textMuted }}>{m.matchId}</span>
                      <button
                        onClick={() => recordStage1Result(m, "team1")}
                        style={{ flex: 1, padding: "7px", borderRadius: "6px", border: res?.result === "team1" ? `2px solid ${C.green}` : `1px solid ${C.border}`, fontWeight: res?.result === "team1" ? 700 : 400, cursor: "pointer", background: C.white }}
                      >{t1}</button>
                      <span style={{ fontSize: "11px", color: C.textMuted }}>vs</span>
                      <button
                        onClick={() => recordStage1Result(m, "team2")}
                        style={{ flex: 1, padding: "7px", borderRadius: "6px", border: res?.result === "team2" ? `2px solid ${C.green}` : `1px solid ${C.border}`, fontWeight: res?.result === "team2" ? 700 : 400, cursor: "pointer", background: C.white }}
                      >{t2}</button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "knockout" && (
              <div>
                <button style={{ ...styles.btnPrimary, marginBottom: "1rem" }} onClick={autoPopulateCSF}>
                  ⚡ Auto-fill Conf. Semis from Round 1 Winners
                </button>
                {KNOCKOUT_ROUNDS.map(({ round, label, slots }) => (
                  <div key={round} style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontWeight: 700, marginBottom: "8px" }}>{label}</div>
                    {Array.from({ length: slots }, (_, i) => {
                      const slotId = `${round}_${i + 1}`;
                      const slot = bracketMap[slotId] || {};
                      const t1 = slot.team1 || "TBD";
                      const t2 = slot.team2 || "TBD";
                      return (
                        <div key={slotId} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          <span style={{ fontSize: "11px", minWidth: "60px", color: C.textMuted }}>{slotId}</span>
                          <button
                            disabled={t1 === "TBD"}
                            onClick={() => recordStage2Result(slotId, round, "team1", t1, t2)}
                            style={{ flex: 1, padding: "8px", borderRadius: "6px", border: slot.result === "team1" ? `2px solid ${C.green}` : `1px solid ${C.border}`, fontWeight: slot.result === "team1" ? 700 : 400, cursor: "pointer", background: C.white }}
                          >{t1}</button>
                          <span>vs</span>
                          <button
                            disabled={t2 === "TBD"}
                            onClick={() => recordStage2Result(slotId, round, "team2", t1, t2)}
                            style={{ flex: 1, padding: "8px", borderRadius: "6px", border: slot.result === "team2" ? `2px solid ${C.green}` : `1px solid ${C.border}`, fontWeight: slot.result === "team2" ? 700 : 400, cursor: "pointer", background: C.white }}
                          >{t2}</button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "settings" && (
              <div>
                {[
                  { key: "registration_open", label: "Registration Open (Allow new sign-ups)" },
                  { key: "stage1_locked", label: "Lock Stage 1 (Wild Card & Round One Picks)" },
                  { key: "stage2_open", label: "Open Stage 2 (Final 8 Knockout Bracket Picks)" },
                  { key: "stage2_locked", label: "Lock Stage 2 (Final 8 Knockout Bracket)" },
                ].map(({ key, label }) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={settings[key] === "true"}
                      onChange={(e) => updateSetting(key, e.target.checked ? "true" : "false")}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── 12. MAIN APP SHELL ───────────────────────────────────────────────────────
const SLOT_LABELS = {
  CSF_1: "East Semifinal 1 (#1/WC vs #4/5)",
  CSF_2: "East Semifinal 2 (#2/7 vs #3/6)",
  CSF_3: "West Semifinal 1 (#1/WC vs #4/5)",
  CSF_4: "West Semifinal 2 (#2/7 vs #3/6)",
  CF_1:  "Eastern Conference Final",
  CF_2:  "Western Conference Final",
  CUP_1: "MLS Cup Final",
};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState("leaderboard");
  const [showAdmin, setShowAdmin] = useState(false);
  const [settings, setSettings] = useState({});
  const [knockoutBracket, setKnockoutBracket] = useState([]);
  const [leagueId, setLeagueId] = useState(null);
  const [leagueName, setLeagueName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [themeKey, setThemeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [globalMatchResults, setGlobalMatchResults] = useState([]);
  const [globalKoResults, setGlobalKoResults] = useState([]);
  const [globalStandings, setGlobalStandings] = useState([]);
  const [resultsVersion, setResultsVersion] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (!session) {
        const { data: regSetting } = await supabase.from("app_settings").select("value").eq("key", "registration_open").maybeSingle();
        if (regSetting) setRegistrationOpen(regSetting.value !== "false");
        setLoading(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  async function refreshAllData(userId) {
    const [{ data: p }, { data: se }, { data: gmr }, { data: gko }, { data: gst }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("app_settings").select("*"),
      supabase.from("match_results").select("*"),
      supabase.from("match_results").select("*").in("stage", ["CSF", "CF", "CUP"]),
      supabase.from("group_standings").select("*"),
    ]);
    setGlobalMatchResults(gmr || []);
    setGlobalKoResults(gko || []);
    setGlobalStandings(gst || []);
    setProfile(p || {});
    setIsAdmin(!!p?.is_admin);

    if (p?.league_id) {
      const { data: lg } = await supabase.from("leagues").select("id,name,theme").eq("id", p.league_id).single();
      if (lg) {
        setLeagueId(lg.id);
        setLeagueName(lg.name);
        applyTheme(lg.theme || "fsf");
        setThemeKey((k) => k + 1);
      }
    }

    const sMap = {}; (se || []).forEach((x) => (sMap[x.key] = x.value));
    setSettings(sMap);

    const bracketSlots = [];
    KNOCKOUT_ROUNDS.forEach(({ round, slots }) => {
      for (let i = 1; i <= slots; i++) {
        const slotId = `${round}_${i}`;
        const existing = (gko || []).find((b) => b.match_id === slotId);
        bracketSlots.push({
          slotId, round,
          label: SLOT_LABELS[slotId] || `${round} Match ${i}`,
          team1: existing?.team1 || "",
          team2: existing?.team2 || "",
        });
      }
    });
    setKnockoutBracket(bracketSlots);
    setLoading(false);
  }

  useEffect(() => {
    if (!session) return;
    refreshAllData(session.user.id);
  }, [session]);

  if (!session) return <AuthScreen registrationOpen={registrationOpen} />;
  if (loading) return <Spinner />;

  const stage1Locked = settings.stage1_locked === "true";
  const stage2Locked = settings.stage2_locked === "true";
  const stage2Open   = settings.stage2_open === "true";

  return (
    <div style={{ ...styles.app, background: C.bg }}>
      <AppNav page={page} setPage={setPage} isAdmin={isAdmin} setShowAdmin={setShowAdmin} themeKey={themeKey} />

      {page === "leaderboard" && (
        <>
          <div style={{ ...styles.hero, background: C.navy }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "18px", marginBottom: "0.5rem" }}>
              {C.heroLogo && <img src={C.heroLogo} alt="Logo" style={{ width: "60px", height: "60px", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
              <div style={{ ...styles.heroTitle, margin: 0, fontFamily: C.fontSerif ? "'Georgia','Times New Roman',serif" : "inherit", fontStyle: C.fontSerif ? "italic" : "normal", color: C.heroTitleColor || C.white }}>
                {C.heroTitle}
              </div>
              {C.heroLogo && <img src={C.heroLogo} alt="Logo" style={{ width: "60px", height: "60px", objectFit: "contain" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />}
            </div>
            <div style={{ ...styles.heroSub, color: C.heroSubColor }}>{C.heroSub}</div>
            <div style={{ fontSize: "13px", color: C.heroSubColor }}>
              Welcome, <strong style={{ color: C.heroNameColor }}>{profile?.display_name}</strong>
            </div>
          </div>
          <Leaderboard currentUserId={session.user.id} leagueId={leagueId} leagueName={leagueName} isAdmin={isAdmin} resultsVersion={resultsVersion} />
        </>
      )}

      {page === "stage1" && <Stage1Picks userId={session.user.id} locked={stage1Locked} matchResultsCache={globalMatchResults} standingsCache={globalStandings} />}
      {page === "stage2" && <Stage2Picks userId={session.user.id} locked={stage2Locked} stage2Open={stage2Open} knockoutBracket={knockoutBracket} koResultsCache={globalKoResults} />}
      {page === "results" && <ResultsPage matchResultsCache={globalMatchResults} standingsCache={globalStandings} koResultsCache={globalKoResults} />}
      {page === "insights" && <Insights stage1Locked={stage1Locked} />}
      {page === "guide" && <UserGuide />}

      {showAdmin && (
        <AdminPanel
          onClose={() => setShowAdmin(false)}
          onResultsChange={async () => {
            await refreshAllData(session.user.id);
            setResultsVersion((v) => v + 1);
          }}
        />
      )}
    </div>
  );
}
