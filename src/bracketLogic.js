// Pure tournament data, scoring rules, and Stage 1 / Stage 2 / Admin bracket logic

// ── 1. CENTRALIZED SCORING RULES ─────────────────────────────────────────────
export const SCORING_RULES = {
  STAGE1: {
    WILD_CARD_WIN: 3,        // +3 pts for correct Wild Card winner (WC_E, WC_W)
    ROUND1_GAME_WIN: 1,      // +1 pt per correct Round 1 game winner (G1, G2, G3)
    SERIES_WINNER: 3,        // +3 pts for picking the advancing team in a Best-of-3 series
    EXACT_SERIES_LENGTH: 1,  // +1 bonus pt (+4 total) if Series Winner AND length ('2-0' or '2-1') match
  },
  STAGE2: {
    CSF: 4,  // Conference Semifinals (4 matches)
    CF: 8,   // Conference Finals (2 matches)
    CUP: 12, // MLS Cup Final (1 match)
  },
};

// ── 2. TOURNAMENT DATA (MLS CUP PLAYOFFS) ────────────────────────────────────
export const WILD_CARDS = {
  WC_E: { matchId: "WC_E", conf: "EAST", label: "East Wild Card (#8 vs #9)", seed8: "CF Montréal", seed9: "Atlanta United", date: "Oct 22", time: "7:30 PM ET" },
  WC_W: { matchId: "WC_W", conf: "WEST", label: "West Wild Card (#8 vs #9)", seed8: "Vancouver Whitecaps", seed9: "Portland Timbers", date: "Oct 23", time: "10:30 PM ET" },
};

// 8 Best-of-3 Round One Series (stored in group_code)
export const GROUPS = {
  E_S1: ["Inter Miami", "East Wild Card Winner"],
  E_S2: ["Columbus Crew", "NY Red Bulls"],
  E_S3: ["FC Cincinnati", "NYCFC"],
  E_S4: ["Orlando City", "Charlotte FC"],
  W_S1: ["LAFC", "West Wild Card Winner"],
  W_S2: ["LA Galaxy", "Colorado Rapids"],
  W_S3: ["Real Salt Lake", "Minnesota United"],
  W_S4: ["Seattle Sounders", "Houston Dynamo"],
};

export const SERIES_LABELS = {
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

export const ALL_TEAMS = [
  "Inter Miami", "Columbus Crew", "FC Cincinnati", "Orlando City",
  "Charlotte FC", "NYCFC", "NY Red Bulls", "CF Montréal", "Atlanta United",
  "LAFC", "LA Galaxy", "Real Salt Lake", "Seattle Sounders",
  "Houston Dynamo", "Minnesota United", "Colorado Rapids", "Vancouver Whitecaps", "Portland Timbers",
].sort();

export const COUNTRY_ABBR = {
  "Inter Miami": "MIA", "Columbus Crew": "CLB", "FC Cincinnati": "CIN", "Orlando City": "ORL",
  "Charlotte FC": "CLT", "NYCFC": "NYC", "NY Red Bulls": "RBNY", "CF Montréal": "MTL", "Atlanta United": "ATL",
  "LAFC": "LAFC", "LA Galaxy": "LA", "Real Salt Lake": "RSL", "Seattle Sounders": "SEA",
  "Houston Dynamo": "HOU", "Minnesota United": "MIN", "Colorado Rapids": "COL",
  "Vancouver Whitecaps": "VAN", "Portland Timbers": "POR",
  "East Wild Card Winner": "E-WC", "West Wild Card Winner": "W-WC",
};

// All 26 Stage 1 fixtures (2 Wild Card matches + 24 Round One Best-of-3 games)
export const ALL_GROUP_MATCHES = [
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

export const KNOCKOUT_ROUNDS = [
  { round: "CSF", label: "Conference Semifinals", points: SCORING_RULES.STAGE2.CSF, slots: 4 },
  { round: "CF",  label: "Conference Finals",     points: SCORING_RULES.STAGE2.CF,  slots: 2 },
  { round: "CUP", label: "MLS Cup Final",         points: SCORING_RULES.STAGE2.CUP, slots: 1 },
];

export const CSF_FEED = {
  CSF_1: ["E_S1", "E_S4"], // East Semifinal 1
  CSF_2: ["E_S2", "E_S3"], // East Semifinal 2
  CSF_3: ["W_S1", "W_S4"], // West Semifinal 1
  CSF_4: ["W_S2", "W_S3"], // West Semifinal 2
};

export const BRACKET_FEED = {
  CF_1:  ["CSF_1", "CSF_2"], // East Final
  CF_2:  ["CSF_3", "CSF_4"], // West Final
  CUP_1: ["CF_1",  "CF_2"],  // MLS Cup
};

export const SLOT_LABELS = {
  CSF_1: "East Semifinal 1 (#1/WC vs #4/5)",
  CSF_2: "East Semifinal 2 (#2/7 vs #3/6)",
  CSF_3: "West Semifinal 1 (#1/WC vs #4/5)",
  CSF_4: "West Semifinal 2 (#2/7 vs #3/6)",
  CF_1:  "Eastern Conference Final",
  CF_2:  "Western Conference Final",
  CUP_1: "MLS Cup Final",
};

export const STAGE2_SLOT_IDS = ["CSF_1", "CSF_2", "CSF_3", "CSF_4", "CF_1", "CF_2", "CUP_1"];

// ── 3. STAGE 1 HELPERS & SCORING ─────────────────────────────────────────────
export function getResolvedMatchTeams(m, matchPicks = {}, matchResults = {}) {
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
export function isSeriesSweep(seriesId, matchPicks) {
  const g1 = matchPicks[`${seriesId}_G1`];
  const g2 = matchPicks[`${seriesId}_G2`];
  if (!g1 || !g2) return false;
  return (g1 === "team1" && g2 === "team2") || (g1 === "team2" && g2 === "team1");
}

export function calcSeriesWins(seriesId, matchPicks, matchResults = {}) {
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

export function deriveSeriesOutcome(sorted) {
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

export function calcStage1Score(matchPicks, groupPicks, results, standings) {
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

// ── 4. STAGE 2 FINAL 8 BRACKET HELPERS & SCORING ─────────────────────────────
export function buildKnockoutBracketSlots(koRows = [], standingsRows = []) {
  const stMap = {};
  (standingsRows || []).forEach((s) => { stMap[s.group_code] = s; });
  const bracketSlots = [];
  KNOCKOUT_ROUNDS.forEach(({ round, slots }) => {
    for (let i = 1; i <= slots; i++) {
      const slotId = `${round}_${i}`;
      const existing = (koRows || []).find((b) => b.match_id === slotId);
      const feed = CSF_FEED[slotId];
      bracketSlots.push({
        slotId,
        round,
        label: SLOT_LABELS[slotId] || `${round} Match ${i}`,
        team1: existing?.team1 || (feed ? stMap[feed[0]]?.first_place || "" : ""),
        team2: existing?.team2 || (feed ? stMap[feed[1]]?.first_place || "" : ""),
      });
    }
  });
  return bracketSlots;
}

export function getStage2SlotTeams(slotId, picks = {}, knockoutBracket = []) {
  const feedSlots = BRACKET_FEED[slotId];
  if (!feedSlots) {
    const slot = knockoutBracket.find((s) => s.slotId === slotId);
    return [slot?.team1 || "", slot?.team2 || ""];
  }
  const [feedA, feedB] = feedSlots;
  return [picks[feedA] || null, picks[feedB] || null];
}

export function applyStage2Pick(prevPicks = {}, slotId, team) {
  const nextPicks = { ...prevPicks, [slotId]: team };
  const changedSlots = [slotId];

  function clearDownstream(sid) {
    for (const [downSlot, feedSlots] of Object.entries(BRACKET_FEED)) {
      if (feedSlots.includes(sid)) {
        const [t1, t2] = [nextPicks[feedSlots[0]] || null, nextPicks[feedSlots[1]] || null];
        if (nextPicks[downSlot] && nextPicks[downSlot] !== t1 && nextPicks[downSlot] !== t2) {
          nextPicks[downSlot] = "";
          if (!changedSlots.includes(downSlot)) changedSlots.push(downSlot);
          clearDownstream(downSlot);
        }
      }
    }
  }
  clearDownstream(slotId);
  return { nextPicks, changedSlots };
}

export function getStage2SlotDisplayState(slotId, picks = {}, koResults = {}, knockoutBracket = [], locked = false) {
  const [t1, t2] = getStage2SlotTeams(slotId, picks, knockoutBracket);
  const picked = picks[slotId] || "";
  const bothKnown = Boolean(t1 && t2);
  const koResult = koResults[slotId];
  const hasResult = Boolean(koResult?.result);
  const actualWinner = hasResult ? (koResult.result === "team1" ? koResult.team1 : koResult.team2) : null;
  const userCorrect = hasResult && picked === actualWinner;

  const t1State = !hasResult ? null : picked === t1 ? (userCorrect ? "correct" : "wrong") : actualWinner === t1 ? "winner" : null;
  const t2State = !hasResult ? null : picked === t2 ? (userCorrect ? "correct" : "wrong") : actualWinner === t2 ? "winner" : null;

  return {
    t1,
    t2,
    bothKnown,
    picked,
    koResult,
    hasResult,
    actualWinner,
    userCorrect,
    t1State,
    t2State,
    isReadOnly: Boolean(locked || hasResult),
  };
}

export function calcStage2Score(s2picks, results) {
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

// ── 5. ADMIN BRACKET CASCADE HELPERS ─────────────────────────────────────────
export function computeBracketCascade(nextMap, parentSlotId, parentWinner) {
  const updatedRows = [];
  function recurse(pid, pWinner) {
    for (const [downSlot, feedSlots] of Object.entries(BRACKET_FEED)) {
      if (!feedSlots.includes(pid)) continue;
      const [feedA, feedB] = feedSlots;
      const existingDown = nextMap[downSlot] || {};
      const newT1 = feedA === pid ? pWinner : (existingDown.team1 || "");
      const newT2 = feedB === pid ? pWinner : (existingDown.team2 || "");
      const downRound = downSlot.replace(/_\d+$/, "");
      const teamsChanged = (existingDown.team1 || "") !== newT1 || (existingDown.team2 || "") !== newT2;
      const nextResult = teamsChanged ? null : (existingDown.result || null);
      const updatedDown = { match_id: downSlot, stage: downRound, team1: newT1, team2: newT2, result: nextResult };
      nextMap[downSlot] = updatedDown;
      updatedRows.push(updatedDown);
      if (teamsChanged) {
        recurse(downSlot, "");
      }
    }
  }
  recurse(parentSlotId, parentWinner);
  return updatedRows;
}

export function computeCSFUpdates(standingsList = [], currentBracket = [], { force = false } = {}) {
  const stMap = {};
  (standingsList || []).forEach((s) => { stMap[s.group_code] = s; });
  const nextMap = {};
  (currentBracket || []).forEach((b) => { nextMap[b.match_id] = { ...b }; });

  const changedRows = [];
  for (const [slotId, [seriesA, seriesB]] of Object.entries(CSF_FEED)) {
    const newT1 = stMap[seriesA]?.first_place || "";
    const newT2 = stMap[seriesB]?.first_place || "";
    const existing = nextMap[slotId];
    const teamsChanged = !existing || (existing.team1 || "") !== newT1 || (existing.team2 || "") !== newT2;
    if (!force && !teamsChanged) continue;

    const sameTeams = Boolean(existing && (existing.team1 || "") === newT1 && (existing.team2 || "") === newT2);
    const updatedSlot = {
      match_id: slotId,
      stage: "CSF",
      team1: newT1,
      team2: newT2,
      result: sameTeams ? (existing.result || null) : null,
    };
    nextMap[slotId] = updatedSlot;
    changedRows.push(updatedSlot);

    if (!sameTeams && existing?.result) {
      const downRows = computeBracketCascade(nextMap, slotId, "");
      changedRows.push(...downRows);
    }
  }

  return { nextBracket: Object.values(nextMap), changedRows };
}
