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

// ── 2. TOURNAMENT DATA (2026 AUDI MLS CUP PLAYOFFS) ───────────────────────────
export const WILD_CARDS = {
  WC_E: { matchId: "WC_E", conf: "EAST", label: "East Wild Card (#8 vs #9)", seed8: "Orlando City", seed9: "FC Cincinnati", date: "Nov 19", time: "7:30 PM ET" },
  WC_W: { matchId: "WC_W", conf: "WEST", label: "West Wild Card (#8 vs #9)", seed8: "Seattle Sounders", seed9: "Real Salt Lake", date: "Nov 19", time: "10:00 PM ET" },
};

// 8 Best-of-3 Round One Series (stored in group_code)
export const GROUPS = {
  E_S1: ["Nashville SC", "East Wild Card Winner"],
  E_S2: ["Inter Miami", "Columbus Crew"],
  E_S3: ["New England Revolution", "Philadelphia Union"],
  E_S4: ["Chicago Fire", "Charlotte FC"],
  W_S1: ["Vancouver Whitecaps", "West Wild Card Winner"],
  W_S2: ["FC Dallas", "Portland Timbers"],
  W_S3: ["St. Louis CITY SC", "LAFC"],
  W_S4: ["San Jose Earthquakes", "Houston Dynamo"],
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
  "Nashville SC", "Inter Miami", "New England Revolution", "Chicago Fire",
  "Charlotte FC", "Philadelphia Union", "Columbus Crew", "Orlando City", "FC Cincinnati",
  "Vancouver Whitecaps", "FC Dallas", "St. Louis CITY SC", "San Jose Earthquakes",
  "Houston Dynamo", "LAFC", "Portland Timbers", "Seattle Sounders", "Real Salt Lake",
].sort();

export const COUNTRY_ABBR = {
  "Nashville SC": "NSH", "Inter Miami": "MIA", "New England Revolution": "NE", "Chicago Fire": "CHI",
  "Charlotte FC": "CLT", "Philadelphia Union": "PHI", "Columbus Crew": "CLB", "Orlando City": "ORL", "FC Cincinnati": "CIN",
  "Vancouver Whitecaps": "VAN", "FC Dallas": "DAL", "St. Louis CITY SC": "STL", "San Jose Earthquakes": "SJ",
  "Houston Dynamo": "HOU", "LAFC": "LAFC", "Portland Timbers": "POR", "Seattle Sounders": "SEA", "Real Salt Lake": "RSL",
  "East Wild Card Winner": "E-WC", "West Wild Card Winner": "W-WC",
};

// All 26 Stage 1 fixtures (2 Wild Card matches + 24 Round One Best-of-3 games)
export const ALL_GROUP_MATCHES = [
  // Wild Card Round
  { matchId: "WC_E",    group: "WC_E", isWildCard: true,  gameNum: 1, team1: "Orlando City",           team2: "FC Cincinnati",         date: "Nov 19", time: "7:30 PM ET" },
  { matchId: "WC_W",    group: "WC_W", isWildCard: true,  gameNum: 1, team1: "Seattle Sounders",       team2: "Real Salt Lake",        date: "Nov 19", time: "10:00 PM ET" },

  // Round One — Game 1 (Higher Seed Hosts)
  { matchId: "E_S3_G1", group: "E_S3", isWildCard: false, gameNum: 1, team1: "New England Revolution", team2: "Philadelphia Union",    date: "Nov 21", time: "2:00 PM ET" },
  { matchId: "W_S2_G1", group: "W_S2", isWildCard: false, gameNum: 1, team1: "FC Dallas",              team2: "Portland Timbers",      date: "Nov 21", time: "4:00 PM ET" },
  { matchId: "E_S2_G1", group: "E_S2", isWildCard: false, gameNum: 1, team1: "Inter Miami",            team2: "Columbus Crew",         date: "Nov 21", time: "6:00 PM ET" },
  { matchId: "E_S1_G1", group: "E_S1", isWildCard: false, gameNum: 1, team1: "Nashville SC",           team2: "East Wild Card Winner", date: "Nov 22", time: "4:00 PM ET" },
  { matchId: "E_S4_G1", group: "E_S4", isWildCard: false, gameNum: 1, team1: "Chicago Fire",           team2: "Charlotte FC",          date: "Nov 22", time: "6:30 PM ET" },
  { matchId: "W_S1_G1", group: "W_S1", isWildCard: false, gameNum: 1, team1: "Vancouver Whitecaps",    team2: "West Wild Card Winner", date: "Nov 22", time: "9:30 PM ET" },
  { matchId: "W_S3_G1", group: "W_S3", isWildCard: false, gameNum: 1, team1: "St. Louis CITY SC",      team2: "LAFC",                  date: "Nov 23", time: "8:00 PM ET" },
  { matchId: "W_S4_G1", group: "W_S4", isWildCard: false, gameNum: 1, team1: "San Jose Earthquakes",   team2: "Houston Dynamo",        date: "Nov 24", time: "10:00 PM ET" },

  // Round One — Game 2 (Lower Seed Hosts)
  { matchId: "E_S2_G2", group: "E_S2", isWildCard: false, gameNum: 2, team1: "Columbus Crew",          team2: "Inter Miami",           date: "Nov 27", time: "8:00 PM ET" },
  { matchId: "W_S1_G2", group: "W_S1", isWildCard: false, gameNum: 2, team1: "West Wild Card Winner",  team2: "Vancouver Whitecaps",   date: "Nov 27", time: "10:00 PM ET" },
  { matchId: "E_S4_G2", group: "E_S4", isWildCard: false, gameNum: 2, team1: "Charlotte FC",           team2: "Chicago Fire",          date: "Nov 28", time: "12:30 PM ET" },
  { matchId: "W_S4_G2", group: "W_S4", isWildCard: false, gameNum: 2, team1: "Houston Dynamo",         team2: "San Jose Earthquakes",  date: "Nov 28", time: "2:30 PM ET" },
  { matchId: "E_S3_G2", group: "E_S3", isWildCard: false, gameNum: 2, team1: "Philadelphia Union",     team2: "New England Revolution",date: "Nov 28", time: "4:30 PM ET" },
  { matchId: "E_S1_G2", group: "E_S1", isWildCard: false, gameNum: 2, team1: "East Wild Card Winner",  team2: "Nashville SC",          date: "Nov 28", time: "6:30 PM ET" },
  { matchId: "W_S3_G2", group: "W_S3", isWildCard: false, gameNum: 2, team1: "LAFC",                   team2: "St. Louis CITY SC",     date: "Nov 28", time: "8:30 PM ET" },
  { matchId: "W_S2_G2", group: "W_S2", isWildCard: false, gameNum: 2, team1: "Portland Timbers",       team2: "FC Dallas",             date: "Nov 28", time: "10:30 PM ET" },

  // Round One — Game 3 (If Necessary — Higher Seed Hosts)
  { matchId: "E_S2_G3", group: "E_S2", isWildCard: false, gameNum: 3, team1: "Inter Miami",            team2: "Columbus Crew",         date: "Dec 1/2", time: "Time TBD" },
  { matchId: "E_S1_G3", group: "E_S1", isWildCard: false, gameNum: 3, team1: "Nashville SC",           team2: "East Wild Card Winner", date: "Dec 2",   time: "Time TBD" },
  { matchId: "E_S3_G3", group: "E_S3", isWildCard: false, gameNum: 3, team1: "New England Revolution", team2: "Philadelphia Union",    date: "Dec 2",   time: "Time TBD" },
  { matchId: "E_S4_G3", group: "E_S4", isWildCard: false, gameNum: 3, team1: "Chicago Fire",           team2: "Charlotte FC",          date: "Dec 2",   time: "Time TBD" },
  { matchId: "W_S1_G3", group: "W_S1", isWildCard: false, gameNum: 3, team1: "Vancouver Whitecaps",    team2: "West Wild Card Winner", date: "Dec 2",   time: "Time TBD" },
  { matchId: "W_S2_G3", group: "W_S2", isWildCard: false, gameNum: 3, team1: "FC Dallas",              team2: "Portland Timbers",      date: "Dec 2",   time: "Time TBD" },
  { matchId: "W_S3_G3", group: "W_S3", isWildCard: false, gameNum: 3, team1: "St. Louis CITY SC",      team2: "LAFC",                  date: "Dec 2",   time: "Time TBD" },
  { matchId: "W_S4_G3", group: "W_S4", isWildCard: false, gameNum: 3, team1: "San Jose Earthquakes",   team2: "Houston Dynamo",        date: "Dec 2",   time: "Time TBD" },
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

export function calcUserPickProgress({ userMatchPicks = [], userGroupPicks = [], userStage2Picks = [] }) {
  const matchPickMap = {};
  (userMatchPicks || []).forEach((row) => {
    if (row?.match_id && row?.pick) matchPickMap[row.match_id] = row.pick;
  });

  const groupPickMap = {};
  (userGroupPicks || []).forEach((row) => {
    if (row?.group_code && row?.first_place && row?.second_place) {
      groupPickMap[row.group_code] = row;
    }
  });

  const wcIds = Object.keys(WILD_CARDS);
  const missingWC = wcIds.filter((id) => !matchPickMap[id]);
  const wcDone = wcIds.length - missingWC.length;

  const seriesIds = Object.keys(GROUPS);
  const missingSeries = [];
  let seriesDone = 0;
  let round1GamesPicked = 0;

  for (const sId of seriesIds) {
    const g1 = matchPickMap[`${sId}_G1`];
    const g2 = matchPickMap[`${sId}_G2`];
    const g3 = matchPickMap[`${sId}_G3`];
    if (g1) round1GamesPicked++;
    if (g2) round1GamesPicked++;
    if (g3 && !isSeriesSweep(sId, matchPickMap)) round1GamesPicked++;

    const derived = deriveSeriesOutcome(calcSeriesWins(sId, matchPickMap, {}));
    const hasDerivedOutcome = Boolean(derived.winner && derived.length);
    const hasStoredGroupPick = Boolean(groupPickMap[sId]);

    if (hasDerivedOutcome || hasStoredGroupPick) {
      seriesDone++;
    } else {
      missingSeries.push(sId);
    }
  }

  const stage1Done = wcDone + seriesDone;
  const stage1Total = wcIds.length + seriesIds.length; // 2 Wild Cards + 8 Round One Series = 10
  const stage1Pct = Math.round((stage1Done / stage1Total) * 100);
  const stage1Status = stage1Done === stage1Total
    ? "complete"
    : (stage1Done > 0 || round1GamesPicked > 0)
      ? "in_progress"
      : "not_started";

  const s2Map = {};
  (userStage2Picks || []).forEach((row) => {
    if (row?.slot_id && row?.picked_team) s2Map[row.slot_id] = row.picked_team;
  });

  const missingStage2 = STAGE2_SLOT_IDS.filter((id) => !s2Map[id]);
  const stage2Done = STAGE2_SLOT_IDS.length - missingStage2.length;
  const stage2Total = STAGE2_SLOT_IDS.length; // 7
  const stage2Pct = Math.round((stage2Done / stage2Total) * 100);
  const stage2Status = stage2Done === stage2Total
    ? "complete"
    : stage2Done > 0
      ? "in_progress"
      : "not_started";

  return {
    stage1: {
      wcDone,
      wcTotal: wcIds.length,
      seriesDone,
      seriesTotal: seriesIds.length,
      round1GamesPicked,
      done: stage1Done,
      total: stage1Total,
      pct: stage1Pct,
      status: stage1Status,
      missingWC,
      missingSeries,
    },
    stage2: {
      done: stage2Done,
      total: stage2Total,
      pct: stage2Pct,
      status: stage2Status,
      missingSlots: missingStage2,
      championPick: s2Map.CUP_1 || null,
    },
  };
}

