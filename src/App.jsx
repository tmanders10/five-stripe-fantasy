import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Trophy, Target, Zap, Award, BarChart3, CheckCircle2, Calendar, Lock, GitMerge, BookOpen, Shield, LogOut, Menu, X, Users, Settings, RefreshCw } from "lucide-react";
import {
  SCORING_RULES,
  WILD_CARDS,
  GROUPS,
  SERIES_LABELS,
  ALL_GROUP_MATCHES,
  KNOCKOUT_ROUNDS,
  SLOT_LABELS,
  getResolvedMatchTeams,
  isSeriesSweep,
  calcSeriesWins,
  deriveSeriesOutcome,
  calcStage1Score,
  buildKnockoutBracketSlots,
  applyStage2Pick,
  getStage2SlotDisplayState,
  calcStage2Score,
  computeBracketCascade,
  computeCSFUpdates,
  calcUserPickProgress,
} from "./bracketLogic.js";

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON);
const supabase = hasSupabaseConfig ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;

// ── 1 & 2. TOURNAMENT DATA & SCORING RULES (IMPORTED FROM ./bracketLogic.js) ─

const TEAM_META = {
  // Eastern Conference
  "Nashville SC":           { seed: 1, regPts: 77, flag: "us", c1: "rgba(236,232,58,0.55)",  c2: "rgba(31,22,70,0.48)",    c3: "rgba(236,232,58,0.55)",  border: "#d4cf24" },
  "Inter Miami":            { seed: 2, regPts: 60, flag: "us", c1: "rgba(247,181,205,0.55)", c2: "rgba(35,31,32,0.45)",    c3: "rgba(247,181,205,0.55)", border: "#f7b5cd" },
  "New England Revolution": { seed: 3, regPts: 58, flag: "us", c1: "rgba(10,34,64,0.48)",    c2: "rgba(206,14,45,0.50)",   c3: "rgba(10,34,64,0.48)",    border: "#ce0e2d" },
  "Chicago Fire":           { seed: 4, regPts: 55, flag: "us", c1: "rgba(211,17,69,0.50)",   c2: "rgba(124,205,244,0.52)", c3: "rgba(20,31,70,0.45)",    border: "#d31145" },
  "Charlotte FC":           { seed: 5, regPts: 54, flag: "us", c1: "rgba(0,133,202,0.48)",   c2: "rgba(16,24,32,0.40)",    c3: "rgba(0,133,202,0.48)",   border: "#0085ca" },
  "Philadelphia Union":     { seed: 6, regPts: 50, flag: "us", c1: "rgba(7,27,44,0.48)",     c2: "rgba(177,135,45,0.52)",  c3: "rgba(80,145,205,0.45)",  border: "#b1872d" },
  "Columbus Crew":          { seed: 7, regPts: 47, flag: "us", c1: "rgba(254,209,0,0.55)",   c2: "rgba(0,0,0,0.45)",       c3: "rgba(254,209,0,0.55)",   border: "#e5b800" },
  "Orlando City":           { seed: 8, regPts: 46, flag: "us", c1: "rgba(99,52,146,0.48)",   c2: "rgba(240,210,131,0.48)", c3: "rgba(99,52,146,0.48)",   border: "#633492" },
  "FC Cincinnati":          { seed: 9, regPts: 46, flag: "us", c1: "rgba(0,48,135,0.45)",    c2: "rgba(254,80,0,0.50)",    c3: "rgba(0,48,135,0.45)",    border: "#fe5000" },
  // Western Conference
  "Vancouver Whitecaps":    { seed: 1, regPts: 64, flag: "ca", c1: "rgba(0,36,94,0.48)",     c2: "rgba(156,194,234,0.45)", c3: "rgba(0,36,94,0.48)",     border: "#00245e" },
  "FC Dallas":              { seed: 2, regPts: 58, flag: "us", c1: "rgba(232,31,62,0.50)",   c2: "rgba(42,64,118,0.48)",   c3: "rgba(232,31,62,0.50)",   border: "#e81f3e" },
  "St. Louis CITY SC":      { seed: 3, regPts: 54, flag: "us", c1: "rgba(221,0,74,0.50)",    c2: "rgba(8,27,51,0.48)",     c3: "rgba(221,0,74,0.50)",    border: "#dd004a" },
  "San Jose Earthquakes":   { seed: 4, regPts: 52, flag: "us", c1: "rgba(0,103,177,0.50)",   c2: "rgba(0,0,0,0.45)",       c3: "rgba(0,103,177,0.50)",   border: "#0067b1" },
  "Houston Dynamo":         { seed: 5, regPts: 51, flag: "us", c1: "rgba(255,107,0,0.52)",   c2: "rgba(16,24,32,0.42)",    c3: "rgba(255,107,0,0.52)",   border: "#ff6b00" },
  "LAFC":                   { seed: 6, regPts: 47, flag: "us", c1: "rgba(0,0,0,0.48)",       c2: "rgba(195,158,109,0.55)", c3: "rgba(0,0,0,0.48)",       border: "#c39e6d" },
  "Portland Timbers":       { seed: 7, regPts: 46, flag: "us", c1: "rgba(0,72,43,0.50)",     c2: "rgba(214,154,0,0.50)",   c3: "rgba(0,72,43,0.50)",     border: "#00482b" },
  "Seattle Sounders":       { seed: 8, regPts: 46, flag: "us", c1: "rgba(93,151,65,0.52)",   c2: "rgba(0,85,149,0.45)",    c3: "rgba(93,151,65,0.52)",   border: "#5d9741" },
  "Real Salt Lake":         { seed: 9, regPts: 45, flag: "us", c1: "rgba(179,8,56,0.48)",    c2: "rgba(1,58,129,0.45)",    c3: "rgba(241,203,0,0.50)",   border: "#b30838" },
  // Wild Card Placeholders
  "East Wild Card Winner":  { seed: "WC", regPts: 46, flag: "us", c1: "rgba(120,120,120,0.3)", c2: "rgba(180,180,180,0.3)", c3: "rgba(120,120,120,0.3)", border: "#888" },
  "West Wild Card Winner":  { seed: "WC", regPts: 45, flag: "us", c1: "rgba(120,120,120,0.3)", c2: "rgba(180,180,180,0.3)", c3: "rgba(120,120,120,0.3)", border: "#888" },
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
    heroTitle: "MLS Cup Challenge",
    heroSub: "Audi MLS Cup Playoffs — Every Match, Every Series.",
    heroLogo: "/fsf-logo.png",
    navTitle: "Five Stripe Fantasy",
    navTitleShort: "FSF",
    fontSerif: true,
    cardBg: "linear-gradient(180deg, #fcfaf8 0%, #f6f1ec 100%)",
    cardBorder: "#eadfd5",
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
    heroTitle: "MLS Cup Challenge",
    heroSub: "Audi MLS Cup Playoffs — Every Match, Every Series.",
    heroLogo: "/fsf-logo.png",
    navTitle: "Five Stripe Fantasy",
    navTitleShort: "FSF",
    fontSerif: true,
    cardBg: "linear-gradient(180deg, #fcfaf8 0%, #f6f1ec 100%)",
    cardBorder: "#eadfd5",
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
    cardBg: "#ffffff",
    cardBorder: "#e2e8f0",
  },
};

const C = { ...THEMES.default };
function applyTheme(name) {
  const t = THEMES[name] || THEMES.default;
  Object.keys(C).forEach((k) => { delete C[k]; });
  Object.assign(C, t);
  if (typeof styles !== "undefined") {
    Object.assign(styles, buildStyles());
  }
}

// ── 4. SCORING & SERIES HELPERS (IMPORTED FROM ./bracketLogic.js) ──────────────

// ── 5. SHARED UI COMPONENTS ──────────────────────────────────────────────────
function buildStyles() {
  return {
    app: { fontFamily: "'DM Sans', sans-serif", background: C.bg, minHeight: "100vh", color: C.text, width: "100%", overflowX: "clip" },
    nav: {
      background: C.navyMid, color: C.white, padding: "0 clamp(0.75rem, 2.5vw, 1.5rem)",
      width: "100%", boxSizing: "border-box",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: "62px", position: "sticky", top: 0, zIndex: 200,
      boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
    },
    navLogo: { fontSize: "17px", fontWeight: 800, color: C.white, letterSpacing: "-0.3px", cursor: "pointer", whiteSpace: "nowrap", minWidth: 0, display: "flex", alignItems: "center", gap: "10px" },
    navLinks: { display: "flex", gap: "4px", alignItems: "center", overflowX: "auto", scrollbarWidth: "none" },
    navBtn: (active) => ({
      background: active ? C.navy : "transparent",
      color: active ? "#1a1a1a" : "rgba(255,255,255,0.82)",
      border: "none", borderRadius: "8px", padding: "7px 11px",
      fontSize: "12.5px", fontWeight: active ? 700 : 500, cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap",
      transition: "background 0.15s ease, color 0.15s ease",
    }),
    hero: {
      background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyMid} 100%)`,
      color: C.white, padding: "2.5rem 1.5rem 2rem", textAlign: "center",
    },
    heroTitle: { fontSize: "clamp(1.8rem,5vw,2.75rem)", fontWeight: 800, color: C.gold, margin: "0 0 0.5rem", letterSpacing: "-0.5px" },
    heroSub: { fontSize: "clamp(0.85rem,3vw,1rem)", color: "rgba(255,255,255,0.8)", margin: "0 0 1.25rem" },
    container: { maxWidth: "960px", width: "100%", boxSizing: "border-box", margin: "0 auto", padding: "clamp(0.75rem, 3vw, 1.5rem)" },
    card: {
      background: C.cardBg || C.white,
      borderRadius: "12px",
      padding: "clamp(0.75rem,3vw,1.5rem)",
      border: `1px solid ${C.cardBorder || C.border}`,
      boxShadow: "0 2px 10px rgba(26,26,26,0.04)",
      marginBottom: "1rem",
    },
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
      cursor: "pointer",
      border: `1.5px solid ${active ? C.navyMid : "#cbd5e1"}`,
      background: active ? C.navyMid : C.white,
      color: active ? C.white : C.text,
      boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "0 1px 2px rgba(0,0,0,0.04)",
      transition: "all 0.15s ease",
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
}
const styles = buildStyles();

function Alert({ type, msg }) {
  if (!msg) return null;
  return <div style={styles.alert(type)}>{msg}</div>;
}

function GlobalStyles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; }
      html, body, #root { width: 100%; max-width: 100%; overflow-x: clip; margin: 0; padding: 0; }
    `}</style>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.navy, animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function CircleLogo({ size = 54, src = C.heroLogo, fallback = null }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return fallback;
  return (
    <span
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        clipPath: "circle(49.2% at 50% 50%)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.28)",
      }}
    >
      <img
        src={src}
        alt="Five Stripe Fantasy"
        onError={() => setBroken(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          borderRadius: "50%",
          transform: "scale(1.02)",
        }}
      />
    </span>
  );
}

function PageBanner({ icon: Icon, badge, title, subtitle, rightSlot = null }) {
  const isMobile = useIsMobile();
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.navyMid} 0%, #2d2d2d 60%, ${C.navy} 100%)`,
      borderRadius: "14px",
      padding: isMobile ? "1.1rem 1rem" : "1.4rem 1.5rem",
      color: C.white,
      marginBottom: "1.15rem",
      boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "space-between",
      alignItems: isMobile ? "stretch" : "center",
      flexWrap: "wrap",
      gap: "12px",
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "10px",
            background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon size={18} color="#fff" />
          </div>
          <span style={{
            fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
            color: C.navy, background: "rgba(255,255,255,0.12)", padding: "3px 10px", borderRadius: "999px",
          }}>
            {badge}
          </span>
        </div>
        <div style={{
          fontSize: "clamp(1.25rem, 3.5vw, 1.55rem)",
          fontWeight: 800,
          fontFamily: C.fontSerif ? "'Georgia','Times New Roman',serif" : "inherit",
          fontStyle: C.fontSerif ? "italic" : "normal",
          marginBottom: subtitle ? "4px" : 0,
        }}>
          {title}
        </div>
        {subtitle && (
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.82)", lineHeight: 1.45 }}>
            {subtitle}
          </p>
        )}
      </div>
      {rightSlot && <div style={{ flexShrink: 0, minWidth: 0 }}>{rightSlot}</div>}
    </div>
  );
}

function TeamBtn({ team, selected, onClick, style = {}, resultState = null, disabled = false, readOnly = false }) {
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
      onClick={(resultState || disabled || readOnly) ? undefined : onClick}
      style={{
        flex: 1, display: "flex", alignItems: "center", gap: isMobile ? "6px" : "8px",
        padding: isMobile ? "9px 8px" : "10px 14px", borderRadius: "8px", fontSize: "13px",
        fontWeight: (selected || isCorrect || isWinner) ? 700 : 500,
        cursor: (resultState || disabled || readOnly) ? "default" : "pointer", textAlign: "left",
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
  const [isCompact, setIsCompact] = useState(() => window.innerWidth < 900);
  const [isPhone, setIsPhone] = useState(() => window.innerWidth < 640);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const compact = window.innerWidth < 900;
      const phone = window.innerWidth < 640;
      setIsCompact(compact);
      setIsPhone(phone);
      if (!compact) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const accentColor = themeKey === "navy" ? C.gold : C.navy;
  const barBg = C.navyMid;
  const navItems = [
    ["leaderboard", "Leaderboard", Trophy],
    ["stage1", "Play-In / Conf QF", Calendar],
    ["stage2", "Final 8 Bracket", GitMerge],
    ["results", "Results", CheckCircle2],
    ["insights", "Insights", BarChart3],
    ["guide", "Guide", BookOpen],
  ];
  const currentItem = navItems.find(([id]) => id === page) || navItems[0];
  const CurrentIcon = currentItem[2];
  const handleNav = (id) => { setPage(id); setMenuOpen(false); };

  return (
    <>
      <nav
        key={`nav-${themeKey}`}
        style={{
          ...styles.nav,
          background: barBg,
          borderBottom: `2px solid ${accentColor}`,
        }}
      >
        <div style={{
          maxWidth: "1100px",
          width: "100%",
          minWidth: 0,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: isPhone ? "8px" : "12px",
        }}>
          <button
            type="button"
            onClick={() => handleNav("leaderboard")}
            style={{
              ...styles.navLogo,
              background: "transparent",
              border: "none",
              padding: 0,
              color: C.white,
              minWidth: 0,
              flexShrink: 1,
              overflow: "hidden",
              gap: isPhone ? "8px" : "10px",
            }}
          >
            <CircleLogo
              size={isPhone ? 30 : 32}
              fallback={(
                <span style={{
                  width: isPhone ? "30px" : "32px",
                  height: isPhone ? "30px" : "32px",
                  borderRadius: "50%",
                  background: accentColor,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Trophy size={16} color="#1a1a1a" />
                </span>
              )}
            />
            <span style={{
              fontFamily: C.fontSerif ? "'Georgia','Times New Roman',serif" : "'DM Sans',sans-serif",
              fontStyle: C.fontSerif ? "italic" : "normal",
              fontSize: isPhone ? "16px" : "18px",
              fontWeight: 800,
              letterSpacing: "-0.2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {C.navTitle || "Five Stripe Fantasy"}
            </span>
          </button>

          {isCompact ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto", flexShrink: 0 }}>
              {!isPhone && (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: accentColor,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: "5px 10px",
                  borderRadius: "999px",
                  whiteSpace: "nowrap",
                }}>
                  <CurrentIcon size={13} color={accentColor} />
                  {currentItem[1]}
                </span>
              )}
              <button
                type="button"
                aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
                style={{
                  background: menuOpen ? accentColor : "rgba(255,255,255,0.12)",
                  border: `1px solid ${menuOpen ? accentColor : "rgba(255,255,255,0.24)"}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  width: "38px",
                  height: "38px",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: menuOpen ? "#1a1a1a" : C.white,
                }}
              >
                {menuOpen ? <X size={19} /> : <Menu size={19} />}
              </button>
            </div>
          ) : (
            <div style={styles.navLinks}>
              {navItems.map(([id, label, Icon]) => {
                const active = page === id;
                return (
                  <button
                    key={id}
                    type="button"
                    style={{
                      ...styles.navBtn(active),
                      background: active ? accentColor : "transparent",
                      color: active ? "#1a1a1a" : "rgba(255,255,255,0.82)",
                      boxShadow: active ? "0 2px 10px rgba(0,0,0,0.22)" : "none",
                    }}
                    onClick={() => handleNav(id)}
                  >
                    <Icon size={14} color={active ? "#1a1a1a" : accentColor} />
                    <span>{label}</span>
                  </button>
                );
              })}

              <span style={{
                width: "1px",
                height: "22px",
                background: "rgba(255,255,255,0.16)",
                margin: "0 4px",
                flexShrink: 0,
              }} />

              {isAdmin && (
                <button
                  type="button"
                  style={{
                    ...styles.navBtn(false),
                    background: "rgba(232,147,106,0.14)",
                    color: accentColor,
                    border: `1px solid ${themeKey === "navy" ? "rgba(239,184,36,0.45)" : "rgba(232,147,106,0.48)"}`,
                    fontWeight: 700,
                    padding: "6px 10px",
                  }}
                  onClick={() => setShowAdmin(true)}
                >
                  <Shield size={13} color={accentColor} />
                  <span>Admin</span>
                </button>
              )}
              <button
                type="button"
                style={{
                  ...styles.navBtn(false),
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.84)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  fontWeight: 600,
                  padding: "6px 10px",
                }}
                onClick={() => supabase.auth.signOut()}
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {isCompact && menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              top: "62px",
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 198,
              background: "rgba(0,0,0,0.45)",
            }}
          />
          <div style={{
            position: "fixed",
            top: "62px",
            left: 0,
            right: 0,
            maxHeight: "calc(100vh - 62px)",
            overflowY: "auto",
            zIndex: 199,
            background: barBg,
            borderBottom: `2px solid ${accentColor}`,
            boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
            padding: "8px 12px 12px",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "560px", margin: "0 auto" }}>
              {navItems.map(([id, label, Icon]) => {
              const active = page === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleNav(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    textAlign: "left",
                    padding: "11px 14px",
                    background: active ? accentColor : "transparent",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14.5px",
                    fontWeight: active ? 700 : 500,
                    color: active ? "#1a1a1a" : "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <Icon size={16} color={active ? "#1a1a1a" : accentColor} />
                  <span>{label}</span>
                </button>
              );
            })}

            <div style={{ height: "1px", background: "rgba(255,255,255,0.12)", margin: "4px 0" }} />

            {isAdmin && (
              <button
                type="button"
                onClick={() => { setShowAdmin(true); setMenuOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  textAlign: "left",
                  padding: "11px 14px",
                  background: "rgba(232,147,106,0.12)",
                  border: `1px solid ${themeKey === "navy" ? "rgba(239,184,36,0.35)" : "rgba(232,147,106,0.4)"}`,
                  borderRadius: "8px",
                  fontSize: "14.5px",
                  fontWeight: 700,
                  color: accentColor,
                  cursor: "pointer",
                  marginBottom: "4px",
                }}
              >
                <Shield size={16} color={accentColor} />
                <span>Admin Panel</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                textAlign: "left",
                padding: "11px 14px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "8px",
                fontSize: "14.5px",
                fontWeight: 500,
                color: "rgba(255,255,255,0.8)",
                cursor: "pointer",
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ── 6. AUTH SCREEN ───────────────────────────────────────────────────────────
function AuthScreen({ registrationOpen = true, onProfileSynced }) {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  async function handleSubmit() {
    setError(""); setLoading(true);
    try {
      if (mode === "register") {
        if (!registrationOpen) throw new Error("Registration is currently closed.");
        if (!name.trim()) throw new Error("Please enter a display name.");
        if (!inviteCode.trim()) throw new Error("An invite code is required to create an account.");
        const { data: league, error: le } = await supabase
          .from("leagues").select("id,name").eq("invite_code", inviteCode.trim().toLowerCase()).single();
        if (le || !league) throw new Error("Invalid invite code. Please check with your league organizer.");
        const { data: authData, error: e } = await supabase.auth.signUp({
          email, password: pass, options: { data: { display_name: name.trim(), league_id: league.id } }
        });
        if (e) throw e;
        if (authData?.user?.id) {
          const payload = { id: authData.user.id, display_name: name.trim(), email, league_id: league.id };
          const { error: pe } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
          if (pe) {
            await new Promise((r) => setTimeout(r, 500));
            await supabase.from("profiles").upsert(payload, { onConflict: "id" });
          }
          if (onProfileSynced) onProfileSynced(authData.user.id);
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
      <GlobalStyles />
      <div style={{
        ...styles.hero,
        padding: isMobile ? "1.6rem 1rem 1.4rem" : "2.5rem 1.5rem 2rem",
        background: `linear-gradient(135deg, ${C.navyMid} 0%, #2d2d2d 58%, ${C.navy} 100%)`,
      }}>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: isMobile ? "10px" : "18px",
          marginBottom: "0.5rem",
        }}>
          <CircleLogo size={isMobile ? 54 : 64} />
          <div style={{ ...styles.heroTitle, margin: 0, fontFamily: C.fontSerif ? "'Georgia','Times New Roman',serif" : "inherit", fontStyle: C.fontSerif ? "italic" : "normal", color: C.heroTitleColor || C.white }}>
            {C.heroTitle}
          </div>
          {!isMobile && <CircleLogo size={64} />}
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
                <input style={styles.input} value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Enter league invite code" />
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
  const isMobile = useIsMobile();
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

  async function syncSeriesOutcome(seriesId, picksMap) {
    const sorted = calcSeriesWins(seriesId, picksMap, matchResults);
    const { winner, length } = deriveSeriesOutcome(sorted);
    if (winner && length) {
      setGroupPicks((prev) => ({ ...prev, [seriesId]: { first: winner, second: length } }));
      const { error: gpErr } = await supabase.from("stage1_group_picks").upsert({
        user_id: userId, group_code: seriesId,
        first_place: winner, second_place: length,
      }, { onConflict: "user_id,group_code" });
      if (gpErr) throw gpErr;
    } else {
      setGroupPicks((prev) => ({ ...prev, [seriesId]: { first: "", second: "" } }));
      const { error: delErr } = await supabase.from("stage1_group_picks").delete().eq("user_id", userId).eq("group_code", seriesId);
      if (delErr) throw delErr;
    }
  }

  async function pickMatch(matchId, pick) {
    if (locked || matchResults[matchId]?.result) return;
    const match = ALL_GROUP_MATCHES.find((m) => m.matchId === matchId);
    if (!match) return;

    const nextPicks = { ...matchPicks, [matchId]: pick };
    const [t1, t2] = getResolvedMatchTeams(match, nextPicks, matchResults);

    // If this is a Round 1 Series match, check if Game 1 + Game 2 produced a 2-0 sweep
    let removedG3 = false;
    if (!match.isWildCard) {
      const seriesId = match.group;
      const sweep = isSeriesSweep(seriesId, nextPicks);
      if (sweep && nextPicks[`${seriesId}_G3`]) {
        delete nextPicks[`${seriesId}_G3`];
        removedG3 = true;
      }
    }

    setMatchPicks(nextPicks);
    setSaveStatus((prev) => ({ ...prev, [matchId]: "saving" }));

    try {
      if (removedG3) {
        await supabase.from("stage1_match_picks").delete().eq("user_id", userId).eq("match_id", `${match.group}_G3`);
      }

      const { error: mpErr } = await supabase.from("stage1_match_picks").upsert({
        user_id: userId, match_id: matchId, group_code: match.group,
        team1: t1, team2: t2, pick,
      }, { onConflict: "user_id,match_id" });
      if (mpErr) throw mpErr;

      // If Wild Card pick changed, cascade resolved club name into Series 1 match picks & derived series winner
      if (match.isWildCard) {
        const cascadeSeriesId = match.matchId === "WC_E" ? "E_S1" : match.matchId === "WC_W" ? "W_S1" : null;
        if (cascadeSeriesId) {
          const seriesMatches = ALL_GROUP_MATCHES.filter((sm) => sm.group === cascadeSeriesId);
          for (const sm of seriesMatches) {
            if (nextPicks[sm.matchId]) {
              const [st1, st2] = getResolvedMatchTeams(sm, nextPicks, matchResults);
              await supabase.from("stage1_match_picks").upsert({
                user_id: userId, match_id: sm.matchId, group_code: sm.group,
                team1: st1, team2: st2, pick: nextPicks[sm.matchId],
              }, { onConflict: "user_id,match_id" });
            }
          }
          await syncSeriesOutcome(cascadeSeriesId, nextPicks);
        }
      } else {
        await syncSeriesOutcome(match.group, nextPicks);
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

  function renderMatchRow(m, showSeriesPrefix = false) {
    const [t1, t2] = getResolvedMatchTeams(m, matchPicks, matchResults);
    const userPick = matchPicks[m.matchId];
    const actualRes = matchResults[m.matchId]?.result;
    const hasResult = !!actualRes;

    // Check if Game 3 is unneeded because user picked a 2-0 sweep
    const sweep = !m.isWildCard && m.gameNum === 3 && isSeriesSweep(m.group, matchPicks);
    if (sweep && !hasResult) {
      return (
        <div key={m.matchId} style={{ padding: "10px 14px", borderRadius: "8px", background: C.white, border: `1px dashed ${C.border}`, textAlign: "center", fontSize: "12px", color: C.textMuted, fontStyle: "italic", marginBottom: showSeriesPrefix ? "6px" : 0 }}>
          {showSeriesPrefix ? `${SERIES_LABELS[m.group]} · ` : ""}Game 3 (If Necessary) — Not needed based on your 2–0 sweep pick
        </div>
      );
    }

    const t1State = !hasResult ? null : userPick === "team1" ? (actualRes === "team1" ? "correct" : "wrong") : actualRes === "team1" ? "winner" : null;
    const t2State = !hasResult ? null : userPick === "team2" ? (actualRes === "team2" ? "correct" : "wrong") : actualRes === "team2" ? "winner" : null;
    const maxPts = m.isWildCard ? SCORING_RULES.STAGE1.WILD_CARD_WIN : SCORING_RULES.STAGE1.ROUND1_GAME_WIN;
    const earnedPts = hasResult && userPick === actualRes ? `+${maxPts}` : null;

    return (
      <div key={m.matchId} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "4px 8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: C.text, background: `${C.navy}25`, padding: "2px 8px", borderRadius: "4px" }}>
            {showSeriesPrefix ? `${SERIES_LABELS[m.group]} · ` : ""}
            {m.isWildCard ? "WILD CARD (SINGLE ELIM.)" : `GAME ${m.gameNum}${m.gameNum === 3 ? " (IF NECESSARY)" : ""}`}
          </span>
          <span style={{ fontSize: "11px", color: C.textMuted }}>{m.date} · {m.time}</span>
        </div>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          gap: isMobile ? "6px" : "8px",
        }}>
          <TeamBtn team={t1} selected={!hasResult && userPick === "team1"} resultState={t1State} readOnly={locked || hasResult} onClick={() => pickMatch(m.matchId, "team1")} />
          {isMobile ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "11px", fontWeight: 700, color: C.textMuted, lineHeight: 1 }}>
              <span>vs</span>
              {hasResult && (
                <span style={{ color: earnedPts ? C.green : C.textMuted }}>
                  {earnedPts ? `✓ ${earnedPts}` : "✗ +0"}
                </span>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "42px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: C.textMuted }}>vs</span>
              {hasResult && (
                <span style={{ fontSize: "11px", fontWeight: 700, color: earnedPts ? C.green : C.textMuted }}>
                  {earnedPts ? `✓ ${earnedPts}` : "✗ +0"}
                </span>
              )}
            </div>
          )}
          <TeamBtn team={t2} selected={!hasResult && userPick === "team2"} resultState={t2State} readOnly={locked || hasResult} onClick={() => pickMatch(m.matchId, "team2")} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <PageBanner
        icon={Target}
        badge="Stage 1 · Play-In & Best-of-3"
        title="Play-In / Conference Quarterfinals"
        subtitle="Pick both Wild Card Play-In winners and all 8 Best-of-3 series—every click saves automatically."
        rightSlot={
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: "10px", padding: "8px 14px", textAlign: "center", minWidth: "92px", flex: isMobile ? 1 : undefined }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: C.navy, letterSpacing: "0.06em" }}>WILD CARD</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>{wcPickedCount}<span style={{ fontSize: "0.85rem", opacity: 0.6 }}>/2</span></div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: "10px", padding: "8px 14px", textAlign: "center", minWidth: "92px", flex: isMobile ? 1 : undefined }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: C.navy, letterSpacing: "0.06em" }}>SERIES SET</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>{clinchedSeriesCount}<span style={{ fontSize: "0.85rem", opacity: 0.6 }}>/8</span></div>
            </div>
          </div>
        }
      />

      {locked && <div style={styles.alert("warning")}>Stage 1 (Play-In &amp; Conf QF) picks are locked!</div>}

      {/* Conference & View Switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", flexDirection: isMobile ? "column" : "row", flexWrap: "wrap", gap: "8px", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["EAST", "WEST"].map((conf) => (
            <button key={conf} style={{ ...styles.tab(activeConf === conf && viewMode === "series"), flex: isMobile ? 1 : undefined, padding: isMobile ? "8px 12px" : "8px 18px" }} onClick={() => { setActiveConf(conf); setViewMode("series"); }}>
              {conf === "EAST" ? "Eastern Conference" : "Western Conference"}
            </button>
          ))}
        </div>
        <button
          style={{ ...styles.tab(viewMode === "date"), display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          onClick={() => setViewMode(viewMode === "date" ? "series" : "date")}
        >
          <Calendar size={14} />
          {viewMode === "date" ? "Back to Series View" : "View All by Date"}
        </button>
      </div>

      {viewMode === "date" ? (
        <div style={{ ...styles.card, borderTop: `4px solid ${C.navyMid}` }}>
          <div style={styles.cardTitle}>All Wild Card &amp; Round One Fixtures (Chronological)</div>
          {ALL_GROUP_MATCHES.map((m) => renderMatchRow(m, true))}
        </div>
      ) : (
        <>
          {/* Wild Card Card */}
          <div style={{ ...styles.card, borderTop: `4px solid ${C.navy}` }}>
            <div style={styles.cardTitle}>
              {confWildCard.label}
              <span style={styles.badge(C.white, C.navy)}>+{SCORING_RULES.STAGE1.WILD_CARD_WIN} pts</span>
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
              <div key={seriesId} style={{ ...styles.card, borderTop: `4px solid ${C.navyMid}` }}>
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
                  background: gp.first ? `${C.navy}15` : C.white,
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
  const isMobile = useIsMobile();
  const [picks, setPicks] = useState({});
  const [autoSaveState, setAutoSaveState] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  // Keep official knockout results decoupled from user picks so admin updates never overwrite local selections
  const koResults = useMemo(() => {
    const rmap = {};
    koResultsCache.forEach((r) => {
      rmap[r.match_id] = { result: r.result, team1: r.team1, team2: r.team2 };
    });
    return rmap;
  }, [koResultsCache]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: s2data, error } = await supabase
        .from("stage2_picks")
        .select("slot_id,picked_team")
        .eq("user_id", userId);
      if (cancelled) return;
      if (error) {
        setMsg({ type: "error", text: error.message || "Failed to load Final 8 bracket picks." });
      } else {
        const map = {};
        (s2data || []).forEach((p) => { map[p.slot_id] = p.picked_team; });
        setPicks(map);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  async function persistStage2Slots(slotIds, picksSnapshot) {
    for (const sid of slotIds) {
      const team = picksSnapshot[sid];
      if (!team) {
        const { error: delErr } = await supabase
          .from("stage2_picks")
          .delete()
          .eq("user_id", userId)
          .eq("slot_id", sid);
        if (delErr) throw delErr;
      } else {
        const round = sid.replace(/_\d+$/, "");
        const { error: upErr } = await supabase
          .from("stage2_picks")
          .upsert(
            { user_id: userId, slot_id: sid, round, picked_team: team },
            { onConflict: "user_id,slot_id" }
          );
        if (upErr) throw upErr;
      }
    }
  }

  async function makePick(slotId, team) {
    if (locked || koResults[slotId]?.result) return;
    const { nextPicks, changedSlots } = applyStage2Pick(picks, slotId, team);
    setPicks(nextPicks);
    setAutoSaveState("saving");
    setMsg({ type: "", text: "" });
    try {
      await persistStage2Slots(changedSlots, nextPicks);
      setAutoSaveState("saved");
    } catch (e) {
      setAutoSaveState("error");
      setMsg({ type: "error", text: e.message || "Failed to save bracket pick." });
    }
  }

  if (!stage2Open) {
    return (
      <div style={styles.container}>
        <PageBanner
          icon={Trophy}
          badge="Stage 2 · Single Elimination"
          title="Final 8 Knockout Bracket"
          subtitle="Pick every matchup from Conference Semifinals through MLS Cup."
        />
        <div style={{ ...styles.card, borderTop: `4px solid ${C.navyMid}`, textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "14px", background: `${C.navy}20`,
            display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem",
          }}>
            <Lock size={24} color={C.navyMid} />
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "6px" }}>Final 8 Knockout Bracket Not Yet Open</div>
          <p style={{ color: C.textMuted, fontSize: "14px", maxWidth: "460px", margin: "0 auto" }}>
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
      <PageBanner
        icon={Trophy}
        badge="Stage 2 · Single Elimination"
        title="Final 8 Knockout Bracket"
        subtitle={!locked
          ? (autoSaveState === "saving"
            ? "Saving pick..."
            : autoSaveState === "saved"
              ? "✓ Picks saved automatically in real time."
              : autoSaveState === "error"
                ? "Auto-save failed — click your pick again to retry."
                : "Picks save automatically on every click and cascade through the bracket.")
          : "Stage 2 picks are locked—track your bracket against official results below."}
        rightSlot={
          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: "10px", padding: "8px 16px", textAlign: "center", minWidth: "108px" }}>
            <div style={{ fontSize: "10px", fontWeight: 800, color: C.navy, letterSpacing: "0.06em" }}>COMPLETED</div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800 }}>{filledSlots}<span style={{ fontSize: "0.85rem", opacity: 0.6 }}>/{knockoutBracket.length}</span></div>
          </div>
        }
      />

      {locked && <div style={styles.alert("warning")}>Stage 2 Knockout Bracket picks are locked!</div>}
      <Alert type={msg.type} msg={msg.text} />

      {KNOCKOUT_ROUNDS.map(({ round, label, points }) => {
        const roundSlots = knockoutBracket.filter((s) => s.round === round);
        const accentColor = round === "CUP" ? "#d97706" : round === "CF" ? C.navyMid : C.navy;
        return (
          <div key={round} style={{ ...styles.card, borderTop: `4px solid ${accentColor}` }}>
            <div style={styles.cardTitle}>
              {label}
              <span style={styles.badge(C.white, accentColor)}>+{points} pts each</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {roundSlots.map((slot) => {
                const {
                  t1, t2, bothKnown, picked, koResult,
                  hasResult, actualWinner, userCorrect,
                  t1State, t2State, isReadOnly,
                } = getStage2SlotDisplayState(slot.slotId, picks, koResults, knockoutBracket, locked);

                const divergedActual = hasResult && actualWinner && actualWinner !== t1 && actualWinner !== t2;

                return (
                  <div key={slot.slotId}>
                    <div style={{ fontSize: "11px", color: C.textMuted, fontWeight: 700, marginBottom: "4px" }}>{slot.label}</div>
                    {!bothKnown ? (
                      <div style={{ padding: "10px", borderRadius: "8px", background: C.white, border: `1px solid ${C.border}`, textAlign: "center", fontSize: "13px", color: C.textMuted, fontStyle: "italic" }}>
                        Select winners in the previous round to populate this matchup
                      </div>
                    ) : (
                      <div style={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: isMobile ? "stretch" : "center",
                        gap: isMobile ? "6px" : "8px",
                      }}>
                        <TeamBtn team={t1} selected={!hasResult && picked === t1} resultState={t1State} readOnly={isReadOnly} onClick={() => makePick(slot.slotId, t1)} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: C.textMuted, textAlign: "center", lineHeight: 1 }}>vs</span>
                        <TeamBtn team={t2} selected={!hasResult && picked === t2} resultState={t2State} readOnly={isReadOnly} onClick={() => makePick(slot.slotId, t2)} />
                      </div>
                    )}
                    {hasResult && (
                      <div style={{ fontSize: "12px", fontWeight: 600, marginTop: "5px", color: userCorrect ? C.green : C.textMuted }}>
                        {userCorrect
                          ? `✓ Actual winner: ${actualWinner} (+${points} pts)`
                          : divergedActual || !bothKnown
                            ? `${picked ? "✗ " : ""}Actual matchup: ${koResult.team1} vs ${koResult.team2} — Winner: ${actualWinner} (${picked ? "+0 pts" : "no pick"})`
                            : picked
                              ? `✗ Actual winner: ${actualWinner} (+0 pts)`
                              : `Winner: ${actualWinner} (no pick)`}
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
}

// ── 9. LEADERBOARD ───────────────────────────────────────────────────────────
function Leaderboard({ currentUserId, leagueId, leagueName, isAdmin, resultsVersion }) {
  const isMobile = useIsMobile();
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
        <div style={{ ...styles.card, borderTop: `4px solid ${C.navy}` }}>
          <div style={{ ...styles.cardTitle, justifyContent: "space-between", marginBottom: "0.85rem" }}>
            <span>Your Standing</span>
            {leagueName && <span style={styles.badge(C.white, C.navyMid)}>{leagueName}</span>}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(150px, 1fr))",
            gap: isMobile ? "8px" : "10px",
          }}>
            {[
              ["RANK", `#${me.rank}`, C.navy],
              ["TOTAL PTS", me.total, C.navyMid],
              ["PLAY-IN / CONF QF", me.s1score, C.green],
              ["FINAL 8 BRACKET", me.s2score, "#d97706"],
            ].map(([l, v, accent]) => (
              <div key={l} style={{
                padding: isMobile ? "10px 11px" : "12px 14px", borderRadius: "10px", background: C.white,
                border: `1px solid ${C.border}`, borderLeft: `4px solid ${accent}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)", minWidth: 0,
              }}>
                <div style={{ fontSize: isMobile ? "9.5px" : "10.5px", fontWeight: 800, color: C.textMuted, letterSpacing: "0.05em", marginBottom: "4px" }}>{l}</div>
                <div style={{ fontSize: isMobile ? "1.4rem" : "1.65rem", fontWeight: 800, color: C.text }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ ...styles.card, borderTop: `4px solid ${C.navyMid}` }}>
        <div style={{ ...styles.cardTitle, justifyContent: "space-between" }}>
          <span>League Standings</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: C.textMuted }}>{rows.length} {rows.length === 1 ? "player" : "players"}</span>
        </div>
        <div style={{ overflowX: "auto", background: C.white, borderRadius: "10px", border: `1px solid ${C.border}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? "12.5px" : "14px" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {[
                  "Rank",
                  "Player",
                  isMobile ? "Stage 1" : "Play-In / Conf QF",
                  "Final 8",
                  "Total",
                  isMobile ? "Hits" : "Correct",
                ].map((h) => (
                  <th key={h} style={{
                    padding: isMobile ? "8px 6px" : "8px 10px",
                    textAlign: h === "Player" ? "left" : "center",
                    fontSize: isMobile ? "11px" : "12px",
                    color: C.textMuted,
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, background: r.id === currentUserId ? `${C.navy}18` : "transparent" }}>
                  <td style={{ padding: isMobile ? "9px 6px" : "10px", textAlign: "center", fontWeight: 700, whiteSpace: "nowrap" }}>
                    {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                  </td>
                  <td style={{ padding: isMobile ? "9px 6px" : "10px", fontWeight: r.id === currentUserId ? 700 : 500 }}>
                    {r.display_name} {r.id === currentUserId && <span style={{ fontSize: "11px", color: C.navy }}>(you)</span>}
                  </td>
                  <td style={{ padding: isMobile ? "9px 6px" : "10px", textAlign: "center" }}>{r.s1score}</td>
                  <td style={{ padding: isMobile ? "9px 6px" : "10px", textAlign: "center" }}>{r.s2score}</td>
                  <td style={{ padding: isMobile ? "9px 6px" : "10px", textAlign: "center", fontWeight: 800 }}>{r.total}</td>
                  <td style={{ padding: isMobile ? "9px 6px" : "10px", textAlign: "center", color: C.textMuted }}>{r.correctPicks}</td>
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
function ResultTeamChip({ team, isWinner = false, isLoser = false, align = "left" }) {
  const isMobile = useIsMobile();
  const meta = TEAM_META[team];
  const pg = "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)";
  const rightAligned = align === "right";

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: rightAligned ? "row-reverse" : "row",
      alignItems: "center",
      gap: isMobile ? "5px" : "8px",
      padding: isMobile ? "7px 8px" : "8px 12px",
      borderRadius: "8px",
      border: `${isWinner ? "2px" : "1px"} solid ${isWinner && meta ? meta.border : isWinner ? C.green : C.border}`,
      background: isWinner && meta ? `${meta.c1.replace(/[\d.]+\)$/, "0.14)")}` : isWinner ? "rgba(29,158,117,0.06)" : C.white,
      opacity: isLoser ? 0.58 : 1,
      position: "relative",
      overflow: "hidden",
    }}>
      {meta && (
        <div style={{
          position: "absolute",
          [rightAligned ? "left" : "right"]: "6px",
          top: 0,
          bottom: 0,
          width: isMobile ? "24px" : "36px",
          display: "flex",
          gap: "2px",
          pointerEvents: "none",
          opacity: isWinner ? 0.85 : 0.35,
        }}>
          <div style={{ flex: 1, background: meta.c1, clipPath: pg }} />
          <div style={{ flex: 1, background: meta.c2, clipPath: pg }} />
          <div style={{ flex: 1, background: meta.c3, clipPath: pg }} />
        </div>
      )}
      {meta?.seed && (
        <span style={{
          fontSize: "10px", fontWeight: 800, padding: "2px 5px", borderRadius: "4px",
          background: "#1a1a1a", color: "#fff", flexShrink: 0, zIndex: 1,
        }}>#{meta.seed}</span>
      )}
      <span style={{
        fontSize: isMobile ? "12px" : "13px",
        fontWeight: isWinner ? 800 : 500,
        color: C.text,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textAlign: rightAligned ? "right" : "left",
        zIndex: 1,
      }}>{team}</span>
      {isWinner && (
        <span style={{
          fontSize: "11px", fontWeight: 800, color: C.green, flexShrink: 0, zIndex: 1,
        }}>✓</span>
      )}
    </div>
  );
}

function ResultsPage({ matchResultsCache = [], standingsCache = [], koResultsCache = [] }) {
  const isMobile = useIsMobile();
  const mrMap = {}; matchResultsCache.forEach((r) => (mrMap[r.match_id] = r));
  const stMap = {}; standingsCache.forEach((s) => (stMap[s.group_code] = s));
  const koMap = {}; koResultsCache.forEach((r) => (koMap[r.match_id] = r));
  const hasAnyKo = koResultsCache.some((r) => r.team1 || r.team2 || r.result);

  const clinchedCount = Object.keys(GROUPS).filter((sId) => stMap[sId]?.first_place).length;
  const completedMatches = ALL_GROUP_MATCHES.filter((m) => mrMap[m.matchId]?.result).length;

  return (
    <div style={styles.container}>
      <PageBanner
        icon={CheckCircle2}
        badge="Official Results"
        title="MLS Cup Playoffs Scoreboard"
        subtitle="Track clinched Best-of-3 series, match winners, and Final 8 Knockout advancement."
        rightSlot={
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: "10px", padding: "8px 14px", textAlign: "center", minWidth: "90px", flex: isMobile ? 1 : undefined }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: C.navy, letterSpacing: "0.06em" }}>SERIES</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>{clinchedCount}<span style={{ fontSize: "0.85rem", opacity: 0.6 }}>/8</span></div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: "10px", padding: "8px 14px", textAlign: "center", minWidth: "90px", flex: isMobile ? 1 : undefined }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: C.navy, letterSpacing: "0.06em" }}>MATCHES</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>{completedMatches}<span style={{ fontSize: "0.85rem", opacity: 0.6 }}>/{ALL_GROUP_MATCHES.length}</span></div>
            </div>
          </div>
        }
      />

      {hasAnyKo && (
        <div style={{ ...styles.card, borderTop: `4px solid #d97706` }}>
          <div style={styles.cardTitle}>Final 8 Knockout Bracket Results</div>
          {KNOCKOUT_ROUNDS.map(({ round, label, slots }) => (
            <div key={round} style={{ marginBottom: "1.1rem" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", marginBottom: "8px" }}>{label}</div>
              {Array.from({ length: slots }, (_, i) => {
                const slotId = `${round}_${i + 1}`;
                const res = koMap[slotId];
                const t1 = res?.team1 || "TBD";
                const t2 = res?.team2 || "TBD";
                const winner = res?.result === "team1" ? t1 : res?.result === "team2" ? t2 : null;
                return (
                  <div key={slotId} style={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "stretch" : "center",
                    gap: isMobile ? "5px" : "8px",
                    marginBottom: "10px",
                  }}>
                    <ResultTeamChip team={t1} isWinner={res?.result === "team1"} isLoser={res?.result === "team2"} align="left" />
                    <span style={{
                      padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700,
                      background: winner ? "rgba(29,158,117,0.12)" : "#f1f5f9",
                      color: winner ? C.green : C.textMuted,
                      whiteSpace: "nowrap", flexShrink: 0, textAlign: "center", minWidth: "74px",
                      alignSelf: isMobile ? "center" : undefined,
                    }}>
                      {winner ? (res.score1 != null && res.score2 != null ? `${res.score1} – ${res.score2}` : "FINAL") : "UPCOMING"}
                    </span>
                    <ResultTeamChip team={t2} isWinner={res?.result === "team2"} isLoser={res?.result === "team1"} align={isMobile ? "left" : "right"} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div style={{ ...styles.card, borderTop: `4px solid ${C.navy}` }}>
        <div style={styles.cardTitle}>Round One Series Summary</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
          {Object.keys(GROUPS).map((sId) => {
            const st = stMap[sId];
            const winnerMeta = st?.first_place ? TEAM_META[st.first_place] : null;
            const [homeClub, awayClub] = GROUPS[sId];
            const m1 = TEAM_META[homeClub];
            const m2 = TEAM_META[awayClub];
            return (
              <div key={sId} style={{
                padding: "10px 12px", borderRadius: "10px",
                border: `1.5px solid ${winnerMeta ? winnerMeta.border : C.border}`,
                background: winnerMeta ? winnerMeta.c1.replace(/[\d.]+\)$/, "0.10)") : C.white,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ display: "flex", height: "4px", borderRadius: "4px", overflow: "hidden", marginBottom: "8px", gap: "2px" }}>
                  {winnerMeta ? (
                    <>
                      <div style={{ flex: 1, background: winnerMeta.border }} />
                      <div style={{ flex: 1, background: winnerMeta.c2 }} />
                      <div style={{ flex: 1, background: winnerMeta.border }} />
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1, background: m1?.border || C.border }} />
                      <div style={{ flex: 1, background: m2?.border || C.border }} />
                    </>
                  )}
                </div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: C.textMuted }}>{SERIES_LABELS[sId]}</div>
                <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                  {st?.first_place ? (
                    <>
                      {winnerMeta?.seed && (
                        <span style={{ fontSize: "10px", fontWeight: 800, padding: "1px 5px", borderRadius: "4px", background: "#1a1a1a", color: "#fff" }}>#{winnerMeta.seed}</span>
                      )}
                      <span>✓ {st.first_place} ({st.second_place})</span>
                    </>
                  ) : (
                    <span style={{ color: C.textMuted, fontWeight: 500, fontSize: "13px" }}>In Progress / Upcoming</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ ...styles.card, borderTop: `4px solid ${C.navyMid}` }}>
        <div style={styles.cardTitle}>Match-by-Match Results</div>
        {ALL_GROUP_MATCHES.map((m) => {
          const res = mrMap[m.matchId];
          const [t1, t2] = getResolvedMatchTeams(m, {}, mrMap);
          return (
            <div key={m.matchId} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "4px 8px", marginBottom: "5px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: C.textMuted }}>
                  {SERIES_LABELS[m.group]} · {m.isWildCard ? "Wild Card" : `Game ${m.gameNum}`}
                </span>
                <span style={{ fontSize: "11px", color: C.textMuted }}>{m.date} · {m.time}</span>
              </div>
              <div style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center",
                gap: isMobile ? "5px" : "8px",
              }}>
                <ResultTeamChip team={t1} isWinner={res?.result === "team1"} isLoser={res?.result === "team2"} align="left" />
                <span style={{
                  padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700,
                  background: res?.result ? "rgba(29,158,117,0.12)" : "#f1f5f9",
                  color: res?.result ? C.green : C.textMuted,
                  whiteSpace: "nowrap", flexShrink: 0, textAlign: "center", minWidth: isMobile ? "54px" : "66px",
                  alignSelf: isMobile ? "center" : undefined,
                }}>
                  {res?.result ? (res.score1 != null && res.score2 != null ? `${res.score1} – ${res.score2}` : "FINAL") : "vs"}
                </span>
                <ResultTeamChip team={t2} isWinner={res?.result === "team2"} isLoser={res?.result === "team1"} align={isMobile ? "left" : "right"} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Insights({ stage1Locked, stage2Locked }) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(stage2Locked ? "stage2" : "stage1");
  const [groupPicks, setGroupPicks] = useState([]);
  const [wcPicks, setWcPicks] = useState([]);
  const [s2Picks, setS2Picks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stage2Locked) setActiveTab("stage2");
  }, [stage2Locked]);

  useEffect(() => {
    if (!stage1Locked && !stage2Locked) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const tasks = [];
      if (stage1Locked) {
        tasks.push(
          supabase.from("stage1_group_picks").select("group_code,first_place,second_place"),
          supabase.from("stage1_match_picks").select("match_id,pick").in("match_id", ["WC_E", "WC_W"])
        );
      } else {
        tasks.push(Promise.resolve({ data: [] }), Promise.resolve({ data: [] }));
      }
      if (stage2Locked) {
        tasks.push(supabase.from("stage2_picks").select("slot_id,round,picked_team"));
      } else {
        tasks.push(Promise.resolve({ data: [] }));
      }
      const [{ data: gp }, { data: wcp }, { data: s2 }] = await Promise.all(tasks);
      if (cancelled) return;
      setGroupPicks(gp || []);
      setWcPicks(wcp || []);
      setS2Picks(s2 || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [stage1Locked, stage2Locked]);

  if (!stage1Locked && !stage2Locked) {
    return (
      <div style={styles.container}>
        <PageBanner
          icon={BarChart3}
          badge="League Analytics"
          title="Pick Consensus & Insights"
          subtitle="See who the league backed once picks lock for each stage."
        />
        <div style={{ ...styles.card, borderTop: `4px solid ${C.navyMid}`, textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "14px", background: `${C.navy}20`,
            display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem",
          }}>
            <Lock size={24} color={C.navyMid} />
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "6px" }}>League Insights Unlock After Kickoff</div>
          <p style={{ fontSize: "14px", color: C.textMuted, maxWidth: "460px", margin: "0 auto" }}>
            Once Play-In / Conf QF or Final 8 Bracket picks lock, see how your league picked every series, round, and MLS Cup Champion.
          </p>
        </div>
      </div>
    );
  }

  function renderBarRows(counts, total) {
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (entries.length === 0) {
      return <div style={{ fontSize: "12px", color: C.textMuted, fontStyle: "italic" }}>No picks recorded yet.</div>;
    }
    return entries.map(([team, cnt]) => {
      const pct = total ? Math.round((cnt / total) * 100) : 0;
      const barColor = TEAM_META[team]?.border || C.navy;
      if (isMobile) {
        return (
          <div key={team} style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px", marginBottom: "4px", gap: "8px" }}>
              <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{team}</span>
              <span style={{ fontWeight: 700, fontSize: "12px", color: C.text, flexShrink: 0 }}>{cnt} ({pct}%)</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: C.border, borderRadius: "5px", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: "5px" }} />
            </div>
          </div>
        );
      }
      return (
        <div key={team} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", marginBottom: "5px" }}>
          <span style={{ width: "170px", flexShrink: 0, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team}</span>
          <div style={{ flex: 1, height: "9px", background: C.border, borderRadius: "5px", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: "5px" }} />
          </div>
          <span style={{ fontWeight: 700, minWidth: "70px", textAlign: "right", fontSize: "12px", color: C.text }}>
            {cnt} ({pct}%)
          </span>
        </div>
      );
    });
  }

  const cupPicks = s2Picks.filter((p) => p.slot_id === "CUP_1" && p.picked_team);
  const cupCounts = {};
  cupPicks.forEach((p) => { cupCounts[p.picked_team] = (cupCounts[p.picked_team] || 0) + 1; });

  return (
    <div style={styles.container}>
      <PageBanner
        icon={BarChart3}
        badge="League Analytics"
        title="Pick Consensus & Insights"
        subtitle="Compare league-wide pick distribution across Play-In / Conf QF series and the Final 8 Bracket."
      />

      <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <button style={styles.tab(activeTab === "stage1")} onClick={() => setActiveTab("stage1")}>
          Play-In / Conf QF Insights
        </button>
        <button style={styles.tab(activeTab === "stage2")} onClick={() => setActiveTab("stage2")}>
          Final 8 Bracket Insights {!stage2Locked ? "🔒" : ""}
        </button>
      </div>

      {loading ? <Spinner /> : activeTab === "stage2" ? (
        !stage2Locked ? (
          <div style={{ ...styles.card, borderTop: `4px solid ${C.navyMid}`, textAlign: "center", padding: "2.5rem 1.5rem" }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "14px", background: `${C.navy}20`,
              display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem",
            }}>
              <Lock size={24} color={C.navyMid} />
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "6px" }}>Final 8 Bracket Insights Locked</div>
            <p style={{ fontSize: "14px", color: C.textMuted, maxWidth: "460px", margin: "0 auto" }}>
              Once Stage 2 (Final 8 Bracket) picks lock, see league-wide MLS Cup Champion favorites and round-by-round consensus.
            </p>
          </div>
        ) : (
          <>
            <div style={{ ...styles.card, borderTop: `4px solid #d97706` }}>
              <div style={styles.cardTitle}>
                <span>MLS Cup Champion Consensus</span>
                <span style={styles.badge(C.white, "#d97706")}>{cupPicks.length} picks</span>
              </div>
              {renderBarRows(cupCounts, cupPicks.length)}
            </div>

            {KNOCKOUT_ROUNDS.map(({ round, label, slots }) => {
              const accent = round === "CUP" ? "#d97706" : round === "CF" ? C.navyMid : C.navy;
              return (
                <div key={round} style={{ ...styles.card, borderTop: `4px solid ${accent}` }}>
                  <div style={styles.cardTitle}>{label} Pick Distribution</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {Array.from({ length: slots }, (_, i) => {
                      const slotId = `${round}_${i + 1}`;
                      const slotPicks = s2Picks.filter((p) => p.slot_id === slotId && p.picked_team);
                      const counts = {};
                      slotPicks.forEach((p) => { counts[p.picked_team] = (counts[p.picked_team] || 0) + 1; });
                      return (
                        <div key={slotId} style={{ padding: "10px 12px", borderRadius: "9px", background: C.white, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>{SLOT_LABELS[slotId]}</div>
                          {renderBarRows(counts, slotPicks.length)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )
      ) : !stage1Locked ? (
        <div style={{ ...styles.card, borderTop: `4px solid ${C.navy}`, textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "14px", background: `${C.navy}20`,
            display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem",
          }}>
            <Lock size={24} color={C.navyMid} />
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "6px" }}>Play-In / Conf QF Insights Locked</div>
          <p style={{ fontSize: "14px", color: C.textMuted }}>These insights unlock once Stage 1 picks lock.</p>
        </div>
      ) : (
        <>
          <div style={{ ...styles.card, borderTop: `4px solid ${C.navy}` }}>
            <div style={styles.cardTitle}>Wild Card Consensus</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {["WC_E", "WC_W"].map((wcId) => {
                const wc = WILD_CARDS[wcId];
                const matchP = wcPicks.filter((p) => p.match_id === wcId && p.pick);
                const counts = {};
                matchP.forEach((p) => {
                  const team = p.pick === "team1" ? wc.seed8 : wc.seed9;
                  counts[team] = (counts[team] || 0) + 1;
                });
                return (
                  <div key={wcId} style={{ padding: "10px 12px", borderRadius: "9px", background: C.white, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>{SERIES_LABELS[wcId]}</div>
                    {renderBarRows(counts, matchP.length)}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ ...styles.card, borderTop: `4px solid ${C.navyMid}` }}>
            <div style={styles.cardTitle}>Round One Series Winner Consensus</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {Object.keys(GROUPS).map((sId) => {
                const sPicks = groupPicks.filter((p) => p.group_code === sId && p.first_place);
                const counts = {};
                sPicks.forEach((p) => { counts[p.first_place] = (counts[p.first_place] || 0) + 1; });
                return (
                  <div key={sId} style={{ padding: "10px 12px", borderRadius: "9px", background: C.white, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>{SERIES_LABELS[sId]}</div>
                    {renderBarRows(counts, sPicks.length)}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UserGuide({ embedded = false }) {
  const s1Rules = [
    { label: "Wild Card Winner", detail: "Single-elimination #8 vs #9 Play-In matches (East & West)", pts: `+${SCORING_RULES.STAGE1.WILD_CARD_WIN} pts`, accent: C.navy },
    { label: "Round One Match Winner", detail: "Each individual game picked correctly (Games 1, 2, or 3)", pts: `+${SCORING_RULES.STAGE1.ROUND1_GAME_WIN} pt`, accent: C.navyMid },
    { label: "Series Advancing Team", detail: "Picking the club that wins the Best-of-3 series", pts: `+${SCORING_RULES.STAGE1.SERIES_WINNER} pts`, accent: C.green },
    { label: "Exact Series Length Bonus", detail: "Bonus when both series winner AND 2–0 or 2–1 length match", pts: `+${SCORING_RULES.STAGE1.EXACT_SERIES_LENGTH} pt`, accent: "#d97706" },
  ];

  const s2Rules = [
    { round: "Conference Semifinals", sub: "4 matchups · East & West", pts: `+${SCORING_RULES.STAGE2.CSF} pts`, max: `${4 * SCORING_RULES.STAGE2.CSF} max`, color: C.navy },
    { round: "Conference Finals", sub: "2 matchups · East & West", pts: `+${SCORING_RULES.STAGE2.CF} pts`, max: `${2 * SCORING_RULES.STAGE2.CF} max`, color: C.navyMid },
    { round: "MLS Cup Champion", sub: "1 Championship Final", pts: `+${SCORING_RULES.STAGE2.CUP} pts`, max: `${SCORING_RULES.STAGE2.CUP} max`, color: "#d97706" },
  ];

  const tips = [
    { icon: Zap, title: "Real-Time Auto-Save", desc: "Both Play-In / Conf QF and Final 8 Bracket picks save automatically the moment you click—no Save button needed." },
    { icon: CheckCircle2, title: "2–0 Sweep Smart Lock", desc: "Every MLS Playoff game goes straight to PKs if tied after 90'. Pick the same team in Games 1 & 2 and Game 3 auto-locks as a 2–0 sweep." },
    { icon: Award, title: "Tiebreakers", desc: "If players tie on Total Points, the Leaderboard breaks the tie by Total Correct Picks across both stages." },
    { icon: BarChart3, title: "League Insights", desc: "Once each stage locks, the Insights tab unlocks league-wide consensus bars for every series, round, and MLS Cup pick." },
  ];

  const body = (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Hero Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navyMid} 0%, #2d2d2d 60%, ${C.navy} 100%)`,
        borderRadius: "14px",
        padding: embedded ? "1.25rem" : "1.75rem 1.5rem",
        color: C.white,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: C.navy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Trophy size={19} color="#fff" />
          </div>
          <span style={{
            fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
            color: C.navy, background: "rgba(255,255,255,0.12)", padding: "3px 10px", borderRadius: "999px",
          }}>
            Audi MLS Cup Playoffs
          </span>
        </div>
        <div style={{
          fontSize: embedded ? "1.3rem" : "1.6rem",
          fontWeight: 800,
          fontFamily: C.fontSerif ? "'Georgia','Times New Roman',serif" : "inherit",
          fontStyle: C.fontSerif ? "italic" : "normal",
          marginBottom: "6px",
        }}>
          Challenge Rules &amp; Scoring Guide
        </div>
        <p style={{ margin: 0, fontSize: "13.5px", color: "rgba(255,255,255,0.82)", lineHeight: 1.5 }}>
          Predict every Wild Card match, Best-of-3 Conference Quarterfinal series, and the Final 8 single-elimination bracket to MLS Cup.
        </p>
      </div>

      {/* Two-Stage Tournament Roadmap */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
        <div style={{ ...styles.card, marginBottom: 0, borderTop: `4px solid ${C.navy}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Target size={17} color={C.navy} />
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: C.navy }}>Stage 1</span>
          </div>
          <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "6px" }}>Play-In / Conf QF</div>
          <p style={{ margin: "0 0 8px", fontSize: "13px", color: C.textMuted, lineHeight: 1.55 }}>
            Covers the <strong>2 Wild Card</strong> single-elimination games (#8 vs #9) and <strong>8 Best-of-3 Round One Series</strong> across East &amp; West.
          </p>
          <div style={{ fontSize: "12px", color: C.text, background: C.white, padding: "8px 10px", borderRadius: "8px", border: `1px solid ${C.border}` }}>
            <strong>Home/Away Flip:</strong> Higher seed hosts Games 1 &amp; 3; lower seed hosts Game 2.
          </div>
        </div>

        <div style={{ ...styles.card, marginBottom: 0, borderTop: `4px solid ${C.navyMid}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Trophy size={17} color={C.navyMid} />
            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: C.navyMid }}>Stage 2</span>
          </div>
          <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "6px" }}>Final 8 Bracket</div>
          <p style={{ margin: "0 0 8px", fontSize: "13px", color: C.textMuted, lineHeight: 1.55 }}>
            Opens once all 8 Round One winners are set. Fill out the entire <strong>single-elimination bracket</strong> from Conference Semifinals to MLS Cup.
          </p>
          <div style={{ fontSize: "12px", color: C.text, background: C.white, padding: "8px 10px", borderRadius: "8px", border: `1px solid ${C.border}` }}>
            <strong>Bracket Cascade:</strong> Changing a Semifinal winner automatically updates or clears downstream rounds.
          </div>
        </div>
      </div>

      {/* Stage 1 Scoring */}
      <div style={{ ...styles.card, marginBottom: 0 }}>
        <div style={styles.cardTitle}>
          <span>Stage 1 Scoring — Play-In &amp; Best-of-3 Series</span>
          <span style={styles.badge(C.white, C.navy)}>Stage 1</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {s1Rules.map((r) => (
            <div key={r.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px",
              padding: "10px 12px", borderRadius: "9px", background: C.white, border: `1px solid ${C.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: C.text }}>{r.label}</div>
                <div style={{ fontSize: "12px", color: C.textMuted }}>{r.detail}</div>
              </div>
              <span style={{
                ...styles.badge(C.white, r.accent),
                fontSize: "13px", padding: "5px 12px", flexShrink: 0,
              }}>
                {r.pts}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stage 2 Scoring */}
      <div style={{ ...styles.card, marginBottom: 0 }}>
        <div style={styles.cardTitle}>
          <span>Stage 2 Scoring — Final 8 Knockout Bracket</span>
          <span style={styles.badge(C.white, C.navyMid)}>44 pts max</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
          {s2Rules.map((r) => (
            <div key={r.round} style={{
              padding: "14px", borderRadius: "10px", background: C.white,
              border: `1px solid ${C.border}`, borderLeft: `4px solid ${r.color}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "8px",
            }}>
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: 800, color: C.text }}>{r.round}</div>
                <div style={{ fontSize: "12px", color: C.textMuted }}>{r.sub}</div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: "20px", fontWeight: 800, color: r.color }}>{r.pts}</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: C.textMuted }}>{r.max}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "10px" }}>
          Points are awarded when your picked club wins that specific knockout matchup.
        </div>
      </div>

      {/* Pro Tips Grid */}
      <div style={{ ...styles.card, marginBottom: 0 }}>
        <div style={styles.cardTitle}>Good to Know</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px" }}>
          {tips.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{
              padding: "12px", borderRadius: "10px", background: C.white, border: `1px solid ${C.border}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              display: "flex", gap: "10px", alignItems: "flex-start",
            }}>
              <div style={{
                width: "30px", height: "30px", borderRadius: "8px",
                background: `${C.navy}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon size={16} color={C.navyMid} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "2px", color: C.text }}>{title}</div>
                <div style={{ fontSize: "12px", color: C.textMuted, lineHeight: 1.45 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  return embedded ? body : <div style={styles.container}>{body}</div>;
}

// ── 11. ADMIN PANEL ──────────────────────────────────────────────────────────
function AdminPanel({ leagueId, onClose, onResultsChange }) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("results");
  const [results, setResults] = useState([]);
  const [standings, setStandings] = useState([]);
  const [settings, setSettings] = useState({});
  const [bracket, setBracket] = useState([]);
  const [players, setPlayers] = useState([]);
  const [allS1MatchPicks, setAllS1MatchPicks] = useState([]);
  const [allS1GroupPicks, setAllS1GroupPicks] = useState([]);
  const [allS2Picks, setAllS2Picks] = useState([]);
  const [progressFilter, setProgressFilter] = useState("all");
  const [progressSearch, setProgressSearch] = useState("");
  const [refreshingProgress, setRefreshingProgress] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  async function syncCSFSlots(standingsList, currentBracket, { force = false } = {}) {
    const { nextBracket, changedRows } = computeCSFUpdates(standingsList, currentBracket, { force });
    for (const row of changedRows) {
      const { error } = await supabase.from("match_results").upsert(row, { onConflict: "match_id" });
      if (error) throw error;
    }
    if (changedRows.length > 0) setBracket(nextBracket);
    return { nextBracket, changed: changedRows.length > 0 };
  }

  async function loadAll() {
    setLoading(true);
    try {
      const [
        { data: r },
        { data: s },
        { data: se },
        { data: b },
        { data: profs },
        { data: s1m },
        { data: s1g },
        { data: s2p },
      ] = await Promise.all([
        supabase.from("match_results").select("*"),
        supabase.from("group_standings").select("*"),
        supabase.from("app_settings").select("*"),
        supabase.from("match_results").select("*").in("stage", ["CSF", "CF", "CUP"]),
        supabase.from("profiles").select("id, display_name, email, is_admin, league_id"),
        supabase.from("stage1_match_picks").select("user_id, match_id, pick"),
        supabase.from("stage1_group_picks").select("user_id, group_code, first_place, second_place"),
        supabase.from("stage2_picks").select("user_id, slot_id, picked_team"),
      ]);
      setResults(r || []);
      setStandings(s || []);
      const sMap = {}; (se || []).forEach((x) => (sMap[x.key] = x.value));
      setSettings(sMap);
      setBracket(b || []);
      setPlayers(profs || []);
      setAllS1MatchPicks(s1m || []);
      setAllS1GroupPicks(s1g || []);
      setAllS2Picks(s2p || []);
      const { changed } = await syncCSFSlots(s || [], b || []);
      if (changed && onResultsChange) onResultsChange();
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Failed to load admin data." });
    } finally {
      setLoading(false);
    }
  }

  async function refreshProgressData() {
    setRefreshingProgress(true);
    try {
      const [{ data: profs }, { data: s1m }, { data: s1g }, { data: s2p }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, email, is_admin, league_id"),
        supabase.from("stage1_match_picks").select("user_id, match_id, pick"),
        supabase.from("stage1_group_picks").select("user_id, group_code, first_place, second_place"),
        supabase.from("stage2_picks").select("user_id, slot_id, picked_team"),
      ]);
      setPlayers(profs || []);
      setAllS1MatchPicks(s1m || []);
      setAllS1GroupPicks(s1g || []);
      setAllS2Picks(s2p || []);
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Failed to refresh player progress." });
    } finally {
      setRefreshingProgress(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function syncAdminSeriesStanding(seriesId, allResults, currentStandings) {
    const seriesPicksSim = {};
    allResults.filter((r) => r.group_code === seriesId && r.result).forEach((r) => (seriesPicksSim[r.match_id] = r.result));
    const mrLookup = {}; allResults.forEach((r) => (mrLookup[r.match_id] = r));
    const sorted = calcSeriesWins(seriesId, seriesPicksSim, mrLookup);
    const { winner, length } = deriveSeriesOutcome(sorted);
    if (winner && length) {
      const stData = { group_code: seriesId, first_place: winner, second_place: length, updated_at: new Date().toISOString() };
      const { error } = await supabase.from("group_standings").upsert(stData, { onConflict: "group_code" });
      if (error) throw error;
      const nextStandings = [...(currentStandings || []).filter((s) => s.group_code !== seriesId), stData];
      setStandings(nextStandings);
      return { outcome: { winner, length }, nextStandings };
    }
    const { error } = await supabase.from("group_standings").delete().eq("group_code", seriesId);
    if (error) throw error;
    const nextStandings = (currentStandings || []).filter((s) => s.group_code !== seriesId);
    setStandings(nextStandings);
    return { outcome: null, nextStandings };
  }

  async function recordStage1Result(m, resultWinner) {
    try {
      const mrMap = {}; results.forEach((r) => (mrMap[r.match_id] = r));
      const [t1, t2] = getResolvedMatchTeams(m, {}, mrMap);
      const data = {
        match_id: m.matchId, stage: "group", group_code: m.group,
        team1: t1, team2: t2, result: resultWinner, updated_at: new Date().toISOString(),
      };
      const { error: upErr } = await supabase.from("match_results").upsert(data, { onConflict: "match_id" });
      if (upErr) throw upErr;
      let nextResults = [...results.filter((r) => r.match_id !== m.matchId), data];
      let nextStandings = standings;

      if (!m.isWildCard) {
        setResults(nextResults);
        const synced = await syncAdminSeriesStanding(m.group, nextResults, nextStandings);
        nextStandings = synced.nextStandings;
        await syncCSFSlots(nextStandings, bracket);
        if (synced.outcome) {
          setMsg({ type: "success", text: `${synced.outcome.winner} clinches ${m.group} (${synced.outcome.length}) & synced to Conference Semifinals!` });
        } else {
          setMsg({ type: "success", text: resultWinner ? `Saved ${m.matchId} winner.` : `Cleared ${m.matchId} result.` });
        }
      } else {
        // If Wild Card result changed, refresh any already-recorded Series 1 match_results & group_standings
        const cascadeSeriesId = m.matchId === "WC_E" ? "E_S1" : m.matchId === "WC_W" ? "W_S1" : null;
        if (cascadeSeriesId) {
          const nextMrMap = {}; nextResults.forEach((r) => (nextMrMap[r.match_id] = r));
          const seriesMatches = ALL_GROUP_MATCHES.filter((sm) => sm.group === cascadeSeriesId);
          for (const sm of seriesMatches) {
            const existing = nextMrMap[sm.matchId];
            if (existing) {
              const [nt1, nt2] = getResolvedMatchTeams(sm, {}, nextMrMap);
              const updatedRow = { ...existing, team1: nt1, team2: nt2, updated_at: new Date().toISOString() };
              const { error: smErr } = await supabase.from("match_results").upsert(updatedRow, { onConflict: "match_id" });
              if (smErr) throw smErr;
              nextResults = [...nextResults.filter((r) => r.match_id !== sm.matchId), updatedRow];
            }
          }
          const synced = await syncAdminSeriesStanding(cascadeSeriesId, nextResults, nextStandings);
          nextStandings = synced.nextStandings;
          await syncCSFSlots(nextStandings, bracket);
        }
        setResults(nextResults);
        setMsg({ type: "success", text: resultWinner ? `Saved Wild Card (${m.matchId}) winner.` : `Cleared Wild Card (${m.matchId}) result.` });
      }
      if (onResultsChange) onResultsChange();
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Failed to save Stage 1 result." });
    }
  }

  async function recordStage2Result(slotId, round, winnerOpt, t1, t2) {
    try {
      const winner = winnerOpt === "team1" ? t1 : winnerOpt === "team2" ? t2 : "";
      const nextMap = {};
      bracket.forEach((b) => { nextMap[b.match_id] = { ...b }; });
      nextMap[slotId] = { match_id: slotId, stage: round, team1: t1, team2: t2, result: winnerOpt };
      const { error } = await supabase.from("match_results").upsert(nextMap[slotId], { onConflict: "match_id" });
      if (error) throw error;

      const downRows = computeBracketCascade(nextMap, slotId, winner);
      for (const row of downRows) {
        const { error: downErr } = await supabase.from("match_results").upsert(row, { onConflict: "match_id" });
        if (downErr) throw downErr;
      }
      await loadAll();
      if (onResultsChange) onResultsChange();
      setMsg({ type: "success", text: winner ? `${winner} advances!` : `Cleared ${slotId} result.` });
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Failed to save Stage 2 result." });
    }
  }

  async function updateSetting(key, value) {
    const { error } = await supabase.from("app_settings").upsert({ key, value }, { onConflict: "key" });
    if (error) {
      setMsg({ type: "error", text: error.message || "Failed to update setting." });
      return;
    }
    setSettings((p) => ({ ...p, [key]: value }));
    setMsg({ type: "success", text: `Setting "${key}" updated to ${value}.` });
    if (onResultsChange) onResultsChange();
  }

  const mrMap = {}; results.forEach((r) => (mrMap[r.match_id] = r));
  const stMap = {}; standings.forEach((s) => (stMap[s.group_code] = s));
  const bracketMap = {}; bracket.forEach((b) => (bracketMap[b.match_id] = b));

  const playerProgressRows = useMemo(() => {
    const scoped = leagueId
      ? players.filter((p) => p.league_id === leagueId || p.is_admin)
      : players;

    return scoped
      .map((p) => {
        const progress = calcUserPickProgress({
          userMatchPicks: allS1MatchPicks.filter((x) => x.user_id === p.id),
          userGroupPicks: allS1GroupPicks.filter((x) => x.user_id === p.id),
          userStage2Picks: allS2Picks.filter((x) => x.user_id === p.id),
        });
        return {
          ...p,
          ...progress,
        };
      })
      .sort((a, b) => (a.display_name || "").localeCompare(b.display_name || ""));
  }, [players, leagueId, allS1MatchPicks, allS1GroupPicks, allS2Picks]);

  const progressSummary = useMemo(() => {
    const total = playerProgressRows.length;
    const s1Complete = playerProgressRows.filter((r) => r.stage1.status === "complete").length;
    const s1InProgress = playerProgressRows.filter((r) => r.stage1.status === "in_progress").length;
    const s1NotStarted = playerProgressRows.filter((r) => r.stage1.status === "not_started").length;
    const s2Complete = playerProgressRows.filter((r) => r.stage2.status === "complete").length;
    const s2InProgress = playerProgressRows.filter((r) => r.stage2.status === "in_progress").length;
    const s2NotStarted = playerProgressRows.filter((r) => r.stage2.status === "not_started").length;
    return { total, s1Complete, s1InProgress, s1NotStarted, s2Complete, s2InProgress, s2NotStarted };
  }, [playerProgressRows]);

  const filteredProgressRows = useMemo(() => {
    const q = progressSearch.trim().toLowerCase();
    return playerProgressRows.filter((r) => {
      if (progressFilter === "s1_incomplete" && r.stage1.status === "complete") return false;
      if (progressFilter === "s2_incomplete" && r.stage2.status === "complete") return false;
      if (progressFilter === "complete" && !(r.stage1.status === "complete" && r.stage2.status === "complete")) return false;
      if (q) {
        const nameMatch = (r.display_name || "").toLowerCase().includes(q);
        const emailMatch = (r.email || "").toLowerCase().includes(q);
        if (!nameMatch && !emailMatch) return false;
      }
      return true;
    });
  }, [playerProgressRows, progressFilter, progressSearch]);

  function renderAdminTeamBtn(label, isSelected, onClick, { disabled = false } = {}) {
    const meta = TEAM_META[label];
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          padding: "8px 10px",
          borderRadius: "8px",
          border: isSelected ? `2px solid ${C.green}` : `1px solid ${C.border}`,
          background: isSelected ? "rgba(29,158,117,0.08)" : C.white,
          color: C.text,
          fontSize: "13px",
          fontWeight: isSelected ? 700 : 500,
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.5 : 1,
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
          {meta?.seed && (
            <span style={{
              fontSize: "10px", fontWeight: 800, padding: "1px 5px", borderRadius: "4px",
              background: "#1a1a1a", color: "#fff", flexShrink: 0,
            }}>#{meta.seed}</span>
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        </span>
        {isSelected && <span style={{ color: C.green, fontWeight: 800, flexShrink: 0 }}>✓</span>}
      </button>
    );
  }

  function renderStatusBadge(status) {
    if (status === "complete") {
      return (
        <span style={{
          fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "999px",
          background: "rgba(29,158,117,0.14)", color: C.green,
        }}>
          Complete
        </span>
      );
    }
    if (status === "in_progress") {
      return (
        <span style={{
          fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "999px",
          background: "rgba(217,119,6,0.14)", color: "#b45309",
        }}>
          In Progress
        </span>
      );
    }
    return (
      <span style={{
        fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px",
        background: "#f1f5f9", color: C.textMuted,
      }}>
        Not Started
      </span>
    );
  }

  const adminTabs = [
    ["results", "Stage 1 Results", CheckCircle2],
    ["knockout", "Stage 2 Bracket", GitMerge],
    ["progress", "Player Progress", Users],
    ["settings", "Settings", Settings],
  ];

  const completedStage1Matches = results.filter((r) => r.stage === "group" && r.result).length;
  const completedStage2Matches = bracket.filter((r) => r.result).length;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.68)", overflowY: "auto", zIndex: 250, padding: isMobile ? "0.75rem" : "1.75rem 1rem" }}>
      <div style={{
        maxWidth: "920px",
        margin: "0 auto",
        background: C.bg,
        borderRadius: "16px",
        padding: isMobile ? "0.9rem" : "1.35rem",
        boxShadow: "0 24px 60px rgba(0,0,0,0.42)",
        border: `1px solid ${C.border}`,
      }}>
        <PageBanner
          icon={Shield}
          badge="Admin Console"
          title="Tournament Control Center"
          subtitle="Record official match results, monitor player pick completeness by stage, and manage stage locks."
          rightSlot={
            <button
              type="button"
              onClick={onClose}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: "rgba(255,255,255,0.14)", color: C.white,
                border: "1px solid rgba(255,255,255,0.28)", borderRadius: "9px",
                padding: "8px 14px", fontSize: "13px", fontWeight: 700, cursor: "pointer",
              }}
            >
              <X size={15} />
              <span>Close</span>
            </button>
          }
        />

        <Alert type={msg.type} msg={msg.text} />

        <div style={{ display: "flex", gap: "8px", marginBottom: "1.15rem", flexWrap: "wrap", alignItems: "center" }}>
          {adminTabs.map(([id, label, Icon]) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                style={{
                  ...styles.tab(active),
                  display: "inline-flex", alignItems: "center", gap: "6px",
                }}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={14} color={active ? C.navy : C.textMuted} />
                <span>{label}</span>
                {id === "progress" && !loading && (
                  <span style={{
                    fontSize: "11px", fontWeight: 800, padding: "1px 6px", borderRadius: "999px",
                    background: active ? "rgba(255,255,255,0.18)" : "#f1f5f9",
                    color: active ? C.white : C.text,
                  }}>
                    {progressSummary.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? <Spinner /> : (
          <>
            {activeTab === "results" && (
              <div>
                <div style={{ ...styles.card, borderTop: `4px solid ${C.navy}` }}>
                  <div style={{ ...styles.cardTitle, justifyContent: "space-between" }}>
                    <span>Wild Card Play-In (#8 vs #9)</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: C.textMuted }}>
                      {completedStage1Matches}/{ALL_GROUP_MATCHES.length} total Stage 1 results recorded
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {["WC_E", "WC_W"].map((wcId) => {
                      const m = ALL_GROUP_MATCHES.find((x) => x.matchId === wcId);
                      const res = mrMap[m.matchId];
                      const [t1, t2] = getResolvedMatchTeams(m, {}, mrMap);
                      return (
                        <div key={m.matchId} style={{
                          display: "flex",
                          flexDirection: isMobile ? "column" : "row",
                          alignItems: isMobile ? "stretch" : "center",
                          gap: isMobile ? "6px" : "8px",
                          padding: "8px 10px",
                          background: C.white, borderRadius: "9px", border: `1px solid ${C.border}`,
                        }}>
                          <span style={{ fontSize: "11px", fontWeight: 800, minWidth: isMobile ? 0 : "72px", color: C.textMuted }}>
                            {m.matchId === "WC_E" ? "EAST WC" : "WEST WC"}
                          </span>
                          {renderAdminTeamBtn(t1, res?.result === "team1", () => recordStage1Result(m, res?.result === "team1" ? null : "team1"))}
                          <span style={{ fontSize: "11px", fontWeight: 700, color: C.textMuted, textAlign: "center" }}>vs</span>
                          {renderAdminTeamBtn(t2, res?.result === "team2", () => recordStage1Result(m, res?.result === "team2" ? null : "team2"))}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {[
                  { title: "Eastern Conference — Round One Best-of-3", prefix: "E_", border: C.navyMid },
                  { title: "Western Conference — Round One Best-of-3", prefix: "W_", border: C.navy },
                ].map(({ title, prefix, border }) => (
                  <div key={prefix} style={{ ...styles.card, borderTop: `4px solid ${border}` }}>
                    <div style={styles.cardTitle}>{title}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {Object.keys(GROUPS).filter((sId) => sId.startsWith(prefix)).map((seriesId) => {
                        const sMatches = ALL_GROUP_MATCHES.filter((m) => m.group === seriesId);
                        const st = stMap[seriesId];
                        return (
                          <div key={seriesId} style={{
                            padding: "10px 12px", background: C.white, borderRadius: "10px",
                            border: `1px solid ${C.border}`,
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                              <span style={{ fontSize: "13px", fontWeight: 800, color: C.text }}>{SERIES_LABELS[seriesId]}</span>
                              {st?.first_place ? (
                                <span style={styles.badge(C.white, C.green)}>
                                  ✓ {st.first_place} ({st.second_place})
                                </span>
                              ) : (
                                <span style={{ fontSize: "11px", fontWeight: 600, color: C.textMuted }}>Series In Progress</span>
                              )}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "10px" : "6px" }}>
                              {sMatches.map((m) => {
                                const res = mrMap[m.matchId];
                                const [t1, t2] = getResolvedMatchTeams(m, {}, mrMap);
                                return (
                                  <div key={m.matchId} style={{
                                    display: "flex",
                                    flexDirection: isMobile ? "column" : "row",
                                    alignItems: isMobile ? "stretch" : "center",
                                    gap: isMobile ? "5px" : "8px",
                                  }}>
                                    <span style={{ fontSize: "11px", fontWeight: 700, minWidth: isMobile ? 0 : "56px", color: C.textMuted }}>
                                      Game {m.gameNum}
                                    </span>
                                    {renderAdminTeamBtn(t1, res?.result === "team1", () => recordStage1Result(m, res?.result === "team1" ? null : "team1"))}
                                    <span style={{ fontSize: "11px", color: C.textMuted, textAlign: "center" }}>vs</span>
                                    {renderAdminTeamBtn(t2, res?.result === "team2", () => recordStage1Result(m, res?.result === "team2" ? null : "team2"))}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "knockout" && (
              <div>
                {KNOCKOUT_ROUNDS.map(({ round, label, slots }) => {
                  const accent = round === "CUP" ? "#d97706" : round === "CF" ? C.navyMid : C.navy;
                  return (
                    <div key={round} style={{ ...styles.card, borderTop: `4px solid ${accent}` }}>
                      <div style={{ ...styles.cardTitle, justifyContent: "space-between" }}>
                        <span>{label}</span>
                        {round === "CSF" && (
                          <span style={{ fontSize: "12px", fontWeight: 600, color: C.textMuted }}>
                            ✓ Auto-synced from Round 1 · {completedStage2Matches}/7 results entered
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {Array.from({ length: slots }, (_, i) => {
                          const slotId = `${round}_${i + 1}`;
                          const slot = bracketMap[slotId] || {};
                          const t1 = slot.team1 || "TBD";
                          const t2 = slot.team2 || "TBD";
                          const notReady = t1 === "TBD" || t2 === "TBD";
                          return (
                            <div key={slotId} style={{
                              padding: "9px 11px", background: C.white, borderRadius: "9px",
                              border: `1px solid ${C.border}`,
                            }}>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: C.textMuted, marginBottom: "6px" }}>
                                {SLOT_LABELS[slotId] || slotId}
                              </div>
                              <div style={{
                                display: "flex",
                                flexDirection: isMobile ? "column" : "row",
                                alignItems: isMobile ? "stretch" : "center",
                                gap: isMobile ? "5px" : "8px",
                              }}>
                                {renderAdminTeamBtn(
                                  t1,
                                  slot.result === "team1",
                                  () => recordStage2Result(slotId, round, slot.result === "team1" ? null : "team1", t1, t2),
                                  { disabled: notReady }
                                )}
                                <span style={{ fontSize: "11px", fontWeight: 700, color: C.textMuted, textAlign: "center" }}>vs</span>
                                {renderAdminTeamBtn(
                                  t2,
                                  slot.result === "team2",
                                  () => recordStage2Result(slotId, round, slot.result === "team2" ? null : "team2", t1, t2),
                                  { disabled: notReady }
                                )}
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

            {activeTab === "progress" && (
              <div>
                {/* Stage Completeness Summary */}
                <div style={{ ...styles.card, borderTop: `4px solid ${C.navy}` }}>
                  <div style={{ ...styles.cardTitle, justifyContent: "space-between", marginBottom: "0.85rem" }}>
                    <span>League Pick Completeness Overview</span>
                    <button
                      type="button"
                      onClick={refreshProgressData}
                      disabled={refreshingProgress}
                      style={{
                        ...styles.btnSecondary,
                        background: C.white,
                        padding: "6px 12px",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <RefreshCw size={13} />
                      <span>{refreshingProgress ? "Refreshing..." : "Refresh"}</span>
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "10px" }}>
                    <div style={{
                      padding: "12px 14px", borderRadius: "10px", background: C.white,
                      border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.navyMid}`,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}>
                      <div style={{ fontSize: "10.5px", fontWeight: 800, color: C.textMuted, letterSpacing: "0.05em", marginBottom: "4px" }}>REGISTERED PLAYERS</div>
                      <div style={{ fontSize: "1.65rem", fontWeight: 800, color: C.text }}>{progressSummary.total}</div>
                      <div style={{ fontSize: "11.5px", color: C.textMuted, marginTop: "2px" }}>Active league members</div>
                    </div>

                    <div style={{
                      padding: "12px 14px", borderRadius: "10px", background: C.white,
                      border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.green}`,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}>
                      <div style={{ fontSize: "10.5px", fontWeight: 800, color: C.textMuted, letterSpacing: "0.05em", marginBottom: "4px" }}>STAGE 1 COMPLETE</div>
                      <div style={{ fontSize: "1.65rem", fontWeight: 800, color: C.text }}>
                        {progressSummary.s1Complete}
                        <span style={{ fontSize: "1rem", fontWeight: 600, color: C.textMuted }}> / {progressSummary.total}</span>
                      </div>
                      <div style={{ fontSize: "11.5px", color: C.textMuted, marginTop: "2px" }}>
                        {progressSummary.s1InProgress} in progress · {progressSummary.s1NotStarted} not started
                      </div>
                    </div>

                    <div style={{
                      padding: "12px 14px", borderRadius: "10px", background: C.white,
                      border: `1px solid ${C.border}`, borderLeft: "4px solid #d97706",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}>
                      <div style={{ fontSize: "10.5px", fontWeight: 800, color: C.textMuted, letterSpacing: "0.05em", marginBottom: "4px" }}>STAGE 2 COMPLETE</div>
                      <div style={{ fontSize: "1.65rem", fontWeight: 800, color: C.text }}>
                        {progressSummary.s2Complete}
                        <span style={{ fontSize: "1rem", fontWeight: 600, color: C.textMuted }}> / {progressSummary.total}</span>
                      </div>
                      <div style={{ fontSize: "11.5px", color: C.textMuted, marginTop: "2px" }}>
                        {progressSummary.s2InProgress} in progress · {progressSummary.s2NotStarted} not started
                      </div>
                    </div>
                  </div>
                </div>

                {/* Per-Player Stage Breakdown */}
                <div style={{ ...styles.card, borderTop: `4px solid ${C.navyMid}` }}>
                  <div style={{ ...styles.cardTitle, justifyContent: "space-between", marginBottom: "0.85rem" }}>
                    <span>Player-by-Player Progress</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: C.textMuted }}>
                      Showing {filteredProgressRows.length} of {playerProgressRows.length}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: "0.9rem" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {[
                        ["all", "All"],
                        ["s1_incomplete", "Missing Stage 1"],
                        ["s2_incomplete", "Missing Stage 2"],
                        ["complete", "Both Complete"],
                      ].map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setProgressFilter(key)}
                          style={{ ...styles.tab(progressFilter === key), padding: "6px 12px", fontSize: "12px" }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <input
                      value={progressSearch}
                      onChange={(e) => setProgressSearch(e.target.value)}
                      placeholder="Filter by name or email..."
                      style={{ ...styles.input, width: isMobile ? "100%" : "220px", padding: "7px 12px", fontSize: "12.5px" }}
                    />
                  </div>

                  {filteredProgressRows.length === 0 ? (
                    <div style={{
                      padding: "1.5rem", textAlign: "center", background: C.white,
                      borderRadius: "10px", border: `1px solid ${C.border}`, fontSize: "13px", color: C.textMuted,
                    }}>
                      No players match the current filter.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {filteredProgressRows.map((p) => (
                        <div key={p.id} style={{
                          padding: "12px 14px",
                          background: C.white,
                          borderRadius: "10px",
                          border: `1px solid ${C.border}`,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "14px", fontWeight: 800, color: C.text }}>
                                  {p.display_name || "Unnamed Player"}
                                </span>
                                {p.is_admin && (
                                  <span style={{
                                    fontSize: "10px", fontWeight: 800,
                                    padding: "2px 6px", borderRadius: "4px",
                                    background: C.navyMid, color: C.navy,
                                  }}>
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              {p.email && (
                                <div style={{ fontSize: "12px", color: C.textMuted, wordBreak: "break-word", marginTop: "2px" }}>{p.email}</div>
                              )}
                            </div>
                            {p.stage2.championPick && (
                              <span style={{
                                fontSize: "11.5px", fontWeight: 700, padding: "2px 9px", borderRadius: "999px",
                                background: "rgba(217,119,6,0.12)", color: "#b45309",
                                display: "inline-flex", alignItems: "center", gap: "4px",
                              }}>
                                <Trophy size={11} />
                                Champ: {p.stage2.championPick}
                              </span>
                            )}
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "10px" }}>
                            {/* Stage 1 Progress */}
                            <div style={{ padding: "8px 10px", borderRadius: "8px", background: "#fcfaf8", border: "1px solid #eadfd5" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>
                                  Stage 1: Play-In / Conf QF
                                </span>
                                {renderStatusBadge(p.stage1.status)}
                              </div>
                              <div style={{ height: "7px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden", marginBottom: "5px" }}>
                                <div style={{
                                  width: `${p.stage1.pct}%`,
                                  height: "100%",
                                  background: p.stage1.status === "complete" ? C.green : C.navy,
                                  borderRadius: "999px",
                                  transition: "width 0.2s ease",
                                }} />
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: C.textMuted }}>
                                <span>WC {p.stage1.wcDone}/{p.stage1.wcTotal} · Series {p.stage1.seriesDone}/{p.stage1.seriesTotal}</span>
                                <strong style={{ color: C.text }}>{p.stage1.pct}%</strong>
                              </div>
                              {p.stage1.status !== "complete" && (p.stage1.missingWC.length > 0 || p.stage1.missingSeries.length > 0) && (
                                <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "4px" }}>
                                  Missing: {[...p.stage1.missingWC, ...p.stage1.missingSeries].join(", ")}
                                </div>
                              )}
                            </div>

                            {/* Stage 2 Progress */}
                            <div style={{ padding: "8px 10px", borderRadius: "8px", background: "#fcfaf8", border: "1px solid #eadfd5" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>
                                  Stage 2: Final 8 Bracket
                                </span>
                                {renderStatusBadge(p.stage2.status)}
                              </div>
                              <div style={{ height: "7px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden", marginBottom: "5px" }}>
                                <div style={{
                                  width: `${p.stage2.pct}%`,
                                  height: "100%",
                                  background: p.stage2.status === "complete" ? C.green : "#d97706",
                                  borderRadius: "999px",
                                  transition: "width 0.2s ease",
                                }} />
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: C.textMuted }}>
                                <span>Bracket Slots {p.stage2.done}/{p.stage2.total}</span>
                                <strong style={{ color: C.text }}>{p.stage2.pct}%</strong>
                              </div>
                              {p.stage2.status !== "complete" && p.stage2.missingSlots.length > 0 && (
                                <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "4px" }}>
                                  Missing: {p.stage2.missingSlots.join(", ")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div style={{ ...styles.card, borderTop: `4px solid ${C.navyMid}` }}>
                <div style={styles.cardTitle}>Tournament Phase &amp; Access Controls</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    {
                      key: "registration_open",
                      label: "Registration Open",
                      desc: "Allow new players to register an account using your league invite code.",
                      onText: "OPEN",
                      offText: "CLOSED",
                      onColor: C.green,
                    },
                    {
                      key: "stage1_locked",
                      label: "Lock Stage 1 (Play-In / Conf QF)",
                      desc: "Freeze all Wild Card & Round One picks and unlock Stage 1 Insights.",
                      onText: "LOCKED",
                      offText: "OPEN",
                      onColor: "#d97706",
                    },
                    {
                      key: "stage2_open",
                      label: "Open Stage 2 (Final 8 Bracket)",
                      desc: "Allow players to view and select their Conference Semifinal → MLS Cup bracket.",
                      onText: "OPEN",
                      offText: "HIDDEN",
                      onColor: C.green,
                    },
                    {
                      key: "stage2_locked",
                      label: "Lock Stage 2 (Final 8 Bracket)",
                      desc: "Freeze all Final 8 Bracket picks and unlock Stage 2 Insights.",
                      onText: "LOCKED",
                      offText: "OPEN",
                      onColor: "#d97706",
                    },
                  ].map(({ key, label, desc, onText, offText, onColor }) => {
                    const enabled = settings[key] === "true";
                    return (
                      <div key={key} style={{
                        display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center",
                        flexWrap: "wrap", gap: "10px 12px",
                        padding: "12px 14px", background: C.white, borderRadius: "10px",
                        border: `1px solid ${C.border}`,
                      }}>
                        <div style={{ minWidth: 0, flex: "1 1 220px" }}>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>{label}</div>
                          <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "2px" }}>{desc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateSetting(key, enabled ? "false" : "true")}
                          style={{
                            minWidth: "92px",
                            padding: "7px 14px",
                            borderRadius: "8px",
                            border: `1.5px solid ${enabled ? onColor : C.border}`,
                            background: enabled ? onColor : "#f8fafc",
                            color: enabled ? C.white : C.textMuted,
                            fontSize: "12px",
                            fontWeight: 800,
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          {enabled ? onText : offText}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── 12. MAIN APP SHELL ───────────────────────────────────────────────────────

export default function App() {
  const isMobile = useIsMobile();
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
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }
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
    let [{ data: p }, { data: se }, { data: gmr }, { data: gko }, { data: gst }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("app_settings").select("*"),
      supabase.from("match_results").select("*"),
      supabase.from("match_results").select("*").in("stage", ["CSF", "CF", "CUP"]),
      supabase.from("group_standings").select("*"),
    ]);

    if (!p || !p.league_id) {
      await new Promise((r) => setTimeout(r, 400));
      const { data: retryProfile } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (retryProfile) p = retryProfile;
      if (!p?.league_id) {
        const { data: { user } } = await supabase.auth.getUser();
        const metaLeagueId = user?.user_metadata?.league_id;
        if (user && metaLeagueId) {
          const { data: upserted } = await supabase.from("profiles").upsert({
            id: user.id,
            display_name: p?.display_name || user.user_metadata?.display_name || "",
            email: p?.email || user.email || "",
            league_id: metaLeagueId,
          }, { onConflict: "id" }).select("*").maybeSingle();
          if (upserted) p = upserted;
        }
      }
    }

    setGlobalMatchResults(gmr || []);
    setGlobalKoResults(gko || []);
    setGlobalStandings(gst || []);
    setProfile(p || {});
    setIsAdmin(!!p?.is_admin);

    if (p?.league_id) {
      const { data: lg } = await supabase.from("leagues").select("id,name,theme").eq("id", p.league_id).maybeSingle();
      if (lg) {
        setLeagueId(lg.id);
        setLeagueName(lg.name);
        applyTheme(lg.theme || "fsf");
        setThemeKey((k) => k + 1);
      }
    }

    const sMap = {}; (se || []).forEach((x) => (sMap[x.key] = x.value));
    setSettings(sMap);

    setKnockoutBracket(buildKnockoutBracketSlots(gko || [], gst || []));
    setLoading(false);
  }

  useEffect(() => {
    if (!session) return;
    refreshAllData(session.user.id);
  }, [session]);

  if (!hasSupabaseConfig) {
    return (
      <div style={{ ...styles.app, display: "flex", flexDirection: "column", background: C.bg }}>
        <div style={{ ...styles.hero, background: C.navy }}>
          <div style={{ ...styles.heroTitle, margin: 0, fontFamily: C.fontSerif ? "'Georgia','Times New Roman',serif" : "inherit", fontStyle: C.fontSerif ? "italic" : "normal", color: C.heroTitleColor || C.white }}>
            {C.heroTitle}
          </div>
          <div style={{ ...styles.heroSub, color: C.heroSubColor, marginTop: "0.5rem" }}>{C.heroSub}</div>
        </div>
        <div style={{ ...styles.container, maxWidth: "500px", width: "100%" }}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Supabase Environment Variables Needed</div>
            <p style={{ fontSize: "14px", color: C.textMuted, lineHeight: 1.5, margin: "0 0 0.75rem" }}>
              Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in AI Studio Secrets (for project <code>hysudigpbwkizgkgzytz</code>) to connect authentication and live picks.
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (!session) return <AuthScreen registrationOpen={registrationOpen} onProfileSynced={(uid) => refreshAllData(uid)} />;
  if (loading) return <Spinner />;

  const stage1Locked = settings.stage1_locked === "true";
  const stage2Locked = settings.stage2_locked === "true";
  const stage2Open   = settings.stage2_open === "true";

  return (
    <div style={{ ...styles.app, background: C.bg }}>
      <GlobalStyles />
      <AppNav page={page} setPage={setPage} isAdmin={isAdmin} setShowAdmin={setShowAdmin} themeKey={themeKey} />

      {page === "leaderboard" && (
        <>
          <div style={{ ...styles.container, paddingBottom: 0 }}>
            <div style={{
              background: `linear-gradient(135deg, ${C.navyMid} 0%, #2d2d2d 58%, ${C.navy} 100%)`,
              color: C.white,
              borderRadius: "14px",
              padding: isMobile ? "1.2rem 1rem" : "1.65rem 1.5rem",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              textAlign: "center",
            }}>
              <div style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobile ? "8px" : "16px",
                marginBottom: "0.5rem",
              }}>
                <CircleLogo size={isMobile ? 50 : 56} />
                <div style={{
                  ...styles.heroTitle,
                  margin: 0,
                  fontSize: "clamp(1.45rem,4.5vw,2.35rem)",
                  fontFamily: C.fontSerif ? "'Georgia','Times New Roman',serif" : "inherit",
                  fontStyle: C.fontSerif ? "italic" : "normal",
                  color: C.heroTitleColor || C.white,
                }}>
                  {C.heroTitle}
                </div>
                {!isMobile && <CircleLogo size={56} />}
              </div>
              <div style={{ fontSize: "clamp(0.85rem,2.8vw,0.98rem)", color: "rgba(255,255,255,0.84)", marginBottom: "0.85rem" }}>
                {C.heroSub}
              </div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "4px 8px",
                maxWidth: "100%",
                fontSize: "12.5px",
                color: "rgba(255,255,255,0.92)",
                background: "rgba(255,255,255,0.12)",
                padding: isMobile ? "6px 12px" : "5px 14px",
                borderRadius: isMobile ? "12px" : "999px",
              }}>
                <span>Welcome, <strong style={{ color: C.white }}>{profile?.display_name}</strong></span>
                {leagueName && !isMobile && <span style={{ opacity: 0.6 }}>·</span>}
                {leagueName && <span style={{ color: C.navy, fontWeight: 700 }}>{leagueName}</span>}
              </div>
            </div>
          </div>
          <Leaderboard currentUserId={session.user.id} leagueId={leagueId} leagueName={leagueName} isAdmin={isAdmin} resultsVersion={resultsVersion} />
        </>
      )}

      {page === "stage1" && <Stage1Picks userId={session.user.id} locked={stage1Locked} matchResultsCache={globalMatchResults} standingsCache={globalStandings} />}
      {page === "stage2" && <Stage2Picks userId={session.user.id} locked={stage2Locked} stage2Open={stage2Open} knockoutBracket={knockoutBracket} koResultsCache={globalKoResults} />}
      {page === "results" && <ResultsPage matchResultsCache={globalMatchResults} standingsCache={globalStandings} koResultsCache={globalKoResults} />}
      {page === "insights" && <Insights stage1Locked={stage1Locked} stage2Locked={stage2Locked} />}
      {page === "guide" && <UserGuide />}

      {showAdmin && (
        <AdminPanel
          leagueId={leagueId}
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
