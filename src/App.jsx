import { useState, useEffect, useRef } from "react";

// Simple hook to detect mobile viewport
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

// Long-press tooltip for mobile — attach handlers to any element
function useLongPress(text, delay = 500) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timer = useRef(null);
  function start(e) {
    const touch = e.touches?.[0];
    if (touch) setPos({ x: touch.clientX, y: touch.clientY });
    timer.current = setTimeout(() => setVisible(true), delay);
  }
  function cancel() { clearTimeout(timer.current); }
  function dismiss() { clearTimeout(timer.current); setVisible(false); }
  return {
    handlers: { onTouchStart: start, onTouchEnd: cancel, onTouchMove: cancel },
    tooltip: visible ? (
      <div onClick={dismiss} style={{
        position: "fixed",
        left: Math.min(pos.x, window.innerWidth - 220),
        top: Math.max(pos.y - 80, 60),
        zIndex: 2000,
        background: "rgba(15,25,50,0.95)", color: "#fff",
        fontSize: "12px", lineHeight: 1.5,
        padding: "8px 12px", borderRadius: "8px",
        maxWidth: "210px", boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        pointerEvents: "auto",
      }}>
        {text}
        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>tap to dismiss</div>
      </div>
    ) : null,
  };
}

// Leaderboard column header with hover title + mobile long-press tooltip
function LbHeader({ display, tip, isMobile }) {
  const { handlers, tooltip } = useLongPress(tip);
  return (
    <th title={tip} {...(isMobile ? handlers : {})} style={{
      padding: isMobile ? "6px 4px" : "8px 6px",
      textAlign: display === "Player" ? "left" : "center",
      fontWeight: 600, color: C.textMuted,
      fontSize: isMobile ? "11px" : "12px",
      whiteSpace: "pre-line",
      cursor: "help", lineHeight: 1.3, userSelect: "none",
    }}>
      {display}
      {tooltip}
    </th>
  );
}
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// Environment detection — fsf-challenge = dev, tma-challenge = prod
const IS_DEV = window.location.hostname.includes("fsf-challenge");
if (IS_DEV) document.title = "DEV: TMA Challenge - 2026 World Cup";

// Tournament data
const GROUPS = {
  A: ["Mexico", "South Korea", "South Africa", "Czechia"],
  B: ["Canada", "Switzerland", "Qatar", "Bosnia & Herz."],
  C: ["Brazil", "Morocco", "Scotland", "Haiti"],
  D: ["USA", "Australia", "Paraguay", "Turkiye"],
  E: ["Germany", "Ecuador", "Ivory Coast", "Curacao"],
  F: ["Netherlands", "Japan", "Tunisia", "Sweden"],
  G: ["Belgium", "Iran", "Egypt", "New Zealand"],
  H: ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"],
  I: ["France", "Senegal", "Norway", "Iraq"],
  J: ["Argentina", "Austria", "Algeria", "Jordan"],
  K: ["Portugal", "Colombia", "Uzbekistan", "DR Congo"],
  L: ["England", "Croatia", "Panama", "Ghana"],
};

const ALL_TEAMS = Object.values(GROUPS).flat().sort();

// 3-letter country abbreviations for admin group headers
const COUNTRY_ABBR = {
  "Mexico": "MEX", "South Korea": "KOR", "South Africa": "RSA", "Czechia": "CZE",
  "Canada": "CAN", "Switzerland": "SUI", "Qatar": "QAT", "Bosnia & Herz.": "BIH",
  "Brazil": "BRA", "Morocco": "MAR", "Scotland": "SCO", "Haiti": "HAI",
  "USA": "USA", "Australia": "AUS", "Paraguay": "PAR", "Turkiye": "TUR",
  "Germany": "GER", "Ecuador": "ECU", "Ivory Coast": "CIV", "Curacao": "CUW",
  "Netherlands": "NED", "Japan": "JPN", "Tunisia": "TUN", "Sweden": "SWE",
  "Belgium": "BEL", "Iran": "IRN", "Egypt": "EGY", "New Zealand": "NZL",
  "Spain": "ESP", "Uruguay": "URU", "Saudi Arabia": "KSA", "Cape Verde": "CPV",
  "France": "FRA", "Senegal": "SEN", "Norway": "NOR", "Iraq": "IRQ",
  "Argentina": "ARG", "Austria": "AUT", "Algeria": "ALG", "Jordan": "JOR",
  "Portugal": "POR", "Colombia": "COL", "Uzbekistan": "UZB", "DR Congo": "COD",
  "England": "ENG", "Croatia": "CRO", "Panama": "PAN", "Ghana": "GHA",
};

// All 72 group stage matches in chronological order with date/time (ET)
const ALL_GROUP_MATCHES = [
  // ── Matchday 1: Jun 11–17 ────────────────────────────────
  { matchId:"A1", group:"A", team1:"Mexico",                  team2:"South Africa",           date:"Jun 11", time:"3:00 PM ET" },
  { matchId:"A2", group:"A", team1:"South Korea",             team2:"Czechia",                date:"Jun 11", time:"10:00 PM ET" },
  { matchId:"B1", group:"B", team1:"Canada",                  team2:"Bosnia & Herz.", date:"Jun 12", time:"3:00 PM ET" },
  { matchId:"D1", group:"D", team1:"USA",                     team2:"Paraguay",               date:"Jun 12", time:"9:00 PM ET" },
  { matchId:"B2", group:"B", team1:"Qatar",                   team2:"Switzerland",            date:"Jun 13", time:"3:00 PM ET" },
  { matchId:"C1", group:"C", team1:"Brazil",                  team2:"Morocco",                date:"Jun 13", time:"6:00 PM ET" },
  { matchId:"C2", group:"C", team1:"Haiti",                   team2:"Scotland",               date:"Jun 13", time:"9:00 PM ET" },
  { matchId:"D2", group:"D", team1:"Australia",               team2:"Turkiye",                date:"Jun 13", time:"12:00 AM ET" },
  { matchId:"E1", group:"E", team1:"Germany",                 team2:"Curacao",                date:"Jun 14", time:"1:00 PM ET" },
  { matchId:"F1", group:"F", team1:"Netherlands",             team2:"Japan",                  date:"Jun 14", time:"4:00 PM ET" },
  { matchId:"E2", group:"E", team1:"Ivory Coast",             team2:"Ecuador",                date:"Jun 14", time:"7:00 PM ET" },
  { matchId:"F2", group:"F", team1:"Tunisia",                 team2:"Sweden",                 date:"Jun 14", time:"10:00 PM ET" },
  { matchId:"H1", group:"H", team1:"Spain",                   team2:"Cape Verde",             date:"Jun 15", time:"1:00 PM ET" },
  { matchId:"G1", group:"G", team1:"Belgium",                 team2:"Egypt",                  date:"Jun 15", time:"3:00 PM ET" },
  { matchId:"H2", group:"H", team1:"Saudi Arabia",            team2:"Uruguay",                date:"Jun 15", time:"6:00 PM ET" },
  { matchId:"G2", group:"G", team1:"Iran",                    team2:"New Zealand",            date:"Jun 15", time:"9:00 PM ET" },
  { matchId:"I1", group:"I", team1:"France",                  team2:"Senegal",                date:"Jun 16", time:"3:00 PM ET" },
  { matchId:"I2", group:"I", team1:"Iraq",                    team2:"Norway",                 date:"Jun 16", time:"6:00 PM ET" },
  { matchId:"J1", group:"J", team1:"Argentina",               team2:"Algeria",                date:"Jun 16", time:"9:00 PM ET" },
  { matchId:"J2", group:"J", team1:"Austria",                 team2:"Jordan",                 date:"Jun 16", time:"12:00 AM ET" },
  { matchId:"K1", group:"K", team1:"Portugal",                team2:"DR Congo",               date:"Jun 17", time:"1:00 PM ET" },
  { matchId:"L1", group:"L", team1:"England",                 team2:"Croatia",                date:"Jun 17", time:"4:00 PM ET" },
  { matchId:"L2", group:"L", team1:"Ghana",                   team2:"Panama",                 date:"Jun 17", time:"7:00 PM ET" },
  { matchId:"K2", group:"K", team1:"Uzbekistan",              team2:"Colombia",               date:"Jun 17", time:"10:00 PM ET" },
  // ── Matchday 2: Jun 18–23 ────────────────────────────────
  { matchId:"A3", group:"A", team1:"South Africa",            team2:"Czechia",                date:"Jun 18", time:"12:00 PM ET" },
  { matchId:"B3", group:"B", team1:"Switzerland",             team2:"Bosnia & Herz.", date:"Jun 18", time:"3:00 PM ET" },
  { matchId:"B4", group:"B", team1:"Canada",                  team2:"Qatar",                  date:"Jun 18", time:"6:00 PM ET" },
  { matchId:"A4", group:"A", team1:"Mexico",                  team2:"South Korea",            date:"Jun 18", time:"9:00 PM ET" },
  { matchId:"D3", group:"D", team1:"USA",                     team2:"Australia",              date:"Jun 19", time:"3:00 PM ET" },
  { matchId:"C3", group:"C", team1:"Scotland",                team2:"Morocco",                date:"Jun 19", time:"6:00 PM ET" },
  { matchId:"C4", group:"C", team1:"Brazil",                  team2:"Haiti",                  date:"Jun 19", time:"9:00 PM ET" },
  { matchId:"D4", group:"D", team1:"Turkiye",                 team2:"Paraguay",               date:"Jun 19", time:"12:00 AM ET" },
  { matchId:"F3", group:"F", team1:"Netherlands",             team2:"Sweden",                 date:"Jun 20", time:"1:00 PM ET" },
  { matchId:"E3", group:"E", team1:"Germany",                 team2:"Ivory Coast",            date:"Jun 20", time:"4:00 PM ET" },
  { matchId:"E4", group:"E", team1:"Ecuador",                 team2:"Curacao",                date:"Jun 20", time:"8:00 PM ET" },
  { matchId:"F4", group:"F", team1:"Tunisia",                 team2:"Japan",                  date:"Jun 20", time:"12:00 AM ET" },
  { matchId:"H3", group:"H", team1:"Spain",                   team2:"Saudi Arabia",           date:"Jun 21", time:"12:00 PM ET" },
  { matchId:"G3", group:"G", team1:"Belgium",                 team2:"Iran",                   date:"Jun 21", time:"3:00 PM ET" },
  { matchId:"H4", group:"H", team1:"Uruguay",                 team2:"Cape Verde",             date:"Jun 21", time:"6:00 PM ET" },
  { matchId:"G4", group:"G", team1:"New Zealand",             team2:"Egypt",                  date:"Jun 21", time:"9:00 PM ET" },
  { matchId:"J3", group:"J", team1:"Argentina",               team2:"Austria",                date:"Jun 22", time:"1:00 PM ET" },
  { matchId:"I3", group:"I", team1:"France",                  team2:"Iraq",                   date:"Jun 22", time:"5:00 PM ET" },
  { matchId:"I4", group:"I", team1:"Norway",                  team2:"Senegal",                date:"Jun 22", time:"8:00 PM ET" },
  { matchId:"J4", group:"J", team1:"Jordan",                  team2:"Algeria",                date:"Jun 22", time:"11:00 PM ET" },
  { matchId:"K3", group:"K", team1:"Portugal",                team2:"Uzbekistan",             date:"Jun 23", time:"1:00 PM ET" },
  { matchId:"L3", group:"L", team1:"England",                 team2:"Ghana",                  date:"Jun 23", time:"4:00 PM ET" },
  { matchId:"L4", group:"L", team1:"Panama",                  team2:"Croatia",                date:"Jun 23", time:"7:00 PM ET" },
  { matchId:"K4", group:"K", team1:"Colombia",                team2:"DR Congo",               date:"Jun 23", time:"10:00 PM ET" },
  // ── Matchday 3: Jun 24–27 ────────────────────────────────
  { matchId:"B5", group:"B", team1:"Switzerland",             team2:"Canada",                 date:"Jun 24", time:"3:00 PM ET" },
  { matchId:"B6", group:"B", team1:"Bosnia & Herz.",  team2:"Qatar",                  date:"Jun 24", time:"3:00 PM ET" },
  { matchId:"C5", group:"C", team1:"Scotland",                team2:"Brazil",                 date:"Jun 24", time:"6:00 PM ET" },
  { matchId:"C6", group:"C", team1:"Morocco",                 team2:"Haiti",                  date:"Jun 24", time:"6:00 PM ET" },
  { matchId:"A5", group:"A", team1:"Czechia",                 team2:"Mexico",                 date:"Jun 24", time:"9:00 PM ET" },
  { matchId:"A6", group:"A", team1:"South Africa",            team2:"South Korea",            date:"Jun 24", time:"9:00 PM ET" },
  { matchId:"E5", group:"E", team1:"Ecuador",                 team2:"Germany",                date:"Jun 25", time:"4:00 PM ET" },
  { matchId:"E6", group:"E", team1:"Curacao",                 team2:"Ivory Coast",            date:"Jun 25", time:"4:00 PM ET" },
  { matchId:"F5", group:"F", team1:"Japan",                   team2:"Sweden",                 date:"Jun 25", time:"7:00 PM ET" },
  { matchId:"F6", group:"F", team1:"Tunisia",                 team2:"Netherlands",            date:"Jun 25", time:"7:00 PM ET" },
  { matchId:"D5", group:"D", team1:"Turkiye",                 team2:"USA",                    date:"Jun 25", time:"10:00 PM ET" },
  { matchId:"D6", group:"D", team1:"Paraguay",                team2:"Australia",              date:"Jun 25", time:"10:00 PM ET" },
  { matchId:"I5", group:"I", team1:"Norway",                  team2:"France",                 date:"Jun 26", time:"3:00 PM ET" },
  { matchId:"I6", group:"I", team1:"Senegal",                 team2:"Iraq",                   date:"Jun 26", time:"3:00 PM ET" },
  { matchId:"H5", group:"H", team1:"Cape Verde",              team2:"Saudi Arabia",           date:"Jun 26", time:"8:00 PM ET" },
  { matchId:"H6", group:"H", team1:"Uruguay",                 team2:"Spain",                  date:"Jun 26", time:"8:00 PM ET" },
  { matchId:"G5", group:"G", team1:"Egypt",                   team2:"Iran",                   date:"Jun 26", time:"11:00 PM ET" },
  { matchId:"G6", group:"G", team1:"New Zealand",             team2:"Belgium",                date:"Jun 26", time:"11:00 PM ET" },
  { matchId:"L5", group:"L", team1:"Panama",                  team2:"England",                date:"Jun 27", time:"5:00 PM ET" },
  { matchId:"L6", group:"L", team1:"Croatia",                 team2:"Ghana",                  date:"Jun 27", time:"5:00 PM ET" },
  { matchId:"K5", group:"K", team1:"Colombia",                team2:"Portugal",               date:"Jun 27", time:"7:30 PM ET" },
  { matchId:"K6", group:"K", team1:"DR Congo",                team2:"Uzbekistan",             date:"Jun 27", time:"7:30 PM ET" },
  { matchId:"J5", group:"J", team1:"Algeria",                 team2:"Austria",                date:"Jun 27", time:"10:00 PM ET" },
  { matchId:"J6", group:"J", team1:"Jordan",                  team2:"Argentina",              date:"Jun 27", time:"10:00 PM ET" },
];

// Helper to get matches for a specific group, already in chronological order
function getGroupMatches(group) {
  return ALL_GROUP_MATCHES.filter((m) => m.group === group);
}

const KNOCKOUT_ROUNDS = [
  { round: "R32", label: "Round of 32", points: 2, slots: 16 },
  { round: "R16", label: "Round of 16", points: 4, slots: 8 },
  { round: "QF",  label: "Quarterfinals", points: 6, slots: 4 },
  { round: "SF",  label: "Semifinals", points: 8, slots: 2 },
  { round: "F",   label: "Final", points: 10, slots: 1 },
];

// Match metadata: date, time (ET), venue, placeholder descriptions, and kickoff UTC for per-slot locking.
// All times are ET (UTC-4 in July 2026). kickoff = UTC ms timestamp of match start.
// ET offset: EDT = UTC-4. So 1:00 PM ET = 17:00 UTC, 3:00 PM ET = 19:00 UTC, etc.
const SLOT_META = {
  // Round of 32
  R32_1:  { matchNum: 73,  date: "Jun 28", time: "3:00 PM ET",  venue: "Los Angeles",   kickoff: Date.UTC(2026,5,28,19,0),  t1desc: "Group A Runner-up",  t2desc: "Group B Runner-up" },
  R32_2:  { matchNum: 74,  date: "Jun 29", time: "4:30 PM ET",  venue: "Boston",        kickoff: Date.UTC(2026,5,29,20,30), t1desc: "Group E Winner",     t2desc: "Best 3rd (A/B/C/D/F)" },
  R32_3:  { matchNum: 75,  date: "Jun 29", time: "9:00 PM ET",  venue: "Monterrey",     kickoff: Date.UTC(2026,5,30,1,0),   t1desc: "Group F Winner",     t2desc: "Group C Runner-up" },
  R32_4:  { matchNum: 76,  date: "Jun 29", time: "1:00 PM ET",  venue: "Houston",       kickoff: Date.UTC(2026,5,29,17,0),  t1desc: "Group C Winner",     t2desc: "Group F Runner-up" },
  R32_5:  { matchNum: 77,  date: "Jun 30", time: "5:00 PM ET",  venue: "New Jersey",    kickoff: Date.UTC(2026,5,30,21,0),  t1desc: "Group I Winner",     t2desc: "Best 3rd (C/D/F/G/H)" },
  R32_6:  { matchNum: 78,  date: "Jun 30", time: "1:00 PM ET",  venue: "Dallas",        kickoff: Date.UTC(2026,5,30,17,0),  t1desc: "Group E Runner-up",  t2desc: "Group I Runner-up" },
  R32_7:  { matchNum: 79,  date: "Jun 30", time: "9:00 PM ET",  venue: "Mexico City",   kickoff: Date.UTC(2026,6,1,1,0),    t1desc: "Group A Winner",     t2desc: "Best 3rd (C/E/F/H/I)" },
  R32_8:  { matchNum: 80,  date: "Jul 1",  time: "12:00 PM ET", venue: "Atlanta",       kickoff: Date.UTC(2026,6,1,16,0),   t1desc: "Group L Winner",     t2desc: "Best 3rd (E/H/I/J/K)" },
  R32_9:  { matchNum: 81,  date: "Jul 1",  time: "8:00 PM ET",  venue: "San Francisco", kickoff: Date.UTC(2026,6,2,0,0),    t1desc: "Group D Winner",     t2desc: "Best 3rd (B/E/F/I/J)" },
  R32_10: { matchNum: 82,  date: "Jul 1",  time: "4:00 PM ET",  venue: "Seattle",       kickoff: Date.UTC(2026,6,1,20,0),   t1desc: "Group G Winner",     t2desc: "Best 3rd (A/E/H/I/J)" },
  R32_11: { matchNum: 83,  date: "Jul 2",  time: "7:00 PM ET",  venue: "Toronto",       kickoff: Date.UTC(2026,6,2,23,0),   t1desc: "Group K Runner-up",  t2desc: "Group L Runner-up" },
  R32_12: { matchNum: 84,  date: "Jul 2",  time: "3:00 PM ET",  venue: "Los Angeles",   kickoff: Date.UTC(2026,6,2,19,0),   t1desc: "Group H Winner",     t2desc: "Group J Runner-up" },
  R32_13: { matchNum: 85,  date: "Jul 2",  time: "11:00 PM ET", venue: "Vancouver",     kickoff: Date.UTC(2026,6,3,3,0),    t1desc: "Group B Winner",     t2desc: "Best 3rd (E/F/G/I/J)" },
  R32_14: { matchNum: 86,  date: "Jul 3",  time: "6:00 PM ET",  venue: "Miami",         kickoff: Date.UTC(2026,6,3,22,0),   t1desc: "Group J Winner",     t2desc: "Group H Runner-up" },
  R32_15: { matchNum: 87,  date: "Jul 3",  time: "9:30 PM ET",  venue: "Kansas City",   kickoff: Date.UTC(2026,6,4,1,30),   t1desc: "Group K Winner",     t2desc: "Best 3rd (D/E/I/J/L)" },
  R32_16: { matchNum: 88,  date: "Jul 3",  time: "2:00 PM ET",  venue: "Dallas",        kickoff: Date.UTC(2026,6,3,18,0),   t1desc: "Group D Runner-up",  t2desc: "Group G Runner-up" },
  // Round of 16
  R16_1:  { matchNum: 90,  date: "Jul 4",  time: "1:00 PM ET",  venue: "Los Angeles",   kickoff: Date.UTC(2026,6,4,17,0),   t1desc: "Winner M73", t2desc: "Winner M75" },
  R16_2:  { matchNum: 89,  date: "Jul 4",  time: "5:00 PM ET",  venue: "San Francisco", kickoff: Date.UTC(2026,6,4,21,0),   t1desc: "Winner M74", t2desc: "Winner M77" },
  R16_3:  { matchNum: 91,  date: "Jul 5",  time: "4:00 PM ET",  venue: "Philadelphia",  kickoff: Date.UTC(2026,6,5,20,0),   t1desc: "Winner M76", t2desc: "Winner M78" },
  R16_4:  { matchNum: 92,  date: "Jul 5",  time: "8:00 PM ET",  venue: "Guadalajara",   kickoff: Date.UTC(2026,6,6,0,0),    t1desc: "Winner M79", t2desc: "Winner M80" },
  R16_5:  { matchNum: 93,  date: "Jul 6",  time: "3:00 PM ET",  venue: "Kansas City",   kickoff: Date.UTC(2026,6,6,19,0),   t1desc: "Winner M83", t2desc: "Winner M84" },
  R16_6:  { matchNum: 94,  date: "Jul 6",  time: "8:00 PM ET",  venue: "San Francisco", kickoff: Date.UTC(2026,6,7,0,0),    t1desc: "Winner M81", t2desc: "Winner M82" },
  R16_7:  { matchNum: 95,  date: "Jul 7",  time: "12:00 PM ET", venue: "Miami",         kickoff: Date.UTC(2026,6,7,16,0),   t1desc: "Winner M86", t2desc: "Winner M88" },
  R16_8:  { matchNum: 96,  date: "Jul 7",  time: "4:00 PM ET",  venue: "Vancouver",     kickoff: Date.UTC(2026,6,7,20,0),   t1desc: "Winner M85", t2desc: "Winner M87" },
  // Quarterfinals
  QF_1:   { matchNum: 97,  date: "Jul 9",  time: "4:00 PM ET",  venue: "Boston",        kickoff: Date.UTC(2026,6,9,20,0),   t1desc: "Winner M89", t2desc: "Winner M90" },
  QF_2:   { matchNum: 98,  date: "Jul 10", time: "3:00 PM ET",  venue: "Los Angeles",   kickoff: Date.UTC(2026,6,10,19,0),  t1desc: "Winner M93", t2desc: "Winner M94" },
  QF_3:   { matchNum: 99,  date: "Jul 11", time: "5:00 PM ET",  venue: "New Jersey",    kickoff: Date.UTC(2026,6,11,21,0),  t1desc: "Winner M91", t2desc: "Winner M92" },
  QF_4:   { matchNum: 100, date: "Jul 11", time: "9:00 PM ET",  venue: "Guadalajara",   kickoff: Date.UTC(2026,6,13,1,0),   t1desc: "Winner M95", t2desc: "Winner M96" },
  // Semifinals
  SF_1:   { matchNum: 101, date: "Jul 14", time: "3:00 PM ET",  venue: "Dallas",        kickoff: Date.UTC(2026,6,14,19,0),  t1desc: "Winner M97",  t2desc: "Winner M98" },
  SF_2:   { matchNum: 102, date: "Jul 15", time: "3:00 PM ET",  venue: "Atlanta",       kickoff: Date.UTC(2026,6,15,19,0),  t1desc: "Winner M99",  t2desc: "Winner M100" },
  // Final
  F_1:    { matchNum: 104, date: "Jul 19", time: "3:00 PM ET",  venue: "New Jersey",    kickoff: Date.UTC(2026,6,19,19,0),  t1desc: "Winner M101", t2desc: "Winner M102" },
};

// Team metadata: flag ISO code + three parallelogram stripe colors + border
const TEAM_META = {
  "Mexico":                 { flag: "mx", c1: "rgba(0,138,68,0.42)",   c2: "rgba(200,200,200,0.32)", c3: "rgba(206,17,38,0.38)",   border: "#00944a" },
  "South Korea":            { flag: "kr", c1: "rgba(205,46,58,0.40)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(0,47,108,0.38)",    border: "#cd2e3a" },
  "South Africa":           { flag: "za", c1: "rgba(0,119,73,0.40)",    c2: "rgba(255,184,28,0.48)",  c3: "rgba(0,0,0,0.28)",       border: "#007749" },
  "Czechia":                { flag: "cz", c1: "rgba(215,20,26,0.38)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(17,69,126,0.38)",   border: "#d7141a" },
  "Canada":                 { flag: "ca", c1: "rgba(255,0,0,0.38)",     c2: "rgba(200,200,200,0.30)", c3: "rgba(255,0,0,0.38)",     border: "#cc0000" },
  "Switzerland":            { flag: "ch", c1: "rgba(220,20,20,0.40)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(220,20,20,0.40)",   border: "#dc1414" },
  "Qatar":                  { flag: "qa", c1: "rgba(139,28,62,0.42)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(139,28,62,0.42)",   border: "#8b1c3e" },
  "Bosnia & Herz.": { flag: "ba", c1: "rgba(0,66,166,0.40)",    c2: "rgba(255,206,0,0.48)",   c3: "rgba(0,66,166,0.40)",    border: "#0042a6" },
  "Brazil":                 { flag: "br", c1: "rgba(0,156,59,0.42)",    c2: "rgba(255,214,0,0.52)",   c3: "rgba(0,39,118,0.34)",    border: "#c9a420" },
  "Morocco":                { flag: "ma", c1: "rgba(195,15,31,0.40)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(0,98,51,0.38)",     border: "#c30f1f" },
  "Scotland":               { flag: "gb-sct", c1: "rgba(0,100,175,0.42)", c2: "rgba(200,200,200,0.30)", c3: "rgba(0,100,175,0.42)", border: "#0064af" },
  "Haiti":                  { flag: "ht", c1: "rgba(0,65,137,0.40)",    c2: "rgba(200,200,200,0.30)", c3: "rgba(215,0,38,0.38)",    border: "#0041a8" },
  "USA":                    { flag: "us", c1: "rgba(178,34,52,0.40)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(60,59,110,0.40)",   border: "#b22234" },
  "Australia":              { flag: "au", c1: "rgba(0,0,139,0.38)",     c2: "rgba(200,200,200,0.30)", c3: "rgba(255,205,0,0.45)",   border: "#00008b" },
  "Paraguay":               { flag: "py", c1: "rgba(215,0,38,0.40)",    c2: "rgba(200,200,200,0.30)", c3: "rgba(0,56,168,0.38)",    border: "#d70026" },
  "Turkiye":                { flag: "tr", c1: "rgba(227,10,23,0.40)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(227,10,23,0.40)",   border: "#e30a17" },
  "Germany":                { flag: "de", c1: "rgba(40,40,40,0.40)",    c2: "rgba(210,0,0,0.40)",     c3: "rgba(255,200,0,0.48)",   border: "#555555" },
  "Ecuador":                { flag: "ec", c1: "rgba(255,215,0,0.50)",   c2: "rgba(0,106,56,0.40)",    c3: "rgba(0,56,147,0.38)",    border: "#e8b800" },
  "Ivory Coast":            { flag: "ci", c1: "rgba(249,88,17,0.42)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(0,133,67,0.40)",    border: "#f95811" },
  "Curacao":                { flag: "cw", c1: "rgba(0,112,200,0.40)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(255,200,0,0.45)",   border: "#0070c8" },
  "Netherlands":            { flag: "nl", c1: "rgba(174,28,40,0.40)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(0,70,153,0.40)",    border: "#ae1c28" },
  "Japan":                  { flag: "jp", c1: "rgba(55,99,174,0.40)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(188,0,45,0.40)",    border: "#3763ae" },
  "Tunisia":                { flag: "tn", c1: "rgba(228,40,40,0.40)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(228,40,40,0.40)",   border: "#e42828" },
  "Sweden":                 { flag: "se", c1: "rgba(0,106,167,0.40)",   c2: "rgba(255,205,0,0.50)",   c3: "rgba(0,106,167,0.40)",   border: "#006aa7" },
  "Belgium":                { flag: "be", c1: "rgba(30,30,30,0.40)",    c2: "rgba(255,210,0,0.50)",   c3: "rgba(237,41,57,0.40)",   border: "#3c3c3c" },
  "Iran":                   { flag: "ir", c1: "rgba(35,125,71,0.40)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(218,41,28,0.38)",   border: "#239447" },
  "Egypt":                  { flag: "eg", c1: "rgba(198,12,48,0.40)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(0,0,0,0.30)",       border: "#c60c30" },
  "New Zealand":            { flag: "nz", c1: "rgba(0,0,139,0.40)",     c2: "rgba(200,200,200,0.30)", c3: "rgba(204,16,32,0.40)",   border: "#00008b" },
  "Spain":                  { flag: "es", c1: "rgba(198,11,30,0.40)",   c2: "rgba(241,191,0,0.52)",   c3: "rgba(198,11,30,0.40)",   border: "#c60b1e" },
  "Uruguay":                { flag: "uy", c1: "rgba(114,158,199,0.42)", c2: "rgba(200,200,200,0.30)", c3: "rgba(114,158,199,0.42)", border: "#6cb4e4" },
  "Saudi Arabia":           { flag: "sa", c1: "rgba(0,106,56,0.42)",    c2: "rgba(200,200,200,0.30)", c3: "rgba(0,106,56,0.42)",    border: "#006a38" },
  "Cape Verde":             { flag: "cv", c1: "rgba(0,92,175,0.40)",    c2: "rgba(255,205,0,0.48)",   c3: "rgba(207,20,43,0.38)",   border: "#005caf" },
  "France":                 { flag: "fr", c1: "rgba(0,35,149,0.42)",    c2: "rgba(200,200,200,0.30)", c3: "rgba(237,41,57,0.40)",   border: "#1a3c8f" },
  "Senegal":                { flag: "sn", c1: "rgba(0,147,68,0.40)",    c2: "rgba(252,209,22,0.50)",  c3: "rgba(227,24,55,0.38)",   border: "#00934a" },
  "Norway":                 { flag: "no", c1: "rgba(186,12,47,0.40)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(0,52,120,0.40)",    border: "#ba0c2f" },
  "Iraq":                   { flag: "iq", c1: "rgba(0,122,61,0.40)",    c2: "rgba(200,200,200,0.30)", c3: "rgba(204,16,32,0.40)",   border: "#007a3d" },
  "Argentina":              { flag: "ar", c1: "rgba(108,180,228,0.45)", c2: "rgba(200,200,200,0.30)", c3: "rgba(108,180,228,0.45)", border: "#6cb4e4" },
  "Austria":                { flag: "at", c1: "rgba(198,12,48,0.40)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(198,12,48,0.40)",   border: "#c60c30" },
  "Algeria":                { flag: "dz", c1: "rgba(0,152,68,0.40)",    c2: "rgba(200,200,200,0.30)", c3: "rgba(210,16,52,0.40)",   border: "#006844" },
  "Jordan":                 { flag: "jo", c1: "rgba(0,0,0,0.32)",       c2: "rgba(200,200,200,0.30)", c3: "rgba(206,17,38,0.40)",   border: "#000000" },
  "Portugal":               { flag: "pt", c1: "rgba(0,102,0,0.40)",     c2: "rgba(255,215,0,0.48)",   c3: "rgba(206,17,38,0.40)",   border: "#006600" },
  "Colombia":               { flag: "co", c1: "rgba(255,205,0,0.52)",   c2: "rgba(0,57,166,0.38)",    c3: "rgba(206,17,38,0.40)",   border: "#ffd100" },
  "Uzbekistan":             { flag: "uz", c1: "rgba(30,155,215,0.40)",  c2: "rgba(200,200,200,0.30)", c3: "rgba(30,155,215,0.40)",  border: "#1e9bd7" },
  "DR Congo":               { flag: "cd", c1: "rgba(0,124,195,0.40)",   c2: "rgba(255,205,0,0.50)",   c3: "rgba(206,17,38,0.40)",   border: "#007cc3" },
  "England":                { flag: "gb-eng", c1: "rgba(192,57,43,0.40)", c2: "rgba(200,200,200,0.30)", c3: "rgba(192,57,43,0.40)", border: "#c0392b" },
  "Croatia":                { flag: "hr", c1: "rgba(171,14,23,0.40)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(0,57,166,0.38)",    border: "#ab0e17" },
  "Panama":                 { flag: "pa", c1: "rgba(218,41,28,0.40)",   c2: "rgba(200,200,200,0.30)", c3: "rgba(0,56,168,0.40)",    border: "#da291c" },
  "Ghana":                  { flag: "gh", c1: "rgba(0,106,56,0.40)",    c2: "rgba(255,205,0,0.50)",   c3: "rgba(206,17,38,0.40)",   border: "#006a38" },
};

// Renders a team button with flag + three parallelogram stripes when selected
// resultState: null=no result yet | "correct"=user picked correctly
//              "wrong"=user picked wrongly | "winner"=actual winner (not picked by user)
// ── WHAT'S NEW MODAL (DB-driven) ─────────────────────────────────────────────
// Content is managed in Admin → Messages tab. No code changes needed to update.
function WhatsNewModal({ payload, onDismiss }) {
  const { header = "What's New", subtitle = "", items = [] } = payload;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.65)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <div style={{
        background: C.white, borderRadius: "16px", maxWidth: "480px", width: "100%",
        maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{ background: C.navy, borderRadius: "16px 16px 0 0", padding: "1.25rem 1.5rem" }}>
          <div style={{ fontSize: "11px", color: C.gold, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>What's New</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: C.white }}>{header}</div>
          {subtitle && <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", marginTop: "4px" }}>{subtitle}</div>}
        </div>
        {/* Items */}
        <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "14px" }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.5rem", flexShrink: 0, lineHeight: 1.2 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: C.navy, marginBottom: "3px" }}>{item.title}</div>
                <div style={{ fontSize: "13px", color: C.textMuted, lineHeight: 1.5 }}>{item.body}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div style={{ padding: "0 1.5rem 1.5rem" }}>
          <button onClick={onDismiss} style={{
            width: "100%", padding: "12px", borderRadius: "10px", border: "none",
            background: C.navy, color: C.white, fontSize: "15px", fontWeight: 700,
            cursor: "pointer",
          }}>
            Got it — let's play!
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MATCH PICKERS MODAL ──────────────────────────────────────────────────────
function MatchPickersModal({ match, picks, playerMap, currentUserId, actualResult, onClose }) {
  const isMobile = useIsMobile();
  const { team1, team2, group, date, time } = match;
  const team1Picks = picks.filter((p) => p.pick === "team1");
  const drawPicks  = picks.filter((p) => p.pick === "draw");
  const team2Picks = picks.filter((p) => p.pick === "team2");
  const hasResult  = !!actualResult;
  const winner     = hasResult ? (actualResult === "team1" ? team1 : actualResult === "team2" ? team2 : "Draw") : null;
  const meta1 = TEAM_META[team1] || { flag: "un" };
  const meta2 = TEAM_META[team2] || { flag: "un" };
  const totalPicked = picks.length;

  function PickerSection({ pickers, label, flagKey, isWinningPick, pickColor }) {
    if (pickers.length === 0) return null;
    return (
      <div style={{
        borderRadius: "10px", overflow: "hidden",
        border: `2px solid ${isWinningPick ? "#1D9E75" : C.border}`,
        marginBottom: "10px",
      }}>
        {/* Section header */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "8px 12px",
          background: isWinningPick ? "rgba(29,158,117,0.08)" : `${C.navy}08`,
        }}>
          {flagKey && <img src={`https://flagcdn.com/${flagKey}.svg`} style={{ width:"20px", height:"14px", borderRadius:"2px", objectFit:"cover", flexShrink: 0 }} />}
          <span style={{ fontSize: "13px", fontWeight: 700, color: C.navy, flex: 1 }}>{label}</span>
          {isWinningPick && <span style={{ fontSize: "11px", color: "#1D9E75", fontWeight: 700 }}>✓ Won</span>}
          <span style={{
            fontSize: "12px", fontWeight: 700, color: C.white,
            background: isWinningPick ? "#1D9E75" : C.navy,
            borderRadius: "12px", padding: "1px 8px", minWidth: "24px", textAlign: "center",
          }}>{pickers.length}</span>
        </div>
        {/* Name grid — 2 columns on mobile, 3 on desktop */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr",
          gap: "4px", padding: "8px",
          background: isWinningPick ? "rgba(29,158,117,0.03)" : C.white,
        }}>
          {pickers.map((p) => {
            const isCurrentUser = p.user_id === currentUserId;
            const name = playerMap[p.user_id] || "Unknown";
            return (
              <div key={p.user_id} style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "5px 8px", borderRadius: "6px",
                background: isCurrentUser ? `${C.gold}22` : "transparent",
                border: isCurrentUser ? `1px solid ${C.gold}` : "1px solid transparent",
                minWidth: 0,
              }}>
                <span style={{
                  fontSize: "12px", fontWeight: isCurrentUser ? 700 : 400,
                  color: isCurrentUser ? C.navy : C.text,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                }}>{name}</span>
                {isCurrentUser && <span style={{ fontSize: "9px", fontWeight: 700, color: C.gold, letterSpacing: "0.04em", flexShrink: 0 }}>YOU</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Sort: team1 first, then draw, then team2 — but put winning pick first if result is in
  const sections = [
    { pickers: team1Picks, label: team1, flagKey: meta1.flag, winning: hasResult && actualResult === "team1" },
    { pickers: drawPicks,  label: "Draw",  flagKey: null,        winning: hasResult && actualResult === "draw" },
    { pickers: team2Picks, label: team2, flagKey: meta2.flag, winning: hasResult && actualResult === "team2" },
  ];
  if (hasResult) sections.sort((a, b) => (b.winning ? 1 : 0) - (a.winning ? 1 : 0));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: isMobile ? 0 : "1rem" }} onClick={onClose}>
      <div style={{
        background: C.white,
        borderRadius: isMobile ? "20px 20px 0 0" : "16px",
        width: "100%", maxWidth: isMobile ? "100%" : "540px",
        maxHeight: isMobile ? "88vh" : "85vh",
        overflowY: "auto",
        boxShadow: "0 -4px 40px rgba(0,0,0,0.25)",
      }} onClick={(e) => e.stopPropagation()}>
        {/* Drag handle on mobile */}
        {isMobile && <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "#cbd5e1", margin: "10px auto 0" }} />}
        {/* Header */}
        <div style={{ background: C.navy, margin: isMobile ? "10px 0 0" : 0, borderRadius: isMobile ? "16px 16px 0 0" : "16px 16px 0 0", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: C.gold, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              GROUP {group} · {date} · {time.replace(" ET","")}
            </span>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "22px", cursor: "pointer", lineHeight: 1, padding: "0 2px" }}>×</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <img src={`https://flagcdn.com/${meta1.flag}.svg`} style={{ width:"22px", height:"15px", borderRadius:"2px", objectFit:"cover" }} />
            <span style={{ fontSize: "16px", fontWeight: 800, color: C.white }}>{team1}</span>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>vs</span>
            <span style={{ fontSize: "16px", fontWeight: 800, color: C.white }}>{team2}</span>
            <img src={`https://flagcdn.com/${meta2.flag}.svg`} style={{ width:"22px", height:"15px", borderRadius:"2px", objectFit:"cover" }} />
          </div>
          {hasResult && (
            <div style={{ marginTop: "5px", fontSize: "12px", color: C.gold, fontWeight: 700 }}>
              Result: {winner} {winner === "Draw" ? "🟡" : "✓"}
            </div>
          )}
        </div>
        {/* Picker sections — stacked vertically */}
        <div style={{ padding: "12px 12px 4px" }}>
          {sections.map(({ pickers, label, flagKey, winning }) => (
            <PickerSection key={label} pickers={pickers} label={label} flagKey={flagKey} isWinningPick={winning} />
          ))}
        </div>
        <div style={{ padding: "0 12px 16px", fontSize: "11px", color: C.textMuted, textAlign: "center" }}>
          {totalPicked} of {Object.keys(playerMap).length} players picked · tap outside to close
        </div>
      </div>
    </div>
  );
}

function AppNav({ page, setPage, isAdmin, setShowAdmin, themeKey }) {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    ["leaderboard","Leaderboard"],
    ["stage1","Group Stage"],
    ["stage2","Knockout"],
    ["results","Results"],
    ["standings","Standings"],
    ["insights","Insights"],
    ["guide","Guide"],
  ];
  const handleNav = (id) => { setPage(id); setMenuOpen(false); };
  return (
    <>
      <nav key={`nav-${themeKey}`} style={{ ...styles.nav, background: C.navy, position: "relative", zIndex: 200 }}>
        <span style={{ ...styles.navLogo, color: C.navText || C.gold, fontFamily: C.fontSerif ? "'Georgia','Times New Roman',serif" : "'DM Sans',sans-serif", fontStyle: C.fontSerif ? "italic" : "normal", maxWidth: isMobile ? "120px" : styles.navLogo.maxWidth }} onClick={() => handleNav("leaderboard")}>
          <span className="nav-title-full">{C.navTitle || C.heroTitle || "Big Soccer Challenge"}</span>
          <span className="nav-title-short" style={{ display: "none" }}>{C.navTitleShort || C.navTitle || "BSC"}</span>
        </span>
        {IS_DEV && (
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#fff", background: "#dc2626", borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.06em", flexShrink: 0 }}>DEV</span>
        )}
        {isMobile ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
            {/* Current page label */}
            <span style={{ fontSize: "13px", fontWeight: 600, color: C.navText || C.white, opacity: 0.8 }}>
              {navItems.find(([id]) => id === page)?.[1] || ""}
            </span>
            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", display: "flex", flexDirection: "column", gap: "5px", alignItems: "center", justifyContent: "center" }}
              aria-label="Menu"
            >
              {menuOpen ? (
                <span style={{ fontSize: "22px", color: C.navText || C.white, lineHeight: 1 }}>✕</span>
              ) : (
                <>
                  <span style={{ display: "block", width: "22px", height: "2px", background: C.navText || C.white, borderRadius: "2px" }} />
                  <span style={{ display: "block", width: "22px", height: "2px", background: C.navText || C.white, borderRadius: "2px" }} />
                  <span style={{ display: "block", width: "22px", height: "2px", background: C.navText || C.white, borderRadius: "2px" }} />
                </>
              )}
            </button>
          </div>
        ) : (
          <div style={styles.navLinks}>
            {navItems.map(([id, label]) => (
              <button key={id} style={styles.navBtn(page === id)} onClick={() => handleNav(id)}>{label}</button>
            ))}
            {isAdmin && <button style={{ ...styles.navBtn(false), marginLeft: "8px" }} onClick={() => { setShowAdmin(true); setMenuOpen(false); }}>Admin</button>}
            <button style={styles.navBtn(false)} onClick={() => supabase.auth.signOut()}>Sign Out</button>
          </div>
        )}
      </nav>
      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <div style={{
          position: "fixed", top: "48px", left: 0, right: 0, zIndex: 199,
          background: C.navy, borderBottom: `2px solid ${C.navText || C.gold}22`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          paddingTop: "6px",
        }}>
          {navItems.map(([id, label]) => (
            <button key={id} onClick={() => handleNav(id)} style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "14px 20px", background: page === id ? `${C.gold}18` : "transparent",
              border: "none", borderBottom: `1px solid rgba(255,255,255,0.07)`,
              fontSize: "15px", fontWeight: page === id ? 700 : 400,
              color: page === id ? (C.navText || C.gold) : (C.navText || "rgba(255,255,255,0.85)"),
              cursor: "pointer",
            }}>
              {label}
              {page === id && <span style={{ float: "right", fontSize: "12px", opacity: 0.6 }}>●</span>}
            </button>
          ))}
          {isAdmin && (
            <button onClick={() => { setShowAdmin(true); setMenuOpen(false); }} style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "14px 20px", background: "transparent",
              border: "none", borderBottom: `1px solid rgba(255,255,255,0.07)`,
              fontSize: "15px", fontWeight: 400,
              color: C.navText || "rgba(255,255,255,0.85)", cursor: "pointer",
            }}>Admin</button>
          )}
          <button onClick={() => supabase.auth.signOut()} style={{
            display: "block", width: "100%", textAlign: "left",
            padding: "14px 20px", background: "transparent",
            border: "none", fontSize: "15px", fontWeight: 400,
            color: C.navText ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.45)", cursor: "pointer",
          }}>Sign Out</button>
        </div>
      )}
      {/* Backdrop to close menu */}
      {isMobile && menuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 198 }} onClick={() => setMenuOpen(false)} />
      )}
    </>
  );
}
function AutoScrollToToday({ containerId, targetId }) {
  useEffect(() => {
    const container = document.getElementById(containerId);
    const target = document.getElementById(targetId);
    if (container && target) {
      const offsetTop = target.offsetTop - container.offsetTop;
      container.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  }, [containerId, targetId]);
  return null;
}

function TeamBtn({ team, selected, onClick, style = {}, resultState = null }) {
  const isMobile = useIsMobile();
  const meta = TEAM_META[team] || { flag: "un", c1: "rgba(100,100,100,0.25)", c2: "rgba(150,150,150,0.20)", c3: "rgba(100,100,100,0.25)", border: "#999" };
  const flagUrl = `https://flagcdn.com/${meta.flag}.svg`;
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
  const stripeWidth = isMobile ? 48 : 78;
  const stripeRight = isMobile ? 6 : 10;

  return (
    <button onClick={resultState ? undefined : onClick} style={{
      flex: 1, display: "flex", alignItems: "center", gap: isMobile ? "6px" : "10px",
      padding: isMobile ? "8px 8px" : "10px 14px", borderRadius: "8px", fontSize: "13px",
      fontWeight: (selected || isCorrect || isWinner) ? 700 : 400,
      cursor: resultState ? "default" : "pointer", textAlign: "left",
      border: `${borderWidth} solid ${borderColor}`,
      background: bg, color: C.text,
      position: "relative", overflow: "hidden", minWidth: 0,
      transition: "all 0.1s", ...style,
    }}>
      <img src={flagUrl} alt={team} style={{ width: isMobile ? "20px" : "26px", height: isMobile ? "14px" : "17px", borderRadius: "2px", objectFit: "cover", flexShrink: 0, opacity: isWrong ? 0.5 : 1 }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        textDecoration: isWrong ? "line-through" : "none",
        color: isWrong ? C.textMuted : C.text,
        flex: (isWinner || isCorrect) ? "none" : 1,
      }}>{team}</span>
      {(isWinner || isCorrect) && (
        <span style={{
          fontSize: "11px", fontWeight: 700, color: "#1D9E75", flexShrink: 0,
          zIndex: 1, position: "relative",
          marginLeft: "auto",
          paddingRight: showStripes ? `${stripeWidth - 22}px` : "4px",
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



// Scoring
function calcStage1Score(matchPicks, groupPicks, thirdPicks, results, standings) {
  let matchScore = 0, finishScore = 0, correct = 0;
  // Match picks: +1 per correct result
  for (const pick of matchPicks) {
    const result = results.find((r) => r.match_id === pick.match_id);
    if (result?.result && result.result === pick.pick) { matchScore += 1; correct += 1; }
  }
  // Group standings: +4 correct 1st, +3 correct 2nd, +2 correct team in wrong position
  for (const gp of groupPicks) {
    const st = standings.find((s) => s.group_code === gp.group_code);
    if (!st) continue;
    if (gp.first_place === st.first_place) { finishScore += 4; correct += 1; }
    else if (gp.first_place === st.second_place) finishScore += 2;
    if (gp.second_place === st.second_place) { finishScore += 3; correct += 1; }
    else if (gp.second_place === st.first_place) finishScore += 2;
  }
  // 3rd place picks: +1 if picked team qualified for R32
  if (thirdPicks?.teams) {
    // Build qualifier set from standings — group_standings already has correct is_third_place_qualifier flags
    // Also award +1 if the picked team finished 1st or 2nd (they qualified too)
    const r32Qualifiers = new Set([
      ...standings.map((s) => s.first_place),
      ...standings.map((s) => s.second_place),
      ...standings.filter((s) => s.is_third_place_qualifier).map((s) => s.third_place),
    ].filter(Boolean));

    // Fallback: if is_third_place_qualifier isn't set yet, compute top-8 from match results
    const hasQualifierFlags = standings.some((s) => s.is_third_place_qualifier === true);
    let top8ThirdSet = new Set();
    if (!hasQualifierFlags) {
      const resultMap = {};
      results.filter((r) => r.stage === "group" && r.result).forEach((r) => (resultMap[r.match_id] = r));
      const thirdPlaceTeams = [];
      for (const group of Object.keys(GROUPS)) {
        const table = {};
        GROUPS[group].forEach((t) => (table[t] = { pts: 0, gd: 0, gf: 0, mp: 0 }));
        ALL_GROUP_MATCHES.filter((m) => m.group === group).forEach((m) => {
          const r = resultMap[m.matchId];
          if (!r?.result) return;
          table[m.team1].mp++; table[m.team2].mp++;
          const s1 = r.score1 ?? 0, s2 = r.score2 ?? 0;
          if (r.result === "draw") { table[m.team1].pts++; table[m.team2].pts++; }
          else if (r.result === "team1") table[m.team1].pts += 3;
          else table[m.team2].pts += 3;
          table[m.team1].gf += s1; table[m.team1].gd += s1 - s2;
          table[m.team2].gf += s2; table[m.team2].gd += s2 - s1;
        });
        const sorted = Object.entries(table).filter(([, v]) => v.mp > 0)
          .map(([team, v]) => ({ team, ...v }))
          .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
        if (sorted.length >= 3) thirdPlaceTeams.push(sorted[2]);
      }
      thirdPlaceTeams.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
      top8ThirdSet = new Set(thirdPlaceTeams.slice(0, 8).map((t) => t.team));
      top8ThirdSet.forEach((t) => r32Qualifiers.add(t));
    }

    for (const t of thirdPicks.teams) {
      if (r32Qualifiers.has(t)) { finishScore += 1; correct += 1; }
    }
  }
  return { score: matchScore + finishScore, matchScore, finishScore, correct };
}

function calcStage2Score(s2picks, results) {
  let score = 0, correct = 0;
  const pts = { R32: 2, R16: 4, QF: 6, SF: 8, F: 10 };
  for (const pick of s2picks) {
    const result = results.find((r) => r.match_id === pick.slot_id);
    if (result?.result) {
      const winner = result.result === "team1" ? result.team1 : result.result === "team2" ? result.team2 : null;
      // Derive round from slot_id (e.g. "R32_1" -> "R32") so we don't need the round column
      const round = pick.round || (pick.slot_id ? pick.slot_id.replace(/_\d+$/, "") : null);
      if (winner && winner === pick.picked_team) { score += pts[round] || 0; correct += 1; }
    }
  }
  return { score, correct };
}

// Max possible total points a user could still reach.
// Group stage is locked in (no more group points possible once all groups complete),
// so this only projects additional knockout points from picks whose team hasn't been eliminated.
function calcMaxPossible(currentTotal, s2picks, results) {
  const pts = { R32: 2, R16: 4, QF: 6, SF: 8, F: 10 };
  const resultMap = {};
  results.forEach((r) => (resultMap[r.match_id] = r));

  // A team is eliminated if it lost any KO match already decided
  const eliminated = new Set();
  results.forEach((r) => {
    if (!r.result || !r.team1 || !r.team2) return;
    if (!["R32","R16","QF","SF","F"].includes(r.stage)) return;
    const loser = r.result === "team1" ? r.team2 : r.result === "team2" ? r.team1 : null;
    if (loser) eliminated.add(loser);
  });

  let bonus = 0;
  for (const pick of s2picks) {
    const result = resultMap[pick.slot_id];
    const round = pick.round || (pick.slot_id ? pick.slot_id.replace(/_\d+$/, "") : null);
    const roundPts = pts[round] || 0;
    if (result?.result) {
      // Match already decided — already counted in currentTotal via calcStage2Score, skip
      continue;
    }
    // Match not yet decided — could this pick still earn points?
    if (pick.picked_team && !eliminated.has(pick.picked_team)) {
      bonus += roundPts;
    }
  }
  return currentTotal + bonus;
}

// Group points helpers
function calcGroupPoints(group, matchPicks) {
  const teams = GROUPS[group];
  const pts = {};
  teams.forEach((t) => (pts[t] = 0));
  for (const m of ALL_GROUP_MATCHES.filter((m) => m.group === group)) {
    const pick = matchPicks[m.matchId];
    if (!pick) continue;
    if (pick === "team1") pts[m.team1] += 3;
    else if (pick === "team2") pts[m.team2] += 3;
    else { pts[m.team1] += 1; pts[m.team2] += 1; }
  }
  return teams.map((t) => ({ team: t, pts: pts[t] || 0 })).sort((a, b) => b.pts - a.pts);
}

function deriveRankings(sorted) {
  if (sorted.length < 2) return { first: null, second: null, tiedFirst: [], tiedSecond: [], tiedThird: [] };
  const [t1, t2] = sorted;
  const tiedFirst = sorted.filter((t) => t.pts === t1.pts).map((t) => t.team);
  if (tiedFirst.length >= 2) return { first: null, second: null, tiedFirst, tiedSecond: [], tiedThird: [] };
  const tiedSecond = sorted.slice(1).filter((t) => t.pts === t2.pts).map((t) => t.team);
  if (tiedSecond.length >= 2) return { first: t1.team, second: null, tiedFirst: [], tiedSecond, tiedThird: [] };
  // Check for 3-way+ tie for 3rd
  if (sorted.length >= 3) {
    const t3 = sorted[2];
    const tiedThird = sorted.slice(2).filter((t) => t.pts === t3.pts).map((t) => t.team);
    if (tiedThird.length >= 2) return { first: t1.team, second: t2.team, tiedFirst: [], tiedSecond: [], tiedThird };
  }
  return { first: t1.team, second: t2.team, tiedFirst: [], tiedSecond: [], tiedThird: [] };
}

// Design tokens
const THEMES = {
  default: {
    navy: "#0B1F3A", navyMid: "#1A3354",
    gold: "#EFB824", goldLight: "#FAD55A",
    bg: "#F5F5F0", white: "#ffffff",
    green: "#1D9E75", red: "#dc2626",
    text: "#1a1a2e", textMuted: "#64748b", border: "#e2e8f0",
    heroTitle: "Big Soccer Challenge",
    navTitle: "Big Soccer Challenge",
    navTitleShort: "BSC",
    fontSerif: false,
  },
  fsf: {
    navy: "#E8936A", navyMid: "#1a1a1a",       // peach nav/hero, near-black stat cards
    gold: "#1a1a1a", goldLight: "#2d2d2d",     // near-black accent
    bg: "#ffffff", white: "#ffffff",
    green: "#1D9E75", red: "#dc2626",
    text: "#1a1a1a", textMuted: "#6b7280", border: "#e5e7eb",
    navText: "#ffffff",                        // white text on peach
    heroTitleColor: "#ffffff",                 // white title on peach hero
    heroSubColor: "rgba(255,255,255,0.85)",    // near-white subtitle
    heroNameColor: "#ffffff",                  // white "Todd" on peach
    heroTitle: "FSF English Muffin Cup",
    heroSub: "It's like a soccer tournament, but bigger.",
    heroLogo: "/fsf-logo.png",
    navTitle: "FSF",
    fontSerif: true,
  },
};

// Mutable theme — updated on login based on league
const C = { ...THEMES.default };
function applyTheme(name) {
  const t = THEMES[name] || THEMES.default;
  // Clear all existing keys first so removed props (e.g. heroLogo) don't linger
  Object.keys(C).forEach((k) => { delete C[k]; });
  Object.assign(C, t);
}


const styles = {
  app: { fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: "100vh", color: C.text },
  nav: {
    background: C.navy, color: C.white, padding: "0 1.5rem",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    height: "60px", position: "sticky", top: 0, zIndex: 100,
    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
  },
  navLogo: { fontSize: "18px", fontWeight: 700, color: C.gold, letterSpacing: "-0.5px", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "clamp(50px,20vw,180px)", flexShrink: 0 },
  navLinks: { display: "flex", gap: "2px", alignItems: "center", overflowX: "auto", padding: "0 8px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" },
  navBtn: (active) => ({
    background: active ? C.gold : "transparent", color: active ? C.navy : (C.navText || C.white),
    border: "none", borderRadius: "6px", padding: "6px 14px",
    fontSize: "13px", fontWeight: 500, cursor: "pointer",
  }),
  hero: {
    background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`,
    color: C.white, padding: "3rem 1.5rem 2.5rem", textAlign: "center",
  },
  heroTitle: { fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 800, color: C.gold, margin: "0 0 0.5rem", letterSpacing: "-1px" },
  heroSub: { fontSize: "clamp(0.85rem,3vw,1rem)", color: "rgba(255,255,255,0.7)", margin: "0 0 2rem" },
  container: { maxWidth: "960px", margin: "0 auto", padding: "clamp(0.75rem, 3vw, 1.5rem)" },
  card: { background: C.white, borderRadius: "12px", padding: "clamp(0.75rem,3vw,1.5rem)", border: `1px solid ${C.border}`, marginBottom: "1rem" },
  cardTitle: { fontSize: "15px", fontWeight: 600, color: C.navy, margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "8px" },
  input: {
    width: "100%", padding: "10px 14px", borderRadius: "8px",
    border: `1px solid ${C.border}`, fontSize: "14px", background: C.white,
    color: C.text, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  },
  label: { fontSize: "13px", fontWeight: 500, color: C.textMuted, display: "block", marginBottom: "5px" },
  btnPrimary: {
    background: C.gold, color: C.navy, border: "none", borderRadius: "8px",
    padding: "10px 20px", fontSize: "14px", fontWeight: 700, cursor: "pointer",
  },
  btnSecondary: {
    background: "transparent", color: C.navy, border: `1px solid ${C.border}`,
    borderRadius: "8px", padding: "10px 20px", fontSize: "14px", cursor: "pointer",
  },
  btnDanger: {
    background: C.red, color: C.white, border: "none", borderRadius: "8px",
    padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
  },
  badge: (color, bg) => ({
    display: "inline-block", padding: "3px 10px", borderRadius: "20px",
    fontSize: "12px", fontWeight: 600, background: bg, color: color,
  }),
  statCard: { background: C.navyMid, borderRadius: "10px", padding: "1rem 1.25rem", textAlign: "center" },
  statLabel: { fontSize: "11px", color: C.gold, margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },
  statVal: { fontSize: "2rem", fontWeight: 800, color: C.white, margin: 0 },
  tab: (active) => ({
    padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
    cursor: "pointer", border: "none",
    background: active ? C.navy : "transparent", color: active ? C.white : C.textMuted,
  }),
  matchRow: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 0", borderBottom: `1px solid ${C.border}` },
  teamBtn: (sel) => ({
    flex: 1, padding: "8px 6px", borderRadius: "6px", fontSize: "13px",
    fontWeight: sel ? 700 : 400, cursor: "pointer", textAlign: "center",
    border: sel ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
    background: sel ? `${C.gold}22` : C.white, color: sel ? C.navy : C.text,
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  }),
  drawBtn: (sel) => ({
    padding: "8px 10px", borderRadius: "6px", fontSize: "12px",
    fontWeight: sel ? 700 : 400, cursor: "pointer",
    border: sel ? `2px solid ${C.navyMid}` : `1px solid ${C.border}`,
    background: sel ? `${C.navyMid}22` : C.white, color: C.text,
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
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.gold, animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// Auth
// Map of URL ?league= param values to theme names and invite codes
const LEAGUE_URL_MAP = {
  fsf:     { theme: "fsf",     inviteCode: "" },
  default: { theme: "default", inviteCode: "" },
};

function AuthScreen({ registrationOpen = true }) {
  const [mode, setMode] = useState("login");
  // Force back to login if registration closes
  useEffect(() => { if (!registrationOpen && mode === "register") setMode("login"); }, [registrationOpen]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [inviteCode, setInviteCode] = useState(() => {
    // Pre-fill invite code if URL param matches a known league
    const param = new URLSearchParams(window.location.search).get("league") || "";
    return LEAGUE_URL_MAP[param.toLowerCase()]?.inviteCode || "";
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Apply theme from URL param on mount
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("league") || "";
    const mapped = LEAGUE_URL_MAP[param.toLowerCase()];
    if (mapped) applyTheme(mapped.theme);
  }, []);

  async function handleSubmit() {
    setError(""); setLoading(true);
    try {
      if (mode === "register") {
        if (!inviteCode.trim()) throw new Error("An invite code is required to create an account.");
        const { data: league, error: le } = await supabase
          .from("leagues").select("id,name").eq("invite_code", inviteCode.trim().toLowerCase()).single();
        if (le || !league) throw new Error("Invalid invite code. Please check with the competition host.");
        const { data: authData, error: e } = await supabase.auth.signUp({
          email, password: pass, options: { data: { display_name: name } }
        });
        if (e) throw e;
        if (authData?.user?.id) {
          await new Promise((r) => setTimeout(r, 800));
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; }
        body { overflow-x: hidden; }
        nav div::-webkit-scrollbar { display: none; }
        button, input, select { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        button { min-height: 36px; }
        @media (max-width: 600px) { .nav-title-full { display: none !important; } .nav-title-short { display: inline !important; } }
        @media (min-width: 601px) { .nav-title-full { display: inline; } .nav-title-short { display: none !important; } }
        @media (max-width: 480px) {
          table { font-size: 12px; }
        }
      `}</style>
      <div style={{ ...styles.hero, background: C.navy }}>
        {C.heroLogo ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(10px,3vw,28px)", marginBottom: "0.5rem" }}>
            <img src={C.heroLogo} alt="Logo" style={{ width: "clamp(48px,8vw,90px)", height: "clamp(48px,8vw,90px)", objectFit: "contain", flexShrink: 0 }} />
            <div style={{ ...styles.heroTitle, margin: 0, fontFamily: C.fontSerif ? "'Georgia','Times New Roman',serif" : "'DM Sans',sans-serif", fontStyle: C.fontSerif ? "italic" : "normal", color: C.heroTitleColor || C.gold }}>{C.heroTitle || "FSF Challenge"}</div>
            <img src={C.heroLogo} alt="Logo" style={{ width: "clamp(48px,8vw,90px)", height: "clamp(48px,8vw,90px)", objectFit: "contain", flexShrink: 0 }} />
          </div>
        ) : (
          <div style={{ ...styles.heroTitle, fontFamily: C.fontSerif ? "'Georgia','Times New Roman',serif" : "'DM Sans',sans-serif", fontStyle: C.fontSerif ? "italic" : "normal", color: C.heroTitleColor || C.gold }}>{C.heroTitle || "FSF Challenge"}</div>
        )}
        <div style={{ ...styles.heroSub, color: C.heroSubColor || "rgba(255,255,255,0.7)" }}>{C.heroSub || "It's like a soccer tournament, but bigger."}</div>
      </div>
      <div style={{ ...styles.container, maxWidth: "420px" }}>
        <div style={styles.card}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "1.5rem" }}>
            {["login", ...(registrationOpen ? ["register"] : [])].map((m) => (
              <button key={m} style={styles.tab(mode === m)} onClick={() => { setMode(m); }}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>
          {!registrationOpen && (
            <div style={{ ...styles.alert("warning"), marginBottom: "1rem" }}>
              Registration is closed. Sign in if you already have an account.
            </div>
          )}
          <Alert type="error" msg={error} />
          {mode === "register" && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={styles.label}>Display Name</label>
              <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name on the leaderboard" />
            </div>
          )}
          {mode === "register" && (
            <div style={{ marginBottom: "1rem" }}>
              <label style={styles.label}>Invite Code</label>
              <input style={styles.input} value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Enter the code shared with you" />
            </div>
          )}
          <div style={{ marginBottom: "1rem" }}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={styles.label}>Password</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...styles.input, paddingRight: "42px" }} type={showPass ? "text" : "password"} value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
              <button
                onClick={() => setShowPass((p) => !p)}
                style={{
                  position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", padding: "4px",
                  color: C.textMuted, fontSize: "16px", lineHeight: 1,
                }}
                title={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          <button style={{ ...styles.btnPrimary, width: "100%", background: C.gold, color: C.navText || C.navy }} onClick={handleSubmit} disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
          <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
            <button onClick={() => setShowGuide(true)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "13px", color: C.textMuted, textDecoration: "underline",
            }}>How does TMA Challenge work?</button>
          </div>
        </div>
      </div>

      {showGuide && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, overflowY: "auto", display: "flex", justifyContent: "center", padding: "2rem 1rem" }}
          onClick={(e) => e.target === e.currentTarget && setShowGuide(false)}>
          <div style={{ background: C.bg, borderRadius: "16px", width: "100%", maxWidth: "680px", height: "fit-content" }}>
            <div style={{ background: C.navy, borderRadius: "16px 16px 0 0", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: C.gold }}>TMA Challenge — How it works</div>
              <button onClick={() => setShowGuide(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", color: C.white, fontSize: "20px", cursor: "pointer", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <div style={{ padding: "1.25rem 1.5rem 1.5rem", maxHeight: "70vh", overflowY: "auto" }}>
              <UserGuide embedded />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Leaderboard
// Read-only view of any user's picks with result feedback
function UserPicksModal({ userId, displayName, currentUserId, onClose, stage1Locked, stage2Locked, isAdmin = false, matchResultsCache = [], koResultsCache = [], standingsCache = [] }) {
  const [matchPicks, setMatchPicks] = useState({});
  const [groupPicks, setGroupPicks] = useState({});
  const [thirdPicks, setThirdPicks] = useState([]);
  const [s2picks, setS2picks] = useState({});
  const [matchResults, setMatchResults] = useState({});
  const [koResults, setKoResults] = useState({});
  const [standings, setStandings] = useState({});
  const [loading, setLoading] = useState(true);
  const koUnderway = koResultsCache.some((r) => r.result);
  const [activeTab, setActiveTab] = useState((koUnderway || isAdmin) ? "stage2" : "stage1");
  const [activeGroup, setActiveGroup] = useState("A");
  const [picksViewMode, setPicksViewMode] = useState("date");

  useEffect(() => {
    async function load() {
      const [{ data: mp, error: mpErr }, { data: gp }, { data: tp }, { data: s2 }] = await Promise.all([
        supabase.from("stage1_match_picks").select("match_id,pick").eq("user_id", userId),
        supabase.from("stage1_group_picks").select("group_code,first_place,second_place,third_place").eq("user_id", userId),
        supabase.from("stage1_third_place_picks").select("teams").eq("user_id", userId).maybeSingle(),
        supabase.from("stage2_picks").select("slot_id,picked_team").eq("user_id", userId),
      ]);
      if (mpErr) console.warn("UserPicksModal: RLS may be blocking picks for userId", userId, mpErr);
      const mpMap = {}; (mp||[]).forEach((p) => (mpMap[p.match_id] = p.pick));
      setMatchPicks(mpMap);
      const gpMap = {}; (gp||[]).forEach((p) => (gpMap[p.group_code] = { first: p.first_place, second: p.second_place, third: p.third_place || "" }));
      setGroupPicks(gpMap);
      setThirdPicks(tp?.teams || []);
      const s2map = {}; (s2||[]).forEach((p) => (s2map[p.slot_id] = p.picked_team));
      setS2picks(s2map);
      // Use cached data from App level
      const mrMap = {}; matchResultsCache.filter((r) => r.stage === "group").forEach((r) => (mrMap[r.match_id] = r.result));
      setMatchResults(mrMap);
      const koMap = {}; koResultsCache.forEach((r) => (koMap[r.match_id] = { result: r.result, team1: r.team1, team2: r.team2 }));
      setKoResults(koMap);
      const stMap = {}; standingsCache.forEach((s) => (stMap[s.group_code] = s));
      setStandings(stMap);
      setLoading(false);
    }
    load();
  }, [userId]);

  const isMe = userId === currentUserId;
  const pg = "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)";

  // Compute Stage 1 score — must match calcStage1Score exactly
  function calcS1() {
    let score = 0;
    // Match picks: +1 per correct result
    for (const [mid, pick] of Object.entries(matchPicks)) {
      if (matchResults[mid] && pick === matchResults[mid]) score += 1;
    }
    // Group standings: +4 correct 1st, +3 correct 2nd, +2 correct team wrong position
    for (const [grp, gp] of Object.entries(groupPicks)) {
      const st = standings[grp]; if (!st) continue;
      if (gp.first === st.first_place) score += 4;
      else if (gp.first === st.second_place) score += 2;
      if (gp.second === st.second_place) score += 3;
      else if (gp.second === st.first_place) score += 2;
    }
    // 3rd place picks: +1 if team qualified for R32
    const r32Qualifiers = new Set([
      ...Object.values(standings).map((s) => s.first_place),
      ...Object.values(standings).map((s) => s.second_place),
      ...Object.values(standings).filter((s) => s.is_third_place_qualifier && s.third_place).map((s) => s.third_place),
    ].filter(Boolean));
    thirdPicks.forEach((t) => { if (r32Qualifiers.has(t)) score += 1; });
    return score;
  }

  function calcS2() {
    const pts = { R32: 2, R16: 4, QF: 6, SF: 8, F: 10 };
    let score = 0;
    for (const [slotId, team] of Object.entries(s2picks)) {
      const r = koResults[slotId]; if (!r?.result) continue;
      const winner = r.result === "team1" ? r.team1 : r.team2;
      if (team === winner) score += pts[slotId.replace(/_\d+$/, "")] || 0;
    }
    return score;
  }

  const groupMatches = ALL_GROUP_MATCHES.filter((m) => m.group === activeGroup);
  const gp = groupPicks[activeGroup] || {};
  const actualSt = standings[activeGroup] || {};

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, overflowY: "auto", display: "flex", justifyContent: "center", padding: "2rem 1rem" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.bg, borderRadius: "16px", width: "100%", maxWidth: "860px", height: "fit-content" }}>

        {/* Header */}
        <div style={{ background: C.navy, borderRadius: "16px 16px 0 0", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: C.gold }}>{displayName}{isMe ? " (you)" : ""}</div>
            {!loading && (
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", marginTop: "2px" }}>
                Group Stage: {calcS1()} pts &nbsp;·&nbsp; Knockout: {calcS2()} pts &nbsp;·&nbsp; Total: {calcS1() + calcS2()} pts
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", color: C.white, fontSize: "20px", cursor: "pointer", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", padding: "1rem 1.5rem 0" }}>
          {[["stage1", "Group Stage"], ["stage2", "Knockout"]].map(([id, label]) => (
            <button key={id}
              style={styles.tab(activeTab === id)}
              onClick={() => (id === "stage2" && !stage2Locked && !isAdmin) ? null : setActiveTab(id)}
              disabled={id === "stage2" && !stage2Locked && !isAdmin}
              title={id === "stage2" && !stage2Locked && !isAdmin ? "Knockout picks not yet locked" : ""}
            >
              {label}{id === "stage2" && !stage2Locked && !isAdmin ? " 🔒" : ""}
            </button>
          ))}
        </div>

        <div style={{ padding: "1rem 1.5rem 1.5rem" }}>
          {loading ? <Spinner /> : (
            <>
              {/* ── STAGE 1 TAB ── */}
              {activeTab === "stage1" && (
                <>
                  {/* View toggle */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "1rem" }}>
                    <button onClick={() => setPicksViewMode("date")} style={{
                      padding: "5px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                      border: picksViewMode === "date" ? `2px solid ${C.navy}` : `1px solid ${C.border}`,
                      background: picksViewMode === "date" ? C.navy : C.white,
                      color: picksViewMode === "date" ? C.white : C.text,
                    }}>📅 By Date</button>
                    <button onClick={() => setPicksViewMode("group")} style={{
                      padding: "5px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                      border: picksViewMode === "group" ? `2px solid ${C.navy}` : `1px solid ${C.border}`,
                      background: picksViewMode === "group" ? C.navy : C.white,
                      color: picksViewMode === "group" ? C.white : C.text,
                    }}>By Group</button>
                  </div>

                  {/* ── DATE VIEW ── */}
                  {picksViewMode === "date" && (() => {
                    const today = new Date();
                    const todayStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" }).replace(/\s+/, " ");
                    const byDate = {};
                    ALL_GROUP_MATCHES.forEach((m) => {
                      if (!byDate[m.date]) byDate[m.date] = [];
                      byDate[m.date].push(m);
                    });
                    const hasTodayDate = Object.keys(byDate).includes(todayStr);
                    return (
                      <div id="modal-date-scroll" style={{ maxHeight: "55vh", overflowY: "auto", paddingRight: "4px" }}>
                        {Object.keys(byDate).map((date) => {
                          const isToday = date === todayStr;
                          const matches = byDate[date];
                          return (
                            <div key={date} id={`modal-date-${date.replace(" ", "-")}`} style={{ marginBottom: "1.25rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                <span style={{
                                  fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
                                  padding: isToday ? "3px 10px" : "2px 8px", borderRadius: "6px",
                                  background: isToday ? C.navy : "transparent",
                                  color: isToday ? C.gold : C.navy,
                                  border: isToday ? `1px solid ${C.navy}` : `1px solid ${C.border}`,
                                }}>
                                  {isToday ? `📅 Today — ${date}` : date}
                                </span>
                                <div style={{ flex: 1, height: "1px", background: C.border }} />
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                {matches.map((m) => {
                                  const userPick = matchPicks[m.matchId];
                                  const actualResult = matchResults[m.matchId];
                                  const hasResult = !!actualResult;
                                  const t1State = !hasResult ? null : userPick==="team1" ? (actualResult==="team1"?"correct":"wrong") : actualResult==="team1"?"winner":null;
                                  const t2State = !hasResult ? null : userPick==="team2" ? (actualResult==="team2"?"correct":"wrong") : actualResult==="team2"?"winner":null;
                                  const drawCorrect  = hasResult && userPick==="draw" && actualResult==="draw";
                                  const drawWrong    = hasResult && userPick==="draw" && actualResult!=="draw";
                                  const drawIsResult = hasResult && actualResult==="draw" && userPick!=="draw";
                                  const pts = hasResult && userPick === actualResult ? "+1" : null;
                                  return (
                                    <div key={m.matchId} style={{ ...styles.card, marginBottom: 0, padding: "10px 14px" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                                        <span style={{ fontSize: "10px", fontWeight: 700, color: C.white, background: C.navy, borderRadius: "4px", padding: "1px 7px", letterSpacing: "0.04em" }}>GROUP {m.group}</span>
                                        {!hasResult && <span style={{ fontSize: "11px", color: C.textMuted }}>{m.time.replace(" ET","")}</span>}
                                      </div>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <TeamBtn team={m.team1} selected={!hasResult && userPick==="team1"} resultState={t1State} onClick={() => {}} />
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", flexShrink: 0 }}>
                                          <button style={{
                                            ...styles.drawBtn(!hasResult && userPick==="draw"),
                                            ...((drawCorrect||drawIsResult) ? { borderColor:"#1D9E75",color:"#1D9E75",fontWeight:700,background:"rgba(29,158,117,0.06)",border:"2px solid #1D9E75" } : {}),
                                            ...(drawWrong ? { borderColor:"#fca5a5",background:"rgba(220,38,38,0.04)",textDecoration:"line-through",color:C.textMuted,border:"2px solid #fca5a5" } : {}),
                                          }} onClick={() => {}}>
                                            {(drawCorrect||drawIsResult) ? "Draw ✓" : "Draw"}
                                          </button>
                                          {hasResult
                                            ? <span style={{ fontSize: "10px", fontWeight: 700, color: pts ? "#1D9E75" : C.textMuted }}>{pts ? `✓ ${pts}` : "✗ +0"}</span>
                                            : <span style={{ fontSize: "10px", color: C.textMuted }}>{m.time.replace(" ET","")}</span>
                                          }
                                        </div>
                                        <TeamBtn team={m.team2} selected={!hasResult && userPick==="team2"} resultState={t2State} onClick={() => {}} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        {hasTodayDate && (
                          <AutoScrollToToday containerId="modal-date-scroll" targetId={`modal-date-${todayStr.replace(" ", "-")}`} />
                        )}
                      </div>
                    );
                  })()}

                  {/* ── GROUP VIEW ── */}
                  {picksViewMode === "group" && (
                    <div>
                      {/* Group selector */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "1rem" }}>
                        {Object.keys(GROUPS).map((g) => {
                          const gMatches = ALL_GROUP_MATCHES.filter((m) => m.group === g);
                          const filled = gMatches.filter((m) => matchPicks[m.matchId]).length;
                          return (
                            <button key={g} onClick={() => setActiveGroup(g)} style={{
                              padding: "5px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                              border: activeGroup === g ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
                              background: activeGroup === g ? C.navy : C.white,
                              color: activeGroup === g ? C.white : C.text,
                            }}>{g}</button>
                          );
                        })}
                      </div>

                      {/* Group standings picks — shown first */}
                      <div style={styles.card}>
                        <div style={styles.cardTitle}>Group {activeGroup} — Standings Picks</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "10px" }}>
                          {[["1st Place", gp.first, actualSt.first_place, 4], ["2nd Place", gp.second, actualSt.second_place, 3]].map(([label, picked, actual, maxPts]) => {
                            const hasResult = !!actual;
                            const correct = hasResult && picked === actual;
                            const partial = hasResult && picked && !correct && (picked === actualSt.second_place || picked === actualSt.first_place);
                            const wrong = hasResult && picked && !correct && !partial;
                            const earned = correct ? maxPts : partial ? 2 : 0;
                            return (
                              <div key={label} style={{ background: `${C.navy}0d`, borderRadius: "8px", padding: "10px 14px", border: `1px solid ${hasResult ? (correct?"#1D9E75":wrong?"#fca5a5":C.border) : C.border}` }}>
                                <div style={{ fontSize: "11px", color: C.textMuted, fontWeight: 600, marginBottom: "4px" }}>{label}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  {picked ? (
                                    <>
                                      <img src={`https://flagcdn.com/${TEAM_META[picked]?.flag||"un"}.svg`} style={{ width:"18px",height:"12px",borderRadius:"2px",objectFit:"cover" }} />
                                      <span style={{ fontSize: "14px", fontWeight: 700, flex: 1, textDecoration: wrong?"line-through":"none", color: wrong?C.textMuted:C.navy }}>{picked}</span>
                                      {hasResult && <span style={{ fontSize: "11px", fontWeight: 700, color: earned>0?"#1D9E75":C.textMuted }}>{earned>0?`✓ +${earned}`:"✗ +0"}</span>}
                                    </>
                                  ) : (
                                    <span style={{ fontSize: "13px", color: C.textMuted, fontStyle: "italic" }}>No pick</span>
                                  )}
                                </div>
                                {hasResult && actual && picked !== actual && (
                                  <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "4px" }}>
                                    Actual: <strong style={{ color: C.navy }}>{actual}</strong>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Match picks */}
                      <div style={styles.card}>
                        <div style={styles.cardTitle}>Group {activeGroup} — Match Picks</div>
                        {groupMatches.map((m, idx) => {
                          const prevMatch = groupMatches[idx - 1];
                          const showDateHeader = idx === 0 || prevMatch?.date !== m.date;
                          const userPick = matchPicks[m.matchId];
                          const actualResult = matchResults[m.matchId];
                          const hasResult = !!actualResult;
                          const t1State = !hasResult ? null : userPick==="team1" ? (actualResult==="team1"?"correct":"wrong") : actualResult==="team1"?"winner":null;
                          const t2State = !hasResult ? null : userPick==="team2" ? (actualResult==="team2"?"correct":"wrong") : actualResult==="team2"?"winner":null;
                          const drawCorrect  = hasResult && userPick==="draw" && actualResult==="draw";
                          const drawWrong    = hasResult && userPick==="draw" && actualResult!=="draw";
                          const drawIsResult = hasResult && actualResult==="draw" && userPick!=="draw";
                          const pts = hasResult && userPick === actualResult ? "+1" : null;
                          return (
                            <div key={m.matchId}>
                              {showDateHeader && (
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0 4px", marginTop: idx > 0 ? "4px" : 0 }}>
                                  <span style={{ fontSize: "11px", fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.date}</span>
                                  <div style={{ flex: 1, height: "1px", background: C.border }} />
                                </div>
                              )}
                              <div style={{ paddingTop: "6px", paddingBottom: "6px", borderBottom: `1px solid ${C.border}` }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <TeamBtn team={m.team1} selected={!hasResult && userPick==="team1"} resultState={t1State} onClick={() => {}} />
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", flexShrink: 0 }}>
                                    <button style={{
                                      ...styles.drawBtn(!hasResult && userPick==="draw"),
                                      ...((drawCorrect||drawIsResult) ? { borderColor:"#1D9E75",color:"#1D9E75",fontWeight:700,background:"rgba(29,158,117,0.06)",border:"2px solid #1D9E75" } : {}),
                                      ...(drawWrong ? { borderColor:"#fca5a5",background:"rgba(220,38,38,0.04)",textDecoration:"line-through",color:C.textMuted,border:"2px solid #fca5a5" } : {}),
                                    }} onClick={() => {}}>
                                      {(drawCorrect||drawIsResult) ? "Draw ✓" : "Draw"}
                                    </button>
                                    {hasResult
                                      ? <span style={{ fontSize: "10px", fontWeight: 700, color: pts ? "#1D9E75" : C.textMuted }}>{pts ? `✓ ${pts}` : "✗ +0"}</span>
                                      : <span style={{ fontSize: "10px", color: C.textMuted }}>{m.time.replace(" ET","")}</span>
                                    }
                                  </div>
                                  <TeamBtn team={m.team2} selected={!hasResult && userPick==="team2"} resultState={t2State} onClick={() => {}} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3rd place picks — always shown */}
                  {thirdPicks.length > 0 && (
                    <div style={styles.card}>
                      <div style={styles.cardTitle}>Best 3rd Place Picks</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: "8px" }}>
                        {thirdPicks.map((team) => {
                          const r32Quals = new Set([
                            ...Object.values(standings).map((s) => s.first_place),
                            ...Object.values(standings).map((s) => s.second_place),
                            ...Object.values(standings).filter((s) => s.is_third_place_qualifier && s.third_place).map((s) => s.third_place),
                          ].filter(Boolean));
                          const hasResults = r32Quals.size > 0;
                          const correct = hasResults && r32Quals.has(team);
                          const wrong = hasResults && !correct;
                          const meta = TEAM_META[team] || { flag: "un" };
                          return (
                            <div key={team} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "6px", border: `1px solid ${hasResults?(correct?"#1D9E75":"#fca5a5"):C.border}`, background: hasResults?(correct?"rgba(29,158,117,0.05)":"rgba(220,38,38,0.03)"):C.white }}>
                              <img src={`https://flagcdn.com/${meta.flag}.svg`} style={{ width:"18px",height:"12px",borderRadius:"2px",objectFit:"cover",opacity:wrong?0.5:1 }} />
                              <span style={{ fontSize:"13px", flex:1, textDecoration:wrong?"line-through":"none", color:wrong?C.textMuted:C.text }}>{team}</span>
                              {hasResults && <span style={{ fontSize:"11px",fontWeight:700,color:correct?"#1D9E75":C.textMuted }}>{correct?"✓ +1":"✗"}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── STAGE 2 TAB ── */}
              {activeTab === "stage2" && !stage2Locked && !isAdmin && (
                <div style={{ ...styles.card, textAlign: "center", padding: "2rem" }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔒</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: C.navy }}>Knockout picks not yet locked</div>
                  <div style={{ fontSize: "13px", color: C.textMuted, marginTop: "6px" }}>Check back after the Round of 32 begins.</div>
                </div>
              )}
              {activeTab === "stage2" && (stage2Locked || isAdmin) && (() => {
                // Derive the viewed user's predicted bracket from their picks
                // using BRACKET_FEED — same logic as Stage2Picks
                function getUserBracketTeams(slotId) {
                  const feed = BRACKET_FEED[slotId];
                  if (!feed) {
                    // R32 — teams come from actual bracket (koResults)
                    const actual = koResults[slotId];
                    return [actual?.team1 || null, actual?.team2 || null];
                  }
                  // Later rounds — teams are whoever the user picked in feeder slots
                  return [s2picks[feed[0]] || null, s2picks[feed[1]] || null];
                }

                return (
                  <div>
                    {KNOCKOUT_ROUNDS.map(({ round, label, points }) => {
                      const slotCount = { R32: 16, R16: 8, QF: 4, SF: 2, F: 1 }[round] || 0;
                      const slotIds = Array.from({ length: slotCount }, (_, i) => `${round}_${i + 1}`);

                      return (
                        <div key={round} style={styles.card}>
                          <div style={styles.cardTitle}>{label}<span style={styles.badge(C.navy, `${C.gold}33`)}>+{points} pts each</span></div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {slotIds.map((slotId, idx) => {
                              const picked = s2picks[slotId];
                              const [t1, t2] = getUserBracketTeams(slotId);
                              const koResult = koResults[slotId];
                              const hasResult = !!koResult?.result;
                              const hasPick = !!picked;
                              const actualWinner = hasResult ? (koResult.result === "team1" ? koResult.team1 : koResult.team2) : null;
                              const userCorrect = hasResult && hasPick && picked === actualWinner;

                              // Result state for display:
                              // correct = user picked this team AND they actually won
                              // wrong = user picked this team AND they actually lost
                              // winner = actual winner, user didn't pick them
                              const pickedState = (team) => {
                                if (!hasResult || !hasPick) return null;
                                if (picked === team) return actualWinner === team ? "correct" : "wrong";
                                if (actualWinner === team) return "winner";
                                return null;
                              };

                              const bothKnown = t1 && t2;
                              const t1Elim = !hasResult && bothKnown && isTeamEliminated(t1, slotId, koResults);
                              const t2Elim = !hasResult && bothKnown && isTeamEliminated(t2, slotId, koResults);
                              const pickedElim = !hasResult && picked && isTeamEliminated(picked, slotId, koResults);

                              return (
                                <div key={slotId}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 2px 3px", flexWrap: "wrap" }}>
                                    <span style={{ fontSize: "10px", color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                      {SLOT_META[slotId] ? `Match ${SLOT_META[slotId].matchNum}` : `Match ${idx + 1}`}
                                    </span>
                                    {SLOT_META[slotId] && <>
                                      <span style={{ fontSize: "10px", color: C.navy, fontWeight: 600 }}>{SLOT_META[slotId].date}</span>
                                      <span style={{ fontSize: "10px", color: C.textMuted }}>{SLOT_META[slotId].time}</span>
                                      <span style={{ fontSize: "10px", color: C.textMuted }}>·</span>
                                      <span style={{ fontSize: "10px", color: C.textMuted }}>{SLOT_META[slotId].venue}</span>
                                    </>}
                                  </div>
                                  {!bothKnown ? (
                                    <div style={{ fontSize: "13px", color: C.textMuted, fontStyle: "italic", padding: "4px 0" }}>
                                      {picked ? `Picked: ${picked}` : "No pick made"}
                                    </div>
                                  ) : (
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                      <TeamBtn team={t1} selected={!hasResult && picked === t1} resultState={pickedState(t1)} onClick={() => {}}
                                        style={t1Elim ? { opacity: 0.4, textDecoration: "line-through" } : {}} />
                                      <span style={{ fontSize: "11px", fontWeight: 600, color: C.textMuted, flexShrink: 0 }}>vs</span>
                                      <TeamBtn team={t2} selected={!hasResult && picked === t2} resultState={pickedState(t2)} onClick={() => {}}
                                        style={t2Elim ? { opacity: 0.4, textDecoration: "line-through" } : {}} />
                                      {hasResult && hasPick && (
                                        <span style={{ fontSize: "11px", fontWeight: 700, flexShrink: 0, minWidth: "40px", textAlign: "right", color: userCorrect ? "#1D9E75" : C.textMuted }}>
                                          {userCorrect ? `✓ +${points}` : "✗ +0"}
                                        </span>
                                      )}
                                      {!hasResult && pickedElim && (
                                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", flexShrink: 0 }}>✗ out</span>
                                      )}
                                      {!hasPick && !pickedElim && <span style={{ fontSize: "10px", color: C.textMuted, flexShrink: 0 }}>no pick</span>}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Module-level leaderboard cache keyed by leagueId
// Invalidated when match_results updated_at changes, not by time
const leaderboardCache = {};

// lbFetchAllMatchPicks removed — using single query with high limit after Max Rows set to 10000

function Leaderboard({ currentUserId, stage1Locked, stage2Locked, leagueId, leagueName, isAdmin, appLeagues = [], onThemeChange, matchResultsCache = [], koResultsCache = [], standingsCache = [], resultsVersion = 0 }) {
  const isMobile = useIsMobile();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [leagues, setLeagues] = useState(appLeagues);
  const [viewLeagueId, setViewLeagueId] = useState(() => {
    if (!isAdmin) return leagueId;
    const saved = localStorage.getItem("fsf_admin_leagueId");
    if (saved === "__all__") return null;
    return saved || leagueId;
  });
  const [viewLeagueName, setViewLeagueName] = useState(() => {
    if (!isAdmin) return leagueName;
    return localStorage.getItem("fsf_admin_leagueName") || leagueName;
  });

  // Sync leagues if appLeagues prop updates
  useEffect(() => { if (appLeagues.length > 0) setLeagues(appLeagues); }, [appLeagues]);

  // Sync viewLeagueId when leagueId prop arrives async (non-admin users)
  useEffect(() => {
    if (!isAdmin && leagueId && !viewLeagueId) {
      setViewLeagueId(leagueId);
      setViewLeagueName(leagueName);
    }
  }, [leagueId, isAdmin]);

  // Load leagues list for admin switcher
  useEffect(() => {
    if (!isAdmin) return;
    supabase.from("leagues").select("id,name,theme").order("name").then(({ data }) => {
      if (data && data.length > 0) {
        setLeagues(data);
        // Default admin to saved league, or first league if no saved preference
        const savedId = localStorage.getItem("fsf_admin_leagueId");
        const savedName = localStorage.getItem("fsf_admin_leagueName");
        if (savedId && savedId !== "__all__" && data.some((l) => l.id === savedId)) {
          // Only update if actually changing to prevent render loops
          if (savedId !== viewLeagueId) {
            setViewLeagueId(savedId);
            setViewLeagueName(savedName || data.find((l) => l.id === savedId)?.name || "");
            const savedTheme = data.find((l) => l.id === savedId)?.theme || "default";
            localStorage.setItem("fsf_admin_theme", savedTheme);
            applyTheme(savedTheme); if (onThemeChange) onThemeChange(savedTheme);
          }
        } else if (!viewLeagueId && localStorage.getItem("fsf_admin_leagueId") !== "__all__") {
          // Only default to first league if user hasn't explicitly chosen "All Leagues"
          setViewLeagueId(data[0].id);
          setViewLeagueName(data[0].name);
          localStorage.setItem("fsf_admin_leagueId", data[0].id);
          localStorage.setItem("fsf_admin_leagueName", data[0].name);
          applyTheme(data[0].theme || "default"); if (onThemeChange) onThemeChange(data[0].theme || "default");
        }
      }
    });
  }, [isAdmin]);

  useEffect(() => {
    async function load(forceRefresh = false) {
      const cacheKey = viewLeagueId || "__all__";
      const cached = leaderboardCache[cacheKey];

      // Check latest match_results updated_at — only refetch if results have changed
      if (!forceRefresh && cached) {
        const { data: latest } = await supabase
          .from("match_results")
          .select("updated_at")
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();
        const latestTs = latest?.updated_at || null;
        if (latestTs === cached.resultsTs) {
          setRows(cached.rows);
          setLastUpdated(cached.timestamp);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      // Fetch everything in parallel — filter in JS, not via .in() which can silently fail
      const [
        { data: allProfiles },
        { data: s1match },
        { data: s1group },
        { data: s1third },
        { data: s2picks },
        { data: freshResults },
        { data: freshStandings },
        { data: latestResult },
      ] = await Promise.all([
        supabase.from("profiles").select("id, display_name, is_admin, league_id"),
        supabase.from("stage1_match_picks").select("user_id,match_id,pick"),
        supabase.from("stage1_group_picks").select("user_id,group_code,first_place,second_place,third_place"),
        supabase.from("stage1_third_place_picks").select("user_id,teams"),
        supabase.from("stage2_picks").select("user_id,slot_id,picked_team"),
        supabase.from("match_results").select("match_id,result,score1,score2,team1,team2,stage"),
        supabase.from("group_standings").select("*"),
        supabase.from("match_results").select("updated_at").order("updated_at", { ascending: false }).limit(1).single(),
      ]);

      // Filter profiles to the correct league scope in JS
      let profiles = [];
      if (viewLeagueId) {
        profiles = (allProfiles||[]).filter(p => p.league_id === viewLeagueId || p.is_admin);
      } else if (isAdmin) {
        profiles = allProfiles || [];
      } else {
        profiles = (allProfiles||[]).filter(p => p.is_admin);
      }

      const results = freshResults || [];
      const standings = freshStandings || [];

      const board = profiles.map((p) => {
        const s1 = calcStage1Score(
          (s1match||[]).filter((x) => x.user_id === p.id),
          (s1group||[]).filter((x) => x.user_id === p.id),
          (s1third||[]).find((x) => x.user_id === p.id),
          results, standings
        );
        const userS2Picks = (s2picks||[]).filter((x) => x.user_id === p.id);
        const s2 = calcStage2Score(userS2Picks, results);
        const total = s1.score + s2.score;
        const maxPossible = calcMaxPossible(total, userS2Picks, results);
        return { ...p, total, s1score: s1.score, s1matchScore: s1.matchScore, s1finishScore: s1.finishScore, s2score: s2.score, correctPicks: s1.correct+s2.correct, maxPossible };
      }).sort((a,b) => b.total-a.total || b.correctPicks-a.correctPicks || a.display_name.localeCompare(b.display_name));

      let rank = 1;
      for (let i = 0; i < board.length; i++) {
        if (i > 0 && board[i].total === board[i-1].total && board[i].correctPicks === board[i-1].correctPicks) board[i].rank = board[i-1].rank;
        else board[i].rank = rank;
        rank++;
      }

      const resultsTs = latestResult?.updated_at || null;
      const timestamp = Date.now();
      leaderboardCache[cacheKey] = { rows: board, timestamp, resultsTs };
      setRows(board);
      setLastUpdated(timestamp);
      setLoading(false);
      setRefreshing(false);
    }
    load();
  }, [viewLeagueId, resultsVersion]);


  if (loading && rows.length === 0) return <Spinner />;
  const me = rows.find((r) => r.id === currentUserId);

  return (
    <div style={styles.container}>
      <div style={{ background: C.navy, borderRadius: "12px", padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
          {/* Admin league switcher — always shown for admin regardless of me */}
          {isAdmin && leagues.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "12px", color: C.navText || C.gold, fontWeight: 600, flexShrink: 0 }}>Viewing:</span>
              <select
                value={viewLeagueId || ""}
                onChange={(e) => {
                  const id = e.target.value || null;
                  setViewLeagueId(id);
                  const league = leagues.find((l) => l.id === id);
                  const name = id ? (league?.name || "All Leagues") : "All Leagues";
                  setViewLeagueName(name);
                  if (id) localStorage.setItem("fsf_admin_leagueId", id);
                  else localStorage.setItem("fsf_admin_leagueId", "__all__"); // marker so we don't auto-default to first league
                  localStorage.setItem("fsf_admin_leagueName", name);
                  const themeName = id ? (league?.theme || "default") : "default";
                  localStorage.setItem("fsf_admin_theme", themeName);
                  applyTheme(themeName); if (onThemeChange) onThemeChange(themeName);
                }}
                style={{ flex: 1, fontSize: "13px", padding: "5px 10px", borderRadius: "6px",
                  border: `1px solid rgba(255,255,255,0.25)`, background: C.navy,
                  color: C.white, cursor: "pointer" }}
              >
                <option value="">All Leagues</option>
                {leagues.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ fontSize: "13px", color: C.navText || C.gold, fontWeight: 600 }}>YOUR STANDING</div>
            {!isAdmin && viewLeagueName && <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.1)", padding: "2px 10px", borderRadius: "20px" }}>{viewLeagueName}</div>}
          </div>
          {me && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px", marginTop: "0.75rem" }}>
              {[["RANK",`#${me.rank}`],["TOTAL PTS",me.total],["MAX POSS.",me.maxPossible ?? me.total],["CORRECT ✓",me.correctPicks]].map(([l,v]) => (
                <div key={l} style={{ ...styles.statCard, background: C.navyMid, padding: "0.75rem 1rem" }}>
                  <div style={{ ...styles.statLabel, color: C.navText || C.gold, fontSize: "10px" }}>{l}</div>
                  <div style={{ ...styles.statVal, color: C.white, fontSize: "1.75rem" }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      <div style={styles.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={styles.cardTitle}>Leaderboard</div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {lastUpdated && (
              <span style={{ fontSize: "11px", color: C.textMuted }}>
                {(() => {
                  const secs = Math.round((Date.now() - lastUpdated) / 1000);
                  if (secs < 60) return `Updated ${secs}s ago`;
                  const mins = Math.round(secs / 60);
                  if (mins < 60) return `Updated ${mins}m ago`;
                  return `Updated ${Math.round(mins / 60)}h ago`;
                })()}
              </span>
            )}
            <button
              onClick={() => {
                setRefreshing(true);
                const cacheKey = viewLeagueId || "__all__";
                delete leaderboardCache[cacheKey];
                setResultsVersion(v => v + 1);
              }}
              style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", border: `1px solid ${C.border}`, background: C.white, cursor: refreshing ? "default" : "pointer", color: C.textMuted }}
              disabled={refreshing}
            >
              {refreshing ? "↻ Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? "13px" : "14px" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {(isMobile ? [
                  ["Rank",       "Rank — your current position on the leaderboard"],
                  ["Player",     "Player"],
                  ["Match\nPts", "Match Pts — +1 per correct match result (Win/Draw/Loss) out of 72 group stage matches"],
                  ["Finish\nPts","Finish Pts — points from predicting group 1st/2nd place (+4/+3) and 3rd place qualifiers (+1). +2 if correct team but wrong position"],
                  ["KO\nPts",    "KO Pts — points from knockout round picks (+2 R32 → +10 Final)"],
                  ["Total",      "Total — sum of all points"],
                  ["Max\nPoss.", "Max Possible — your highest achievable total if every remaining pick with a still-alive team wins their match"],
                  ["✓",          "Correct — total count of correct answers. Used as tiebreaker when totals are equal"],
                ] : [
                  ["Rank",        "Rank — your current position on the leaderboard"],
                  ["Player",      "Player"],
                  ["Match\nPts",  "Match Pts — +1 per correct match result (Win/Draw/Loss) out of 72 group stage matches"],
                  ["Finish\nPts", "Finish Pts — points from predicting group 1st/2nd place (+4/+3) and 3rd place qualifiers (+1). +2 if correct team but wrong position"],
                  ["KO\nPts",     "KO Pts — points from knockout round picks (+2 R32, +4 R16, +6 QF, +8 SF, +10 Final)"],
                  ["Total",       "Total — sum of all points"],
                  ["Max\nPossible","Max Possible — your highest achievable total if every remaining pick with a still-alive team wins their match"],
                  ["Correct",     "Correct — total count of correct answers. Used as tiebreaker when totals are equal"],
                ]).map(([display, tip]) => (
                  <LbHeader key={display} display={display} tip={tip} isMobile={isMobile} />
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}
                  onClick={() => (stage1Locked || isAdmin) && setSelectedUser(r)}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: r.id===currentUserId?`${C.gold}18`:"transparent",
                    cursor: (stage1Locked || isAdmin) ? "pointer" : "default",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (stage1Locked || isAdmin) && (e.currentTarget.style.background = r.id===currentUserId?`${C.gold}28`:`${C.navy}08`)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = r.id===currentUserId?`${C.gold}18`:"transparent")}
                >
                  <td style={{ padding: isMobile ? "8px 5px" : "8px 6px", textAlign: "center", fontWeight: 700, color: r.rank<=3?C.gold:C.textMuted, whiteSpace: "nowrap" }}>
                    {r.rank===1?"🥇":r.rank===2?"🥈":r.rank===3?"🥉":`#${r.rank}`}
                  </td>
                  <td style={{ padding: isMobile ? "8px 5px" : "8px 6px", fontWeight: r.id===currentUserId?700:400, maxWidth: isMobile ? "90px" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.display_name}{r.id===currentUserId&&<span style={{ fontSize:"11px",color:C.gold }}> (you)</span>}
                    {(stage1Locked || isAdmin) && !isMobile && <span style={{ fontSize:"10px",color:C.textMuted,marginLeft:"6px" }}>→ view picks</span>}
                  </td>
                  <td style={{ padding: isMobile ? "8px 5px" : "8px 6px", textAlign:"center" }}>{r.s1matchScore ?? r.s1score}</td>
                  <td style={{ padding: isMobile ? "8px 5px" : "8px 6px", textAlign:"center", color: (r.s1finishScore ?? 0) > 0 ? C.green : C.text }}>{r.s1finishScore ?? 0}</td>
                  <td style={{ padding: isMobile ? "8px 5px" : "8px 6px", textAlign:"center" }}>{r.s2score}</td>
                  <td style={{ padding: isMobile ? "8px 5px" : "8px 6px", textAlign:"center", fontWeight:700, color:C.navy }}>{r.total}</td>
                  <td style={{ padding: isMobile ? "8px 5px" : "8px 6px", textAlign:"center", color: (r.maxPossible ?? r.total) > r.total ? C.gold : C.textMuted, fontWeight: (r.maxPossible ?? r.total) > r.total ? 700 : 400 }}>{r.maxPossible ?? r.total}</td>
                  <td style={{ padding: isMobile ? "8px 5px" : "8px 6px", textAlign:"center", color:C.textMuted }}>{r.correctPicks}</td>
                </tr>
              ))}
              {rows.length===0&&<tr><td colSpan={8} style={{ textAlign:"center",padding:"2rem",color:C.textMuted }}>No entries yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    {selectedUser && (
      <UserPicksModal
        userId={selectedUser.id}
        displayName={selectedUser.display_name}
        currentUserId={currentUserId}
        stage1Locked={stage1Locked}
        stage2Locked={stage2Locked}
        isAdmin={isAdmin}
        onClose={() => setSelectedUser(null)}
        matchResultsCache={matchResultsCache}
        koResultsCache={koResultsCache}
        standingsCache={standingsCache}
      />
    )}
    </div>
  );
}

// Stage 1 Picks

// Third place tab — extracted as standalone component to avoid IIFE nesting issues
function ThirdPlaceTeamRow({ row, globalIdx, isAbove, isDraggable, locked, onSwap, onMove, pg, qualified, hasResults, actualFinish }) {
  const meta = TEAM_META[row.team] || { flag: "un", c1: "rgba(100,100,100,0.2)", c2: "rgba(100,100,100,0.1)", c3: "rgba(100,100,100,0.15)" };
  return (
    <div
      draggable={isDraggable && !locked}
      onDragStart={(e) => { e.dataTransfer.setData("team", row.team); e.dataTransfer.setData("pos", isAbove ? "above" : "below"); }}
      onDragOver={isDraggable ? (e) => e.preventDefault() : undefined}
      onDrop={isDraggable ? (e) => {
        e.preventDefault();
        const draggedTeam = e.dataTransfer.getData("team");
        const draggedPos = e.dataTransfer.getData("pos");
        if (draggedTeam === row.team) return;
        if (draggedPos === "below" && isAbove) onSwap(row.team, draggedTeam);
        if (draggedPos === "above" && !isAbove) onSwap(draggedTeam, row.team);
      } : undefined}
      style={{
        display: "grid", gridTemplateColumns: "28px 1fr 48px 56px 56px",
        alignItems: "center", gap: "8px", padding: "8px 14px",
        borderTop: `1px solid ${C.border}`,
        background: hasResults && isAbove
          ? (qualified ? "rgba(29,158,117,0.08)" : "rgba(220,38,38,0.04)")
          : isAbove ? `${C.green}0a` : "#f8fafc",
        cursor: isDraggable && !locked ? "grab" : "default",
        position: "relative", overflow: "hidden", userSelect: "none",
        border: hasResults && isAbove
          ? `1px solid ${qualified ? "rgba(29,158,117,0.3)" : "rgba(220,38,38,0.2)"}`
          : "none",
        borderRadius: hasResults && isAbove ? "6px" : "0",
        marginBottom: hasResults && isAbove ? "2px" : "0",
      }}
    >
      <span style={{ fontSize: "12px", fontWeight: 700, color: isAbove ? C.navy : C.textMuted }}>{globalIdx + 1}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
        <img src={`https://flagcdn.com/${meta.flag}.svg`} alt={row.team}
          style={{ width: "22px", height: "15px", borderRadius: "2px", objectFit: "cover", flexShrink: 0, opacity: isAbove ? 1 : 0.5 }} />
        <span style={{ fontSize: "13px", fontWeight: isAbove ? 600 : 400, color: isAbove ? C.navy : C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {row.team}
        </span>
      </div>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, background: isAbove ? C.navy : "#e2e8f0", color: isAbove ? C.white : C.textMuted, padding: "2px 6px", borderRadius: "4px" }}>
          {row.group}
        </span>
      </div>
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: "15px", fontWeight: 800, color: isAbove ? C.navy : C.textMuted }}>{row.pts}</span>
      </div>
      <div style={{ display: "flex", gap: "4px", alignItems: "center", justifyContent: "center", zIndex: 1, position: "relative" }}>
        {isDraggable && !locked ? (
          <>
            <span style={{ fontSize: "16px", color: C.textMuted, cursor: "grab", lineHeight: 1 }} title="Drag to reorder">⠿</span>
            {isAbove ? (
              <button
                onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onMove(row.team, "down"); }}
                style={{ fontSize: "12px", background: "rgba(220,38,38,0.08)", border: "1px solid #fca5a5", borderRadius: "5px", cursor: "pointer", padding: "2px 6px", color: "#dc2626", lineHeight: 1, touchAction: "manipulation" }}
                title="Move below cutoff"
              >▼</button>
            ) : (
              <button
                onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onMove(row.team, "up"); }}
                style={{ fontSize: "12px", background: "rgba(29,158,117,0.08)", border: "1px solid #6ee7b7", borderRadius: "5px", cursor: "pointer", padding: "2px 6px", color: "#1D9E75", lineHeight: 1, touchAction: "manipulation" }}
                title="Move above cutoff"
              >▲</button>
            )}
          </>
        ) : isAbove ? (
          hasResults
            ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: qualified ? "#1D9E75" : "#dc2626" }}>{qualified ? "✓ +1" : "✗ +0"}</span>
                {actualFinish && actualFinish !== "3rd" && (
                  <span style={{ fontSize: "10px", color: "#1D9E75", fontWeight: 600 }}>finished {actualFinish}</span>
                )}
              </div>
            )
            : <span style={{ fontSize: "11px", color: C.green }}>✓</span>
        ) : hasResults && qualified ? (
          <span style={{ fontSize: "11px", color: C.textMuted, fontStyle: "italic" }}>missed</span>
        ) : null}
      </div>
      {isAbove && (
        <div style={{ position: "absolute", right: "8px", top: 0, bottom: 0, width: "60px", display: "flex", gap: "3px", pointerEvents: "none", alignItems: "stretch" }}>
          <div style={{ flex: 1, background: meta.c1, clipPath: pg }} />
          <div style={{ flex: 1, background: meta.c2, clipPath: pg }} />
          <div style={{ flex: 1, background: meta.c3, clipPath: pg }} />
        </div>
      )}
    </div>
  );
}

function CutoffZone({ cutoffIsTie, spotsLeft, chosenTied, onDrop }) {
  const [over, setOver] = useState(false);
  const spotsRemaining = spotsLeft - chosenTied.length;
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setOver(false);
        const team = e.dataTransfer.getData("team");
        const pos = e.dataTransfer.getData("pos");
        onDrop(team, pos);
      }}
      style={{
        display: "flex", alignItems: "center", gap: "10px", padding: "7px 14px",
        background: over ? `${C.gold}18` : "#f8fafc",
        borderTop: `2px dashed ${over ? C.gold : C.border}`,
        transition: "all 0.12s",
      }}
    >
      <span style={{ fontSize: "10px", fontWeight: 700, color: over ? "#b8860b" : C.textMuted, whiteSpace: "nowrap" }}>
        {cutoffIsTie
          ? `CUTOFF LINE — ${spotsRemaining} spot${spotsRemaining !== 1 ? "s" : ""} above · ${chosenTied.length}/${spotsLeft} filled`
          : "BELOW CUTOFF"}
      </span>
      <div style={{ flex: 1, height: "1px", background: over ? C.gold : C.border }} />
      {over && cutoffIsTie && <span style={{ fontSize: "11px", color: C.gold, fontWeight: 700, whiteSpace: "nowrap" }}>Drop to move</span>}
    </div>
  );
}

function ThirdPlaceTab({ locked, matchPicks, groupPicks, validThirdPicks, thirdPicks, setThirdPicks, thirdSaving, thirdSaved, saveThirdPicks, setActiveTab, setActiveGroup, standings = {}, matchResults = {} }) {
  const pg = "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)";

  // Derive top 8 third-place qualifiers from standings using pts/GD/GF
  // A group's standings are "complete" if first, second, third are all filled
  const allStandings = Object.values(standings);
  const completeStandings = allStandings.filter((s) => s.first_place && s.second_place && s.third_place);

  // Build qualified set directly from group_standings — the source of truth
  // A 3rd-place pick earns +1 if the team advanced to R32 in ANY position (1st, 2nd, or top-8 3rd)
  const r32QualifiedSet = new Set([
    ...allStandings.filter((s) => s.first_place).map((s) => s.first_place),
    ...allStandings.filter((s) => s.second_place).map((s) => s.second_place),
    ...allStandings.filter((s) => s.is_third_place_qualifier && s.third_place).map((s) => s.third_place),
  ].filter(Boolean));

  // Show results once at least one group's standings are fully set
  const hasThirdResults = completeStandings.length > 0;

  const qualifiedThird = r32QualifiedSet;

  const incompleteGroups = Object.keys(GROUPS).filter((g) => {
    if (!groupPicks[g]?.first || !groupPicks[g]?.second) return true;
    const rankings = deriveRankings(calcGroupPoints(g, matchPicks));
    const needsThird = rankings.tiedSecond.length > 2 || rankings.tiedThird.length >= 2;
    return needsThird && !groupPicks[g]?.third;
  });
  if (incompleteGroups.length > 0) {
    return (
      <div style={{ ...styles.card, textAlign: "center", padding: "2.5rem 2rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔒</div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: C.navy, marginBottom: "0.5rem" }}>Complete all group picks first</div>
        <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 0 1.5rem" }}>
          You need 1st and 2nd place selections for all 12 groups before picking the best 3rd-place teams.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
          {incompleteGroups.map((g) => (
            <button key={g} onClick={() => { setActiveTab("matches"); setActiveGroup(g); }} style={{
              padding: "5px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600,
              cursor: "pointer", border: `1px solid ${C.border}`, background: C.white, color: C.red,
            }}>Group {g} ✗</button>
          ))}
        </div>
        <div style={{ marginTop: "1rem", fontSize: "12px", color: C.textMuted }}>Click a group above to jump straight to it.</div>
      </div>
    );
  }

  // Build ranked list of all 12 third-place teams
  const ranked = Object.keys(GROUPS).map((grp) => {
    const sorted = calcGroupPoints(grp, matchPicks);
    const gpEntry = groupPicks[grp] || {};
    const eligible = sorted.filter((t) => t.team !== gpEntry.first && t.team !== gpEntry.second);
    return { group: grp, team: eligible[0]?.team || "", pts: eligible[0]?.pts ?? 0 };
  }).sort((a, b) => b.pts - a.pts);

  const cutoffPts = ranked[7]?.pts ?? 0;
  const ninthPts  = ranked[8]?.pts ?? -1;
  const cutoffIsTie = cutoffPts === ninthPts;
  const clearTop8 = ranked.filter((r) => r.pts > cutoffPts);
  const tiedAtCutoff = ranked.filter((r) => r.pts === cutoffPts);
  const belowAll = ranked.filter((r) => r.pts < cutoffPts);
  const spotsLeft = 8 - clearTop8.length;
  const chosenTied = validThirdPicks.filter((t) => tiedAtCutoff.some((r) => r.team === t));
  const unchosenTied = tiedAtCutoff.filter((r) => !chosenTied.includes(r.team));

  function promoteTeam(team) {
    if (locked || !tiedAtCutoff.some((r) => r.team === team)) return;
    const newChosen = chosenTied.length < spotsLeft
      ? [...chosenTied, team]
      : [...chosenTied.slice(0, -1), team];
    const newPicks = [...clearTop8.map((r) => r.team), ...newChosen];
    setThirdPicks(newPicks);
    if (newPicks.length === 8) saveThirdPicks(newPicks);
  }

  function demoteTeam(team) {
    if (locked) return;
    const newPicks = validThirdPicks.filter((t) => t !== team);
    setThirdPicks(newPicks);
  }

  function swapTeams(fromTeam, toTeam) {
    if (locked) return;
    const newChosen = chosenTied.map((t) => t === fromTeam ? toTeam : t);
    const newPicks = [...clearTop8.map((r) => r.team), ...newChosen];
    setThirdPicks(newPicks);
    if (newPicks.length === 8) saveThirdPicks(newPicks);
  }





  const aboveRows = [
    ...clearTop8.map((r) => ({ ...r, draggable: false })),
    ...tiedAtCutoff.filter((r) => chosenTied.includes(r.team)).map((r) => ({ ...r, draggable: true })),
  ];
  const belowRows = [
    ...unchosenTied.map((r) => ({ ...r, draggable: true })),
    ...belowAll.map((r) => ({ ...r, draggable: false })),
  ];

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>
        Best 3rd-Place Teams — Ranked by Points
        {thirdSaving && <span style={{ fontSize: "12px", color: C.textMuted, fontWeight: 400, marginLeft: "8px" }}>Saving...</span>}
        {thirdSaved && <span style={{ fontSize: "12px", color: C.green, fontWeight: 600, marginLeft: "8px" }}>✓ Saved</span>}
      </div>
      <p style={{ fontSize: "13px", color: C.textMuted, marginTop: 0, marginBottom: "1.25rem" }}>
        {cutoffIsTie
          ? `${tiedAtCutoff.length} teams are tied at ${cutoffPts} pts — ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} available. Drag ⠿ teams across the cutoff line to pick who you think advances.`
          : "Top 8 auto-selected from your match picks. No action needed."}
      </p>

      <div style={{ border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden", marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 48px 56px 32px", background: C.navy, color: C.white, padding: "7px 14px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", gap: "8px" }}>
          <span>#</span><span>Team</span>
          <span style={{ textAlign: "center" }}>Grp</span>
          <span style={{ textAlign: "center" }}>Pts</span>
          <span />
        </div>
        {aboveRows.map((row, idx) => (
          <ThirdPlaceTeamRow key={row.team} row={row} globalIdx={idx} isAbove={true} isDraggable={row.draggable} locked={locked} onSwap={swapTeams} pg={pg}
            qualified={qualifiedThird.has(row.team)} hasResults={hasThirdResults}
            actualFinish={(() => {
              const s = allStandings.find((st) => st.third_place === row.team || st.first_place === row.team || st.second_place === row.team);
              if (!s) return null;
              if (s.first_place === row.team) return "1st";
              if (s.second_place === row.team) return "2nd";
              if (s.third_place === row.team) return "3rd";
              return null;
            })()}
            onMove={(team, dir) => {
              if (dir === "down") demoteTeam(team);
            }}
          />
        ))}
        <CutoffZone
          cutoffIsTie={cutoffIsTie}
          spotsLeft={spotsLeft}
          chosenTied={chosenTied}
          onDrop={(team, pos) => {
            if (pos === "below") promoteTeam(team);
            else if (pos === "above") demoteTeam(team);
          }}
        />
        {belowRows.map((row, idx) => (
          <ThirdPlaceTeamRow key={row.team} row={row} globalIdx={aboveRows.length + idx} isAbove={false} isDraggable={row.draggable} locked={locked} onSwap={swapTeams} pg={pg}
            qualified={qualifiedThird.has(row.team)} hasResults={hasThirdResults}
            onMove={(team, dir) => {
              if (dir === "up") promoteTeam(team);
            }}
          />
        ))}
      </div>

      {cutoffIsTie && !locked && (
        <div style={{ fontSize: "12px", color: C.textMuted, marginBottom: "0.75rem" }}>
          Use ▲/▼ buttons or drag ⠿ to move teams across the cutoff line.
        </div>
      )}

      <div style={{ fontSize: "12px", fontWeight: 500, color: validThirdPicks.length === 8 ? C.green : C.textMuted }}>
        {validThirdPicks.length === 8
          ? (thirdSaving ? "Saving..." : thirdSaved ? "✓ Picks saved automatically" : "✓ Picks saved")
          : cutoffIsTie
            ? `${spotsLeft - chosenTied.length} more tie-break pick${spotsLeft - chosenTied.length !== 1 ? "s" : ""} needed`
            : "Top 8 auto-selected — picks save automatically"}
      </div>
    </div>
  );
}

function Stage1Picks({ userId, locked, matchResultsCache = [], standingsCache = [] }) {
  const [activeGroup, setActiveGroup] = useState("A");
  const [matchPicks, setMatchPicks] = useState({});
  const [groupPicks, setGroupPicks] = useState({});
  const [thirdPicks, setThirdPicks] = useState([]);
  const [standings, setStandings] = useState({});
  const [matchResults, setMatchResults] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [thirdSaving, setThirdSaving] = useState(false);
  const [thirdSaved, setThirdSaved] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("matches");
  const [matchViewMode, setMatchViewMode] = useState("date");
  const prevAutoKey = useRef("");

  useEffect(() => {
    async function load() {
      const [{ data: mp },{ data: gp },{ data: tp }] = await Promise.all([
        supabase.from("stage1_match_picks").select("match_id,pick").eq("user_id", userId),
        supabase.from("stage1_group_picks").select("group_code,first_place,second_place,third_place").eq("user_id", userId),
        supabase.from("stage1_third_place_picks").select("teams").eq("user_id", userId).maybeSingle(),
      ]);
      const mpMap = {};
      (mp||[]).forEach((p) => (mpMap[p.match_id] = p.pick));
      setMatchPicks(mpMap);
      const gpMap = {};
      (gp||[]).forEach((p) => (gpMap[p.group_code] = { first: p.first_place, second: p.second_place, third: p.third_place || "" }));
      setGroupPicks(gpMap);
      setThirdPicks(tp?.teams || []);
      // Use cached match results and standings from App level
      const mrMap = {};
      matchResultsCache.filter((r) => r.stage === "group").forEach((r) => (mrMap[r.match_id] = r.result));
      setMatchResults(mrMap);
      const stMap = {};
      standingsCache.forEach((s) => (stMap[s.group_code] = s));
      setStandings(stMap);
      setLoading(false);
    }
    load();
  }, [userId]);


  async function pickMatch(matchId, pick) {
    if (locked) return;
    const match = ALL_GROUP_MATCHES.find((m) => m.matchId === matchId);
    if (!match) return;
    const newMatchPicks = { ...matchPicks, [matchId]: pick };
    setMatchPicks(newMatchPicks);
    setSaveStatus((prev) => ({ ...prev, [matchId]: "saving" }));
    try {
      const { error: matchErr } = await supabase.from("stage1_match_picks").upsert({
        user_id: userId, match_id: matchId,
        group_code: match.group, team1: match.team1, team2: match.team2, pick,
      }, { onConflict: "user_id,match_id" });
      if (matchErr) throw matchErr;
      setSaveStatus((prev) => ({ ...prev, [matchId]: "saved" }));
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, [matchId]: null })), 2000);
      const sorted = calcGroupPoints(match.group, newMatchPicks);
      const { first, second, tiedFirst, tiedSecond } = deriveRankings(sorted);
      const current = groupPicks[match.group] || {};
      if (tiedFirst.length === 0 && tiedSecond.length === 0 && first && second) {
        const newGp = { first, second };
        setGroupPicks((prev) => ({ ...prev, [match.group]: newGp }));
        const gpKey = `gp_${match.group}`;
        setSaveStatus((prev) => ({ ...prev, [gpKey]: "saving" }));
        const existingThird = groupPicks[match.group]?.third || null;
        const { error: gpErr } = await supabase.from("stage1_group_picks").upsert({
          user_id: userId, group_code: match.group,
          first_place: first, second_place: second, third_place: existingThird,
        }, { onConflict: "user_id,group_code" });
        if (!gpErr) {
          setSaveStatus((prev) => ({ ...prev, [gpKey]: "saved" }));
          setTimeout(() => setSaveStatus((prev) => ({ ...prev, [gpKey]: null })), 2000);
        }
      } else {
        const newFirst = tiedFirst.length > 0 ? "" : (first || current.first);
        const newSecond = tiedSecond.length > 0 ? "" : (second || current.second);
        setGroupPicks((prev) => ({ ...prev, [match.group]: { first: newFirst || "", second: newSecond || "" } }));
      }
    } catch(err) {
      setSaveStatus((prev) => ({ ...prev, [matchId]: "error" }));
    }
  }

  async function saveGroupStanding(group, first, second, third = "") {
    if (locked || !first || !second) return;
    setGroupPicks((prev) => ({ ...prev, [group]: { first, second, third } }));
    const key = `gp_${group}`;
    setSaveStatus((prev) => ({ ...prev, [key]: "saving" }));
    try {
      const { error: sgsErr } = await supabase.from("stage1_group_picks").upsert({
        user_id: userId, group_code: group,
        first_place: first, second_place: second, third_place: third || null,
      }, { onConflict: "user_id,group_code" });
      if (sgsErr) throw sgsErr;
      setSaveStatus((prev) => ({ ...prev, [key]: "saved" }));
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, [key]: null })), 2000);
    } catch (err) {
      console.error("saveGroupStanding error:", err);
      setSaveStatus((prev) => ({ ...prev, [key]: "error" }));
    }
  }

  async function saveThirdPicks(picks) {
    setThirdSaving(true); setThirdSaved(false);
    try {
      await supabase.from("stage1_third_place_picks").upsert(
        { user_id: userId, teams: picks }, { onConflict: "user_id" }
      );
      setThirdSaved(true);
      setTimeout(() => setThirdSaved(false), 3000);
    } catch { setMsg({ type: "error", text: "Error saving picks." }); }
    finally { setThirdSaving(false); }
  }

  // Auto-save clear top-8 when no tie at cutoff
  useEffect(() => {
    if (loading || locked) return;
    const ranked = Object.keys(GROUPS).map((grp) => {
      const sorted = calcGroupPoints(grp, matchPicks);
      const gpEntry = groupPicks[grp] || {};
      const eligible = sorted.filter((t) => t.team !== gpEntry.first && t.team !== gpEntry.second);
      return { group: grp, team: eligible[0]?.team || "", pts: eligible[0]?.pts ?? 0 };
    }).sort((a, b) => b.pts - a.pts);
    const allDone = Object.keys(GROUPS).every((g) => groupPicks[g]?.first && groupPicks[g]?.second);
    if (!allDone) return;
    const c8 = ranked[7]?.pts ?? 0;
    const c9 = ranked[8]?.pts ?? -1;
    if (c8 === c9) return;
    const top8 = ranked.slice(0, 8).map((r) => r.team);
    const key = top8.slice().sort().join(",");
    if (key === prevAutoKey.current) return;
    prevAutoKey.current = key;
    if (key === thirdPicks.slice().sort().join(",")) return;
    setThirdPicks(top8);
    saveThirdPicks(top8);
  }, [groupPicks, matchPicks, loading, locked]);

  if (loading) return <Spinner />;

  const groupMatches = ALL_GROUP_MATCHES.filter((m) => m.group === activeGroup);
  const gp = groupPicks[activeGroup] || {};
  const sortedPts = calcGroupPoints(activeGroup, matchPicks);
  const { first: autoFirst, second: autoSecond, tiedFirst, tiedSecond, tiedThird } = deriveRankings(sortedPts);
  const hasTiedFirst = tiedFirst.length >= 2;
  const hasTiedSecond = tiedSecond.length >= 2;
  const hasTiedThird = tiedThird.length >= 2;
  const filledMatches = Object.keys(matchPicks).length;
  const filledGroups = Object.values(groupPicks).filter((g) => g.first && g.second).length;
  const ineligibleForThird = new Set();
  Object.entries(groupPicks).forEach(([grp, picks]) => {
    const sorted = calcGroupPoints(grp, matchPicks);
    const fourthTeam = sorted[sorted.length - 1]?.team;
    if (picks.first) ineligibleForThird.add(picks.first);
    if (picks.second) ineligibleForThird.add(picks.second);
    if (fourthTeam && fourthTeam !== picks.first && fourthTeam !== picks.second) ineligibleForThird.add(fourthTeam);
  });
  const validThirdPicks = thirdPicks.filter((t) => !ineligibleForThird.has(t));

  // Ranked 3rd-place table
  const thirdPlaceRanked = Object.keys(GROUPS).map((grp) => {
    const sorted = calcGroupPoints(grp, matchPicks);
    const gpEntry = groupPicks[grp] || {};
    const eligible = sorted.filter((t) => t.team !== gpEntry.first && t.team !== gpEntry.second);
    return { group: grp, team: eligible[0]?.team || "", pts: eligible[0]?.pts ?? 0 };
  }).sort((a, b) => b.pts - a.pts);

  const allGroupsPicked = Object.keys(GROUPS).every((g) => {
    if (!groupPicks[g]?.first || !groupPicks[g]?.second) return false;
    const rankings = deriveRankings(calcGroupPoints(g, matchPicks));
    const needsThird = rankings.tiedSecond.length > 2 || rankings.tiedThird.length >= 2;
    return !needsThird || !!groupPicks[g]?.third;
  });
  const cutoffPts8 = thirdPlaceRanked[7]?.pts ?? 0;
  const ninthPts8 = thirdPlaceRanked[8]?.pts ?? -1;
  const hasTieAtCutoff = allGroupsPicked && cutoffPts8 === ninthPts8;

  const medalColor = (i) => i===0?C.gold:i===1?"#94a3b8":i===2?"#cd7f32":C.textMuted;
  const rankLabel = (i) => i===0?"1st":i===1?"2nd":i===2?"3rd":"4th";
  const anySaving = Object.values(saveStatus).some((s) => s==="saving");
  const anyError = Object.values(saveStatus).some((s) => s==="error");

  // ── RENDER ──────────────────────────────────────────────
  return (
    <div style={styles.container}>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "1rem" }}>
        {[["MATCHES PICKED",`${filledMatches}`,`/${ALL_GROUP_MATCHES.length}`],["GROUPS FINISHED",`${filledGroups}`,"/12"],["3RD PLACE PICKS",`${validThirdPicks.length}`,"/8"]].map(([label,val,denom]) => (
          <div key={label} style={{ ...styles.card, background: C.navy, color: C.white, marginBottom: 0, textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: C.gold, fontWeight: 600, marginBottom: "4px" }}>{label}</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{val}<span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.5)" }}>{denom}</span></div>
          </div>
        ))}
      </div>

      <Alert type={msg.type} msg={msg.text} />

      <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
        <button style={styles.tab(activeTab==="matches")} onClick={() => setActiveTab("matches")}>Group Picks</button>
        <button style={styles.tab(activeTab==="third")} onClick={() => setActiveTab("third")}>Best 3rd Place (8)</button>
      </div>

      {activeTab === "matches" && (
        <>
          {/* View mode toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "1rem" }}>
            <button onClick={() => setMatchViewMode("date")} style={{
              padding: "5px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              border: matchViewMode === "date" ? `2px solid ${C.navy}` : `1px solid ${C.border}`,
              background: matchViewMode === "date" ? C.navy : C.white,
              color: matchViewMode === "date" ? C.white : C.text,
            }}>📅 By Date</button>
            <button onClick={() => setMatchViewMode("group")} style={{
              padding: "5px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              border: matchViewMode === "group" ? `2px solid ${C.navy}` : `1px solid ${C.border}`,
              background: matchViewMode === "group" ? C.navy : C.white,
              color: matchViewMode === "group" ? C.white : C.text,
            }}>By Group</button>
          </div>

          {/* ── DATE VIEW ── */}
          {matchViewMode === "date" && (() => {
            const today = new Date();
            const todayStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" }).replace(/\s+/, " ");
            const byDate = {};
            ALL_GROUP_MATCHES.forEach((m) => {
              if (!byDate[m.date]) byDate[m.date] = [];
              byDate[m.date].push(m);
            });
            const dates = Object.keys(byDate);
            const hasTodayDate = dates.includes(todayStr);
            return (
              <div>
                {/* Scrollable match list — auto-scrolls to today on mount */}
                <div
                  id="picks-date-scroll"
                  style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "4px" }}
                >
                  {dates.map((date) => {
                    const isToday = date === todayStr;
                    const matches = byDate[date];
                    const pickedCount = matches.filter((m) => matchPicks[m.matchId]).length;
                    return (
                      <div key={date} id={`picks-date-${date.replace(" ", "-")}`} style={{ marginBottom: "1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                          <span style={{
                            fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
                            padding: isToday ? "3px 10px" : "2px 8px",
                            borderRadius: "6px",
                            background: isToday ? C.navy : "transparent",
                            color: isToday ? C.gold : C.navy,
                            border: isToday ? `1px solid ${C.navy}` : `1px solid ${C.border}`,
                          }}>
                            {isToday ? `📅 Today — ${date}` : date}
                          </span>
                          <span style={{ fontSize: "11px", color: pickedCount === matches.length ? C.green : C.textMuted, fontWeight: pickedCount === matches.length ? 700 : 400 }}>
                            {pickedCount}/{matches.length} picked{pickedCount === matches.length ? " ✓" : ""}
                          </span>
                          <div style={{ flex: 1, height: "1px", background: C.border }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {matches.map((m) => {
                            const userPick = matchPicks[m.matchId];
                            const actualResult = matchResults[m.matchId];
                            const hasResult = !!actualResult;
                            const t1State = !hasResult ? null : userPick === "team1" ? (actualResult === "team1" ? "correct" : "wrong") : actualResult === "team1" ? "winner" : null;
                            const t2State = !hasResult ? null : userPick === "team2" ? (actualResult === "team2" ? "correct" : "wrong") : actualResult === "team2" ? "winner" : null;
                            const drawCorrect  = hasResult && userPick === "draw" && actualResult === "draw";
                            const drawWrong    = hasResult && userPick === "draw" && actualResult !== "draw";
                            const drawIsResult = hasResult && actualResult === "draw" && userPick !== "draw";
                            const pts = hasResult && userPick === actualResult ? "+1" : null;
                            return (
                              <div key={m.matchId} style={{ ...styles.card, marginBottom: 0, padding: "10px 14px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                                  <span style={{ fontSize: "10px", fontWeight: 700, color: C.white, background: C.navy, borderRadius: "4px", padding: "1px 7px", letterSpacing: "0.04em" }}>GROUP {m.group}</span>
                                  {!hasResult && <span style={{ fontSize: "11px", color: C.textMuted }}>{m.time.replace(" ET", "")}</span>}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <TeamBtn team={m.team1} selected={!hasResult && userPick === "team1"} resultState={t1State} onClick={() => pickMatch(m.matchId, "team1")} />
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", flexShrink: 0 }}>
                                    <button
                                      style={{
                                        ...styles.drawBtn(!hasResult && userPick === "draw"),
                                        ...((drawCorrect || drawIsResult) ? { borderColor: "#1D9E75", color: "#1D9E75", fontWeight: 700, background: "rgba(29,158,117,0.06)", border: "2px solid #1D9E75" } : {}),
                                        ...(drawWrong ? { borderColor: "#fca5a5", background: "rgba(220,38,38,0.04)", textDecoration: "line-through", color: C.textMuted, border: "2px solid #fca5a5" } : {}),
                                      }}
                                      onClick={() => !hasResult && pickMatch(m.matchId, "draw")}
                                    >
                                      {(drawCorrect || drawIsResult) ? "Draw ✓" : "Draw"}
                                    </button>
                                    {hasResult
                                      ? <span style={{ fontSize: "10px", fontWeight: 700, color: pts ? "#1D9E75" : C.textMuted }}>{pts ? `✓ ${pts}` : "✗ +0"}</span>
                                      : <span style={{ fontSize: "10px", color: C.textMuted }}>{m.time.replace(" ET", "")}</span>
                                    }
                                  </div>
                                  <TeamBtn team={m.team2} selected={!hasResult && userPick === "team2"} resultState={t2State} onClick={() => pickMatch(m.matchId, "team2")} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Auto-scroll to today on mount */}
                {hasTodayDate && (
                  <AutoScrollToToday containerId="picks-date-scroll" targetId={`picks-date-${todayStr.replace(" ", "-")}`} />
                )}
              </div>
            );
          })()}

          {/* ── GROUP VIEW ── */}
          {matchViewMode === "group" && (
            <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "1.25rem" }}>
            {Object.keys(GROUPS).map((g) => {
              const filled = ALL_GROUP_MATCHES.filter((m) => m.group===g && matchPicks[m.matchId]).length;
              const gRankings = deriveRankings(calcGroupPoints(g, matchPicks));
              const needsThird = gRankings.tiedSecond.length > 2 || gRankings.tiedThird.length >= 2;
              const done = filled===6 && groupPicks[g]?.first && groupPicks[g]?.second && (!needsThird || groupPicks[g]?.third);
              return (
                <button key={g} onClick={() => setActiveGroup(g)} style={{
                  padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  border: activeGroup===g?`2px solid ${C.gold}`:`1px solid ${C.border}`,
                  background: activeGroup===g?C.navy:done?`${C.green}18`:C.white,
                  color: activeGroup===g?C.white:done?C.green:C.text,
                }}>{g}{done?" ✓":""}</button>
              );
            })}
            </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", alignItems: "start" }}>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Group {activeGroup} — Match Results</div>
              {groupMatches.map((m, idx) => {
                const prevMatch = groupMatches[idx - 1];
                const showDateHeader = idx === 0 || prevMatch?.date !== m.date;
                return (
                  <div key={m.matchId}>
                    {showDateHeader && (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0 4px", marginTop: idx > 0 ? "4px" : 0 }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.date}</span>
                        <div style={{ flex: 1, height: "1px", background: C.border }} />
                      </div>
                    )}
                    {(() => {
                      const userPick = matchPicks[m.matchId];
                      const actualResult = matchResults[m.matchId];
                      const hasResult = !!actualResult;
                      const t1State = !hasResult ? null
                        : userPick === "team1" ? (actualResult === "team1" ? "correct" : "wrong")
                        : actualResult === "team1" ? "winner" : null;
                      const t2State = !hasResult ? null
                        : userPick === "team2" ? (actualResult === "team2" ? "correct" : "wrong")
                        : actualResult === "team2" ? "winner" : null;
                      const drawCorrect   = hasResult && userPick === "draw" && actualResult === "draw";
                      const drawWrong     = hasResult && userPick === "draw" && actualResult !== "draw";
                      const drawIsResult  = hasResult && actualResult === "draw" && userPick !== "draw";
                      const pts = hasResult && userPick === actualResult ? "+1" : null;
                      return (
                        <div style={{ paddingTop: "6px", paddingBottom: "6px", borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <TeamBtn team={m.team1} selected={!hasResult && userPick==="team1"} resultState={t1State} onClick={() => pickMatch(m.matchId,"team1")} />
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", flexShrink: 0 }}>
                              <button
                                style={{
                                  ...styles.drawBtn(!hasResult && userPick==="draw"),
                                  ...((drawCorrect || drawIsResult) ? { borderColor: "#1D9E75", color: "#1D9E75", fontWeight: 700, background: "rgba(29,158,117,0.06)", border: "2px solid #1D9E75" } : {}),
                                  ...(drawWrong ? { borderColor: "#fca5a5", background: "rgba(220,38,38,0.04)", textDecoration: "line-through", color: C.textMuted, border: "2px solid #fca5a5" } : {}),
                                }}
                                onClick={() => !hasResult && pickMatch(m.matchId,"draw")}
                              >
                                {(drawCorrect || drawIsResult) ? "Draw ✓" : "Draw"}
                              </button>
                              {hasResult
                                ? <span style={{ fontSize: "10px", fontWeight: 700, color: pts ? "#1D9E75" : C.textMuted }}>{pts ? `✓ ${pts}` : "✗ +0"}</span>
                                : <span style={{ fontSize: "10px", color: C.textMuted }}>{m.time.replace(" ET", "")}</span>
                              }
                            </div>
                            <TeamBtn team={m.team2} selected={!hasResult && userPick==="team2"} resultState={t2State} onClick={() => pickMatch(m.matchId,"team2")} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>

            <div style={{ ...styles.card, marginBottom: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: C.navy, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Standings</div>
              {sortedPts.map(({ team, pts }, i) => {
                const isTied = tiedFirst.includes(team) || tiedSecond.includes(team);
                return (
                  <div key={team} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i<3?`1px solid ${C.border}`:"none", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: medalColor(i), minWidth: "22px" }}>{rankLabel(i)}</span>
                      <span style={{ fontSize: "13px", fontWeight: isTied?700:400 }}>{team}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {isTied&&<span style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 700 }}>TIE</span>}
                      <span style={{ fontSize: "13px", fontWeight: 700, background: pts>0?C.navy:C.border, color: pts>0?C.white:C.textMuted, borderRadius: "4px", padding: "1px 7px", minWidth: "24px", textAlign: "center" }}>{pts}</span>
                    </div>
                  </div>
                );
              })}
              <div style={{ fontSize: "10px", color: C.textMuted, marginTop: "10px" }}>W=3 pts · D=1 pt · L=0</div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Group {activeGroup} — Final Standings</div>
            {groupMatches.filter((m) => matchPicks[m.matchId]).length < groupMatches.length ? (
              <div style={{ fontSize: "13px", color: C.textMuted, fontStyle: "italic" }}>
                Pick all {groupMatches.length} matches above to unlock standings — {groupMatches.length - groupMatches.filter((m) => matchPicks[m.matchId]).length} remaining.
              </div>
            ) : !hasTiedFirst && !hasTiedSecond && gp.first && gp.second ? (
              <>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "10px", flex: 1, flexWrap: "wrap" }}>
                    {[["1st Place",gp.first],["2nd Place",gp.second]].map(([label,val]) => (
                      <div key={label} style={{ flex: 1, minWidth: "140px", background: `${C.navy}0d`, borderRadius: "8px", padding: "10px 14px", border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "3px", fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: C.navy }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: "12px", color: C.green, fontWeight: 600 }}>
                    {saveStatus[`gp_${activeGroup}`]==="saving"?"Saving...":"✓ Auto-set from results"}
                  </div>
                </div>
                {hasTiedThird && (
                  <div style={{ marginTop: "1rem" }}>
                    <div style={{ ...styles.alert("warning"), marginBottom: "8px" }}>
                      {tiedThird.join(", ")} are tied for 3rd. Pick who you think finishes 3rd.
                    </div>
                    <label style={styles.label}>3rd Place — tiebreaker pick</label>
                    <select style={styles.select} value={gp.third||""} onChange={(e) => {
                      if (!locked && e.target.value) saveGroupStanding(activeGroup, gp.first, gp.second, e.target.value);
                    }}>
                      <option value="">-- Pick 3rd --</option>
                      {tiedThird.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}
              </>
            ) : (
              <div>
                {hasTiedFirst && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ ...styles.alert("warning"), marginBottom: "8px" }}>
                      {tiedFirst.join(" and ")} are tied on points. Pick who you think wins the tiebreaker.
                    </div>
                    <label style={styles.label}>1st Place — tiebreaker pick</label>
                    <select style={styles.select} value={gp.first||""} onChange={(e) => {
                      if (!locked && e.target.value) {
                        const picked1st = e.target.value;
                        const remaining = tiedFirst.filter((t) => t !== picked1st);
                        setGroupPicks((p) => ({ ...p, [activeGroup]: { first: picked1st, second: remaining.length === 1 ? remaining[0] : (gp.second || "") } }));
                        if (remaining.length === 1) saveGroupStanding(activeGroup, picked1st, remaining[0]);
                      }
                    }}>
                      <option value="">-- Pick 1st --</option>
                      {tiedFirst.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {gp.first && (() => {
                      const remaining = tiedFirst.filter((t) => t !== gp.first);
                      return (
                        <div style={{ marginTop: "8px" }}>
                          {remaining.length === 1 ? (
                            <>
                              <label style={styles.label}>2nd Place (auto)</label>
                              <div style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, fontSize: "13px", background: "#f8f8f8" }}>{remaining[0]}</div>
                            </>
                          ) : (
                            <>
                              <label style={styles.label}>2nd Place — tiebreaker pick</label>
                              <select style={styles.select} value={gp.second||""} onChange={(e) => { if (!locked && e.target.value) saveGroupStanding(activeGroup, gp.first, e.target.value); }}>
                                <option value="">-- Pick 2nd --</option>
                                {remaining.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
                {!hasTiedFirst && hasTiedSecond && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ padding: "8px 14px", borderRadius: "8px", background: `${C.navy}0d`, border: `1px solid ${C.border}`, fontSize: "13px", marginBottom: "10px" }}>
                      <span style={{ fontSize: "11px", color: C.textMuted, fontWeight: 600 }}>1ST PLACE</span>
                      <span style={{ marginLeft: "10px", fontWeight: 700 }}>{autoFirst}</span>
                    </div>
                    <div style={{ ...styles.alert("warning"), marginBottom: "8px" }}>
                      {tiedSecond.length === 2
                        ? `${tiedSecond.join(" and ")} are tied for 2nd. Pick who finishes 2nd — 3rd will be set automatically.`
                        : `${tiedSecond.join(", ")} are tied for 2nd. Pick who finishes 2nd and 3rd.`}
                    </div>
                    <label style={styles.label}>2nd Place — tiebreaker pick</label>
                    <select style={styles.select} value={gp.second||""} onChange={(e) => {
                      if (!locked && e.target.value) {
                        const picked2nd = e.target.value;
                        if (tiedSecond.length === 2) {
                          // Only 2 tied — 3rd is automatic by elimination
                          const auto3rd = tiedSecond.find((t) => t !== picked2nd) || "";
                          saveGroupStanding(activeGroup, autoFirst, picked2nd, auto3rd);
                        } else {
                          // 3+ tied — clear 3rd if it conflicts, show manual picker
                          const newThird = gp.third === picked2nd ? "" : (gp.third || "");
                          setGroupPicks((p) => ({ ...p, [activeGroup]: { ...p[activeGroup], second: picked2nd, third: newThird } }));
                          if (newThird) saveGroupStanding(activeGroup, autoFirst, picked2nd, newThird);
                        }
                      }
                    }}>
                      <option value="">-- Pick 2nd --</option>
                      {tiedSecond.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {/* Only show 3rd picker when 3+ teams are tied for 2nd */}
                    {tiedSecond.length > 2 && gp.second && (
                      <div style={{ marginTop: "10px" }}>
                        <label style={styles.label}>3rd Place — tiebreaker pick</label>
                        <select style={styles.select} value={gp.third||""} onChange={(e) => {
                          if (!locked && e.target.value) saveGroupStanding(activeGroup, autoFirst, gp.second, e.target.value);
                        }}>
                          <option value="">-- Pick 3rd --</option>
                          {tiedSecond.filter((t) => t !== gp.second).map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    )}
                    {/* Show auto-set 3rd when only 2 teams tied */}
                    {tiedSecond.length === 2 && gp.second && (
                      <div style={{ marginTop: "8px" }}>
                        <label style={styles.label}>3rd Place (auto)</label>
                        <div style={{ padding: "8px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, fontSize: "13px", background: "#f8f8f8" }}>
                          {tiedSecond.find((t) => t !== gp.second)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {!hasTiedFirst && !hasTiedSecond && (
                  <div style={{ fontSize: "13px", color: C.textMuted }}>Pick all 6 matches above to auto-fill standings.</div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: "0.25rem", fontSize: "12px", fontWeight: 500, padding: "0 2px", color: anyError?C.red:C.green }}>
            {anyError ? "Save error — check your connection" : anySaving ? "Saving..." : locked ? "Picks are locked" : "Picks save automatically as you click — safe to navigate away"}
          </div>
          </div>
          )}
        </>
      )}

      {activeTab === "third" && <ThirdPlaceTab
        locked={locked}
        matchPicks={matchPicks}
        groupPicks={groupPicks}
        validThirdPicks={validThirdPicks}
        thirdPicks={thirdPicks}
        setThirdPicks={setThirdPicks}
        thirdSaving={thirdSaving}
        thirdSaved={thirdSaved}
        saveThirdPicks={saveThirdPicks}
        setActiveTab={setActiveTab}
        setActiveGroup={setActiveGroup}
        standings={standings}
        matchResults={matchResults}
      />}
    </div>
  );
}

// Fixed bracket progression — which two R32 slots feed each R16 slot, etc.
const BRACKET_FEED = {
  R16_1: ["R32_1",  "R32_3"],   // M90: W73 vs W75
  R16_2: ["R32_2",  "R32_5"],   // M89: W74 vs W77
  R16_3: ["R32_4",  "R32_6"],   // M91: W76 vs W78
  R16_4: ["R32_7",  "R32_8"],   // M92: W79 vs W80
  R16_5: ["R32_11", "R32_12"],  // M93: W83 vs W84
  R16_6: ["R32_9",  "R32_10"],  // M94: W81 vs W82
  R16_7: ["R32_14", "R32_16"],  // M95: W86 vs W88
  R16_8: ["R32_13", "R32_15"],  // M96: W85 vs W87
  QF_1:  ["R16_2",  "R16_1"],   // M97: W89 vs W90
  QF_2:  ["R16_5",  "R16_6"],   // M98: W93 vs W94
  QF_3:  ["R16_3",  "R16_4"],   // M99: W91 vs W92
  QF_4:  ["R16_7",  "R16_8"],   // M100: W95 vs W96
  SF_1:  ["QF_1",   "QF_2"],
  SF_2:  ["QF_3",   "QF_4"],
  F_1:   ["SF_1",   "SF_2"],
};

// Returns true if a team has already been eliminated before reaching slotId.
// Walks the bracket backwards — for each ancestor slot, checks if that match
// has a result and the team lost.
function isTeamEliminated(team, slotId, koResults) {
  if (!team || !slotId) return false;
  function checkSlot(sid) {
    const feed = BRACKET_FEED[sid];
    if (!feed) return false; // R32 — no ancestors to check
    for (const parentSlotId of feed) {
      const r = koResults[parentSlotId];
      if (r?.result && r.team1 && r.team2) {
        const loser = r.result === "team1" ? r.team2 : r.team1;
        if (loser === team) return true; // team lost in this ancestor match
      }
      if (checkSlot(parentSlotId)) return true; // recurse further back
    }
    return false;
  }
  return checkSlot(slotId);
}

function Stage2Picks({ userId, locked, stage2Open, knockoutBracket, koResultsCache = [] }) {
  const [picks, setPicks] = useState({});
  const [koResults, setKoResults] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: s2data } = await supabase.from("stage2_picks").select("slot_id,picked_team").eq("user_id", userId);
      const map = {};
      (s2data||[]).forEach((p) => (map[p.slot_id] = p.picked_team));
      setPicks(map);
      // Use cached ko results from App level
      const rmap = {};
      koResultsCache.forEach((r) => (rmap[r.match_id] = { result: r.result, team1: r.team1, team2: r.team2 }));
      setKoResults(rmap);
      setLoading(false);
    }
    load();
  }, [userId]);


  // Derive which teams are available for each slot based on picks made so far
  function getSlotTeams(slotId) {
    const feedSlots = BRACKET_FEED[slotId];
    if (!feedSlots) {
      // R32 — use the real teams from knockoutBracket
      const slot = knockoutBracket.find((s) => s.slotId === slotId);
      const t1 = slot?.team1 || "";
      const t2 = slot?.team2 || "";
      return [t1, t2];
    }
    // Later rounds — teams are whoever was picked to win the feeding slots
    const [feedA, feedB] = feedSlots;
    const teamA = picks[feedA] || null;
    const teamB = picks[feedB] || null;
    return [teamA, teamB];
  }

  // When a pick is made, clear any downstream picks that are now invalid
  function makePick(slotId, team) {
    if (locked) return;
    const sm = SLOT_META[slotId];
    if (sm?.kickoff && Date.now() >= sm.kickoff) return;
    setPicks((prev) => {
      const next = { ...prev, [slotId]: team };
      function clearDownstream(sid) {
        for (const [downSlot, feedSlots] of Object.entries(BRACKET_FEED)) {
          if (feedSlots.includes(sid)) {
            const [t1, t2] = getTeamsFromPicks(downSlot, next);
            if (next[downSlot] && t1 !== null && t2 !== null &&
                next[downSlot] !== t1 && next[downSlot] !== t2) {
              next[downSlot] = "";
              clearDownstream(downSlot);
            }
          }
        }
      }
      function getTeamsFromPicks(slot, picksMap) {
        const feed = BRACKET_FEED[slot];
        if (!feed) {
          const s = knockoutBracket.find((s) => s.slotId === slot);
          return [s?.team1 || null, s?.team2 || null];
        }
        return [picksMap[feed[0]] || null, picksMap[feed[1]] || null];
      }
      clearDownstream(slotId);
      // Auto-save the new pick and clear any invalidated downstream picks
      savePick(slotId, team);
      const cleared = Object.entries(next).filter(([k, v]) => k !== slotId && prev[k] && !v).map(([k]) => k);
      if (cleared.length > 0) {
        supabase.from("stage2_picks").delete().eq("user_id", userId).in("slot_id", cleared);
      }
      return next;
    });
  }

  async function saveAll() {
    if (locked) return;
    setSaving(true); setMsg({ type: "", text: "" });
    try {
      const rows = Object.entries(picks)
        .filter(([, team]) => !!team)
        .map(([slotId, team]) => ({
          user_id: userId, slot_id: slotId,
          round: slotId.replace(/_\d+$/, ""), picked_team: team,
        }));
      if (rows.length === 0) { setMsg({ type: "error", text: "No picks to save." }); return; }
      const { error } = await supabase.from("stage2_picks").upsert(rows, { onConflict: "user_id,slot_id" });
      if (error) { setMsg({ type: "error", text: `Save failed: ${error.message}` }); return; }
      setMsg({ type: "success", text: `${rows.length} knockout picks saved!` });
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    finally { setSaving(false); }
  }

  // Auto-save a single pick immediately when made
  async function savePick(slotId, team) {
    if (locked) return;
    const sm = SLOT_META[slotId];
    if (sm?.kickoff && Date.now() >= sm.kickoff) return;
    const round = slotId.replace(/_\d+$/, "");
    const { error } = await supabase.from("stage2_picks").upsert(
      { user_id: userId, slot_id: slotId, round, picked_team: team },
      { onConflict: "user_id,slot_id" }
    );
    if (error) setMsg({ type: "error", text: `Pick not saved: ${error.message}` });
    else setMsg({ type: "success", text: "Pick saved ✓" });
  }

  if (!stage2Open) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: C.navy, marginBottom: "0.5rem" }}>Knockout Picks Not Yet Open</div>
          <div style={{ color: C.textMuted, fontSize: "14px", maxWidth: "360px", margin: "0 auto" }}>
            Knockout picks will open progressively as group stage results come in. Check back after groups start completing on Jun 25!
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  const filledSlots = knockoutBracket.filter((s) => picks[s.slotId]).length;
  const now = Date.now(); // used for per-slot kickoff lock check

  return (
    <div style={styles.container}>
      {locked && <div style={styles.alert("warning")}>Knockout picks are locked. The knockout rounds have begun!</div>}
      <Alert type={msg.type} msg={msg.text} />
      <div style={{ ...styles.card, background: C.navy, color: C.white, marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "11px", color: C.gold, fontWeight: 600, marginBottom: "4px" }}>PICKS SUBMITTED</div>
        <div style={{ fontSize: "2rem", fontWeight: 800 }}>{filledSlots}<span style={{ fontSize: "1rem", color: "rgba(255,255,255,0.5)" }}>/{knockoutBracket.length}</span></div>
      </div>
      {KNOCKOUT_ROUNDS.map(({ round, label, points }) => {
        const roundSlots = knockoutBracket.filter((s) => s.round === round);
        if (roundSlots.length === 0) return null;
        return (
          <div key={round} style={styles.card}>
            <div style={styles.cardTitle}>{label}<span style={styles.badge(C.navy, `${C.gold}33`)}>+{points} pts each</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {roundSlots.map((slot) => {
                const [t1, t2] = getSlotTeams(slot.slotId);
                const picked = picks[slot.slotId] || "";
                const bothKnown = t1 && t2 && !t1.startsWith("W-") && !t2.startsWith("W-");
                const oneKnown = (t1 && !t1.startsWith("W-")) || (t2 && !t2.startsWith("W-"));
                const roundName = slot.round || slot.slotId.replace(/_\d+$/, "");
                const prevRound = { R16: "R32", QF: "R16", SF: "QF", F: "SF" }[roundName];
                // Per-slot kickoff lock — true if match has started (regardless of global lock)
                const slotMeta = SLOT_META[slot.slotId];
                const slotLocked = locked || (slotMeta?.kickoff ? now >= slotMeta.kickoff : false);
                const kickedOff = slotMeta?.kickoff ? now >= slotMeta.kickoff : false;

                return (
                  <div key={slot.slotId}>
                    {/* Match header: number + date/time/venue + lock status */}
                    {(() => {
                      const meta = SLOT_META[slot.slotId];
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 2px 3px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "10px", color: slotLocked && !locked ? "#dc2626" : C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {slot.label}
                          </span>
                          {meta && (
                            <>
                              <span style={{ fontSize: "10px", color: C.navy, fontWeight: 600 }}>{meta.date}</span>
                              <span style={{ fontSize: "10px", color: C.textMuted }}>{meta.time}</span>
                              <span style={{ fontSize: "10px", color: C.textMuted }}>·</span>
                              <span style={{ fontSize: "10px", color: C.textMuted }}>{meta.venue}</span>
                            </>
                          )}
                          {kickedOff && !locked && (
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "#dc2626", background: "rgba(220,38,38,0.08)", border: "1px solid #fca5a5", borderRadius: "4px", padding: "1px 6px", marginLeft: "2px" }}>
                              🔒 Match started
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    {!bothKnown ? (
                      <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "10px 16px", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "10px" }}>
                        {/* Partial R32 slot — team1 known, team2 TBD: allow speculative pick */}
                        {slot.round === "R32" && ((t1 && !t1.startsWith("W-") && !t2) || (t2 && !t2.startsWith("W-") && !t1)) ? (
                          // One team known, other TBD — show known team as pickable, TBD as placeholder
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                            {(() => {
                              const meta = SLOT_META[slot.slotId];
                              const knownIsT1 = !!t1;
                              const knownTeam = knownIsT1 ? t1 : t2;
                              const tbdDesc = knownIsT1 ? meta?.t2desc : meta?.t1desc;
                              return (
                                <>
                                  {meta?.t2desc && (
                                    <div style={{ fontSize: "11px", color: C.textMuted, fontStyle: "italic", marginBottom: "2px" }}>
                                      Opponent: <strong>{tbdDesc}</strong> — TBD
                                    </div>
                                  )}
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    {knownIsT1 ? (
                                      <>
                                        <TeamBtn team={knownTeam} selected={!slotLocked && picks[slot.slotId] === knownTeam} resultState={null} onClick={() => !slotLocked && makePick(slot.slotId, "team1")} />
                                        <span style={{ fontSize: "11px", fontWeight: 600, color: C.textMuted, flexShrink: 0 }}>vs</span>
                                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", border: `1px dashed ${C.border}`, background: C.white, minWidth: 0 }}>
                                          <span style={{ fontSize: "12px", color: C.textMuted, fontStyle: "italic" }}>🔒 {tbdDesc || "TBD"}</span>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", border: `1px dashed ${C.border}`, background: C.white, minWidth: 0 }}>
                                          <span style={{ fontSize: "12px", color: C.textMuted, fontStyle: "italic" }}>🔒 {tbdDesc || "TBD"}</span>
                                        </div>
                                        <span style={{ fontSize: "11px", fontWeight: 600, color: C.textMuted, flexShrink: 0 }}>vs</span>
                                        <TeamBtn team={knownTeam} selected={!slotLocked && picks[slot.slotId] === knownTeam} resultState={null} onClick={() => !slotLocked && makePick(slot.slotId, "team2")} />
                                      </>
                                    )}
                                  </div>
                                  {picks[slot.slotId] === knownTeam && (
                                    <div style={{ fontSize: "11px", color: C.gold, fontWeight: 600, padding: "2px 4px" }}>
                                      ✓ You've picked {knownTeam} — opponent will be confirmed later
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : oneKnown ? (
                          <>
                            {t1 && !t1.startsWith("W-") && <TeamBtn team={t1} selected={false} onClick={() => {}} style={{ opacity: 0.5, pointerEvents: "none" }} />}
                            <span style={{ fontSize: "12px", color: C.textMuted, fontStyle: "italic", flex: 1, textAlign: "center" }}>vs TBD — pick {prevRound} winner</span>
                            {t2 && !t2.startsWith("W-") && <TeamBtn team={t2} selected={false} onClick={() => {}} style={{ opacity: 0.5, pointerEvents: "none" }} />}
                          </>
                        ) : (
                          /* Fully TBD — show descriptive placeholders from SLOT_META */
                          (() => {
                            const meta = SLOT_META[slot.slotId];
                            const isR32 = slot.round === "R32";
                            return (
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", minWidth: 0 }}>
                                <div style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: `1px dashed ${C.border}`, background: C.white, minWidth: 0, textAlign: "center" }}>
                                  <span style={{ fontSize: isR32 ? "11px" : "12px", color: C.textMuted, fontStyle: "italic" }}>
                                    {meta?.t1desc || (isR32 ? "TBD" : `Pick ${prevRound} winner`)}
                                  </span>
                                </div>
                                <span style={{ fontSize: "11px", fontWeight: 600, color: C.textMuted, flexShrink: 0 }}>vs</span>
                                <div style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: `1px dashed ${C.border}`, background: C.white, minWidth: 0, textAlign: "center" }}>
                                  <span style={{ fontSize: isR32 ? "11px" : "12px", color: C.textMuted, fontStyle: "italic" }}>
                                    {meta?.t2desc || (isR32 ? "TBD" : `Pick ${prevRound} winner`)}
                                  </span>
                                </div>
                              </div>
                            );
                          })()
                        )}
                      </div>
                    ) : (() => {
                      const koResult = koResults[slot.slotId];
                      const hasResult = !!(koResult?.result);
                      const actualWinner = hasResult
                        ? (koResult.result === "team1" ? koResult.team1 : koResult.team2)
                        : null;
                      const userCorrect = hasResult && picked === actualWinner;
                      const userWrong   = hasResult && picked && picked !== actualWinner;

                      const t1State = !hasResult ? null
                        : picked === t1 ? (userCorrect ? "correct" : "wrong")
                        : actualWinner === t1 ? "winner" : null;
                      const t2State = !hasResult ? null
                        : picked === t2 ? (userCorrect ? "correct" : "wrong")
                        : actualWinner === t2 ? "winner" : null;

                      const roundPts = { R32: 2, R16: 4, QF: 8, SF: 12, F: 16 };
                      const pts = roundPts[roundName] || 0;

                      const t1Eliminated = !hasResult && isTeamEliminated(t1, slot.slotId, koResults);
                      const t2Eliminated = !hasResult && isTeamEliminated(t2, slot.slotId, koResults);
                      const pickedEliminated = picked && isTeamEliminated(picked, slot.slotId, koResults);

                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <TeamBtn team={t1} selected={!hasResult && picked===t1} resultState={t1State}
                            onClick={() => !slotLocked && !hasResult && !t1Eliminated && makePick(slot.slotId, t1)}
                            style={t1Eliminated ? { opacity: 0.4, textDecoration: "line-through" } : {}} />
                          <span style={{ fontSize: "11px", fontWeight: 600, color: C.textMuted, flexShrink: 0 }}>vs</span>
                          <TeamBtn team={t2} selected={!hasResult && picked===t2} resultState={t2State}
                            onClick={() => !slotLocked && !hasResult && !t2Eliminated && makePick(slot.slotId, t2)}
                            style={t2Eliminated ? { opacity: 0.4, textDecoration: "line-through" } : {}} />
                          {(hasResult && picked) ? (
                            <span style={{ fontSize: "11px", fontWeight: 700, flexShrink: 0, minWidth: "40px", textAlign: "right",
                              color: userCorrect ? "#1D9E75" : C.textMuted,
                            }}>
                              {userCorrect ? `✓ +${pts}` : "✗ +0"}
                            </span>
                          ) : pickedEliminated ? (
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#dc2626", flexShrink: 0 }}>✗ out</span>
                          ) : null}
                          {hasResult && !picked && (
                            <span style={{ fontSize: "10px", color: C.textMuted, flexShrink: 0 }}>no pick</span>
                          )}
                          {!hasResult && !picked && (
                            <span style={{ fontSize: "10px", color: C.textMuted, flexShrink: 0 }}>not played</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {/* Auto-save status */}
      {!locked && (
        <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ fontSize: "12px", fontWeight: 500, color: msg.type === "error" ? C.red : msg.type === "success" ? C.green : C.textMuted }}>
            {msg.text || "Picks save automatically as you click — safe to navigate away"}
          </div>
          {/* Keep Save All as a fallback for any unsaved picks */}
          <button style={{ ...styles.btnSecondary, fontSize: "12px", padding: "5px 12px" }} onClick={saveAll} disabled={saving}>
            {saving ? "Saving..." : "Save All (backup)"}
          </button>
        </div>
      )}
    </div>
  );
}

// Insights tab — pick popularity and consensus (visible after Stage 1 locks)
function InsightsBarRow({ label, count, total, color, align = "left", isWinner = false }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
        {align === "left" ? (
          <>
            <span style={{ fontSize: "12px", color: isWinner ? "#1D9E75" : C.text, fontWeight: isWinner ? 700 : 400, display: "flex", alignItems: "center", gap: "4px" }}>
              <img src={`https://flagcdn.com/${TEAM_META[label]?.flag || "un"}.svg`} style={{ width: "16px", height: "11px", borderRadius: "1px", objectFit: "cover" }} />
              {label}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: isWinner ? "#1D9E75" : C.textMuted }}>{pct}%</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: "12px", fontWeight: 700, color: isWinner ? "#1D9E75" : C.textMuted }}>{pct}%</span>
            <span style={{ fontSize: "12px", color: isWinner ? "#1D9E75" : C.text, fontWeight: isWinner ? 700 : 400, display: "flex", alignItems: "center", gap: "4px" }}>
              {label}
              <img src={`https://flagcdn.com/${TEAM_META[label]?.flag || "un"}.svg`} style={{ width: "16px", height: "11px", borderRadius: "1px", objectFit: "cover" }} />
            </span>
          </>
        )}
      </div>
      <div style={{ height: "8px", background: C.border, borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: isWinner ? "#1D9E75" : color, borderRadius: "4px",
          ...(align === "right" ? { marginLeft: "auto" } : {}),
        }} />
      </div>
    </div>
  );
}

function Insights({ stage1Locked, stage2Locked, leagueId, currentUserId, isAdmin = false, matchResultsCache = [], standingsCache = [], koResultsCache = [] }) {
  const [allMatchPicks, setAllMatchPicks] = useState([]);
  const [allGroupPicks, setAllGroupPicks] = useState([]);
  const [allS2Picks, setAllS2Picks] = useState([]);
  const [matchResults, setMatchResults] = useState({});
  const [playerCount, setPlayerCount] = useState(0);
  const [playerMap, setPlayerMap] = useState({}); // userId -> display_name
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState("A");
  const koUnderway = koResultsCache.some((r) => r.result);
  const [insightsTab, setInsightsTab] = useState(koUnderway ? "stage2" : "stage1");
  const [selectedKOMatch, setSelectedKOMatch] = useState(null);
  const [insightsViewMode, setInsightsViewMode] = useState("date");
  const [selectedMatch, setSelectedMatch] = useState(null); // { matchId, team1, team2, group }

  useEffect(() => {
    if (!stage1Locked) { setLoading(false); return; }
    setLoading(true);
    async function load() {
      let leagueMemberIds = null;
      if (leagueId) {
        const { data: lm } = await supabase.from("profiles").select("id").eq("league_id", leagueId);
        leagueMemberIds = (lm || []).map((p) => p.id);
        // Always include all admin users so their picks appear for every league member
        const { data: admins } = await supabase.from("profiles").select("id").eq("is_admin", true);
        (admins || []).forEach((a) => {
          if (!leagueMemberIds.includes(a.id)) leagueMemberIds.push(a.id);
        });
      }

      const profilesQuery = leagueMemberIds
        ? supabase.from("profiles").select("id,display_name").in("id", leagueMemberIds)
        : supabase.from("profiles").select("id,display_name");
      const mpQuery = leagueMemberIds
        ? supabase.from("stage1_match_picks").select("match_id,pick,user_id").in("user_id", leagueMemberIds)
        : supabase.from("stage1_match_picks").select("match_id,pick,user_id");
      const gpQuery = leagueMemberIds
        ? supabase.from("stage1_group_picks").select("group_code,first_place,second_place,third_place").in("user_id", leagueMemberIds)
        : supabase.from("stage1_group_picks").select("group_code,first_place,second_place,third_place");
      const s2Query = leagueMemberIds
        ? supabase.from("stage2_picks").select("slot_id,picked_team,user_id").in("user_id", leagueMemberIds)
        : supabase.from("stage2_picks").select("slot_id,picked_team,user_id");

      const [{ data: mp }, { data: gp }, { data: profiles }, { data: s2 }] = await Promise.all([
        mpQuery, gpQuery, profilesQuery, s2Query,
      ]);

      const pMap = {};
      (profiles || []).forEach((p) => { pMap[p.id] = p.display_name; });
      setPlayerMap(pMap);
      setAllMatchPicks(mp || []);
      setAllGroupPicks(gp || []);
      setAllS2Picks(s2 || []);
      const mrMap = {};
      matchResultsCache.filter((r) => r.stage === "group").forEach((r) => (mrMap[r.match_id] = r.result));
      setMatchResults(mrMap);
      setPlayerCount((profiles||[]).length);
      setLoading(false);
    }
    load();
  }, [stage1Locked, leagueId]);

  if (!stage1Locked) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: "center", padding: "3rem 2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔒</div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: C.navy, marginBottom: "0.75rem" }}>
            Insights unlock when picks are locked
          </div>
          <p style={{ fontSize: "14px", color: C.textMuted, maxWidth: "420px", margin: "0 auto 2rem", lineHeight: 1.6 }}>
            Once Group Stage picks are locked on June 11, you'll be able to see how the whole group picked every match — pick distributions, consensus ratings, and standings predictions.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "10px", maxWidth: "520px", margin: "0 auto" }}>
            {[
              { icon: "📊", label: "Pick distribution", desc: "See how the group split on every match" },
              { icon: "🤝", label: "Consensus rating", desc: "Which picks were unanimous vs contested" },
              { icon: "🏅", label: "Standings picks", desc: "Who everyone predicted to top each group" },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ background: `${C.navy}08`, borderRadius: "10px", padding: "1rem", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{icon}</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: C.navy, marginBottom: "4px" }}>{label}</div>
                <div style={{ fontSize: "12px", color: C.textMuted, lineHeight: 1.4 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "2rem", fontSize: "13px", color: C.textMuted }}>
            Unlocks June 11, 2026 · Group Stage lock time
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  const groupMatches = ALL_GROUP_MATCHES.filter((m) => m.group === activeGroup);

  // Get pickers for a specific match
  function getMatchPickers(matchId) {
    return allMatchPicks.filter((p) => p.match_id === matchId);
  }

  // Build pick counts per match
  function getMatchCounts(matchId) {
    const picks = allMatchPicks.filter((p) => p.match_id === matchId);
    const t1 = picks.filter((p) => p.pick === "team1").length;
    const draw = picks.filter((p) => p.pick === "draw").length;
    const t2 = picks.filter((p) => p.pick === "team2").length;
    const total = t1 + draw + t2;
    return { t1, draw, t2, total };
  }

  // Build standings pick counts for a group
  function getStandingsCounts(group) {
    const picks = allGroupPicks.filter((p) => p.group_code === group);
    const firstCounts = {}, secondCounts = {};
    picks.forEach((p) => {
      firstCounts[p.first_place] = (firstCounts[p.first_place] || 0) + 1;
      secondCounts[p.second_place] = (secondCounts[p.second_place] || 0) + 1;
    });
    const sortDesc = (obj) => Object.entries(obj).sort((a,b) => b[1]-a[1]);
    return { first: sortDesc(firstCounts), second: sortDesc(secondCounts), total: picks.length };
  }

  // Find most agreed and most split match across all groups
  // Compute group-scoped stats for the active group
  let groupMostAgreed = null, groupMostSplit = null, groupMaxAgree = 0, groupMinAgree = 999;
  let groupTotalPicks = 0, groupCorrectPicks = 0;
  ALL_GROUP_MATCHES.filter((m) => m.group === activeGroup).forEach((m) => {
    const { t1, draw, t2, total } = getMatchCounts(m.matchId);
    if (total === 0) return;
    groupTotalPicks += total;
    const maxPick = Math.max(t1, draw, t2);
    const pct = Math.round((maxPick / total) * 100);
    if (pct > groupMaxAgree) { groupMaxAgree = pct; groupMostAgreed = m; }
    if (pct < groupMinAgree) { groupMinAgree = pct; groupMostSplit = m; }
    const actualResult = matchResults[m.matchId];
    if (actualResult) {
      const correctCount = actualResult === "team1" ? t1 : actualResult === "team2" ? t2 : draw;
      groupCorrectPicks += correctCount;
    }
  });
  const groupAccuracy = groupTotalPicks > 0 && groupCorrectPicks > 0
    ? Math.round((groupCorrectPicks / groupTotalPicks) * 100)
    : null;

  // Overall accuracy across all matches with results (for date view)
  let overallTotalPicks = 0, overallCorrectPicks = 0;
  ALL_GROUP_MATCHES.forEach((m) => {
    const actualResult = matchResults[m.matchId];
    if (!actualResult) return;
    const { t1, draw, t2, total } = getMatchCounts(m.matchId);
    if (total === 0) return;
    overallTotalPicks += total;
    const correctCount = actualResult === "team1" ? t1 : actualResult === "team2" ? t2 : draw;
    overallCorrectPicks += correctCount;
  });
  const overallAccuracy = overallTotalPicks > 0
    ? Math.round((overallCorrectPicks / overallTotalPicks) * 100)
    : null;

  // Determine most agreed label
  function getMostAgreedLabel(m) {
    if (!m) return "—";
    const { t1, draw, t2, total } = getMatchCounts(m.matchId);
    const maxPick = Math.max(t1, draw, t2);
    if (maxPick === draw) return "Draw";
    if (maxPick === t1) return m.team1;
    return m.team2;
  }



  const stCounts = getStandingsCounts(activeGroup);

  // Stage 2 slot pick counts
  function getS2PickCounts(slotId, team1, team2) {
    const picks = allS2Picks.filter((p) => p.slot_id === slotId);
    const t1 = picks.filter((p) => p.picked_team === team1).length;
    const t2 = picks.filter((p) => p.picked_team === team2).length;
    return { t1, t2, total: t1 + t2 };
  }

  return (
    <div style={styles.container}>

      {/* Insights tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
        <button style={styles.tab(insightsTab === "stage1")} onClick={() => setInsightsTab("stage1")}>Group Stage</button>
        <button style={styles.tab(insightsTab === "stage2")} onClick={() => setInsightsTab("stage2")}>Knockout</button>
      </div>

      {insightsTab === "stage2" && (() => {
        if (!stage2Locked) {
          return (
            <div style={{ ...styles.card, textAlign: "center", padding: "2.5rem 2rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔒</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: C.navy, marginBottom: "0.5rem" }}>Knockout insights unlock when knockout picks are locked</div>
              <p style={{ fontSize: "13px", color: C.textMuted, margin: "0 auto", maxWidth: "380px", lineHeight: 1.6 }}>
                Once the Round of 32 begins and picks are locked, you'll see how everyone picked the bracket — round by round.
              </p>
            </div>
          );
        }
        // Derive koResults map from cache
        const koResults = {};
        koResultsCache.forEach((r) => (koResults[r.match_id] = r));

        const rounds = [
          { id: "R32", label: "Round of 32", pts: 2 },
          { id: "R16", label: "Round of 16", pts: 4 },
          { id: "QF",  label: "Quarterfinals", pts: 6 },
          { id: "SF",  label: "Semifinals", pts: 8 },
          { id: "F",   label: "Final", pts: 10 },
        ];

        return (
          <div>
            {selectedKOMatch && (() => {
              const slotId = selectedKOMatch.slotId;
              const slot = selectedKOMatch.slot;
              const picks = allS2Picks
                .filter((p) => p.slot_id === slotId)
                .map((p) => ({
                  user_id: p.user_id,
                  pick: p.picked_team === slot.team1 ? "team1" : p.picked_team === slot.team2 ? "team2" : null,
                }))
                .filter((p) => p.pick);
              const meta = SLOT_META[slotId];
              const match = {
                team1: slot.team1, team2: slot.team2,
                group: meta ? `M${meta.matchNum}` : slotId,
                date: meta?.date || "",
                time: meta?.time || "",
              };
              const actualResult = slot.result || null;
              return (
                <MatchPickersModal
                  match={match}
                  picks={picks}
                  playerMap={playerMap}
                  currentUserId={currentUserId}
                  actualResult={actualResult}
                  onClose={() => setSelectedKOMatch(null)}
                />
              );
            })()}
            {rounds.map(({ id, label, pts }) => {
              const slots = Object.entries(koResults)
                .filter(([sid]) => sid.startsWith(id + "_"))
                .sort(([a],[b]) => parseInt(a.split("_")[1]) - parseInt(b.split("_")[1]));
              if (slots.length === 0) return (
                <div key={id} style={styles.card}>
                  <div style={styles.cardTitle}>{label}<span style={styles.badge(C.navy, `${C.gold}33`)}>+{pts} pts</span></div>
                  <div style={{ fontSize: "13px", color: C.textMuted, fontStyle: "italic" }}>Not yet played</div>
                </div>
              );
              return (
                <div key={id} style={styles.card}>
                  <div style={styles.cardTitle}>{label}<span style={styles.badge(C.navy, `${C.gold}33`)}>+{pts} pts</span></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {slots.map(([slotId, slot], idx) => {
                      if (!slot.team1 || slot.team1.startsWith("W-")) return null;
                      const { t1, t2, total } = getS2PickCounts(slotId, slot.team1, slot.team2);
                      const hasResult = !!slot.result;
                      const actualWinner = hasResult ? (slot.result === "team1" ? slot.team1 : slot.team2) : null;
                      const t1pct = total > 0 ? Math.round((t1 / total) * 100) : 0;
                      const t2pct = total > 0 ? Math.round((t2 / total) * 100) : 0;
                      const maxPct = Math.max(t1pct, t2pct);
                      const isHigh = maxPct >= 70;
                      const isSplit = maxPct <= 50;
                      const t1IsWinner = hasResult && actualWinner === slot.team1;
                      const t2IsWinner = hasResult && actualWinner === slot.team2;
                      const meta = SLOT_META[slotId];
                      return (
                        <div key={slotId}
                          onClick={() => setSelectedKOMatch({ slotId, slot })}
                          style={{ cursor: "pointer" }}
                        >
                          {/* Match header with date/venue */}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              {meta ? `Match ${meta.matchNum}` : `Match ${idx + 1}`}
                            </span>
                            {meta && <>
                              <span style={{ fontSize: "10px", color: C.navy, fontWeight: 600 }}>{meta.date}</span>
                              <span style={{ fontSize: "10px", color: C.textMuted }}>{meta.time}</span>
                              <span style={{ fontSize: "10px", color: C.textMuted }}>·</span>
                              <span style={{ fontSize: "10px", color: C.textMuted }}>{meta.venue}</span>
                            </>}
                            <span style={{ marginLeft: "auto", fontSize: "10px", color: C.textMuted }}>tap to see picks →</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ fontSize: "12px", color: C.textMuted }}>
                              <img src={`https://flagcdn.com/${TEAM_META[slot.team1]?.flag||"un"}.svg`} style={{ width:"14px",height:"9px",borderRadius:"1px",objectFit:"cover",verticalAlign:"middle",marginRight:"4px" }} />
                              {slot.team1}
                              <span style={{ color: C.border, margin: "0 6px" }}>vs</span>
                              <img src={`https://flagcdn.com/${TEAM_META[slot.team2]?.flag||"un"}.svg`} style={{ width:"14px",height:"9px",borderRadius:"1px",objectFit:"cover",verticalAlign:"middle",marginRight:"4px" }} />
                              {slot.team2}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {hasResult && <span style={{ fontSize: "10px", color: "#1D9E75", fontWeight: 700 }}>{actualWinner} won ✓</span>}
                              <span style={{
                                fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                                background: isHigh ? "rgba(29,158,117,0.1)" : isSplit ? "rgba(239,184,36,0.15)" : `${C.border}`,
                                color: isHigh ? "#0a5c3a" : isSplit ? "#7a5c00" : C.textMuted,
                              }}>
                                {total > 0 ? `${maxPct}% agree` : "no picks"}
                              </span>
                            </div>
                          </div>
                          {total > 0 && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                                  <span style={{ fontSize: "12px", color: t1IsWinner ? "#1D9E75" : C.text, fontWeight: t1IsWinner ? 700 : 400, display: "flex", alignItems: "center", gap: "4px" }}>
                                    <img src={`https://flagcdn.com/${TEAM_META[slot.team1]?.flag||"un"}.svg`} style={{ width:"16px",height:"11px",borderRadius:"1px",objectFit:"cover" }} />
                                    {slot.team1}
                                  </span>
                                  <span style={{ fontSize: "12px", fontWeight: 700, color: t1IsWinner ? "#1D9E75" : C.textMuted }}>{t1pct}%</span>
                                </div>
                                <div style={{ height: "8px", background: C.border, borderRadius: "4px", overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${t1pct}%`, background: t1IsWinner ? "#1D9E75" : C.navy, borderRadius: "4px" }} />
                                </div>
                              </div>
                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                                  <span style={{ fontSize: "12px", fontWeight: 700, color: t2IsWinner ? "#1D9E75" : C.textMuted }}>{t2pct}%</span>
                                  <span style={{ fontSize: "12px", color: t2IsWinner ? "#1D9E75" : C.text, fontWeight: t2IsWinner ? 700 : 400, display: "flex", alignItems: "center", gap: "4px" }}>
                                    {slot.team2}
                                    <img src={`https://flagcdn.com/${TEAM_META[slot.team2]?.flag||"un"}.svg`} style={{ width:"16px",height:"11px",borderRadius:"1px",objectFit:"cover" }} />
                                  </span>
                                </div>
                                <div style={{ height: "8px", background: C.border, borderRadius: "4px", overflow: "hidden", display: "flex", justifyContent: "flex-end" }}>
                                  <div style={{ height: "100%", width: `${t2pct}%`, background: t2IsWinner ? "#1D9E75" : C.gold, borderRadius: "4px" }} />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {insightsTab === "stage1" && <>

      {/* Summary stats — content varies by view mode */}
      {(() => {
        const today = new Date();
        const todayStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" }).replace(/\s+/, " ");
        const todayMatches = ALL_GROUP_MATCHES.filter((m) => m.date === todayStr);
        const todayWithResults = todayMatches.filter((m) => matchResults[m.matchId]);

        const isDateView = insightsViewMode === "date";

        const statBoxes = isDateView ? [
          ["PARTICIPANTS", playerCount],
          ["OVERALL ACCURACY", overallAccuracy !== null ? `${overallAccuracy}%` : "—"],
          ["TODAY'S MATCHES", todayMatches.length > 0 ? todayMatches.length : "—"],
          ["RESULTS IN", todayMatches.length > 0 ? `${todayWithResults.length}/${todayMatches.length}` : "—"],
        ] : [
          ["PARTICIPANTS", playerCount],
          ["GROUP ACCURACY", groupAccuracy !== null ? `${groupAccuracy}%` : "—"],
          ["MOST AGREED", groupMostAgreed ? getMostAgreedLabel(groupMostAgreed) : "—"],
          ["MOST SPLIT", groupMostSplit ? `${groupMostSplit.team1} vs ${groupMostSplit.team2}` : "—"],
        ];

        return (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "6px" }}>
              {statBoxes.map(([label, val]) => {
                const isLong = typeof val === "string" && val.length > 8;
                return (
                  <div key={label} style={{ ...styles.card, background: C.navy, color: C.white, marginBottom: 0, textAlign: "center", padding: "0.75rem 0.5rem" }}>
                    <div style={{ fontSize: "10px", color: C.gold, fontWeight: 600, marginBottom: "4px", letterSpacing: "0.04em" }}>{label}</div>
                    <div style={{ fontSize: typeof val === "number" ? "1.75rem" : isLong ? "12px" : "1.25rem", fontWeight: 700, lineHeight: 1.3, paddingTop: "2px" }}>{val}</div>
                  </div>
                );
              })}
            </div>
            {/* Context label */}
            <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "1rem", paddingLeft: "2px" }}>
              {isDateView
                ? "Participants & overall accuracy across all played matches · today's activity"
                : `Participants & accuracy · Most Agreed/Split for Group ${activeGroup}`
              }
            </div>
          </>
        );
      })()}

      {/* Group selector + view toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "1rem" }}>
        <button onClick={() => setInsightsViewMode("date")} style={{
          padding: "5px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
          border: insightsViewMode === "date" ? `2px solid ${C.navy}` : `1px solid ${C.border}`,
          background: insightsViewMode === "date" ? C.navy : C.white,
          color: insightsViewMode === "date" ? C.white : C.text,
        }}>📅 By Date</button>
        <button onClick={() => setInsightsViewMode("group")} style={{
          padding: "5px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
          border: insightsViewMode === "group" ? `2px solid ${C.navy}` : `1px solid ${C.border}`,
          background: insightsViewMode === "group" ? C.navy : C.white,
          color: insightsViewMode === "group" ? C.white : C.text,
        }}>By Group</button>
      </div>

      {/* ── INSIGHTS DATE VIEW ── */}
      {insightsViewMode === "date" && (() => {
        const today = new Date();
        const todayStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" }).replace(/\s+/, " ");
        const byDate = {};
        ALL_GROUP_MATCHES.forEach((m) => {
          if (!byDate[m.date]) byDate[m.date] = [];
          byDate[m.date].push(m);
        });
        const hasTodayDate = Object.keys(byDate).includes(todayStr);
        return (
          <div
            id="insights-date-scroll"
            style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "4px" }}
          >
            {Object.keys(byDate).map((date) => {
              const isToday = date === todayStr;
              const matches = byDate[date];
              return (
                <div key={date} id={`insights-date-${date.replace(" ", "-")}`} style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <span style={{
                      fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
                      padding: isToday ? "3px 10px" : "2px 8px", borderRadius: "6px",
                      background: isToday ? C.navy : "transparent",
                      color: isToday ? C.gold : C.navy,
                      border: isToday ? `1px solid ${C.navy}` : `1px solid ${C.border}`,
                    }}>
                      {isToday ? `📅 Today — ${date}` : date}
                    </span>
                    <div style={{ flex: 1, height: "1px", background: C.border }} />
                  </div>
                  {matches.map((m) => {
                    const { t1, draw, t2, total } = getMatchCounts(m.matchId);
                    const actualResult = matchResults[m.matchId];
                    const hasResult = !!actualResult;
                    const maxCount = Math.max(t1, draw, t2);
                    const agreePct = total > 0 ? Math.round((maxCount / total) * 100) : 0;
                    const isHigh = agreePct >= 70;
                    const isSplit = agreePct <= 40;
                    return (
                      <div key={m.matchId}
                        onClick={() => setSelectedMatch(m)}
                        style={{ ...styles.card, marginBottom: "10px", padding: "12px 14px", cursor: "pointer", transition: "box-shadow 0.15s" }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = ""}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontSize: "12px", color: C.textMuted }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, color: C.white, background: C.navy, borderRadius: "4px", padding: "1px 6px", marginRight: "6px", letterSpacing: "0.04em" }}>GRP {m.group}</span>
                            <img src={`https://flagcdn.com/${TEAM_META[m.team1]?.flag||"un"}.svg`} style={{ width:"14px",height:"9px",borderRadius:"1px",objectFit:"cover",verticalAlign:"middle",marginRight:"4px" }} />
                            {m.team1}
                            <span style={{ color: C.border, margin: "0 6px" }}>vs</span>
                            <img src={`https://flagcdn.com/${TEAM_META[m.team2]?.flag||"un"}.svg`} style={{ width:"14px",height:"9px",borderRadius:"1px",objectFit:"cover",verticalAlign:"middle",marginRight:"4px" }} />
                            {m.team2}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {hasResult && (
                              <span style={{ fontSize: "10px", color: "#1D9E75", fontWeight: 700 }}>
                                {actualResult === "team1" ? m.team1 : actualResult === "team2" ? m.team2 : "Draw"} won ✓
                              </span>
                            )}
                            <span style={{
                              fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                              background: isHigh ? "rgba(29,158,117,0.1)" : isSplit ? "rgba(239,184,36,0.15)" : `${C.border}`,
                              color: isHigh ? "#0a5c3a" : isSplit ? "#7a5c00" : C.textMuted,
                            }}>
                              {total > 0 ? `${agreePct}% agree` : "no picks"}
                            </span>
                            <span style={{ fontSize: "10px", color: C.textMuted }}>👥</span>
                          </div>
                        </div>
                        {total > 0 && (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 44px 1fr", gap: "8px", alignItems: "center" }}>
                            <InsightsBarRow label={m.team1} count={t1} total={total} color={C.navy} align="left" isWinner={hasResult && actualResult==="team1"} />
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontSize: "11px", fontWeight: draw > 0 ? 700 : 400, color: hasResult && actualResult==="draw" ? "#1D9E75" : C.textMuted }}>
                                {Math.round((draw/total)*100)}%
                              </div>
                              <div style={{ fontSize: "10px", color: C.textMuted }}>draw</div>
                              <div style={{ height: "6px", background: C.border, borderRadius: "3px", overflow: "hidden", marginTop: "3px" }}>
                                <div style={{ height: "100%", width: `${Math.round((draw/total)*100)}%`, background: hasResult && actualResult==="draw" ? "#1D9E75" : "#94a3b8", borderRadius: "3px" }} />
                              </div>
                            </div>
                            <InsightsBarRow label={m.team2} count={t2} total={total} color={C.gold} align="right" isWinner={hasResult && actualResult==="team2"} />
                          </div>
                        )}
                        {total === 0 && <div style={{ fontSize: "12px", color: C.textMuted, fontStyle: "italic" }}>No picks submitted</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {hasTodayDate && (
              <AutoScrollToToday containerId="insights-date-scroll" targetId={`insights-date-${todayStr.replace(" ", "-")}`} />
            )}
          </div>
        );
      })()}

      {/* ── INSIGHTS GROUP VIEW ── */}
      {insightsViewMode === "group" && (<div>
      {/* Group selector */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "1.25rem" }}>
        {Object.keys(GROUPS).map((g) => (
          <button key={g} onClick={() => setActiveGroup(g)} style={{
            padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            border: activeGroup === g ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
            background: activeGroup === g ? C.navy : C.white,
            color: activeGroup === g ? C.white : C.text,
          }}>{g}</button>
        ))}
      </div>

      {/* Match pick distribution */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Group {activeGroup} — Pick distribution</div>
        {groupMatches.map((m, idx) => {
          const prevMatch = groupMatches[idx - 1];
          const showDate = idx === 0 || prevMatch?.date !== m.date;
          const { t1, draw, t2, total } = getMatchCounts(m.matchId);
          const actualResult = matchResults[m.matchId];
          const hasResult = !!actualResult;
          const maxCount = Math.max(t1, draw, t2);
          const agreePct = total > 0 ? Math.round((maxCount / total) * 100) : 0;
          const isHigh = agreePct >= 70;
          const isSplit = agreePct <= 40;
          return (
            <div key={m.matchId}
              onClick={() => setSelectedMatch(m)}
              style={{ marginBottom: "16px", cursor: "pointer", borderRadius: "8px", padding: "4px", transition: "background 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = `${C.navy}06`}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {showDate && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0 4px", marginTop: idx > 0 ? "8px" : 0 }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.date}</span>
                  <div style={{ flex: 1, height: "1px", background: C.border }} />
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: C.textMuted }}>
                  <img src={`https://flagcdn.com/${TEAM_META[m.team1]?.flag||"un"}.svg`} style={{ width:"14px",height:"9px",borderRadius:"1px",objectFit:"cover",verticalAlign:"middle",marginRight:"4px" }} />
                  {m.team1}
                  <span style={{ color: C.border, margin: "0 6px" }}>vs</span>
                  <img src={`https://flagcdn.com/${TEAM_META[m.team2]?.flag||"un"}.svg`} style={{ width:"14px",height:"9px",borderRadius:"1px",objectFit:"cover",verticalAlign:"middle",marginRight:"4px" }} />
                  {m.team2}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {hasResult && (
                    <span style={{ fontSize: "10px", color: "#1D9E75", fontWeight: 700 }}>
                      {actualResult === "team1" ? m.team1 : actualResult === "team2" ? m.team2 : "Draw"} won ✓
                    </span>
                  )}
                  <span style={{
                    fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                    background: isHigh ? "rgba(29,158,117,0.1)" : isSplit ? "rgba(239,184,36,0.15)" : `${C.border}`,
                    color: isHigh ? "#0a5c3a" : isSplit ? "#7a5c00" : C.textMuted,
                  }}>
                    {total > 0 ? `${agreePct}% agree` : "no picks"}
                  </span>
                  <span style={{ fontSize: "10px", color: C.textMuted }}>👥</span>
                </div>
              </div>
              {total > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 44px 1fr", gap: "8px", alignItems: "center" }}>
                  <InsightsBarRow label={m.team1} count={t1} total={total} color={C.navy} align="left" isWinner={hasResult && actualResult==="team1"} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "11px", fontWeight: draw > 0 ? 700 : 400, color: hasResult && actualResult==="draw" ? "#1D9E75" : C.textMuted }}>
                      {total > 0 ? Math.round((draw/total)*100) : 0}%
                    </div>
                    <div style={{ fontSize: "10px", color: C.textMuted }}>draw</div>
                    <div style={{ height: "6px", background: C.border, borderRadius: "3px", overflow: "hidden", marginTop: "3px" }}>
                      <div style={{ height: "100%", width: `${total>0?Math.round((draw/total)*100):0}%`, background: hasResult && actualResult==="draw" ? "#1D9E75" : "#94a3b8", borderRadius: "3px" }} />
                    </div>
                  </div>
                  <InsightsBarRow label={m.team2} count={t2} total={total} color={C.gold} align="right" isWinner={hasResult && actualResult==="team2"} />
                </div>
              )}
              {total === 0 && <div style={{ fontSize: "12px", color: C.textMuted, fontStyle: "italic" }}>No picks submitted</div>}
            </div>
          );
        })}
      </div>

      {/* Standings consensus */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Group {activeGroup} — Standings consensus
          <span style={{ fontSize: "12px", color: C.textMuted, fontWeight: 400 }}>{stCounts.total} picks</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "10px" }}>
          {[["1st place picks", stCounts.first], ["2nd place picks", stCounts.second]].map(([label, counts]) => (
            <div key={label} style={{ border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px 14px" }}>
              <div style={{ fontSize: "11px", color: C.textMuted, fontWeight: 600, marginBottom: "8px" }}>{label.toUpperCase()}</div>
              {counts.length === 0 ? (
                <div style={{ fontSize: "12px", color: C.textMuted, fontStyle: "italic" }}>No picks</div>
              ) : counts.map(([team, count]) => (
                <div key={team} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <img src={`https://flagcdn.com/${TEAM_META[team]?.flag||"un"}.svg`} style={{ width:"18px",height:"12px",borderRadius:"2px",objectFit:"cover",flexShrink:0 }} />
                  <span style={{ fontSize: "13px", flex: 1 }}>{team}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: C.navy, minWidth: "20px", textAlign: "right" }}>{count}</span>
                  <div style={{ width: "60px", height: "6px", background: C.border, borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${stCounts.total>0?Math.round((count/stCounts.total)*100):0}%`, background: C.navy, borderRadius: "3px" }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      </div>
      )}

      {selectedMatch && (
        <MatchPickersModal
          match={selectedMatch}
          picks={getMatchPickers(selectedMatch.matchId)}
          playerMap={playerMap}
          currentUserId={currentUserId}
          actualResult={matchResults[selectedMatch.matchId]}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      </>}

    </div>
  );
}

// User Guide
function StandingsPage({ matchResultsCache = [] }) {
  const isMobile = useIsMobile();
  const [matchResults, setMatchResults] = useState({});

  useEffect(() => {
    const mrMap = {};
    matchResultsCache.filter((r) => r.stage === "group").forEach((r) => (mrMap[r.match_id] = r));
    setMatchResults(mrMap);
  }, [matchResultsCache]);

  // Compute standings for a given group
  function computeGroupTable(g) {
    const teams = GROUPS[g];
    const table = {};
    teams.forEach((t) => (table[t] = { w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }));
    ALL_GROUP_MATCHES.filter((m) => m.group === g).forEach((m) => {
      const res = matchResults[m.matchId];
      if (!res?.result) return;
      const s1 = res.score1 ?? 0, s2 = res.score2 ?? 0;
      if (res.result === "draw") {
        table[m.team1].d++; table[m.team1].pts++;
        table[m.team2].d++; table[m.team2].pts++;
      } else if (res.result === "team1") {
        table[m.team1].w++; table[m.team1].pts += 3; table[m.team2].l++;
      } else {
        table[m.team2].w++; table[m.team2].pts += 3; table[m.team1].l++;
      }
      table[m.team1].gf += s1; table[m.team1].ga += s2;
      table[m.team2].gf += s2; table[m.team2].ga += s1;
    });
    return Object.entries(table)
      .map(([team, s]) => ({ team, group: g, ...s, gd: s.gf - s.ga, mp: s.w + s.d + s.l }))
      .sort((a, b) => b.pts - a.pts || (b.gd - a.gd) || (b.gf - a.gf));
  }

  // Compute all 3rd-place teams and rank them
  const allThirdPlace = Object.keys(GROUPS).map((g) => {
    const rows = computeGroupTable(g);
    return rows[2] ? { ...rows[2], group: g } : null;
  }).filter(Boolean).filter((r) => r.mp > 0)
    .sort((a, b) => b.pts - a.pts || (b.gd - a.gd) || (b.gf - a.gf));

  const allGroupsComplete = Object.keys(GROUPS).every((g) =>
    ALL_GROUP_MATCHES.filter((m) => m.group === g).every((m) => matchResults[m.matchId]?.result)
  );
  const top8ThirdSet = new Set(allThirdPlace.slice(0, 8).map((r) => r.team));

  // Shared table header cols
  const cols = isMobile
    ? ["#", "Team", "MP", "W", "D", "L", "GD", "Pts"]
    : ["#", "Team", "MP", "W", "D", "L", "GF", "GA", "GD", "Pts"];

  function GroupTable({ g }) {
    const rows = computeGroupTable(g);
    const anyPlayed = rows.some((r) => r.mp > 0);
    return (
      <div style={{ ...styles.card, marginBottom: "1rem", padding: isMobile ? "10px 8px" : undefined }}>
        <div style={{ ...styles.cardTitle, marginBottom: "8px" }}>Group {g}</div>
        {!anyPlayed ? (
          <div style={{ fontSize: "12px", color: C.textMuted, fontStyle: "italic", padding: "8px 0" }}>No matches played yet</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? "12px" : "13px" }}>
              <thead>
                <tr style={{ background: C.navy, color: C.white }}>
                  {cols.map((h) => (
                    <th key={h} style={{ padding: isMobile ? "6px 5px" : "7px 10px", textAlign: h === "Team" ? "left" : "center", fontWeight: 700, fontSize: "11px", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const meta = TEAM_META[r.team] || { flag: "un" };
                  const isTop2 = idx < 2;
                  const isThird = idx === 2;
                  const isThirdQ = isThird && top8ThirdSet.has(r.team);
                  const qualifies = isTop2 || isThirdQ;
                  const thirdPending = isThird && !allGroupsComplete;
                  const vals = isMobile
                    ? [r.mp, r.w, r.d, r.l, r.gd >= 0 ? `+${r.gd}` : r.gd, r.pts]
                    : [r.mp, r.w, r.d, r.l, r.gf, r.ga, r.gd >= 0 ? `+${r.gd}` : r.gd, r.pts];
                  return (
                    <tr key={r.team} style={{ borderBottom: `1px solid ${C.border}`, background: qualifies ? "rgba(29,158,117,0.04)" : idx % 2 === 0 ? C.white : "#f8fafc" }}>
                      <td style={{ padding: isMobile ? "7px 5px" : "8px 10px", textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", borderRadius: "50%", fontSize: "11px", fontWeight: 700,
                          background: isTop2 ? C.navy : isThird ? `${C.navy}33` : "transparent",
                          color: isTop2 ? C.white : isThird ? C.navy : C.textMuted,
                        }}>{idx + 1}</span>
                      </td>
                      <td style={{ padding: isMobile ? "7px 5px" : "8px 10px", minWidth: isMobile ? "90px" : "120px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "5px" : "8px" }}>
                          <img src={`https://flagcdn.com/${meta.flag}.svg`} style={{ width: isMobile ? "18px" : "22px", height: isMobile ? "12px" : "15px", borderRadius: "2px", objectFit: "cover", flexShrink: 0 }} />
                          <span style={{ fontWeight: qualifies ? 700 : 400, color: qualifies ? C.navy : C.text, fontSize: isMobile ? "11px" : "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isMobile ? "70px" : "none" }}>{r.team}</span>
                          {!isMobile && isTop2 && <span style={{ fontSize: "10px", color: C.green, fontWeight: 700, flexShrink: 0 }}>↑ R32</span>}
                          {!isMobile && isThirdQ && <span style={{ fontSize: "10px", color: C.green, fontWeight: 700, flexShrink: 0 }}>↑ R32</span>}
                          {!isMobile && thirdPending && !isThirdQ && <span style={{ fontSize: "10px", color: C.textMuted, fontStyle: "italic", flexShrink: 0 }}>?</span>}
                        </div>
                      </td>
                      {vals.map((val, i) => {
                        const isPts = i === vals.length - 1;
                        const isGD = i === vals.length - 2;
                        return (
                          <td key={i} style={{ padding: isMobile ? "7px 5px" : "8px 10px", textAlign: "center",
                            fontWeight: isPts ? 800 : 400,
                            color: isPts ? C.navy : isGD ? (r.gd > 0 ? C.green : r.gd < 0 ? "#dc2626" : C.textMuted) : C.text,
                          }}>{val}</td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {anyPlayed && isMobile && (
          <div style={{ fontSize: "10px", color: C.textMuted, marginTop: "6px" }}>
            {rows.filter((r, i) => i < 2 && r.mp > 0).map((r) => `${r.team} ↑`).join(" · ")}
            {top8ThirdSet.has(rows[2]?.team) ? ` · ${rows[2].team} ↑(3rd)` : ""}
          </div>
        )}
      </div>
    );
  }

  // 3rd place table
  function ThirdPlaceTable() {
    if (allThirdPlace.length === 0) return null;
    const thirdCols = isMobile
      ? ["#", "Team", "Grp", "MP", "W", "D", "L", "GD", "Pts"]
      : ["#", "Team", "Group", "MP", "W", "D", "L", "GF", "GA", "GD", "Pts"];
    return (
      <div style={{ ...styles.card, marginTop: "1.5rem", padding: isMobile ? "10px 8px" : undefined }}>
        <div style={{ ...styles.cardTitle, marginBottom: "4px" }}>Best 3rd Place — Rankings</div>
        <div style={{ fontSize: "12px", color: C.textMuted, marginBottom: "10px" }}>
          Top 8 advance to Round of 32
          {!allGroupsComplete && " · Rankings provisional — not all groups complete"}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? "12px" : "13px" }}>
            <thead>
              <tr style={{ background: C.navy, color: C.white }}>
                {thirdCols.map((h) => (
                  <th key={h} style={{ padding: isMobile ? "6px 5px" : "7px 10px", textAlign: h === "Team" ? "left" : "center", fontWeight: 700, fontSize: "11px", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allThirdPlace.map((r, idx) => {
                const meta = TEAM_META[r.team] || { flag: "un" };
                const advances = idx < 8;
                const isThirdCutoff = idx === 7; // last advancing team
                const vals = isMobile
                  ? [r.group, r.mp, r.w, r.d, r.l, r.gd >= 0 ? `+${r.gd}` : r.gd, r.pts]
                  : [r.group, r.mp, r.w, r.d, r.l, r.gf, r.ga, r.gd >= 0 ? `+${r.gd}` : r.gd, r.pts];
                return (
                  <>
                    <tr key={r.team} style={{ borderBottom: isThirdCutoff ? "none" : `1px solid ${C.border}`, background: advances ? "rgba(29,158,117,0.04)" : C.white }}>
                      <td style={{ padding: isMobile ? "7px 5px" : "8px 10px", textAlign: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "20px", height: "20px", borderRadius: "50%", fontSize: "11px", fontWeight: 700,
                          background: advances ? C.navy : "transparent",
                          color: advances ? C.white : C.textMuted,
                        }}>{idx + 1}</span>
                      </td>
                      <td style={{ padding: isMobile ? "7px 5px" : "8px 10px", minWidth: isMobile ? "90px" : "120px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "5px" : "8px" }}>
                          <img src={`https://flagcdn.com/${meta.flag}.svg`} style={{ width: isMobile ? "18px" : "22px", height: isMobile ? "12px" : "15px", borderRadius: "2px", objectFit: "cover", flexShrink: 0 }} />
                          <span style={{ fontWeight: advances ? 700 : 400, color: advances ? C.navy : C.text, fontSize: isMobile ? "11px" : "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: isMobile ? "70px" : "none" }}>{r.team}</span>
                          {advances && <span style={{ fontSize: "10px", color: C.green, fontWeight: 700, flexShrink: 0 }}>↑ R32</span>}
                        </div>
                      </td>
                      {vals.map((val, i) => {
                        const isPts = i === vals.length - 1;
                        const isGD = i === vals.length - 2;
                        const isGrp = i === 0;
                        return (
                          <td key={i} style={{ padding: isMobile ? "7px 5px" : "8px 10px", textAlign: "center",
                            fontWeight: isPts ? 800 : isGrp ? 600 : 400,
                            color: isPts ? C.navy : isGD ? (r.gd > 0 ? C.green : r.gd < 0 ? "#dc2626" : C.textMuted) : isGrp ? C.navy : C.text,
                          }}>{val}</td>
                        );
                      })}
                    </tr>
                    {/* Divider line between 8th and 9th */}
                    {isThirdCutoff && (
                      <tr key="divider">
                        <td colSpan={thirdCols.length} style={{ padding: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 8px" }}>
                            <div style={{ flex: 1, height: "2px", background: `linear-gradient(to right, ${C.navy}, ${C.navy}44)`, borderRadius: "1px" }} />
                            <span style={{ fontSize: "10px", fontWeight: 700, color: C.navy, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>ADVANCE CUTOFF</span>
                            <div style={{ flex: 1, height: "2px", background: `linear-gradient(to left, ${C.navy}, ${C.navy}44)`, borderRadius: "1px" }} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "8px" }}>
          Sorted by Pts → GD → GF · Top 8 of 12 third-place teams advance to Round of 32
        </div>
      </div>
    );
  }

  const playedCount = Object.values(matchResults).filter((r) => r.result).length;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={{ ...styles.card, background: C.navy, color: C.white, marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "13px", color: C.gold, fontWeight: 600, marginBottom: "4px" }}>STANDINGS</div>
        <div style={{ fontSize: "16px", fontWeight: 700 }}>FIFA World Cup 2026 — Group Stage</div>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
          {playedCount} of {ALL_GROUP_MATCHES.length} group matches played
          {allGroupsComplete && " · All groups complete"}
        </div>
      </div>

      {/* All 12 group tables */}
      {Object.keys(GROUPS).map((g) => <GroupTable key={g} g={g} />)}

      {/* 3rd place table */}
      <ThirdPlaceTable />

      {!isMobile && (
        <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "0.5rem", marginBottom: "1rem" }}>
          ↑ R32 = qualified for Round of 32 · Sorted by Pts → GD → GF
        </div>
      )}
    </div>
  );
}

function ResultsPage({ matchResultsCache = [], koResultsCache = [] }) {
  const [matchResults, setMatchResults] = useState({});
  const [koResults, setKoResults] = useState({});
  const [loading, setLoading] = useState(true);
  const koUnderway = koResultsCache.some((r) => r.result);
  const [activeTab, setActiveTab] = useState(koUnderway ? "knockout" : "group");
  const [activeGroup, setActiveGroup] = useState("A");
  const [resultsViewMode, setResultsViewMode] = useState("group");

  useEffect(() => {
    // Use cached data from App level — no fetch needed
    const mrMap = {};
    matchResultsCache.filter((r) => r.stage === "group").forEach((r) => (mrMap[r.match_id] = r));
    setMatchResults(mrMap);
    const koMap = {};
    koResultsCache.forEach((r) => (koMap[r.match_id] = r));
    setKoResults(koMap);
    setLoading(false);
  }, [matchResultsCache, koResultsCache]);

  if (loading) return <Spinner />;

  const groupMatches = ALL_GROUP_MATCHES.filter((m) => m.group === activeGroup);

  function ScoreDisplay({ result, score1, score2, team1, team2 }) {
    if (!result) return <span style={{ fontSize: "13px", color: C.textMuted, fontStyle: "italic" }}>—</span>;
    const winner = result === "team1" ? team1 : result === "team2" ? team2 : null;
    const scoreStr = score1 !== null && score1 !== undefined && score2 !== null && score2 !== undefined
      ? `${score1} – ${score2}`
      : result === "draw" ? "Draw" : `${winner} win`;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
        <span style={{ fontSize: "14px", fontWeight: 800, color: C.navy }}>{scoreStr}</span>
        {result === "draw" && (
          <span style={{
            fontSize: "10px", fontWeight: 700, color: "#92400e",
            background: "#fef3c7", border: "1px solid #fcd34d",
            borderRadius: "4px", padding: "1px 7px", letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}>Draw</span>
        )}
        {result !== "draw" && <span style={{ fontSize: "10px", color: "#1D9E75", fontWeight: 600 }}>{winner}</span>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={{ ...styles.card, background: C.navy, color: C.white, marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "13px", color: C.gold, fontWeight: 600, marginBottom: "4px" }}>MATCH RESULTS</div>
        <div style={{ fontSize: "16px", fontWeight: 700 }}>FIFA World Cup 2026</div>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
          {Object.values(matchResults).filter((r) => r.result).length} of {ALL_GROUP_MATCHES.length} group matches played
          {Object.values(koResults).filter((r) => r.result).length > 0 && ` · ${Object.values(koResults).filter((r) => r.result).length} knockout results`}
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
        <button style={styles.tab(activeTab === "group")} onClick={() => setActiveTab("group")}>Group Stage</button>
        <button style={styles.tab(activeTab === "knockout")} onClick={() => setActiveTab("knockout")}>Knockout</button>
      </div>

      {/* ── GROUP STAGE ── */}
      {activeTab === "group" && (
        <>
          {/* View mode toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "1rem" }}>
            <button onClick={() => setResultsViewMode("date")} style={{
              padding: "5px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              border: resultsViewMode === "date" ? `2px solid ${C.navy}` : `1px solid ${C.border}`,
              background: resultsViewMode === "date" ? C.navy : C.white,
              color: resultsViewMode === "date" ? C.white : C.text,
            }}>📅 By Date</button>
            <button onClick={() => setResultsViewMode("group")} style={{
              padding: "5px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              border: resultsViewMode === "group" ? `2px solid ${C.navy}` : `1px solid ${C.border}`,
              background: resultsViewMode === "group" ? C.navy : C.white,
              color: resultsViewMode === "group" ? C.white : C.text,
            }}>By Group</button>
          </div>

          {/* ── DATE VIEW ── */}
          {resultsViewMode === "date" && (() => {
            const today = new Date();
            const todayStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" }).replace(/\s+/, " ");
            const byDate = {};
            ALL_GROUP_MATCHES.forEach((m) => {
              if (!byDate[m.date]) byDate[m.date] = [];
              byDate[m.date].push(m);
            });
            const pg = "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)";
            const hasTodayDate = Object.keys(byDate).includes(todayStr);
            return (
              <div>
                {/* Scrollable results list — auto-scrolls to today on mount */}
                <div
                  id="results-date-scroll"
                  style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "4px" }}
                >
                {Object.keys(byDate).map((date) => {
                  const isToday = date === todayStr;
                  const matches = byDate[date];
                  const playedCount = matches.filter((m) => matchResults[m.matchId]?.result).length;
                  return (
                    <div key={date} id={`results-date-${date.replace(" ", "-")}`} style={{ marginBottom: "1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <span style={{
                          fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
                          padding: isToday ? "3px 10px" : "2px 8px", borderRadius: "6px",
                          background: isToday ? C.navy : "transparent",
                          color: isToday ? C.gold : C.navy,
                          border: isToday ? `1px solid ${C.navy}` : `1px solid ${C.border}`,
                        }}>
                          {isToday ? `📅 Today — ${date}` : date}
                        </span>
                        <span style={{ fontSize: "11px", color: playedCount === matches.length && playedCount > 0 ? C.green : C.textMuted, fontWeight: playedCount === matches.length && playedCount > 0 ? 700 : 400 }}>
                          {playedCount}/{matches.length} played{playedCount === matches.length && playedCount > 0 ? " ✓" : ""}
                        </span>
                        <div style={{ flex: 1, height: "1px", background: C.border }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {matches.map((m) => {
                          const res = matchResults[m.matchId];
                          const played = !!res?.result;
                          const meta1 = TEAM_META[m.team1] || { flag: "un", border: "#999" };
                          const meta2 = TEAM_META[m.team2] || { flag: "un", border: "#999" };
                          return (
                            <div key={m.matchId} style={{ ...styles.card, marginBottom: 0, padding: "10px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                                <span style={{ fontSize: "10px", fontWeight: 700, color: C.white, background: C.navy, borderRadius: "4px", padding: "1px 7px", letterSpacing: "0.04em" }}>GROUP {m.group}</span>
                                {!played && <span style={{ fontSize: "11px", color: C.textMuted }}>{m.time}</span>}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "6px",
                                  border: `1px solid ${played && res.result === "team1" ? "#1D9E75" : C.border}`,
                                  background: played && res.result === "team1" ? "rgba(29,158,117,0.06)" : C.white,
                                  position: "relative", overflow: "hidden", minWidth: 0,
                                }}>
                                  <img src={`https://flagcdn.com/${meta1.flag}.svg`} style={{ width: "22px", height: "15px", borderRadius: "2px", objectFit: "cover", flexShrink: 0, opacity: played && res.result === "team2" ? 0.4 : 1 }} />
                                  <span style={{ fontSize: "13px", fontWeight: played && res.result === "team1" ? 700 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    textDecoration: played && res.result === "team2" ? "line-through" : "none",
                                    color: played && res.result === "team2" ? C.textMuted : C.text,
                                  }}>{m.team1}</span>
                                  {played && res.result === "team1" && (
                                    <div style={{ position: "absolute", right: "8px", top: 0, bottom: 0, width: "60px", display: "flex", gap: "3px", pointerEvents: "none", alignItems: "stretch" }}>
                                      <div style={{ flex: 1, background: meta1.c1, clipPath: pg }} />
                                      <div style={{ flex: 1, background: meta1.c2, clipPath: pg }} />
                                      <div style={{ flex: 1, background: meta1.c3, clipPath: pg }} />
                                    </div>
                                  )}
                                </div>
                                <div style={{ flexShrink: 0, textAlign: "center", minWidth: "80px" }}>
                                  {played ? (
                                    <ScoreDisplay result={res.result} score1={res.score1} score2={res.score2} team1={m.team1} team2={m.team2} />
                                  ) : (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                      <span style={{ fontSize: "12px", color: C.textMuted }}>vs</span>
                                    </div>
                                  )}
                                </div>
                                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "6px",
                                  border: `1px solid ${played && res.result === "team2" ? "#1D9E75" : C.border}`,
                                  background: played && res.result === "team2" ? "rgba(29,158,117,0.06)" : C.white,
                                  position: "relative", overflow: "hidden", minWidth: 0,
                                }}>
                                  <img src={`https://flagcdn.com/${meta2.flag}.svg`} style={{ width: "22px", height: "15px", borderRadius: "2px", objectFit: "cover", flexShrink: 0, opacity: played && res.result === "team1" ? 0.4 : 1 }} />
                                  <span style={{ fontSize: "13px", fontWeight: played && res.result === "team2" ? 700 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    textDecoration: played && res.result === "team1" ? "line-through" : "none",
                                    color: played && res.result === "team1" ? C.textMuted : C.text,
                                  }}>{m.team2}</span>
                                  {played && res.result === "team2" && (
                                    <div style={{ position: "absolute", right: "8px", top: 0, bottom: 0, width: "60px", display: "flex", gap: "3px", pointerEvents: "none", alignItems: "stretch" }}>
                                      <div style={{ flex: 1, background: meta2.c1, clipPath: pg }} />
                                      <div style={{ flex: 1, background: meta2.c2, clipPath: pg }} />
                                      <div style={{ flex: 1, background: meta2.c3, clipPath: pg }} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                </div>
                {hasTodayDate && (
                  <AutoScrollToToday containerId="results-date-scroll" targetId={`results-date-${todayStr.replace(" ", "-")}`} />
                )}
              </div>
            );
          })()}

          {/* ── GROUP VIEW ── */}
          {resultsViewMode === "group" && (<div>
          {/* Group selector */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "1.25rem" }}>
            {Object.keys(GROUPS).map((g) => {
              const gMatches = ALL_GROUP_MATCHES.filter((m) => m.group === g);
              const played = gMatches.filter((m) => matchResults[m.matchId]?.result).length;
              const done = played === gMatches.length;
              return (
                <button key={g} onClick={() => setActiveGroup(g)} style={{
                  padding: "6px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  border: activeGroup === g ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
                  background: activeGroup === g ? C.navy : C.white,
                  color: activeGroup === g ? C.white : C.text,
                  position: "relative",
                }}>
                  {g}
                  {done && <span style={{ marginLeft: "4px", fontSize: "10px", color: activeGroup === g ? C.gold : C.green }}>✓</span>}
                  {!done && played > 0 && <span style={{ marginLeft: "4px", fontSize: "10px", color: activeGroup === g ? "rgba(255,255,255,0.6)" : C.textMuted }}>{played}/6</span>}
                </button>
              );
            })}
          </div>

          {/* Match results card */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Group {activeGroup} — Results</div>
            {groupMatches.map((m, idx) => {
              const prevMatch = groupMatches[idx - 1];
              const showDate = idx === 0 || prevMatch?.date !== m.date;
              const res = matchResults[m.matchId];
              const played = !!res?.result;
              const meta1 = TEAM_META[m.team1] || { flag: "un", border: "#999" };
              const meta2 = TEAM_META[m.team2] || { flag: "un", border: "#999" };
              const pg = "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)";
              return (
                <div key={m.matchId}>
                  {showDate && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0 4px", marginTop: idx > 0 ? "8px" : 0 }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.date}</span>
                      <div style={{ flex: 1, height: "1px", background: C.border }} />
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0" }}>
                    {/* Team 1 */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "6px",
                      border: `1px solid ${played && res.result === "team1" ? "#1D9E75" : C.border}`,
                      background: played && res.result === "team1" ? "rgba(29,158,117,0.06)" : C.white,
                      position: "relative", overflow: "hidden", minWidth: 0,
                    }}>
                      <img src={`https://flagcdn.com/${meta1.flag}.svg`} style={{ width: "22px", height: "15px", borderRadius: "2px", objectFit: "cover", flexShrink: 0, opacity: played && res.result === "team2" ? 0.4 : 1 }} />
                      <span style={{ fontSize: "13px", fontWeight: played && res.result === "team1" ? 700 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        textDecoration: played && res.result === "team2" ? "line-through" : "none",
                        color: played && res.result === "team2" ? C.textMuted : C.text,
                      }}>{m.team1}</span>
                      {played && res.result === "team1" && (
                        <div style={{ position: "absolute", right: "8px", top: 0, bottom: 0, width: "60px", display: "flex", gap: "3px", pointerEvents: "none", alignItems: "stretch" }}>
                          <div style={{ flex: 1, background: meta1.c1, clipPath: pg }} />
                          <div style={{ flex: 1, background: meta1.c2, clipPath: pg }} />
                          <div style={{ flex: 1, background: meta1.c3, clipPath: pg }} />
                        </div>
                      )}
                    </div>

                    {/* Score / time */}
                    <div style={{ flexShrink: 0, textAlign: "center", minWidth: "80px" }}>
                      {played ? (
                        <ScoreDisplay result={res.result} score1={res.score1} score2={res.score2} team1={m.team1} team2={m.team2} />
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: C.textMuted }}>vs</span>
                          <span style={{ fontSize: "11px", color: C.textMuted }}>{m.time}</span>
                        </div>
                      )}
                    </div>

                    {/* Team 2 */}
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "6px",
                      border: `1px solid ${played && res.result === "team2" ? "#1D9E75" : C.border}`,
                      background: played && res.result === "team2" ? "rgba(29,158,117,0.06)" : C.white,
                      position: "relative", overflow: "hidden", minWidth: 0,
                    }}>
                      <img src={`https://flagcdn.com/${meta2.flag}.svg`} style={{ width: "22px", height: "15px", borderRadius: "2px", objectFit: "cover", flexShrink: 0, opacity: played && res.result === "team1" ? 0.4 : 1 }} />
                      <span style={{ fontSize: "13px", fontWeight: played && res.result === "team2" ? 700 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        textDecoration: played && res.result === "team1" ? "line-through" : "none",
                        color: played && res.result === "team1" ? C.textMuted : C.text,
                      }}>{m.team2}</span>
                      {played && res.result === "team2" && (
                        <div style={{ position: "absolute", right: "8px", top: 0, bottom: 0, width: "60px", display: "flex", gap: "3px", pointerEvents: "none", alignItems: "stretch" }}>
                          <div style={{ flex: 1, background: meta2.c1, clipPath: pg }} />
                          <div style={{ flex: 1, background: meta2.c2, clipPath: pg }} />
                          <div style={{ flex: 1, background: meta2.c3, clipPath: pg }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
          )}
        </>
      )}

      {/* ── KNOCKOUT ── */}
      {activeTab === "knockout" && (
        <div>
          {Object.values(koResults).filter((r) => r.result).length === 0 ? (
            <div style={{ ...styles.card, textAlign: "center", padding: "2.5rem 2rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⏳</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: C.navy, marginBottom: "6px" }}>Knockout stage not yet started</div>
              <div style={{ fontSize: "13px", color: C.textMuted }}>Results will appear here as matches are played.</div>
            </div>
          ) : KNOCKOUT_ROUNDS.map(({ round, label, points }) => {
            const slots = Object.entries(koResults)
              .filter(([id]) => id.startsWith(round + "_"))
              .sort(([a], [b]) => parseInt(a.split("_")[1]) - parseInt(b.split("_")[1]));
            if (slots.length === 0) return null;
            return (
              <div key={round} style={styles.card}>
                <div style={styles.cardTitle}>
                  {label}
                  <span style={styles.badge(C.navy, `${C.gold}33`)}>+{points} pts</span>
                  <span style={{ fontSize: "12px", color: C.textMuted, fontWeight: 400, marginLeft: "auto" }}>
                    {slots.filter(([, r]) => r.result).length}/{slots.length} played
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {slots.map(([slotId, slot]) => {
                    const played = !!slot.result;
                    const winner = played ? (slot.result === "team1" ? slot.team1 : slot.team2) : null;
                    const meta1 = TEAM_META[slot.team1] || { flag: "un", border: "#999" };
                    const meta2 = TEAM_META[slot.team2] || { flag: "un", border: "#999" };
                    const pg = "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)";
                    if (!slot.team1 && !slot.team2) return null;
                    return (
                      <div key={slotId}>
                        {/* Match header */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {SLOT_META[slotId] ? `Match ${SLOT_META[slotId].matchNum}` : slotId}
                          </span>
                          {SLOT_META[slotId] && <>
                            <span style={{ fontSize: "10px", color: C.navy, fontWeight: 600 }}>{SLOT_META[slotId].date}</span>
                            <span style={{ fontSize: "10px", color: C.textMuted }}>{SLOT_META[slotId].time}</span>
                            <span style={{ fontSize: "10px", color: C.textMuted }}>·</span>
                            <span style={{ fontSize: "10px", color: C.textMuted }}>{SLOT_META[slotId].venue}</span>
                          </>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {/* Team 1 */}
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "6px",
                          border: `1px solid ${winner === slot.team1 ? "#1D9E75" : C.border}`,
                          background: winner === slot.team1 ? "rgba(29,158,117,0.06)" : C.white,
                          position: "relative", overflow: "hidden", minWidth: 0,
                        }}>
                          <img src={`https://flagcdn.com/${meta1.flag}.svg`} style={{ width: "22px", height: "15px", borderRadius: "2px", objectFit: "cover", flexShrink: 0, opacity: winner === slot.team2 ? 0.4 : 1 }} />
                          <span style={{ fontSize: "13px", fontWeight: winner === slot.team1 ? 700 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            textDecoration: winner === slot.team2 ? "line-through" : "none",
                            color: winner === slot.team2 ? C.textMuted : C.text,
                          }}>{slot.team1 || "TBD"}</span>
                          {winner === slot.team1 && <span style={{ fontSize: "11px", fontWeight: 700, color: "#1D9E75", flexShrink: 0, marginLeft: "auto", zIndex: 1, position: "relative", paddingRight: "70px" }}>Winner ✓</span>}
                          {winner === slot.team1 && (
                            <div style={{ position: "absolute", right: "8px", top: 0, bottom: 0, width: "60px", display: "flex", gap: "3px", pointerEvents: "none", alignItems: "stretch" }}>
                              <div style={{ flex: 1, background: meta1.c1, clipPath: pg }} />
                              <div style={{ flex: 1, background: meta1.c2, clipPath: pg }} />
                              <div style={{ flex: 1, background: meta1.c3, clipPath: pg }} />
                            </div>
                          )}
                        </div>
                        {/* Score / vs */}
                        <div style={{ flexShrink: 0, textAlign: "center", minWidth: "60px" }}>
                          {played && slot.score1 !== null && slot.score1 !== undefined ? (
                            <span style={{ fontSize: "14px", fontWeight: 800, color: C.navy }}>{slot.score1} – {slot.score2}</span>
                          ) : (
                            <span style={{ fontSize: "12px", color: C.textMuted }}>{played ? "✓" : "vs"}</span>
                          )}
                        </div>
                        {/* Team 2 */}
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "6px",
                          border: `1px solid ${winner === slot.team2 ? "#1D9E75" : C.border}`,
                          background: winner === slot.team2 ? "rgba(29,158,117,0.06)" : C.white,
                          position: "relative", overflow: "hidden", minWidth: 0,
                        }}>
                          <img src={`https://flagcdn.com/${meta2.flag}.svg`} style={{ width: "22px", height: "15px", borderRadius: "2px", objectFit: "cover", flexShrink: 0, opacity: winner === slot.team1 ? 0.4 : 1 }} />
                          <span style={{ fontSize: "13px", fontWeight: winner === slot.team2 ? 700 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            textDecoration: winner === slot.team1 ? "line-through" : "none",
                            color: winner === slot.team1 ? C.textMuted : C.text,
                          }}>{slot.team2 || "TBD"}</span>
                          {winner === slot.team2 && <span style={{ fontSize: "11px", fontWeight: 700, color: "#1D9E75", flexShrink: 0, marginLeft: "auto", zIndex: 1, position: "relative", paddingRight: "70px" }}>Winner ✓</span>}
                          {winner === slot.team2 && (
                            <div style={{ position: "absolute", right: "8px", top: 0, bottom: 0, width: "60px", display: "flex", gap: "3px", pointerEvents: "none", alignItems: "stretch" }}>
                              <div style={{ flex: 1, background: meta2.c1, clipPath: pg }} />
                              <div style={{ flex: 1, background: meta2.c2, clipPath: pg }} />
                              <div style={{ flex: 1, background: meta2.c3, clipPath: pg }} />
                            </div>
                          )}
                        </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UserGuide({ embedded = false }) {
  const sections = [
    {
      title: "Overview",
      items: [
        "TMA Challenge is a World Cup 2026 prediction competition covering all 48 teams, 12 groups, and the full knockout bracket.",
        "There are two stages: Group Stage (picks before June 11) and Knockout (picks before the Round of 32 begins around July 1).",
        "Your total score combines Group Stage and Knockout points. The leaderboard updates automatically as match results are entered.",
      ],
    },
    {
      title: "Group Stage picks",
      items: [
        "For each of the 72 group stage matches, pick Team 1, Draw, or Team 2. Picks save instantly on click — no save button needed.",
        "The Group Stage tab opens in 'By Date' view by default, showing today's matches at the top. Switch to 'By Group' using the toggle if you prefer browsing by group.",
        "After picking all 6 matches in a group, 1st and 2nd place standings are auto-filled when clear. If teams are tied, a manual tiebreaker dropdown appears.",
        "You must also pick the 8 best 3rd-place teams that you think will qualify for the Round of 32.",
      ],
    },
    {
      title: "Group Stage scoring",
      items: [
        "Correct match result (win/draw/loss): +1 point per match.",
        "Correct group winner (1st place): +4 points.",
        "Correct group runner-up (2nd place): +3 points.",
        "Correct top-2 team but wrong position (picked 1st but finished 2nd, or vice versa): +2 points.",
        "Each correct 3rd-place qualifier pick: +1 point (8 picks, max 8 bonus points). A team earns you +1 if they qualify for the Round of 32 in any position — 1st, 2nd, or as one of the best 8 3rd-place teams. The Results tab shows live group standings with ↑ R32 badges indicating who has qualified.",
        "Deadline: All Group Stage picks lock before the first match on June 11, 2026.",
      ],
    },
    {
      title: "Knockout picks",
      items: [
        "The Knockout stage opens after the group stage and the full 32-team bracket is published.",
        "Pick a winner for all 31 matches — Round of 32 through the Final. As you make picks, later rounds fill in dynamically based on your selections.",
        "Knockout picks save automatically as you click, just like Group Stage picks. A \"Save All\" backup button is also available at the bottom if needed.",
        "Deadline: All 31 Knockout picks must be saved before the Round of 32 begins (around July 1, 2026). Picks lock at that point and cannot be changed.",
      ],
    },
    {
      title: "Knockout scoring",
      items: [
        "Round of 32 correct pick: +2 points.",
        "Round of 16 correct pick: +4 points.",
        "Quarterfinals correct pick: +6 points.",
        "Semifinals correct pick: +8 points.",
        "Final correct pick: +10 points.",
        "A team must be in the match to earn points — if you picked a team that didn't make it that far, no points are awarded regardless of later results.",
      ],
    },
    {
      title: "Leaderboard and tiebreakers",
      items: [
        "The leaderboard ranks all participants by total points (Group Stage + Knockout), updating automatically as results are entered.",
        "Your personal stats — rank, total points, Group Stage score, Knockout score — appear highlighted at the top of the leaderboard.",
        "Tiebreaker: if two players have the same total points, the player with more correct picks (total right answers) ranks higher.",
        "Click any player's row on the leaderboard (after Group Stage locks) to view their full picks with result feedback.",
      ],
    },
    {
      title: "Results tab",
      items: [
        "The Results tab shows all group stage and knockout match results as they are entered.",
        "Group Stage results open in 'By Date' view by default — today's matches appear at the top. Switch to 'By Group' to see all matches for a specific group including the live standings table.",
        "Group standings appear above the match list for each group, showing points, goal difference, and R32 qualification status.",
        "Drawn matches are highlighted with an amber 'DRAW' badge so the result is easy to spot at a glance.",
      ],
    },
    {
      title: "Insights",
      items: [
        "The Insights tab unlocks after Group Stage picks are locked on June 11.",
        "Group Stage insights show pick distribution (what % of players picked each team or draw per match), consensus ratings, and group standings predictions across all 12 groups.",
        "Insights also open in 'By Date' view — today's matches appear at the top with full pick distribution bars. Switch to 'By Group' for the traditional group-by-group view.",
        "Knockout insights unlock after the Round of 32 begins and show bracket pick popularity round by round.",
        "Insights are hidden until picks are locked to prevent copying — everyone picks independently first.",
      ],
    },
    {
      title: "Tips",
      items: [
        "Group Stage picks save automatically on every click — it is safe to navigate away at any time and come back.",
        "Knockout picks must be saved explicitly with the Save button — don't forget to hit it before the deadline.",
        "Use the 'By Date' view on match days to quickly find today's fixtures and check your picks without scrolling through all 12 groups.",
        "Check the Insights tab after June 11 to see how your picks compare to the rest of the group.",
        "The bracket fills in dynamically as you make Knockout picks — you can follow your predicted path all the way to the Final before saving.",
      ],
    },
  ];

  const guideContent = (
    <>
      {!embedded && (
        <div style={{ background: C.navy, borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "22px", fontWeight: 800, color: C.gold, marginBottom: "0.5rem" }}>TMA Challenge — User Guide</div>
          <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>Everything you need to know to compete</div>
        </div>
      )}
      {sections.map((sec) => (
        <div key={sec.title} style={{ ...styles.card, ...(embedded ? { marginBottom: "1rem" } : {}) }}>
          <div style={styles.cardTitle}>{sec.title}</div>
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            {sec.items.map((item, i) => (
              <li key={i} style={{ fontSize: "14px", color: C.text, marginBottom: "8px", lineHeight: 1.6 }}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );

  return embedded ? guideContent : <div style={styles.container}>{guideContent}</div>;
}


function LeagueRow({ league, members, onUpdate, onDelete, onCopy, onThemeChange }) {
  const [editCode, setEditCode] = useState(league.invite_code);
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: "10px", marginBottom: "1rem", overflow: "hidden" }}>
      <div style={{ background: C.navy, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontSize: "15px", fontWeight: 700, color: C.gold }}>{league.name}</span>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginLeft: "10px" }}>{members.length} member{members.length !== 1 ? "s" : ""}</span>
        </div>
        <button style={{ ...styles.btnDanger, fontSize: "12px", padding: "3px 10px" }} onClick={onDelete}>Delete</button>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <label style={{ ...styles.label, margin: 0, whiteSpace: "nowrap" }}>Invite code:</label>
          <input style={{ ...styles.input, flex: 1 }} value={editCode} onChange={(e) => setEditCode(e.target.value)} />
          <button style={{ ...styles.btnPrimary, flexShrink: 0, padding: "6px 12px", fontSize: "12px" }} onClick={() => onUpdate(editCode)}>Save</button>
          <button style={{ padding: "6px 10px", borderRadius: "6px", fontSize: "12px", border: `1px solid ${C.border}`, background: C.white, cursor: "pointer" }} onClick={() => onCopy(editCode)}>Copy</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <label style={{ ...styles.label, margin: 0, whiteSpace: "nowrap" }}>Theme:</label>
          <select style={{ ...styles.select, flex: 1, fontSize: "12px" }} value={league.theme || "default"} onChange={(e) => onThemeChange(e.target.value)}>
            <option value="default">Default — Navy / Gold</option>
            <option value="fsf">FSF English Muffin Cup — Red / Gold</option>
          </select>
        </div>
        {members.length === 0 ? (
          <div style={{ fontSize: "12px", color: C.textMuted, fontStyle: "italic" }}>No members yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {members.map((m) => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontWeight: 600 }}>{m.display_name}</span>
                <span style={{ color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis" }}>{m.email}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Leagues admin tab — create and manage leagues
function LeaguesAdminTab() {
  const [leagues, setLeagues] = useState([]);
  const [members, setMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newTheme, setNewTheme] = useState("default");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    async function load() {
      const [{ data: lg }, { data: profiles }] = await Promise.all([
        supabase.from("leagues").select("*").order("created_at"),
        supabase.from("profiles").select("id,display_name,email,league_id"),
      ]);
      setLeagues(lg || []);
      // Build member map per league
      const mmap = {};
      (profiles||[]).forEach((p) => {
        if (!p.league_id) return;
        if (!mmap[p.league_id]) mmap[p.league_id] = [];
        mmap[p.league_id].push(p);
      });
      setMembers(mmap);
      setLoading(false);
    }
    load();
  }, []);

  async function createLeague() {
    if (!newName.trim() || !newCode.trim()) return;
    setSaving(true);
    const code = newCode.trim().toLowerCase().replace(/\s+/g, "-");
    const { data, error } = await supabase.from("leagues")
      .insert({ name: newName.trim(), invite_code: code, theme: newTheme })
      .select().single();
    if (error) {
      setMsg({ type: "error", text: error.message.includes("unique") ? "That invite code is already taken." : error.message });
    } else {
      setLeagues((prev) => [...prev, data]);
      setMembers((prev) => ({ ...prev, [data.id]: [] }));
      setNewName(""); setNewCode(""); setNewTheme("default");
      setMsg({ type: "success", text: `League "${data.name}" created with code "${data.invite_code}"` });
    }
    setSaving(false);
  }

  async function updateCode(leagueId, newInviteCode) {
    const code = newInviteCode.trim().toLowerCase().replace(/\s+/g, "-");
    const { error } = await supabase.from("leagues").update({ invite_code: code }).eq("id", leagueId);
    if (error) {
      setMsg({ type: "error", text: "Could not update invite code — it may already be in use." });
    } else {
      setLeagues((prev) => prev.map((l) => l.id === leagueId ? { ...l, invite_code: code } : l));
      setMsg({ type: "success", text: "Invite code updated." });
    }
  }

  async function updateTheme(leagueId, theme) {
    const { error } = await supabase.from("leagues").update({ theme }).eq("id", leagueId);
    if (error) {
      setMsg({ type: "error", text: "Could not update theme." });
    } else {
      setLeagues((prev) => prev.map((l) => l.id === leagueId ? { ...l, theme } : l));
      setMsg({ type: "success", text: `Theme updated to "${theme}". Switch to this league on the leaderboard to preview.` });
    }
  }

  async function deleteLeague(leagueId, leagueName) {
    if (!window.confirm(`Delete league "${leagueName}"? Members will be unassigned but their picks are kept.`)) return;
    await supabase.from("profiles").update({ league_id: null }).eq("league_id", leagueId);
    await supabase.from("leagues").delete().eq("id", leagueId);
    setLeagues((prev) => prev.filter((l) => l.id !== leagueId));
    setMembers((prev) => { const n = { ...prev }; delete n[leagueId]; return n; });
    setMsg({ type: "success", text: `League "${leagueName}" deleted.` });
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <p style={{ fontSize: "13px", color: C.textMuted, marginTop: 0 }}>
        Create leagues and share their invite codes with each group. Users enter the code when registering.
      </p>

      <Alert type={msg.type} msg={msg.text} />

      {/* Create new league */}
      <div style={{ background: `${C.navy}08`, borderRadius: "8px", padding: "14px", marginBottom: "1.5rem", border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: C.navy, marginBottom: "10px" }}>Create new league</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
          <div>
            <label style={styles.label}>League name</label>
            <input style={styles.input} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Work Friends" />
          </div>
          <div>
            <label style={styles.label}>Invite code</label>
            <input style={styles.input} value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="e.g. workmates26" />
          </div>
        </div>
        <div style={{ marginBottom: "8px" }}>
          <label style={styles.label}>Theme</label>
          <select style={{ ...styles.select, width: "100%", fontSize: "13px" }} value={newTheme} onChange={(e) => setNewTheme(e.target.value)}>
            <option value="default">Default — Navy / Gold</option>
            <option value="fsf">FSF English Muffin Cup — Red / Gold</option>
          </select>
        </div>
        <button style={styles.btnPrimary} onClick={createLeague} disabled={saving || !newName.trim() || !newCode.trim()}>
          {saving ? "Creating..." : "Create League"}
        </button>
      </div>

      {/* Existing leagues */}
      {leagues.length === 0 ? (
        <div style={{ fontSize: "13px", color: C.textMuted, fontStyle: "italic" }}>No leagues yet — create one above.</div>
      ) : leagues.map((league) => (
        <LeagueRow
          key={league.id}
          league={league}
          members={members[league.id] || []}
          onUpdate={(newCode) => updateCode(league.id, newCode)}
          onDelete={() => deleteLeague(league.id, league.name)}
          onCopy={(code) => { navigator.clipboard?.writeText(code); setMsg({ type: "success", text: "Invite code copied!" }); }}
          onThemeChange={(theme) => updateTheme(league.id, theme)}
        />
      ))}
    </div>
  );
}

// Admin group stage match row — includes score inputs for full tiebreaker calculation
function AdminMatchRow({ m, res, winner, meta1, meta2, pg, onSave, onClear }) {
  const [s1, setS1] = useState(res?.score1 ?? "");
  const [s2, setS2] = useState(res?.score2 ?? "");

  // Derive result from scores if both entered
  function resultFromScores(score1, score2) {
    const n1 = parseInt(score1), n2 = parseInt(score2);
    if (isNaN(n1) || isNaN(n2)) return null;
    if (n1 > n2) return "team1";
    if (n2 > n1) return "team2";
    return "draw";
  }

  function handleScoreChange(side, val) {
    const clean = val.replace(/[^0-9]/g, "").slice(0, 2);
    const newS1 = side === 1 ? clean : s1;
    const newS2 = side === 2 ? clean : s2;
    if (side === 1) setS1(clean); else setS2(clean);
    // Auto-save when both scores are filled
    const result = resultFromScores(newS1, newS2);
    if (result && newS1 !== "" && newS2 !== "") {
      onSave(result, newS1, newS2);
    }
  }

  const scoreInputStyle = {
    width: "38px", textAlign: "center", fontSize: "16px", fontWeight: 700,
    padding: "5px 4px", borderRadius: "6px", border: `1px solid ${C.border}`,
    background: C.white, color: C.navy, outline: "none",
    WebkitAppearance: "none", MozAppearance: "textfield",
  };

  return (
    <div style={{ borderRadius: "8px", border: `1px solid ${winner ? "#1D9E75" : C.border}`,
      background: winner ? "rgba(29,158,117,0.02)" : C.white, overflow: "hidden", marginBottom: "4px" }}>

      {/* Top row: team names + result buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px" }}>
        <span style={{ fontSize: "11px", color: C.textMuted, minWidth: "32px", fontWeight: 600 }}>{m.matchId}</span>

        {/* Team 1 button */}
        <button tabIndex={-1} onClick={() => onSave("team1", s1 || null, s2 || null)} style={{
          flex: 1, display: "flex", alignItems: "center", gap: "8px",
          padding: "7px 10px", borderRadius: "6px", fontSize: "13px", cursor: "pointer",
          textAlign: "left", position: "relative", overflow: "hidden", minWidth: 0,
          border: winner===m.team1 ? `2px solid #1D9E75` : winner && winner!==m.team1 ? `1px solid ${C.border}` : `1px solid ${meta1.border}`,
          background: winner===m.team1 ? "rgba(29,158,117,0.08)" : C.white,
          fontWeight: winner===m.team1 ? 700 : 400,
        }}>
          <img src={`https://flagcdn.com/${meta1.flag}.svg`} style={{ width:"20px",height:"14px",borderRadius:"2px",objectFit:"cover",flexShrink:0,opacity:winner&&winner!==m.team1?0.4:1 }} />
          <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            textDecoration: winner && winner!==m.team1 && winner!=="draw" ? "line-through" : "none",
            color: winner && winner!==m.team1 && winner!=="draw" ? C.textMuted : C.text }}>{m.team1}</span>
          {winner===m.team1 && <span style={{ fontSize:"11px",fontWeight:700,color:"#1D9E75",flexShrink:0,zIndex:1,position:"relative",paddingRight:winner===m.team1?"70px":"8px" }}>Winner ✓</span>}
          {winner===m.team1 && (
            <div style={{ position:"absolute",right:"8px",top:0,bottom:0,width:"60px",display:"flex",gap:"3px",pointerEvents:"none",alignItems:"stretch" }}>
              <div style={{ flex:1,background:meta1.c1,clipPath:pg }} />
              <div style={{ flex:1,background:meta1.c2,clipPath:pg }} />
              <div style={{ flex:1,background:meta1.c3,clipPath:pg }} />
            </div>
          )}
        </button>

        {/* Draw button */}
        <button tabIndex={-1} onClick={() => onSave("draw", s1 || null, s2 || null)} style={{
          padding: "7px 8px", borderRadius: "6px", fontSize: "12px", cursor: "pointer",
          flexShrink: 0, minWidth: "44px", textAlign: "center",
          border: winner==="draw" ? `2px solid #1D9E75` : `1px solid ${C.border}`,
          background: winner==="draw" ? "rgba(29,158,117,0.08)" : C.white,
          fontWeight: winner==="draw" ? 700 : 400,
          color: winner==="draw" ? "#1D9E75" : C.textMuted,
        }}>{winner==="draw" ? "✓" : "D"}</button>

        {/* Team 2 button */}
        <button tabIndex={-1} onClick={() => onSave("team2", s1 || null, s2 || null)} style={{
          flex: 1, display: "flex", alignItems: "center", gap: "8px",
          padding: "7px 10px", borderRadius: "6px", fontSize: "13px", cursor: "pointer",
          textAlign: "left", position: "relative", overflow: "hidden", minWidth: 0,
          border: winner===m.team2 ? `2px solid #1D9E75` : winner && winner!==m.team2 ? `1px solid ${C.border}` : `1px solid ${meta2.border}`,
          background: winner===m.team2 ? "rgba(29,158,117,0.08)" : C.white,
          fontWeight: winner===m.team2 ? 700 : 400,
        }}>
          <img src={`https://flagcdn.com/${meta2.flag}.svg`} style={{ width:"20px",height:"14px",borderRadius:"2px",objectFit:"cover",flexShrink:0,opacity:winner&&winner!==m.team2?0.4:1 }} />
          <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            textDecoration: winner && winner!==m.team2 && winner!=="draw" ? "line-through" : "none",
            color: winner && winner!==m.team2 && winner!=="draw" ? C.textMuted : C.text }}>{m.team2}</span>
          {winner===m.team2 && <span style={{ fontSize:"11px",fontWeight:700,color:"#1D9E75",flexShrink:0,zIndex:1,position:"relative",paddingRight:"70px" }}>Winner ✓</span>}
          {winner===m.team2 && (
            <div style={{ position:"absolute",right:"8px",top:0,bottom:0,width:"60px",display:"flex",gap:"3px",pointerEvents:"none",alignItems:"stretch" }}>
              <div style={{ flex:1,background:meta2.c1,clipPath:pg }} />
              <div style={{ flex:1,background:meta2.c2,clipPath:pg }} />
              <div style={{ flex:1,background:meta2.c3,clipPath:pg }} />
            </div>
          )}
        </button>

        {/* Undo */}
        {winner && (
          <button tabIndex={-1} onClick={() => { onClear(); setS1(""); setS2(""); }} style={{
            fontSize:"11px", fontWeight:600, color:"#dc2626",
            background:"rgba(220,38,38,0.06)", border:"1px solid #fca5a5",
            borderRadius:"5px", cursor:"pointer", flexShrink:0,
            padding:"4px 8px", whiteSpace:"nowrap",
          }}>↩ Undo</button>
        )}
      </div>

      {/* Score row */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px 8px",
        borderTop: `1px solid ${C.border}`, background: "#f8fafc" }}>
        <span style={{ fontSize: "11px", color: C.textMuted, minWidth: "32px" }} />
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <input
            type="number" min="0" max="99" value={s1}
            onChange={(e) => handleScoreChange(1, e.target.value)}
            style={{ ...scoreInputStyle, border: res?.score1 !== null && res?.score1 !== undefined ? `1px solid #1D9E75` : `1px solid ${C.border}` }}
            placeholder="0"
          />
        </div>
        <span style={{ fontSize: "13px", fontWeight: 700, color: C.textMuted, flexShrink: 0 }}>–</span>
        <div style={{ flex: 1 }}>
          <input
            type="number" min="0" max="99" value={s2}
            onChange={(e) => handleScoreChange(2, e.target.value)}
            style={{ ...scoreInputStyle, border: res?.score2 !== null && res?.score2 !== undefined ? `1px solid #1D9E75` : `1px solid ${C.border}` }}
            placeholder="0"
          />
        </div>
        <span style={{ fontSize: "11px", color: C.textMuted, flex: 1 }}>
          {res?.score1 !== null && res?.score1 !== undefined ? `${res.score1}–${res.score2} · auto-sets result` : "enter score to auto-set result"}
        </span>
      </div>
    </div>
  );
}

function AdminMessagesTab({ settings, setSettings, setMsg, styles }) {
  const savedPayload = (() => {
    try { return settings.whats_new_payload ? JSON.parse(settings.whats_new_payload) : null; } catch { return null; }
  })();
  const publishedAt = settings.whats_new_published_at || "";
  const [msgHeader, setMsgHeader] = useState(savedPayload?.header || "");
  const [msgSubtitle, setMsgSubtitle] = useState(savedPayload?.subtitle || "");
  const [msgItems, setMsgItems] = useState(savedPayload?.items?.length ? savedPayload.items : [{ icon: "", title: "", body: "" }]);
  const [previewOpen, setPreviewOpen] = useState(false);

  function updateItem(idx, field, val) {
    setMsgItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  }
  function addItem() {
    if (msgItems.length < 4) setMsgItems((prev) => [...prev, { icon: "", title: "", body: "" }]);
  }
  function removeItem(idx) {
    setMsgItems((prev) => prev.filter((_, i) => i !== idx));
  }
  async function publishMessage() {
    if (!msgHeader.trim()) { setMsg({ type: "error", text: "Header is required." }); return; }
    const payload = JSON.stringify({ header: msgHeader.trim(), subtitle: msgSubtitle.trim(), items: msgItems.filter(it => it.title.trim()) });
    const ts = new Date().toISOString();
    await Promise.all([
      supabase.from("app_settings").upsert({ key: "whats_new_payload", value: payload }, { onConflict: "key" }),
      supabase.from("app_settings").upsert({ key: "whats_new_published_at", value: ts }, { onConflict: "key" }),
    ]);
    setSettings((prev) => ({ ...prev, whats_new_payload: payload, whats_new_published_at: ts }));
    setMsg({ type: "success", text: "Message published! All users will see it on their next visit." });
  }
  async function clearMessage() {
    if (!window.confirm("Clear the current message? Users who haven't seen it won't see it.")) return;
    await Promise.all([
      supabase.from("app_settings").upsert({ key: "whats_new_payload", value: "" }, { onConflict: "key" }),
      supabase.from("app_settings").upsert({ key: "whats_new_published_at", value: "" }, { onConflict: "key" }),
    ]);
    setSettings((prev) => ({ ...prev, whats_new_payload: "", whats_new_published_at: "" }));
    setMsg({ type: "success", text: "Message cleared." });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>
            Compose a message to show all users as a pop-up. Hit Publish to send — every user sees it once on their next visit. Hit Publish again on an existing message to re-send as a reminder.
          </p>
          {publishedAt && (
            <p style={{ fontSize: "12px", color: C.green, margin: "4px 0 0", fontWeight: 600 }}>
              ✓ Currently published: {new Date(publishedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button style={{ ...styles.btnSecondary, fontSize: "12px" }} onClick={() => setPreviewOpen(true)}>👁 Preview</button>
          {publishedAt && <button style={{ fontSize: "12px", fontWeight: 600, color: "#dc2626", background: "rgba(220,38,38,0.06)", border: "1px solid #fca5a5", borderRadius: "6px", cursor: "pointer", padding: "6px 12px" }} onClick={clearMessage}>✕ Clear</button>}
          <button style={{ ...styles.btn, fontSize: "13px" }} onClick={publishMessage}>📢 Publish</button>
        </div>
      </div>

      {/* Header & subtitle */}
      <div style={{ ...styles.card, marginBottom: "1rem" }}>
        <div style={{ fontWeight: 700, fontSize: "13px", color: C.navy, marginBottom: "10px" }}>Header</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div>
            <label style={styles.label}>Title (e.g. "App Update — Jun 28, v1.6")</label>
            <input style={styles.input} value={msgHeader} onChange={(e) => setMsgHeader(e.target.value)} placeholder='App Update — Jun 28, v1.6' />
          </div>
          <div>
            <label style={styles.label}>Subtitle (optional)</label>
            <input style={styles.input} value={msgSubtitle} onChange={(e) => setMsgSubtitle(e.target.value)} placeholder="A few improvements to make your tournament experience better" />
          </div>
        </div>
      </div>

      {/* Message items */}
      <div style={{ ...styles.card, marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <div style={{ fontWeight: 700, fontSize: "13px", color: C.navy }}>Message Items ({msgItems.length}/4)</div>
          {msgItems.length < 4 && (
            <button style={{ ...styles.btnSecondary, fontSize: "12px", padding: "4px 10px" }} onClick={addItem}>+ Add Item</button>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {msgItems.map((item, idx) => (
            <div key={idx} style={{ padding: "12px", borderRadius: "8px", background: `${C.navy}06`, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: C.navy }}>Item {idx + 1}</span>
                {msgItems.length > 1 && (
                  <button onClick={() => removeItem(idx)} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: "0 2px" }}>×</button>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ width: "70px" }}>
                    <label style={styles.label}>Emoji</label>
                    <input style={{ ...styles.input, textAlign: "center", fontSize: "20px" }} value={item.icon} onChange={(e) => updateItem(idx, "icon", e.target.value)} placeholder="⚽" maxLength={4} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Title</label>
                    <input style={styles.input} value={item.title} onChange={(e) => updateItem(idx, "title", e.target.value)} placeholder="Feature or reminder title" />
                  </div>
                </div>
                <div>
                  <label style={styles.label}>Body text</label>
                  <textarea style={{ ...styles.input, resize: "vertical", minHeight: "64px", fontFamily: "inherit", lineHeight: 1.5 }} value={item.body} onChange={(e) => updateItem(idx, "body", e.target.value)} placeholder="Describe the update or reminder in a sentence or two..." />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {previewOpen && (
        <WhatsNewModal
          payload={{ header: msgHeader || "Preview", subtitle: msgSubtitle, items: msgItems.filter(it => it.title.trim()) }}
          onDismiss={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}

function AdminPanel({ onClose, onResultsChange, stage2OpenFromBracket = false }) {
  const [activeTab, setActiveTab] = useState("results");
  const [results, setResults] = useState([]);
  const [standings, setStandings] = useState([]);
  const [settings, setSettings] = useState({});
  const [users, setUsers] = useState([]);
  const [bracket, setBracket] = useState([]);
  const [adminLeagues, setAdminLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [clearKey, setClearKey] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState({ __default__: true });
  function toggleSection(id) {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    const all = {};
    Object.keys(GROUPS).forEach((g) => (all[g] = true));
    return all;
  });
  function toggleGroup(g) {
    setCollapsedGroups((prev) => ({ ...prev, [g]: !prev[g] }));
  }
  function collapseAllGroups() {
    const all = {};
    Object.keys(GROUPS).forEach((g) => (all[g] = true));
    setCollapsedGroups(all);
  }
  function expandAllGroups() {
    setCollapsedGroups({});
  }
  async function loadAll() {
    setLoading(true);
    const [{ data: r },{ data: s },{ data: se },{ data: u },{ data: b },{ data: lg },
           { data: pickCounts }] = await Promise.all([
      supabase.from("match_results").select("*").order("match_id"),
      supabase.from("group_standings").select("*").order("group_code"),
      supabase.from("app_settings").select("*"),
      supabase.from("profiles").select("*, leagues(name)").order("display_name"),
      supabase.from("match_results").select("*").in("stage",["R32","R16","QF","SF","F"]).order("match_id"),
      supabase.from("leagues").select("id,name,theme").order("name"),
      supabase.rpc("get_all_pick_counts"),
    ]);
    setResults(r||[]); 
    // Build standings from group_standings table; supplement with data derivable from bracket
    const rawStandings = s||[];
    const bracketRows = b||[];
    // Build a map of what's in the bracket to pre-fill standings if group_standings is empty
    const bracketTeamMap = {};
    const R32_TO_GROUP = {
      R32_7: { group: "A", pos: "first_place" }, R32_1: { group: "A", pos: "second_place" },
      R32_13: { group: "B", pos: "first_place" },
      R32_4: { group: "C", pos: "first_place" }, R32_3: { group: "C", pos: "second_place" },
      R32_9: { group: "D", pos: "first_place" }, R32_16: { group: "D", pos: "second_place" },
      R32_2: { group: "E", pos: "first_place" }, R32_6: { group: "E", pos: "second_place" },
      R32_3_f: { group: "F", pos: "first_place" }, R32_4_f: { group: "F", pos: "second_place" },
      R32_10: { group: "G", pos: "first_place" },
      R32_12: { group: "H", pos: "first_place" }, R32_14: { group: "H", pos: "second_place" },
      R32_5: { group: "I", pos: "first_place" },
      R32_14_j: { group: "J", pos: "first_place" }, R32_12_j: { group: "J", pos: "second_place" },
      R32_15: { group: "K", pos: "first_place" }, R32_11: { group: "K", pos: "second_place" },
      R32_8: { group: "L", pos: "first_place" },
    };
    // Simpler: just use a direct map of slotId → {group, team1role, team2role}
    const SLOT_GROUP_MAP = [
      { slot: "R32_1",  t1: { g: "A", p: "second_place" }, t2: { g: "B", p: "second_place" } },
      { slot: "R32_2",  t1: { g: "E", p: "first_place"  }, t2: null },
      { slot: "R32_3",  t1: { g: "F", p: "first_place"  }, t2: { g: "C", p: "second_place" } },
      { slot: "R32_4",  t1: { g: "C", p: "first_place"  }, t2: { g: "F", p: "second_place" } },
      { slot: "R32_5",  t1: { g: "I", p: "first_place"  }, t2: null },
      { slot: "R32_6",  t1: { g: "E", p: "second_place" }, t2: { g: "I", p: "second_place" } },
      { slot: "R32_7",  t1: { g: "A", p: "first_place"  }, t2: null },
      { slot: "R32_8",  t1: { g: "L", p: "first_place"  }, t2: null },
      { slot: "R32_9",  t1: { g: "D", p: "first_place"  }, t2: null },
      { slot: "R32_10", t1: { g: "G", p: "first_place"  }, t2: null },
      { slot: "R32_11", t1: { g: "K", p: "second_place" }, t2: { g: "L", p: "second_place" } },
      { slot: "R32_12", t1: { g: "H", p: "first_place"  }, t2: { g: "J", p: "second_place" } },
      { slot: "R32_13", t1: { g: "B", p: "first_place"  }, t2: null },
      { slot: "R32_14", t1: { g: "J", p: "first_place"  }, t2: { g: "H", p: "second_place" } },
      { slot: "R32_15", t1: { g: "K", p: "first_place"  }, t2: null },
      { slot: "R32_16", t1: { g: "D", p: "second_place" }, t2: { g: "G", p: "second_place" } },
    ];
    // Build inferred standings from bracket data
    const inferred = {};
    bracketRows.forEach((br) => {
      const mapping = SLOT_GROUP_MAP.find((m) => m.slot === br.match_id);
      if (!mapping) return;
      if (br.team1 && mapping.t1) {
        if (!inferred[mapping.t1.g]) inferred[mapping.t1.g] = { group_code: mapping.t1.g };
        inferred[mapping.t1.g][mapping.t1.p] = br.team1;
      }
      if (br.team2 && mapping.t2) {
        if (!inferred[mapping.t2.g]) inferred[mapping.t2.g] = { group_code: mapping.t2.g };
        inferred[mapping.t2.g][mapping.t2.p] = br.team2;
      }
    });
    // Merge: DB standings take priority, inferred fills gaps
    const mergedStandings = Object.keys(GROUPS).map((g) => {
      const db = rawStandings.find((s) => s.group_code === g) || {};
      const inf = inferred[g] || {};
      return { group_code: g, ...inf, ...db };
    }).filter((s) => Object.keys(s).length > 1);
    setStandings(mergedStandings.length > 0 ? mergedStandings : rawStandings);
    const sMap = {};
    (se||[]).forEach((x) => (sMap[x.key] = x.value));

    // Build per-user completion stats via SECURITY DEFINER function (bypasses RLS)
    const pickCountMap = {};
    (pickCounts||[]).forEach((row) => (pickCountMap[row.user_id] = row));

    const usersWithStats = (u||[]).map((usr) => {
      const pc = pickCountMap[usr.id] || {};
      return {
        ...usr,
        matchPicks:  Number(pc.match_picks  || 0),
        groupPicks:  Number(pc.group_picks  || 0),
        thirdPicks:  Number(pc.third_picks  || 0),
        s2picks:     Number(pc.s2_picks     || 0),
      };
    });

    setSettings(sMap); setUsers(usersWithStats); setBracket(b||[]); setAdminLeagues(lg||[]);
    setLoading(false);
  }

  async function updateSetting(key, value) {
    await supabase.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    setSettings((p) => ({ ...p, [key]: value }));
    setMsg({ type: "success", text: `"${key}" updated.` });
  }

  // Calculate full group table with pts, GD, GF for all teams in a group
  function calcFullGroupTable(groupCode, allResults) {
    const teams = GROUPS[groupCode];
    const table = {};
    teams.forEach((t) => (table[t] = { pts: 0, gd: 0, gf: 0 }));
    allResults.filter((r) => r.group_code === groupCode && r.result).forEach((r) => {
      const s1 = r.score1 ?? null;
      const s2 = r.score2 ?? null;
      // Points
      if (r.result === "team1") { table[r.team1].pts += 3; }
      else if (r.result === "team2") { table[r.team2].pts += 3; }
      else { table[r.team1].pts += 1; table[r.team2].pts += 1; }
      // Goals — only if scores provided
      if (s1 !== null && s2 !== null) {
        table[r.team1].gf += s1; table[r.team1].gd += (s1 - s2);
        table[r.team2].gf += s2; table[r.team2].gd += (s2 - s1);
      }
    });
    return Object.entries(table)
      .sort((a, b) => b[1].pts - a[1].pts || b[1].gd - a[1].gd || b[1].gf - a[1].gf)
      .map(([team, stats]) => ({ team, ...stats }));
  }

  async function saveGroupResult(m, result, score1 = null, score2 = null) {
    const existing = results.find((r) => r.match_id === m.matchId);
    const data = {
      match_id: m.matchId, stage: "group", group_code: m.group,
      team1: m.team1, team2: m.team2, result,
      score1: score1 !== null ? parseInt(score1) : null,
      score2: score2 !== null ? parseInt(score2) : null,
      updated_at: new Date().toISOString(),
    };
    if (existing) await supabase.from("match_results").update(data).eq("match_id", m.matchId);
    else await supabase.from("match_results").insert(data);
    const updatedResults = results.map((r) => r.match_id === m.matchId ? { ...r, ...data } : r);
    if (!existing) updatedResults.push(data);
    setResults(updatedResults);

    // Auto-calculate standings whenever any result changes
    const groupMatches = ALL_GROUP_MATCHES.filter((gm) => gm.group === m.group);
    const groupResults = updatedResults.filter((r) => r.group_code === m.group && r.result);
    if (groupResults.length === groupMatches.length) {
      const sorted = calcFullGroupTable(m.group, updatedResults);
      const standingsData = {
        first_place: sorted[0].team, second_place: sorted[1].team,
        third_place: sorted[2].team, fourth_place: sorted[3].team,
        is_third_place_qualifier: false, // will be updated below once all 12 groups complete
      };
      await saveGroupStandings(m.group, standingsData);

      // Once all 12 groups are complete, compute and update is_third_place_qualifier flags
      const allGroupsDone = Object.keys(GROUPS).every((g) => {
        const gm = ALL_GROUP_MATCHES.filter((x) => x.group === g);
        return gm.every((x) => updatedResults.find((r) => r.match_id === x.matchId && r.result));
      });
      if (allGroupsDone) {
        // Re-fetch standings to get all groups
        const { data: allSt } = await supabase.from("group_standings").select("*");
        if (allSt) {
          // Compute top-8 3rd place teams
          const thirdTeams = allSt.filter((s) => s.third_place).map((s) => {
            let pts = 0, gd = 0, gf = 0;
            const gMs = ALL_GROUP_MATCHES.filter((x) => x.group === s.group_code);
            gMs.forEach((x) => {
              const r = updatedResults.find((r) => r.match_id === x.matchId);
              if (!r?.result) return;
              const isT1 = x.team1 === s.third_place;
              if (r.result === "draw") pts++;
              else if ((r.result === "team1" && isT1) || (r.result === "team2" && !isT1)) pts += 3;
              if (r.score1 != null) { gf += isT1 ? r.score1 : r.score2; gd += isT1 ? r.score1 - r.score2 : r.score2 - r.score1; }
            });
            return { group_code: s.group_code, team: s.third_place, pts, gd, gf };
          }).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
          const top8 = new Set(thirdTeams.slice(0, 8).map((t) => t.team));
          // Update is_third_place_qualifier for all groups
          for (const s of allSt) {
            if (!s.third_place) continue;
            const qualifier = top8.has(s.third_place);
            if (qualifier !== s.is_third_place_qualifier) {
              await supabase.from("group_standings").update({ is_third_place_qualifier: qualifier }).eq("group_code", s.group_code);
            }
          }
        }
      }
      setMsg({ type: "success", text: `Saved: ${m.team1} ${score1 ?? ""}–${score2 ?? ""} ${m.team2} · Standings auto-updated for Group ${m.group}` });
    } else {
      setMsg({ type: "success", text: `Saved: ${m.team1} ${score1 ?? ""}–${score2 ?? ""} ${m.team2}` });
    }
    // Refresh global results cache so leaderboard scores update immediately
    if (onResultsChange) onResultsChange();
  }

  async function saveGroupStandings(group, data) {
    await supabase.from("group_standings").upsert({ group_code: group, ...data, updated_at: new Date().toISOString() }, { onConflict: "group_code" });
    const newStandings = (() => {
      const idx = standings.findIndex((s) => s.group_code === group);
      if (idx >= 0) { const n = [...standings]; n[idx] = { ...n[idx], group_code: group, ...data }; return n; }
      return [...standings, { group_code: group, ...data }];
    })();
    setStandings(newStandings);
    await updateBracketFromStandings(newStandings);
    if (onResultsChange) onResultsChange();
    setMsg({ type: "success", text: `Group ${group} standings saved. R32 slots updated where possible.` });
  }

  async function updateBracketFromStandings(currentStandings) {
    const stMap = {};
    currentStandings.forEach((s) => (stMap[s.group_code] = s));
    function resolveTeam(source) {
      if (!source) return null;
      if (source.startsWith("1")) return stMap[source[1]]?.first_place || null;
      if (source.startsWith("2")) return stMap[source[1]]?.second_place || null;
      return null;
    }
    const R32_TEMPLATE = [
      ["R32_1",  "2A", "2B"], ["R32_2",  "1E", null], ["R32_3",  "1F", "2C"],
      ["R32_4",  "1C", "2F"], ["R32_5",  "1I", null], ["R32_6",  "2E", "2I"],
      ["R32_7",  "1A", null], ["R32_8",  "1L", null], ["R32_9",  "1D", null],
      ["R32_10", "1G", null], ["R32_11", "2K", "2L"], ["R32_12", "1H", "2J"],
      ["R32_13", "1B", null], ["R32_14", "1J", "2H"], ["R32_15", "1K", null],
      ["R32_16", "2D", "2G"],
    ];
    const { data: freshBracket } = await supabase.from("match_results")
      .select("match_id,team1,team2,result")
      .in("stage", ["R32"]);
    const freshMap = {};
    (freshBracket || []).forEach((b) => (freshMap[b.match_id] = b));
    let anyUpdated = false;
    for (const [slotId, src1, src2] of R32_TEMPLATE) {
      const t1 = resolveTeam(src1);
      const t2 = src2 ? resolveTeam(src2) : null;
      if (!t1 && !t2) continue;
      const existing = freshMap[slotId];
      const newT1 = t1 || existing?.team1 || "";
      const newT2 = t2 || existing?.team2 || "";
      if (newT1 === "" && newT2 === "") continue;
      if (existing?.team1 === newT1 && existing?.team2 === newT2) continue;
      const { error } = await supabase.from("match_results").upsert(
        { match_id: slotId, stage: "R32", team1: newT1, team2: newT2, result: existing?.result || null },
        { onConflict: "match_id" }
      );
      if (!error) anyUpdated = true;
    }
    if (anyUpdated) {
      const { data: updatedBracket } = await supabase.from("match_results")
        .select("match_id,team1,team2,result")
        .in("stage", ["R32","R16","QF","SF","F"]);
      setBracket((prev) => {
        const next = [...prev];
        (updatedBracket || []).forEach((u) => {
          const idx = next.findIndex((b) => b.match_id === u.match_id);
          if (idx >= 0) next[idx] = { ...next[idx], ...u };
          else next.push(u);
        });
        return next;
      });
    }
  }

  async function autoPopulateR32() {
    const stMap = {};
    standings.forEach((s) => (stMap[s.group_code] = s));
    const completeGroups = standings.filter((s) => s.first_place && s.second_place);
    if (completeGroups.length === 0) {
      setMsg({ type: "error", text: "No group standings entered yet. Set at least 1st and 2nd place in the Standings tab first." });
      return;
    }
    await updateBracketFromStandings(standings);
    const fixedDone = ["R32_1","R32_3","R32_4","R32_6","R32_11","R32_12","R32_14","R32_16"]
      .filter((id) => {
        const slot = bracket.find((b) => b.match_id === id);
        return slot?.team1 && slot?.team2;
      }).length;
    const winnerDone = ["R32_2","R32_5","R32_7","R32_8","R32_9","R32_10","R32_13","R32_15"]
      .filter((id) => bracket.find((b) => b.match_id === id)?.team1).length;
    setMsg({ type: "success", text: `R32 updated — ${fixedDone}/8 fixed slots fully resolved, ${winnerDone}/8 winner slots have team1 set (3rd place opponents need manual entry in Knockout tab).` });
  }

  async function deleteUser(id) {
    if (!window.confirm("Delete this user and all their picks?")) return;
    await Promise.all([
      supabase.from("stage1_match_picks").delete().eq("user_id", id),
      supabase.from("stage1_group_picks").delete().eq("user_id", id),
      supabase.from("stage1_third_place_picks").delete().eq("user_id", id),
      supabase.from("stage2_picks").delete().eq("user_id", id),
      supabase.from("profiles").delete().eq("id", id),
    ]);
    setUsers((p) => p.filter((u) => u.id !== id));
    setMsg({ type: "success", text: "User deleted." });
  }

  async function addKnockoutSlot(slotId, stage, team1, team2) {
    const data = { match_id: slotId, stage, team1, team2, updated_at: new Date().toISOString() };
    await supabase.from("match_results").upsert(data, { onConflict: "match_id" });
    setBracket((prev) => {
      const idx = prev.findIndex((b) => b.match_id === slotId);
      if (idx >= 0) { const n = [...prev]; n[idx] = { ...n[idx], ...data }; return n; }
      return [...prev, data];
    });
    setMsg({ type: "success", text: `Slot ${slotId} saved.` });
  }

  useEffect(() => { loadAll(); }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", overflowY: "auto", zIndex: 200 }}>
      <div style={{ maxWidth: "900px", margin: "2rem auto", padding: "0 1rem" }}>
        <div style={{ ...styles.card, marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div style={{ ...styles.cardTitle, marginBottom: 0 }}>Admin Panel</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={{ ...styles.btnSecondary, fontSize: "12px", padding: "6px 12px" }} onClick={() => loadAll()} title="Refresh all data">↻ Refresh</button>
              <button style={styles.btnSecondary} onClick={onClose}>Close</button>
            </div>
          </div>
          <Alert type={msg.type} msg={msg.text} />
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            {[["results","Group Stage"],["standings","Standings"],["knockout","Knockout"],["settings","Settings"],["messages","Messages"],["users","Users"],["leagues","Leagues"]].map(([t,label]) => (
              <button key={t} style={styles.tab(activeTab===t)} onClick={() => setActiveTab(t)}>{label}</button>
            ))}
          </div>
          {loading && activeTab !== "knockout" && <Spinner />}

          {activeTab==="results" && !loading && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "8px" }}>
                <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>
                  Click a team or Draw to record the result. Standings auto-update once all 6 group matches are entered.
                </p>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  <button style={{ fontSize: "11px", fontWeight: 600, color: C.navy, background: "rgba(0,0,0,0.04)", border: `1px solid ${C.border}`, borderRadius: "6px", cursor: "pointer", padding: "5px 10px", whiteSpace: "nowrap" }} onClick={collapseAllGroups}>Collapse All</button>
                  <button style={{ fontSize: "11px", fontWeight: 600, color: C.navy, background: "rgba(0,0,0,0.04)", border: `1px solid ${C.border}`, borderRadius: "6px", cursor: "pointer", padding: "5px 10px", whiteSpace: "nowrap" }} onClick={expandAllGroups}>Expand All</button>
                  <button style={{
                    fontSize: "12px", fontWeight: 600, color: "#dc2626",
                    background: "rgba(220,38,38,0.06)", border: "1px solid #fca5a5",
                    borderRadius: "6px", cursor: "pointer", padding: "6px 14px", whiteSpace: "nowrap",
                  }} onClick={async () => {
                    if (!window.confirm("Clear ALL group stage results and standings? This cannot be undone.")) return;
                    await supabase.from("match_results").delete().eq("stage", "group");
                    await supabase.from("group_standings").delete().neq("group_code", "");
                    setResults([]); setStandings([]); setClearKey((k) => k + 1);
                    setMsg({ type: "success", text: "All group stage results and standings cleared." });
                  }}>✕ Clear All Results</button>
                </div>
              </div>
              {Object.keys(GROUPS).map((group) => {
                const groupMatches = ALL_GROUP_MATCHES.filter((m) => m.group===group);
                const doneCount = groupMatches.filter((m) => results.find((r) => r.match_id===m.matchId)?.result).length;
                const pg = "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)";
                const isCollapsed = !!collapsedGroups[group];
                const teamAbbrs = GROUPS[group].map((t) => COUNTRY_ABBR[t] || t.slice(0,3).toUpperCase()).join(" · ");
                return (
                  <div key={group} style={{ marginBottom: "0.75rem" }}>
                    <div
                      onClick={() => toggleGroup(group)}
                      style={{ fontWeight: 700, fontSize: "14px", color: C.navy, marginBottom: isCollapsed ? 0 : "10px",
                        display: "flex", alignItems: "center", gap: "10px", cursor: "pointer",
                        userSelect: "none", padding: "8px 10px", borderRadius: "8px",
                        background: isCollapsed ? "rgba(0,0,0,0.03)" : "transparent",
                        border: `1px solid ${isCollapsed ? C.border : "transparent"}`,
                        transition: "background 0.15s",
                      }}>
                      <span style={{ fontSize: "13px", color: C.textMuted, fontWeight: 400, minWidth: "14px" }}>{isCollapsed ? "▶" : "▼"}</span>
                      <span>Group {group}</span>
                      <span style={{ fontSize: "11px", fontWeight: 500, color: C.textMuted, letterSpacing: "0.02em" }}>{teamAbbrs}</span>
                      <span style={{ fontSize: "12px", fontWeight: 400, color: doneCount===6?C.green:C.textMuted }}>
                        {doneCount}/6 {doneCount===6?"✓":""}
                      </span>
                      <div style={{ flex: 1, height: "1px", background: C.border }} />
                    </div>
                    {!isCollapsed && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {groupMatches.map((m) => {
                          const res = results.find((r) => r.match_id===m.matchId);
                          const winner = res?.result === "team1" ? m.team1 : res?.result === "team2" ? m.team2 : res?.result === "draw" ? "draw" : null;
                          const meta1 = TEAM_META[m.team1] || { flag: "un", border: "#999" };
                          const meta2 = TEAM_META[m.team2] || { flag: "un", border: "#999" };
                          return (
                            <AdminMatchRow
                              key={`${m.matchId}-${clearKey}`}
                              m={m}
                              res={res}
                              winner={winner}
                              meta1={meta1}
                              meta2={meta2}
                              pg={pg}
                              onSave={(result, s1, s2) => saveGroupResult(m, result, s1, s2)}
                              onClear={async () => {
                                await supabase.from("match_results").update({ result: null, score1: null, score2: null }).eq("match_id", m.matchId);
                                setResults((prev) => prev.map((r) => r.match_id===m.matchId ? { ...r, result: null, score1: null, score2: null } : r));
                                if (onResultsChange) onResultsChange();
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab==="standings" && !loading && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "8px" }}>
                <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>
                  Set 1st and 2nd place as soon as a group is decided — R32 bracket slots update automatically.
                </p>
                <button style={{ fontSize: "12px", fontWeight: 600, color: C.navy, background: "rgba(0,0,0,0.04)", border: `1px solid ${C.border}`, borderRadius: "6px", cursor: "pointer", padding: "6px 12px" }}
                  onClick={async () => {
                    // Recompute and save is_third_place_qualifier for all groups
                    const { data: allSt } = await supabase.from("group_standings").select("*");
                    const { data: allResults } = await supabase.from("match_results").select("match_id,result,score1,score2,stage").eq("stage", "group");
                    if (!allSt || !allResults) { setMsg({ type: "error", text: "Could not fetch data." }); return; }
                    const resultMap = {};
                    allResults.forEach((r) => (resultMap[r.match_id] = r));
                    const thirdTeams = [];
                    for (const group of Object.keys(GROUPS)) {
                      const table = {};
                      GROUPS[group].forEach((t) => (table[t] = { pts: 0, gd: 0, gf: 0, mp: 0 }));
                      ALL_GROUP_MATCHES.filter((m) => m.group === group).forEach((m) => {
                        const r = resultMap[m.matchId];
                        if (!r?.result) return;
                        table[m.team1].mp++; table[m.team2].mp++;
                        const s1 = r.score1 ?? 0, s2 = r.score2 ?? 0;
                        if (r.result === "draw") { table[m.team1].pts++; table[m.team2].pts++; }
                        else if (r.result === "team1") table[m.team1].pts += 3;
                        else table[m.team2].pts += 3;
                        table[m.team1].gf += s1; table[m.team1].gd += s1 - s2;
                        table[m.team2].gf += s2; table[m.team2].gd += s2 - s1;
                      });
                      const sorted = Object.entries(table).filter(([, v]) => v.mp > 0)
                        .map(([team, v]) => ({ team, group, ...v }))
                        .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
                      if (sorted.length >= 3) thirdTeams.push(sorted[2]);
                    }
                    thirdTeams.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
                    const top8 = new Set(thirdTeams.slice(0, 8).map((t) => t.team));
                    for (const s of allSt) {
                      if (!s.third_place) continue;
                      const qualifier = top8.has(s.third_place);
                      await supabase.from("group_standings").update({ is_third_place_qualifier: qualifier }).eq("group_code", s.group_code);
                    }
                    setMsg({ type: "success", text: "3rd place qualifiers recalculated and saved." });
                    if (onResultsChange) onResultsChange();
                  }}
                >↻ Recalc 3rd Place Qualifiers</button>
              </div>
              {/* R32 slot → group mapping for display */}
              {(() => {
                const GROUP_TO_R32 = {
                  A: [{ slot: "R32_7", role: "1st", vs: "3rd TBD" }, { slot: "R32_1", role: "2nd", vs: "Grp B 2nd" }],
                  B: [{ slot: "R32_13", role: "1st", vs: "3rd TBD" }, { slot: "R32_1", role: "2nd", vs: "Grp A 2nd" }],
                  C: [{ slot: "R32_4", role: "1st", vs: "Grp F 2nd" }, { slot: "R32_3", role: "2nd", vs: "Grp F 1st" }],
                  D: [{ slot: "R32_9", role: "1st", vs: "3rd TBD" }, { slot: "R32_16", role: "2nd", vs: "Grp G 2nd" }],
                  E: [{ slot: "R32_2", role: "1st", vs: "3rd TBD" }, { slot: "R32_6", role: "2nd", vs: "Grp I 2nd" }],
                  F: [{ slot: "R32_3", role: "1st", vs: "Grp C 2nd" }, { slot: "R32_4", role: "2nd", vs: "Grp C 1st" }],
                  G: [{ slot: "R32_10", role: "1st", vs: "3rd TBD" }, { slot: "R32_16", role: "2nd", vs: "Grp D 2nd" }],
                  H: [{ slot: "R32_12", role: "1st", vs: "Grp J 2nd" }, { slot: "R32_14", role: "2nd", vs: "Grp J 1st" }],
                  I: [{ slot: "R32_5", role: "1st", vs: "3rd TBD" }, { slot: "R32_6", role: "2nd", vs: "Grp E 2nd" }],
                  J: [{ slot: "R32_14", role: "1st", vs: "Grp H 2nd" }, { slot: "R32_12", role: "2nd", vs: "Grp H 1st" }],
                  K: [{ slot: "R32_15", role: "1st", vs: "3rd TBD" }, { slot: "R32_11", role: "2nd", vs: "Grp L 2nd" }],
                  L: [{ slot: "R32_8", role: "1st", vs: "3rd TBD" }, { slot: "R32_11", role: "2nd", vs: "Grp K 2nd" }],
                };
                const bracketMap = {};
                bracket.forEach((b) => (bracketMap[b.match_id] = b));
                return Object.keys(GROUPS).map((group) => {
                  const st = standings.find((s) => s.group_code===group) || {};
                  const r32slots = GROUP_TO_R32[group] || [];
                  return (
                    <div key={group} style={{ marginBottom: "1.25rem", borderBottom: `1px solid ${C.border}`, paddingBottom: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <div style={{ fontWeight: 700, fontSize: "14px", color: C.navy }}>Group {group}</div>
                        {/* R32 slot indicators */}
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {r32slots.map(({ slot, role }) => {
                            const s = bracketMap[slot];
                            const team = role === "1st" ? s?.team1 : s?.team2;
                            const isSet = !!team;
                            return (
                              <span key={slot} style={{
                                fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "4px",
                                background: isSet ? "rgba(29,158,117,0.1)" : "rgba(0,0,0,0.04)",
                                color: isSet ? "#0a5c3a" : C.textMuted,
                                border: `1px solid ${isSet ? "#1D9E75" : C.border}`,
                              }}>
                                {slot} {isSet ? `✓ ${team}` : "🔒 pending"}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(90px,1fr))", gap: "6px", marginBottom: "8px" }}>
                        {["first_place","second_place","third_place","fourth_place"].map((pos, i) => (
                          <div key={pos}>
                            <label style={styles.label}>{["1st","2nd","3rd","4th"][i]}</label>
                            <select style={styles.select} value={st[pos]||""} onChange={(e) => saveGroupStandings(group, { ...st, [pos]: e.target.value })}>
                              <option value="">--</option>
                              {GROUPS[group].map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {activeTab==="knockout" && (() => {
            if (bracket.length === 0 && loading) return <Spinner />;
            // Build a live bracket map from current bracket state
            const bracketMap = {};
            bracket.forEach((b) => (bracketMap[b.match_id] = b));

            // Derive team for a slot based on who won its feeder slot
            function getTeamFromResult(feederSlotId) {
              const feeder = bracketMap[feederSlotId];
              if (!feeder?.result) return null;
              return feeder.result === "team1" ? feeder.team1 : feeder.team2;
            }

            // Auto-derive teams for later rounds from BRACKET_FEED
            function getDerivedTeams(slotId) {
              const feed = BRACKET_FEED[slotId];
              if (!feed) return null; // R32 — teams set manually
              const t1 = getTeamFromResult(feed[0]);
              const t2 = getTeamFromResult(feed[1]);
              return { t1, t2 };
            }

            // Save result and auto-populate downstream slots
            async function saveResult(slotId, round, winnerOpt, t1, t2) {
              const winner = winnerOpt === "team1" ? t1 : t2;
              // Save result
              await supabase.from("match_results").upsert(
                { match_id: slotId, stage: round, team1: t1, team2: t2, result: winnerOpt },
                { onConflict: "match_id" }
              );
              setBracket((prev) => {
                const n = [...prev];
                const idx = n.findIndex((b) => b.match_id === slotId);
                if (idx >= 0) n[idx] = { ...n[idx], result: winnerOpt };
                else n.push({ match_id: slotId, stage: round, team1: t1, team2: t2, result: winnerOpt });
                return n;
              });

              // Find any downstream slot that feeds from this slotId and update its teams
              for (const [downSlot, feedSlots] of Object.entries(BRACKET_FEED)) {
                if (!feedSlots.includes(slotId)) continue;
                const [feedA, feedB] = feedSlots;
                const slotA = bracketMap[feedA];
                const slotB = bracketMap[feedB];
                const newT1 = feedA === slotId
                  ? winner
                  : (slotA?.result ? (slotA.result === "team1" ? slotA.team1 : slotA.team2) : null);
                const newT2 = feedB === slotId
                  ? winner
                  : (slotB?.result ? (slotB.result === "team1" ? slotB.team1 : slotB.team2) : null);
                if (newT1 || newT2) {
                  const downRound = downSlot.replace(/_\d+$/, "");
                  const existing = bracketMap[downSlot] || {};
                  await supabase.from("match_results").upsert({
                    match_id: downSlot, stage: downRound,
                    team1: newT1 || existing.team1 || "",
                    team2: newT2 || existing.team2 || "",
                    result: null,
                  }, { onConflict: "match_id" });
                  setBracket((prev) => {
                    const n = [...prev];
                    const idx = n.findIndex((b) => b.match_id === downSlot);
                    if (idx >= 0) n[idx] = { ...n[idx], team1: newT1 || n[idx].team1, team2: newT2 || n[idx].team2, result: null };
                    else n.push({ match_id: downSlot, stage: downRound, team1: newT1||"", team2: newT2||"", result: null });
                    return n;
                  });
                }
              }
              setMsg({ type: "success", text: `${winner} advances ✓` });
              if (onResultsChange) onResultsChange();
            }

            // Build team → position label map from standings
            const teamLabel = {};
            standings.forEach((s) => {
              if (s.first_place)  teamLabel[s.first_place]  = `1st · Grp ${s.group_code}`;
              if (s.second_place) teamLabel[s.second_place] = `2nd · Grp ${s.group_code}`;
              if (s.third_place)  teamLabel[s.third_place]  = `3rd · Grp ${s.group_code}`;
            });

            // Track which 3rd place teams are already assigned to R32 slots (team2 position)
            const assignedThird = new Set(
              Object.entries(bracketMap)
                .filter(([id]) => id.startsWith("R32_"))
                .map(([, slot]) => slot.team2)
                .filter(Boolean)
                .filter((team) => standings.some((s) => s.third_place === team))
            );

            // Top 8 third place teams by pts/GD/GF
            const top8ThirdTeams = standings
              .filter((s) => s.third_place)
              .map((s) => {
                const table = calcFullGroupTable(s.group_code, results);
                const entry = table.find((t) => t.team === s.third_place) || { pts: 0, gd: 0, gf: 0 };
                return { group: s.group_code, team: s.third_place, pts: entry.pts, gd: entry.gd, gf: entry.gf };
              })
              .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
              .slice(0, 8);
            const top8TeamNames = new Set(top8ThirdTeams.map((t) => t.team));

            return (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "10px" }}>
                  <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>
                    Click a team to record the winner. R16+ auto-populates from R32 results.
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      style={{ ...styles.btnPrimary, fontSize: "13px", padding: "8px 16px", whiteSpace: "nowrap" }}
                      onClick={autoPopulateR32}
                    >
                      ⚡ Auto-fill R32 from Standings
                    </button>
                    <button style={{
                      fontSize: "12px", fontWeight: 600, color: "#dc2626",
                      background: "rgba(220,38,38,0.06)", border: "1px solid #fca5a5",
                      borderRadius: "6px", cursor: "pointer", padding: "8px 14px", whiteSpace: "nowrap",
                    }} onClick={async () => {
                      if (!window.confirm("Clear ALL knockout results and bracket slots? This cannot be undone.")) return;
                      await supabase.from("match_results").delete().in("stage", ["R32","R16","QF","SF","F"]);
                      setBracket([]);
                      setMsg({ type: "success", text: "All knockout results and bracket slots cleared." });
                    }}>✕ Clear Knockout</button>
                  </div>
                </div>
                {KNOCKOUT_ROUNDS.map(({ round, label, slots }) => (
                  <div key={round} style={{ marginBottom: "1.5rem" }}>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: C.navy, marginBottom: "10px",
                      display: "flex", alignItems: "center", gap: "10px" }}>
                      {label}
                      <div style={{ flex: 1, height: "1px", background: C.border }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {Array.from({ length: slots }, (_, i) => {
                        const slotId = `${round}_${i+1}`;
                        const slot = bracketMap[slotId] || {};
                        const derived = BRACKET_FEED[slotId] ? getDerivedTeams(slotId) : null;
                        const t1 = derived ? (derived.t1 || slot.team1 || "") : (slot.team1 || "");
                        const t2 = derived ? (derived.t2 || slot.team2 || "") : (slot.team2 || "");
                        const result = slot.result || null;
                        const winner = result ? (result === "team1" ? t1 : t2) : null;
                        const bothKnown = t1 && t2 && !t1.startsWith("W-") && !t2.startsWith("W-");
                        const meta1 = TEAM_META[t1] || { flag: "un", border: "#999" };
                        const meta2 = TEAM_META[t2] || { flag: "un", border: "#999" };
                        const pg = "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)";

                        return (
                          <div key={slotId} style={{ display: "flex", flexDirection: "column", gap: "4px",
                            padding: "8px 10px", borderRadius: "8px", border: `1px solid ${C.border}`,
                            background: winner ? "rgba(29,158,117,0.04)" : C.white }}>
                            {/* Slot header row */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "11px", color: C.textMuted, minWidth: "48px", fontWeight: 600 }}>
                                {SLOT_META[slotId] ? `M${SLOT_META[slotId].matchNum}` : `${round}_${i+1}`}
                              </span>
                              {(() => {
                                const sm = SLOT_META[slotId];
                                return sm ? (
                                  <>
                                    <span style={{ fontSize: "11px", color: C.navy, fontWeight: 600 }}>{sm.date}</span>
                                    <span style={{ fontSize: "11px", color: C.textMuted }}>{sm.time}</span>
                                    <span style={{ fontSize: "11px", color: C.textMuted }}>·</span>
                                    <span style={{ fontSize: "11px", color: C.textMuted }}>{sm.venue}</span>
                                  </>
                                ) : null;
                              })()}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {!bothKnown ? (
                              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                                {(() => {
                                  // 3rd-place slots: R32_2,5,7,8,9,10,13,15 (winner vs best 3rd)
                                  // All others are winner vs runner-up OR runner-up vs runner-up — no 3rd place dropdown
                                  const THIRD_PLACE_SLOTS = new Set(["R32_2","R32_5","R32_7","R32_8","R32_9","R32_10","R32_13","R32_15"]);
                                  const isThirdPlaceSlot = round === "R32" && THIRD_PLACE_SLOTS.has(slotId);
                                  return isThirdPlaceSlot ? (
                                  // R32 slots where team2 is a 3rd-place team — allow manual entry
                                  <>
                                    {/* Group winner on the left */}
                                    {t1 ? (
                                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "6px", border: `1px solid ${meta1.border}`, fontSize: "13px", background: C.white }}>
                                        <img src={`https://flagcdn.com/${meta1.flag}.svg`} style={{ width:"20px",height:"14px",borderRadius:"2px",objectFit:"cover" }} />
                                        <span style={{ flex: 1 }}>{t1}</span>
                                        {teamLabel[t1] && <span style={{ fontSize:"10px",color:"#64748b",background:"rgba(11,31,58,0.06)",padding:"1px 6px",borderRadius:"4px",whiteSpace:"nowrap" }}>{teamLabel[t1]}</span>}
                                      </div>
                                    ) : (
                                      <div style={{ flex: 1, fontSize: "12px", color: C.textMuted, fontStyle: "italic", padding: "7px 10px", border: `1px dashed ${C.border}`, borderRadius: "6px" }}>
                                        {SLOT_META[slotId]?.t1desc || "Group Winner TBD"} — set standings
                                      </div>
                                    )}
                                    <span style={{ fontSize: "12px", color: C.textMuted, flexShrink: 0 }}>vs</span>
                                    {/* 3rd place team dropdown on the right */}
                                    <select
                                      value={t2 || ""}
                                      onChange={async (e) => {
                                        const val = e.target.value;
                                        await supabase.from("match_results").upsert(
                                          { match_id: slotId, stage: round, team1: t1 || "", team2: val, result: null },
                                          { onConflict: "match_id" }
                                        );
                                        setBracket((prev) => {
                                          const n = [...prev];
                                          const idx = n.findIndex((b) => b.match_id === slotId);
                                          if (idx >= 0) n[idx] = { ...n[idx], team2: val };
                                          else n.push({ match_id: slotId, stage: round, team1: t1 || "", team2: val, result: null });
                                          return n;
                                        });
                                      }}
                                      style={{ flex: 1, ...styles.select, fontSize: "13px" }}
                                    >
                                      <option value="">— Select 3rd place team —</option>
                                      {top8ThirdTeams.map((s) => {
                                        const alreadyUsed = assignedThird.has(s.team) && s.team !== t2;
                                        return (
                                          <option key={s.team} value={s.team} disabled={alreadyUsed}>
                                            {s.team} (3rd Grp {s.group}){alreadyUsed ? " — assigned" : ""}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </>
                                ) : (
                                  // Runner-up vs Runner-up slots (R32_1/6/11/16) or other rounds — waiting for standings
                                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                                    {/* Show whichever runner-up is known, TBD placeholder for the other */}
                                    {[t1, t2].map((team, idx) => {
                                      const desc = idx === 0 ? SLOT_META[slotId]?.t1desc : SLOT_META[slotId]?.t2desc;
                                      const meta = TEAM_META[team] || { flag: "un", border: "#999" };
                                      return (
                                        <div key={idx} style={{ display: "contents" }}>
                                          {idx === 1 && <span style={{ fontSize: "12px", color: C.textMuted, flexShrink: 0 }}>vs</span>}
                                          {team && !team.startsWith("W-") ? (
                                            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "6px", border: `1px solid ${meta.border}`, fontSize: "13px", background: C.white }}>
                                              <img src={`https://flagcdn.com/${meta.flag}.svg`} style={{ width:"20px",height:"14px",borderRadius:"2px",objectFit:"cover" }} />
                                              <span style={{ flex: 1 }}>{team}</span>
                                              {teamLabel[team] && <span style={{ fontSize:"10px",color:"#64748b",background:"rgba(11,31,58,0.06)",padding:"1px 6px",borderRadius:"4px",whiteSpace:"nowrap" }}>{teamLabel[team]}</span>}
                                            </div>
                                          ) : (
                                            <div style={{ flex: 1, fontSize: "12px", color: C.textMuted, fontStyle: "italic", padding: "7px 10px", textAlign: "center", border: `1px dashed ${C.border}`, borderRadius: "6px" }}>
                                              {desc || "TBD"} — set standings
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                                })()}
                              </div>
                            ) : (
                              <>
                                {/* Team 1 button */}
                                <button onClick={() => saveResult(slotId, round, "team1", t1, t2)} style={{
                                  flex: 1, display: "flex", alignItems: "center", gap: "8px",
                                  padding: "8px 12px", borderRadius: "6px", fontSize: "13px",
                                  cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden",
                                  border: winner === t1 ? `2px solid #1D9E75` : winner === t2 ? `1px solid ${C.border}` : `1px solid ${meta1.border}`,
                                  background: winner === t1 ? "rgba(29,158,117,0.08)" : C.white,
                                  fontWeight: winner === t1 ? 700 : 400, minWidth: 0,
                                }}>
                                  <img src={`https://flagcdn.com/${meta1.flag}.svg`} style={{ width:"22px",height:"15px",borderRadius:"2px",objectFit:"cover",flexShrink:0,opacity: winner===t2?0.4:1 }} />
                                  <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                                    textDecoration: winner===t2 ? "line-through" : "none",
                                    color: winner===t2 ? C.textMuted : C.text }}>{t1}</span>
                                  {teamLabel[t1] && <span style={{ fontSize:"10px",color:winner===t2?C.textMuted:"#64748b",flexShrink:0,background:winner===t2?"none":"rgba(11,31,58,0.06)",padding:"1px 6px",borderRadius:"4px",whiteSpace:"nowrap",zIndex:1,position:"relative" }}>{teamLabel[t1]}</span>}
                                  {winner===t1 && <span style={{ fontSize:"11px",fontWeight:700,color:"#1D9E75",flexShrink:0 }}>Winner ✓</span>}
                                  {winner===t1 && (
                                    <div style={{ position:"absolute",right:"8px",top:0,bottom:0,width:"60px",display:"flex",gap:"3px",pointerEvents:"none",alignItems:"stretch" }}>
                                      <div style={{ flex:1,background:meta1.c1,clipPath:pg }} />
                                      <div style={{ flex:1,background:meta1.c2,clipPath:pg }} />
                                      <div style={{ flex:1,background:meta1.c3,clipPath:pg }} />
                                    </div>
                                  )}
                                </button>

                                <span style={{ fontSize:"12px",fontWeight:600,color:C.textMuted,flexShrink:0 }}>vs</span>

                                {/* Team 2 button */}
                                <button onClick={() => saveResult(slotId, round, "team2", t1, t2)} style={{
                                  flex: 1, display: "flex", alignItems: "center", gap: "8px",
                                  padding: "8px 12px", borderRadius: "6px", fontSize: "13px",
                                  cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden",
                                  border: winner === t2 ? `2px solid #1D9E75` : winner === t1 ? `1px solid ${C.border}` : `1px solid ${meta2.border}`,
                                  background: winner === t2 ? "rgba(29,158,117,0.08)" : C.white,
                                  fontWeight: winner === t2 ? 700 : 400, minWidth: 0,
                                }}>
                                  <img src={`https://flagcdn.com/${meta2.flag}.svg`} style={{ width:"22px",height:"15px",borderRadius:"2px",objectFit:"cover",flexShrink:0,opacity: winner===t1?0.4:1 }} />
                                  <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                                    textDecoration: winner===t1 ? "line-through" : "none",
                                    color: winner===t1 ? C.textMuted : C.text }}>{t2}</span>
                                  {teamLabel[t2] && <span style={{ fontSize:"10px",color:winner===t1?C.textMuted:"#64748b",flexShrink:0,background:winner===t1?"none":"rgba(11,31,58,0.06)",padding:"1px 6px",borderRadius:"4px",whiteSpace:"nowrap",zIndex:1,position:"relative" }}>{teamLabel[t2]}</span>}
                                  {winner===t2 && <span style={{ fontSize:"11px",fontWeight:700,color:"#1D9E75",flexShrink:0 }}>Winner ✓</span>}
                                  {winner===t2 && (
                                    <div style={{ position:"absolute",right:"8px",top:0,bottom:0,width:"60px",display:"flex",gap:"3px",pointerEvents:"none",alignItems:"stretch" }}>
                                      <div style={{ flex:1,background:meta2.c1,clipPath:pg }} />
                                      <div style={{ flex:1,background:meta2.c2,clipPath:pg }} />
                                      <div style={{ flex:1,background:meta2.c3,clipPath:pg }} />
                                    </div>
                                  )}
                                </button>

                                {winner && (
                                  <button onClick={async () => {
                                    await supabase.from("match_results").update({ result: null }).eq("match_id", slotId);
                                    setBracket((prev) => { const n=[...prev]; const idx=n.findIndex((b)=>b.match_id===slotId); if(idx>=0)n[idx]={...n[idx],result:null}; return n; });
                                  }} style={{
                                    fontSize:"11px", fontWeight:600, color:"#dc2626",
                                    background:"rgba(220,38,38,0.06)", border:"1px solid #fca5a5",
                                    borderRadius:"5px", cursor:"pointer", flexShrink:0,
                                    padding:"4px 8px", whiteSpace:"nowrap",
                                  }} title="Clear result">↩ Undo</button>
                                )}
                              </>
                            )}
                          </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {activeTab==="settings" && !loading && (
            <div>
              <p style={{ fontSize: "13px", color: C.textMuted, marginTop: 0 }}>Control locks and Knockout visibility.</p>
              {[
                { key: "registration_open", label: "Registration Open", desc: "Allow new sign-ups" },
                { key: "stage1_locked", label: "Stage 1 Picks Locked", desc: "Prevent any further Group Stage pick changes" },
                { key: "stage2_open", label: "Force-Open Knockout Picks", desc: "Override: open bracket picks even before any standings are set. Normally auto-opens when first group standings are saved." },
                { key: "stage2_locked", label: "Stage 2 Picks Locked", desc: "Prevent any further Knockout pick changes" },
              ].map(({ key, label, desc }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.border}`, gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "2px" }}>{desc}</div>
                    {key === "stage2_open" && (
                      <div style={{ fontSize: "11px", marginTop: "4px", fontWeight: 600,
                        color: stage2OpenFromBracket ? C.green : C.textMuted }}>
                        {stage2OpenFromBracket
                          ? "✓ Auto-open active — bracket has at least one known team"
                          : "Auto-open inactive — no standings set yet"}
                      </div>
                    )}
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", flexShrink: 0 }}>
                    <input type="checkbox" checked={settings[key]==="true"} onChange={(e) => updateSetting(key, e.target.checked?"true":"false")} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: settings[key]==="true"?C.red:C.green }}>
                      {settings[key]==="true"?"ON":"OFF"}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeTab==="messages" && !loading && (
            <AdminMessagesTab
              settings={settings}
              setSettings={setSettings}
              setMsg={setMsg}
              styles={styles}
            />
          )}

          {activeTab==="users" && !loading && (
            <div>
              <p style={{ fontSize: "13px", color: C.textMuted, marginTop: 0 }}>Manage competition participants and league assignments.</p>
              {(() => {
                // Separate admins and regular users
                const admins = users.filter((u) => u.is_admin).sort((a, b) => a.display_name.localeCompare(b.display_name));
                const nonAdmins = users.filter((u) => !u.is_admin).sort((a, b) => a.display_name.localeCompare(b.display_name));

                // Group non-admins by league
                const leagueGroups = {};
                nonAdmins.forEach((u) => {
                  const key = u.league_id || "__none__";
                  if (!leagueGroups[key]) leagueGroups[key] = [];
                  leagueGroups[key].push(u);
                });

                // Build ordered sections: named leagues alphabetically, then unassigned
                const leagueSections = adminLeagues
                  .filter((l) => leagueGroups[l.id])
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((l) => ({ id: l.id, name: l.name, members: leagueGroups[l.id] }));
                if (leagueGroups["__none__"]?.length > 0) {
                  leagueSections.push({ id: "__none__", name: "Unassigned", members: leagueGroups["__none__"] });
                }

                function renderUser(u) {
                  const assignedLeague = adminLeagues.find((l) => l.id === u.league_id);
                  return (
                    <div key={u.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px", gap: "8px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: 600 }}>{u.display_name}</div>
                          <div style={{ fontSize: "12px", color: C.textMuted, marginBottom: "6px" }}>{u.email}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                            {[
                              { label: "Matches", val: u.matchPicks||0, total: 72 },
                              { label: "Standings", val: u.groupPicks||0, total: 12 },
                              { label: "3rd Place", val: u.thirdPicks||0, total: 8 },
                              { label: "Knockout", val: u.s2picks||0, total: 31 },
                            ].map(({ label, val, total }) => {
                              const done = val === total;
                              const started = val > 0;
                              return (
                                <span key={label} style={{
                                  fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px",
                                  background: done ? "rgba(29,158,117,0.1)" : started ? "rgba(239,184,36,0.15)" : "rgba(220,38,38,0.08)",
                                  color: done ? "#1D9E75" : started ? "#7a5c00" : "#dc2626",
                                  border: `1px solid ${done ? "rgba(29,158,117,0.3)" : started ? "rgba(239,184,36,0.3)" : "rgba(220,38,38,0.2)"}`,
                                }}>
                                  {label}: {val}/{total}{done ? " ✓" : ""}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", flexShrink: 0 }}>
                          {u.is_admin && <span style={styles.badge(C.navy, C.gold)}>Admin</span>}
                          <button style={styles.btnDanger} onClick={() => deleteUser(u.id)}>Delete</button>
                        </div>
                      </div>
                      {!u.is_admin && adminLeagues.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "12px", color: C.textMuted, flexShrink: 0 }}>League:</span>
                          <select
                            value={u.league_id || ""}
                            onChange={async (e) => {
                              const newLeagueId = e.target.value || null;
                              const { error: saveErr } = await supabase.from("profiles").update({ league_id: newLeagueId }).eq("id", u.id);
                              if (saveErr) { setMsg({ type: "error", text: `Save failed: ${saveErr.message}` }); return; }
                              setUsers((prev) => prev.map((p) => p.id === u.id ? { ...p, league_id: newLeagueId } : p));
                              setMsg({ type: "success", text: `${u.display_name} assigned to ${adminLeagues.find((l) => l.id === newLeagueId)?.name || "no league"}.` });
                            }}
                            style={{ ...styles.select, fontSize: "12px", flex: 1 }}
                          >
                            <option value="">— No league —</option>
                            {adminLeagues.map((l) => (
                              <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                          </select>
                          {assignedLeague && <span style={styles.badge("#1e40af", "#dbeafe")}>{assignedLeague.name}</span>}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <>
                    {/* Admins section */}
                    {admins.length > 0 && (() => {
                      const isCollapsed = collapsedSections["__admins__"] !== false;
                      return (
                        <div style={{ marginBottom: "1.5rem" }}>
                          <button onClick={() => setCollapsedSections((prev) => ({ ...prev, "__admins__": !isCollapsed }))}
                            style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "0.05em" }}>Admins</div>
                            <div style={{ flex: 1, height: "1px", background: C.border }} />
                            <span style={{ fontSize: "11px", color: C.textMuted }}>{admins.length}</span>
                            <span style={{ fontSize: "12px", color: C.textMuted, marginLeft: "4px" }}>{isCollapsed ? "▶" : "▼"}</span>
                          </button>
                          {!isCollapsed && admins.map(renderUser)}
                        </div>
                      );
                    })()}
                    {/* League sections */}
                    {leagueSections.map(({ id, name, members }) => {
                      const isCollapsed = id in collapsedSections ? collapsedSections[id] : true;
                      return (
                        <div key={id} style={{ marginBottom: "1.5rem" }}>
                          <button
                            onClick={() => toggleSection(id)}
                            style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}
                          >
                            <div style={{ fontSize: "12px", fontWeight: 700, color: id === "__none__" ? C.textMuted : C.navy, textTransform: "uppercase", letterSpacing: "0.05em" }}>{name}</div>
                            <div style={{ flex: 1, height: "1px", background: C.border }} />
                            <span style={{ fontSize: "11px", color: C.textMuted }}>{members.length} member{members.length !== 1 ? "s" : ""}</span>
                            <span style={{ fontSize: "12px", color: C.textMuted, marginLeft: "4px" }}>{isCollapsed ? "▶" : "▼"}</span>
                          </button>
                          {!isCollapsed && members.map(renderUser)}
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          )}

          {activeTab==="leagues" && <LeaguesAdminTab />}
        </div>
      </div>
    </div>
  );
}

// Main App
export default function App() {
  // Apply saved admin theme immediately to prevent flash on navigation
  useState(() => {
    const savedTheme = localStorage.getItem("fsf_admin_theme");
    if (savedTheme) applyTheme(savedTheme);
  });

  // Guest mode — ?guest=true or #guest=true bypasses login entirely
  const isGuest = typeof window !== "undefined" && (
    window.location.search.includes("guest=true") ||
    window.location.hash.includes("guest=true") ||
    window.location.href.includes("guest=true")
  );

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState("leaderboard");
  const [showAdmin, setShowAdmin] = useState(false);
  const [whatsNewPayload, setWhatsNewPayload] = useState(null);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [settings, setSettings] = useState({});
  const [knockoutBracket, setKnockoutBracket] = useState([]);
  const [leagueId, setLeagueId] = useState(null);
  const [leagueName, setLeagueName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [appLeagues, setAppLeagues] = useState([]);
  const [themeKey, setThemeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [guestAdminId, setGuestAdminId] = useState(null);
  // Global cached data — fetched once per session, passed as props to all components
  const [globalMatchResults, setGlobalMatchResults] = useState([]);
  const [globalKoResults, setGlobalKoResults] = useState([]);
  const [globalStandings, setGlobalStandings] = useState([]);
  const [resultsVersion, setResultsVersion] = useState(0);

  useEffect(() => {
    if (isGuest) {
      // Guest mode — load public data without auth
      async function loadGuest() {
        const [{ data: se }, { data: kb }, { data: gmr }, { data: gko }, { data: gst }, { data: adminProfiles }] = await Promise.all([
          supabase.from("app_settings").select("*"),
          supabase.from("match_results").select("*").in("stage", ["R32","R16","QF","SF","F"]),
          supabase.from("match_results").select("match_id,result,score1,score2,team1,team2,stage"),
          supabase.from("match_results").select("match_id,result,team1,team2").in("stage", ["R32","R16","QF","SF","F"]),
          supabase.from("group_standings").select("*"),
          supabase.from("profiles").select("id").eq("is_admin", true).limit(1),
        ]);
        setGlobalMatchResults(gmr || []);
        setGlobalKoResults(gko || []);
        setGlobalStandings(gst || []);
        if (adminProfiles?.[0]) setGuestAdminId(adminProfiles[0].id);
        const sMap = {};
        (se || []).forEach((x) => (sMap[x.key] = x.value));
        setSettings(sMap);
        // Apply theme for guest
        const savedTheme = localStorage.getItem("fsf_admin_theme");
        if (savedTheme) { applyTheme(savedTheme); setThemeKey((k) => k + 1); }
        // Build knockout bracket
        const bracketSlots = [];
        KNOCKOUT_ROUNDS.forEach(({ round, slots }) => {
          for (let i = 1; i <= slots; i++) {
            const slotId = `${round}_${i}`;
            const existing = (kb || []).find((b) => b.match_id === slotId);
            bracketSlots.push({ slotId, round, label: SLOT_META[slotId] ? `Match ${SLOT_META[slotId].matchNum}` : `Match ${i}`, team1: existing?.team1 || "", team2: existing?.team2 || "", teams: existing ? [existing.team1, existing.team2].filter(Boolean) : ALL_TEAMS });
          }
        });
        setKnockoutBracket(bracketSlots);
        setLoading(false);
      }
      loadGuest();
      return;
    }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (!session) {
        // Fetch registration setting for the auth screen before login
        const { data: regSetting } = await supabase.from("app_settings").select("value").eq("key", "registration_open").maybeSingle();
        if (regSetting) setRegistrationOpen(regSetting.value !== "false");
        setLoading(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    async function load() {
      const [{ data: p },{ data: se },{ data: kb },{ data: gmr },{ data: gko },{ data: gst }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("app_settings").select("*"),
        supabase.from("match_results").select("*").in("stage",["R32","R16","QF","SF","F"]),
        supabase.from("match_results").select("match_id,result,score1,score2,team1,team2,stage"),
        supabase.from("match_results").select("match_id,result,team1,team2").in("stage",["R32","R16","QF","SF","F"]),
        supabase.from("group_standings").select("*"),
      ]);
      setGlobalMatchResults(gmr || []);
      setGlobalKoResults(gko || []);
      setGlobalStandings(gst || []);
      setProfile(p || {});
      const isAdminUser = !!p?.is_admin;
      if (isAdminUser) setIsAdmin(true);
      // Load leagues immediately if admin
      if (isAdminUser) {
        const { data: leaguesData } = await supabase.from("leagues").select("id,name,theme").order("name");
        if (leaguesData) setAppLeagues(leaguesData);
      }
      // Safely load league — retry once if league_id missing (handles new signup race condition)
      // Skip retry for admins — they intentionally have no league_id
      try {
        let profileWithLeague = p;
        if (!profileWithLeague?.league_id && !profileWithLeague?.is_admin) {
          await new Promise((r) => setTimeout(r, 1000));
          const { data: retryP } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
          if (retryP?.league_id) profileWithLeague = retryP;
        }
        if (profileWithLeague?.league_id) {
          const { data: lg } = await supabase.from("leagues").select("id,name,theme").eq("id", profileWithLeague.league_id).single();
          if (lg) {
            setLeagueId(lg.id);
            setLeagueName(lg.name);
            applyTheme(lg.theme || "default"); setThemeKey(k => k+1);
          }
        }
      } catch { /* leagues table may not exist yet — safe to ignore */ }
      const sMap = {};
      (se||[]).forEach((x) => (sMap[x.key] = x.value));
      setSettings(sMap);
      // Check if there's a published message the user hasn't seen yet
      const publishedAt = sMap.whats_new_published_at || "";
      const payload = sMap.whats_new_payload || "";
      if (publishedAt && payload) {
        try {
          const seenAt = localStorage.getItem("whatsNewSeenAt") || "";
          if (!seenAt || new Date(publishedAt) > new Date(seenAt)) {
            setWhatsNewPayload(JSON.parse(payload));
            setShowWhatsNew(true);
          }
        } catch {}
      }
      const bracketSlots = [];
      KNOCKOUT_ROUNDS.forEach(({ round, slots }) => {
        for (let i = 1; i <= slots; i++) {
          const slotId = `${round}_${i}`;
          const existing = (kb||[]).find((b) => b.match_id===slotId);
          bracketSlots.push({ slotId, round, label: SLOT_META[slotId] ? `Match ${SLOT_META[slotId].matchNum}` : `Match ${i}`, team1: existing?.team1||"", team2: existing?.team2||"", teams: existing?[existing.team1,existing.team2].filter(Boolean):ALL_TEAMS });
        }
      });
      setKnockoutBracket(bracketSlots);
      setLoading(false);
    }
    load();
  }, [session]);

  // Sync registrationOpen when settings load after login — must be before any conditional returns
  useEffect(() => {
    if (settings.registration_open !== undefined) {
      setRegistrationOpen(settings.registration_open !== "false");
    }
  }, [settings.registration_open]);

  const stage1Locked = settings.stage1_locked === "true";

  if (!session && !isGuest) return <AuthScreen registrationOpen={registrationOpen} />;
  if (loading) return (
    <div style={{ ...styles.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; }
        body { overflow-x: hidden; }
        nav div::-webkit-scrollbar { display: none; }
        button, input, select { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        button { min-height: 36px; }
        @media (max-width: 600px) { .nav-title-full { display: none !important; } .nav-title-short { display: inline !important; } }
        @media (min-width: 601px) { .nav-title-full { display: inline; } .nav-title-short { display: none !important; } }
        @media (max-width: 480px) {
          table { font-size: 12px; }
        }
      `}</style>
      <Spinner />
    </div>
  );
  const stage2Locked = settings.stage2_locked === "true";
  // stage2Open: true if admin has enabled it via settings OR any R32 slot has a known team
  const stage2OpenSetting = settings.stage2_open === "true";
  const stage2OpenFromBracket = knockoutBracket.some((s) => s.round === "R32" && s.team1);
  const stage2Open = stage2OpenSetting || stage2OpenFromBracket;
  // registrationOpen is managed as dedicated state above

  return (
    <div style={{ ...styles.app, fontFamily: C.fontSerif ? "'Georgia','Times New Roman',serif" : "'DM Sans',sans-serif", background: C.bg }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap'); *{box-sizing:border-box;} button:hover{opacity:0.88;}`}</style>
      <AppNav page={page} setPage={setPage} isAdmin={isAdmin && !isGuest} setShowAdmin={setShowAdmin} themeKey={themeKey} />
      {isGuest && (
        <div style={{ background: `${C.gold}18`, borderBottom: `1px solid ${C.gold}44`, padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: C.navy, fontWeight: 600 }}>👁 Guest View</span>
          <span style={{ fontSize: "12px", color: C.textMuted }}>— read-only access · picks shown are the admin's selections</span>
        </div>
      )}

      {page === "leaderboard" && (
        <>
          <div key={`hero-${themeKey}`} style={{ ...styles.hero, background: C.navy }}>
            {C.heroLogo ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(10px,3vw,28px)", marginBottom: "0.5rem" }}>
                <img src={C.heroLogo} alt="FSF Logo"
                  style={{ width: "clamp(48px,8vw,90px)", height: "clamp(48px,8vw,90px)", objectFit: "contain", flexShrink: 0 }} />
                <div style={{ ...styles.heroTitle, margin: 0, fontFamily: C.fontSerif ? "'Georgia','Times New Roman',serif" : "'DM Sans',sans-serif", fontStyle: C.fontSerif ? "italic" : "normal", color: C.heroTitleColor || C.gold }}>{C.heroTitle || "FSF Challenge"}</div>
                <img src={C.heroLogo} alt="FSF Logo"
                  style={{ width: "clamp(48px,8vw,90px)", height: "clamp(48px,8vw,90px)", objectFit: "contain", flexShrink: 0 }} />
              </div>
            ) : (
              <div style={{ ...styles.heroTitle, fontFamily: C.fontSerif ? "'Georgia','Times New Roman',serif" : "'DM Sans',sans-serif", fontStyle: C.fontSerif ? "italic" : "normal", color: C.heroTitleColor || C.gold }}>{C.heroTitle || "FSF Challenge"}</div>
            )}
            <div style={{ ...styles.heroSub, color: C.heroSubColor || (C.navText ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.7)") }}>{C.heroSub || "It's like a soccer tournament, but bigger."}</div>
            <div style={{ fontSize: "13px", color: C.heroSubColor || (C.navText ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)") }}>
              Welcome, <strong style={{ color: C.heroNameColor || C.navText || C.gold }}>{profile?.display_name}</strong>
            </div>
          </div>
          <Leaderboard currentUserId={isGuest ? (guestAdminId || "") : session.user.id} stage1Locked={stage1Locked} stage2Locked={stage2Locked} leagueId={leagueId} leagueName={leagueName} isAdmin={isAdmin && !isGuest} appLeagues={appLeagues} onThemeChange={(name) => { applyTheme(name); setThemeKey(k => k+1); }} matchResultsCache={globalMatchResults} koResultsCache={globalKoResults} standingsCache={globalStandings} resultsVersion={resultsVersion} />
        </>
      )}
      {page === "stage1" && <Stage1Picks userId={isGuest ? guestAdminId : session.user.id} locked={true} matchResultsCache={globalMatchResults} standingsCache={globalStandings} />}
      {page === "stage2" && <Stage2Picks userId={isGuest ? guestAdminId : session.user.id} locked={true} stage2Open={stage2Open} knockoutBracket={knockoutBracket} koResultsCache={globalKoResults} />}
      {page === "results" && <ResultsPage matchResultsCache={globalMatchResults} koResultsCache={globalKoResults} />}
      {page === "standings" && <StandingsPage matchResultsCache={globalMatchResults} />}
      {page === "insights" && <Insights stage1Locked={stage1Locked} stage2Locked={stage2Locked} leagueId={isAdmin ? (localStorage.getItem("fsf_admin_leagueId") && localStorage.getItem("fsf_admin_leagueId") !== "__all__" ? localStorage.getItem("fsf_admin_leagueId") : leagueId) : leagueId} currentUserId={isGuest ? (guestAdminId || "") : session.user.id} isAdmin={isAdmin && !isGuest} matchResultsCache={globalMatchResults} standingsCache={globalStandings} koResultsCache={globalKoResults} />}
      {page === "guide" && <UserGuide />}

      {showAdmin && !isGuest && <AdminPanel onClose={() => setShowAdmin(false)} stage2OpenFromBracket={stage2OpenFromBracket} onResultsChange={async () => {
        const [{ data: gmr },{ data: gst },{ data: kb }] = await Promise.all([
          supabase.from("match_results").select("match_id,result,score1,score2,team1,team2,stage"),
          supabase.from("group_standings").select("*"),
          supabase.from("match_results").select("*").in("stage",["R32","R16","QF","SF","F"]),
        ]);
        setGlobalMatchResults(gmr||[]);
        setGlobalStandings(gst||[]);
        Object.keys(leaderboardCache).forEach((k) => delete leaderboardCache[k]);
        setResultsVersion(v => v+1);
        const bracketSlots = [];
        KNOCKOUT_ROUNDS.forEach(({ round, slots }) => {
          for (let i = 1; i <= slots; i++) {
            const slotId = `${round}_${i}`;
            const existing = (kb||[]).find((b) => b.match_id===slotId);
            bracketSlots.push({ slotId, round, label: SLOT_META[slotId] ? `Match ${SLOT_META[slotId].matchNum}` : `Match ${i}`, team1: existing?.team1||"", team2: existing?.team2||"", teams: existing?[existing.team1,existing.team2].filter(Boolean):ALL_TEAMS });
          }
        });
        setKnockoutBracket(bracketSlots);
        const { data: gko } = await supabase.from("match_results").select("match_id,result,team1,team2").in("stage",["R32","R16","QF","SF","F"]);
        setGlobalKoResults(gko||[]);
      }} />}
      {showWhatsNew && whatsNewPayload && !isGuest && <WhatsNewModal payload={whatsNewPayload} onDismiss={() => {
        try { localStorage.setItem("whatsNewSeenAt", new Date().toISOString()); } catch {}
        setShowWhatsNew(false);
      }} />}
    </div>
  );
}
