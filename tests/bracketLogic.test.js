// @ts-nocheck
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SCORING_RULES,
  WILD_CARDS,
  GROUPS,
  ALL_GROUP_MATCHES,
  KNOCKOUT_ROUNDS,
  CSF_FEED,
  BRACKET_FEED,
  STAGE2_SLOT_IDS,
  getResolvedMatchTeams,
  isSeriesSweep,
  calcSeriesWins,
  deriveSeriesOutcome,
  calcStage1Score,
  buildKnockoutBracketSlots,
  getStage2SlotTeams,
  applyStage2Pick,
  getStage2SlotDisplayState,
  calcStage2Score,
  computeBracketCascade,
  computeCSFUpdates,
  calcUserPickProgress,
} from "../src/bracketLogic.js";

// ── 1. TOURNAMENT STRUCTURE & DATA INTEGRITY ─────────────────────────────────
describe("Tournament structure", () => {
  it("defines all 26 Stage 1 fixtures (2 Wild Cards + 24 Round 1 games)", () => {
    assert.equal(ALL_GROUP_MATCHES.length, 26);
    const wc = ALL_GROUP_MATCHES.filter((m) => m.isWildCard);
    const r1 = ALL_GROUP_MATCHES.filter((m) => !m.isWildCard);
    assert.equal(wc.length, 2);
    assert.equal(r1.length, 24);
  });

  it("flips home/away properly between Game 1, Game 2, and Game 3 for every Round 1 series", () => {
    for (const seriesId of Object.keys(GROUPS)) {
      const g1 = ALL_GROUP_MATCHES.find((m) => m.matchId === `${seriesId}_G1`);
      const g2 = ALL_GROUP_MATCHES.find((m) => m.matchId === `${seriesId}_G2`);
      const g3 = ALL_GROUP_MATCHES.find((m) => m.matchId === `${seriesId}_G3`);
      assert.ok(g1 && g2 && g3, `Missing games for ${seriesId}`);
      assert.equal(g1.team1, g2.team2, `${seriesId} G2 should flip G1 team1 to team2`);
      assert.equal(g1.team2, g2.team1, `${seriesId} G2 should flip G1 team2 to team1`);
      assert.equal(g3.team1, g1.team1, `${seriesId} G3 should restore higher seed host`);
      assert.equal(g3.team2, g1.team2, `${seriesId} G3 should restore lower seed visitor`);
    }
  });

  it("wires all 8 Round 1 series into the 4 Conference Semifinal slots", () => {
    const fedSeries = Object.values(CSF_FEED).flat().sort();
    assert.deepEqual(fedSeries, Object.keys(GROUPS).sort());
    assert.equal(STAGE2_SLOT_IDS.length, 7);
    assert.equal(KNOCKOUT_ROUNDS.reduce((sum, r) => sum + r.slots, 0), 7);
  });
});

// ── 2. STAGE 1 HELPERS & SCORING ─────────────────────────────────────────────
describe("Stage 1 Wild Card cascade & Round 1 series logic", () => {
  it("resolves Wild Card placeholders from user picks, overridden by official results", () => {
    const eS1G1 = ALL_GROUP_MATCHES.find((m) => m.matchId === "E_S1_G1");
    const eS1G2 = ALL_GROUP_MATCHES.find((m) => m.matchId === "E_S1_G2");

    // Unpicked & no result -> placeholder remains
    assert.deepEqual(getResolvedMatchTeams(eS1G1, {}, {}), ["Inter Miami", "East Wild Card Winner"]);

    // User picked Atlanta United (team2 in WC_E)
    assert.deepEqual(
      getResolvedMatchTeams(eS1G1, { WC_E: "team2" }, {}),
      ["Inter Miami", "Atlanta United"]
    );
    assert.deepEqual(
      getResolvedMatchTeams(eS1G2, { WC_E: "team2" }, {}),
      ["Atlanta United", "Inter Miami"]
    );

    // Official WC_E result (CF Montréal / team1) overrides user pick
    assert.deepEqual(
      getResolvedMatchTeams(eS1G1, { WC_E: "team2" }, { WC_E: { result: "team1" } }),
      ["Inter Miami", "CF Montréal"]
    );
  });

  it("detects 2-0 sweeps accounting for Game 2 home/away flip", () => {
    // Higher seed sweeps: G1 team1 (home) + G2 team2 (away)
    assert.equal(isSeriesSweep("E_S2", { E_S2_G1: "team1", E_S2_G2: "team2" }), true);
    // Lower seed sweeps: G1 team2 (away) + G2 team1 (home)
    assert.equal(isSeriesSweep("E_S2", { E_S2_G1: "team2", E_S2_G2: "team1" }), true);
    // Split 1-1: both home teams win OR both away teams win
    assert.equal(isSeriesSweep("E_S2", { E_S2_G1: "team1", E_S2_G2: "team1" }), false);
    assert.equal(isSeriesSweep("E_S2", { E_S2_G1: "team2", E_S2_G2: "team2" }), false);
    // Incomplete
    assert.equal(isSeriesSweep("E_S2", { E_S2_G1: "team1" }), false);
  });

  it("derives 2-0 and 2-1 series outcomes and ignores stray Game 3 picks on 2-0 sweeps", () => {
    const sweepOutcome = deriveSeriesOutcome(
      calcSeriesWins("E_S2", {
        E_S2_G1: "team1",
        E_S2_G2: "team2",
        E_S2_G3: "team2", // stray G3 pick should not corrupt 2-0 sweep
      })
    );
    assert.deepEqual(sweepOutcome, { winner: "Columbus Crew", length: "2-0", needsGame3: false });

    const threeGameUpset = deriveSeriesOutcome(
      calcSeriesWins("E_S2", {
        E_S2_G1: "team1", // Columbus 1
        E_S2_G2: "team1", // NYRB 1 (lower seed hosts G2)
        E_S2_G3: "team2", // NYRB wins away in G3
      })
    );
    assert.deepEqual(threeGameUpset, { winner: "NY Red Bulls", length: "2-1", needsGame3: true });

    const tiedAtOne = deriveSeriesOutcome(
      calcSeriesWins("E_S2", { E_S2_G1: "team1", E_S2_G2: "team1" })
    );
    assert.deepEqual(tiedAtOne, { winner: null, length: null, needsGame3: true });
  });

  it("calculates Stage 1 points accurately across Wild Card, games, series, and exact length bonus", () => {
    const matchPicks = [
      { match_id: "WC_E", pick: "team2" },      // +3 (correct)
      { match_id: "WC_W", pick: "team1" },      // +0 (wrong)
      { match_id: "E_S2_G1", pick: "team1" },   // +1 (correct)
      { match_id: "E_S2_G2", pick: "team2" },   // +1 (correct)
      { match_id: "E_S3_G1", pick: "team1" },   // +1 (correct)
      { match_id: "E_S3_G2", pick: "team2" },   // +0 (actual went 3 games)
    ];
    const groupPicks = [
      { group_code: "E_S2", first_place: "Columbus Crew", second_place: "2-0" }, // +3 +1 = +4
      { group_code: "E_S3", first_place: "FC Cincinnati", second_place: "2-0" }, // +3 +0 (actual 2-1)
      { group_code: "E_S4", first_place: "Charlotte FC", second_place: "2-0" },  // +0 winner wrong (no length bonus even though actual 2-0!)
    ];
    const results = [
      { match_id: "WC_E", result: "team2" },
      { match_id: "WC_W", result: "team2" },
      { match_id: "E_S2_G1", result: "team1" },
      { match_id: "E_S2_G2", result: "team2" },
      { match_id: "E_S3_G1", result: "team1" },
      { match_id: "E_S3_G2", result: "team1" },
      { match_id: "E_S3_G3", result: "team1" },
    ];
    const standings = [
      { group_code: "E_S2", first_place: "Columbus Crew", second_place: "2-0" },
      { group_code: "E_S3", first_place: "FC Cincinnati", second_place: "2-1" },
      { group_code: "E_S4", first_place: "Orlando City", second_place: "2-0" },
    ];

    const res = calcStage1Score(matchPicks, groupPicks, results, standings);
    assert.deepEqual(res, {
      score:
        SCORING_RULES.STAGE1.WILD_CARD_WIN +
        3 * SCORING_RULES.STAGE1.ROUND1_GAME_WIN +
        2 * SCORING_RULES.STAGE1.SERIES_WINNER +
        SCORING_RULES.STAGE1.EXACT_SERIES_LENGTH, // 3 + 3 + 6 + 1 = 13
      correct: 7,
    });
  });
});

// ── 3. STAGE 2 FINAL 8 BRACKET LOGIC & REGRESSION TESTS ──────────────────────
describe("Stage 2 Final 8 Bracket selection & scoring", () => {
  const sampleBracket = buildKnockoutBracketSlots(
    [
      { match_id: "CSF_1", stage: "CSF", team1: "Inter Miami", team2: "Orlando City" },
      { match_id: "CSF_2", stage: "CSF", team1: "Columbus Crew", team2: "FC Cincinnati" },
      { match_id: "CSF_3", stage: "CSF", team1: "LAFC", team2: "Seattle Sounders" },
      { match_id: "CSF_4", stage: "CSF", team1: "LA Galaxy", team2: "Real Salt Lake" },
    ],
    []
  );

  it("populates CSF teams from match_results or falls back to group_standings", () => {
    const standingsOnly = [
      { group_code: "E_S1", first_place: "Inter Miami" },
      { group_code: "E_S4", first_place: "Charlotte FC" },
      { group_code: "W_S1", first_place: "LAFC" },
      { group_code: "W_S4", first_place: "Seattle Sounders" },
    ];
    const slots = buildKnockoutBracketSlots([], standingsOnly);
    assert.equal(slots.length, 7);
    assert.deepEqual(
      slots.find((s) => s.slotId === "CSF_1"),
      {
        slotId: "CSF_1",
        round: "CSF",
        label: "East Semifinal 1 (#1/WC vs #4/5)",
        team1: "Inter Miami",
        team2: "Charlotte FC",
      }
    );
    assert.deepEqual(getStage2SlotTeams("CSF_3", {}, slots), ["LAFC", "Seattle Sounders"]);
    assert.deepEqual(getStage2SlotTeams("CF_1", { CSF_1: "Inter Miami" }, slots), ["Inter Miami", null]);
  });

  it("cascades downstream clears when changing an upstream pick only if invalidated", () => {
    let picks = {};
    picks = applyStage2Pick(picks, "CSF_1", "Inter Miami").nextPicks;
    picks = applyStage2Pick(picks, "CSF_2", "Columbus Crew").nextPicks;
    picks = applyStage2Pick(picks, "CSF_3", "LAFC").nextPicks;
    picks = applyStage2Pick(picks, "CSF_4", "LA Galaxy").nextPicks;
    picks = applyStage2Pick(picks, "CF_1", "Inter Miami").nextPicks;
    picks = applyStage2Pick(picks, "CF_2", "LAFC").nextPicks;
    picks = applyStage2Pick(picks, "CUP_1", "Inter Miami").nextPicks;

    // Changing CSF_1 invalidates CF_1 AND CUP_1
    const changedInvalid = applyStage2Pick(picks, "CSF_1", "Orlando City");
    assert.deepEqual(changedInvalid.changedSlots, ["CSF_1", "CF_1", "CUP_1"]);
    assert.equal(changedInvalid.nextPicks.CF_1, "");
    assert.equal(changedInvalid.nextPicks.CUP_1, "");
    assert.equal(changedInvalid.nextPicks.CF_2, "LAFC");

    // Changing CSF_2 keeps CF_1 ("Inter Miami") and CUP_1 ("Inter Miami") intact
    const changedValid = applyStage2Pick(picks, "CSF_2", "FC Cincinnati");
    assert.deepEqual(changedValid.changedSlots, ["CSF_2"]);
    assert.equal(changedValid.nextPicks.CF_1, "Inter Miami");
    assert.equal(changedValid.nextPicks.CUP_1, "Inter Miami");
  });

  it("preserves user selections and locks decided slots when official results arrive", () => {
    const userPicks = {
      CSF_1: "Inter Miami",
      CSF_2: "Columbus Crew",
      CSF_3: "LAFC",
      CSF_4: "LA Galaxy",
      CF_1: "Inter Miami",
      CF_2: "LAFC",
      CUP_1: "Inter Miami",
    };

    const koResults = {
      CSF_1: { team1: "Inter Miami", team2: "Orlando City", result: "team2" }, // Orlando upset
      CSF_2: { team1: "Columbus Crew", team2: "FC Cincinnati", result: "team1" }, // Columbus wins
      CF_1: { team1: "Orlando City", team2: "Columbus Crew", result: "team1" }, // Diverged matchup!
      CF_2: { team1: "LAFC", team2: "", result: null }, // Populated by CSF_3, not yet played
    };

    // CSF_1: wrong pick -> user's pick preserved, Inter Miami marked wrong, Orlando marked winner, read-only
    const csf1 = getStage2SlotDisplayState("CSF_1", userPicks, koResults, sampleBracket, false);
    assert.equal(csf1.picked, "Inter Miami");
    assert.equal(csf1.hasResult, true);
    assert.equal(csf1.userCorrect, false);
    assert.equal(csf1.t1State, "wrong");
    assert.equal(csf1.t2State, "winner");
    assert.equal(csf1.isReadOnly, true);

    // CSF_2: correct pick -> user's pick preserved, Columbus marked correct, read-only
    const csf2 = getStage2SlotDisplayState("CSF_2", userPicks, koResults, sampleBracket, false);
    assert.equal(csf2.picked, "Columbus Crew");
    assert.equal(csf2.userCorrect, true);
    assert.equal(csf2.t1State, "correct");
    assert.equal(csf2.t2State, null);
    assert.equal(csf2.isReadOnly, true);

    // CSF_3: no result yet -> still editable & pick preserved
    const csf3 = getStage2SlotDisplayState("CSF_3", userPicks, koResults, sampleBracket, false);
    assert.equal(csf3.picked, "LAFC");
    assert.equal(csf3.hasResult, false);
    assert.equal(csf3.isReadOnly, false);

    // CF_1: diverged matchup -> Inter Miami marked wrong, actualWinner still Orlando City
    const cf1 = getStage2SlotDisplayState("CF_1", userPicks, koResults, sampleBracket, false);
    assert.equal(cf1.picked, "Inter Miami");
    assert.equal(cf1.userCorrect, false);
    assert.equal(cf1.t1State, "wrong");
    assert.equal(cf1.t2State, null);
    assert.equal(cf1.actualWinner, "Orlando City");
    assert.equal(cf1.isReadOnly, true);

    // CF_2: admin row exists with result: null -> user's predicted matchup & pick remain editable
    const cf2 = getStage2SlotDisplayState("CF_2", userPicks, koResults, sampleBracket, false);
    assert.equal(cf2.hasResult, false);
    assert.equal(cf2.picked, "LAFC");
    assert.equal(cf2.t1, "LAFC");
    assert.equal(cf2.t2, "LA Galaxy");
    assert.equal(cf2.isReadOnly, false);
  });

  it("scores Stage 2 picks accurately (CSF +4, CF +8, CUP +12)", () => {
    assert.equal(SCORING_RULES.STAGE2.CUP, 12);
    const picks = [
      { slot_id: "CSF_1", round: "CSF", picked_team: "Inter Miami" },   // wrong
      { slot_id: "CSF_2", round: "CSF", picked_team: "Columbus Crew" }, // +4
      { slot_id: "CSF_3", round: "CSF", picked_team: "LAFC" },          // +4
      { slot_id: "CSF_4", round: "CSF", picked_team: "LA Galaxy" },     // +4
      { slot_id: "CF_1", picked_team: "Columbus Crew" },                // +8 (fallback round parsing)
      { slot_id: "CF_2", round: "CF", picked_team: "LAFC" },            // +8
      { slot_id: "CUP_1", round: "CUP", picked_team: "LAFC" },          // +12
    ];
    const results = [
      { match_id: "CSF_1", team1: "Inter Miami", team2: "Orlando City", result: "team2" },
      { match_id: "CSF_2", team1: "Columbus Crew", team2: "FC Cincinnati", result: "team1" },
      { match_id: "CSF_3", team1: "LAFC", team2: "Seattle Sounders", result: "team1" },
      { match_id: "CSF_4", team1: "LA Galaxy", team2: "Real Salt Lake", result: "team1" },
      { match_id: "CF_1", team1: "Orlando City", team2: "Columbus Crew", result: "team2" },
      { match_id: "CF_2", team1: "LAFC", team2: "LA Galaxy", result: "team1" },
      { match_id: "CUP_1", team1: "Columbus Crew", team2: "LAFC", result: "team2" },
    ];
    assert.deepEqual(calcStage2Score(picks, results), { score: 4 + 4 + 4 + 8 + 8 + 12, correct: 6 });
  });
});

// ── 4. ADMIN CSF AUTO-FILL & BRACKET CASCADE ──────────────────────────────────
describe("Admin CSF auto-fill and bracket cascade", () => {
  it("auto-fills CSF_1..4 progressively from group_standings without touching unclinched slots", () => {
    const partialStandings = [
      { group_code: "E_S1", first_place: "Inter Miami" },
      { group_code: "E_S4", first_place: "Orlando City" },
    ];
    const { nextBracket, changedRows } = computeCSFUpdates(partialStandings, []);
    assert.equal(changedRows.length, 4);
    const csf1 = nextBracket.find((b) => b.match_id === "CSF_1");
    assert.deepEqual(csf1, {
      match_id: "CSF_1",
      stage: "CSF",
      team1: "Inter Miami",
      team2: "Orlando City",
      result: null,
    });
    const csf2 = nextBracket.find((b) => b.match_id === "CSF_2");
    assert.equal(csf2.team1, "");
    assert.equal(csf2.team2, "");

    // Second run with identical standings is a no-op
    const noOp = computeCSFUpdates(partialStandings, nextBracket);
    assert.equal(noOp.changedRows.length, 0);
  });

  it("preserves CSF results when teams do not change and cascades clears when Round 1 winner changes", () => {
    const standings = [
      { group_code: "E_S1", first_place: "Inter Miami" },
      { group_code: "E_S4", first_place: "Orlando City" },
      { group_code: "E_S2", first_place: "Columbus Crew" },
      { group_code: "E_S3", first_place: "FC Cincinnati" },
    ];
    const bracket = [
      { match_id: "CSF_1", stage: "CSF", team1: "Inter Miami", team2: "Orlando City", result: "team1" },
      { match_id: "CSF_2", stage: "CSF", team1: "Columbus Crew", team2: "FC Cincinnati", result: "team1" },
      { match_id: "CSF_3", stage: "CSF", team1: "", team2: "", result: null },
      { match_id: "CSF_4", stage: "CSF", team1: "", team2: "", result: null },
      { match_id: "CF_1", stage: "CF", team1: "Inter Miami", team2: "Columbus Crew", result: "team1" },
      { match_id: "CUP_1", stage: "CUP", team1: "Inter Miami", team2: "", result: "team1" },
    ];

    // Unchanged standings preserve CSF_1 result
    const same = computeCSFUpdates(standings, bracket, { force: true });
    assert.equal(same.nextBracket.find((b) => b.match_id === "CSF_1").result, "team1");

    // E_S1 changes to Atlanta United -> resets CSF_1, CF_1, CUP_1
    const updatedStandings = standings.map((s) =>
      s.group_code === "E_S1" ? { group_code: "E_S1", first_place: "Atlanta United" } : s
    );
    const changed = computeCSFUpdates(updatedStandings, bracket);
    const nextMap = Object.fromEntries(changed.nextBracket.map((b) => [b.match_id, b]));
    assert.equal(nextMap.CSF_1.team1, "Atlanta United");
    assert.equal(nextMap.CSF_1.result, null);
    assert.equal(nextMap.CF_1.team1, "");
    assert.equal(nextMap.CF_1.result, null);
    assert.equal(nextMap.CUP_1.team1, "");
    assert.equal(nextMap.CUP_1.result, null);
    // Unrelated CSF_2 remains intact
    assert.equal(nextMap.CSF_2.result, "team1");
  });

  it("cascades Stage 2 admin results CSF -> CF -> CUP and clears downstream on toggle", () => {
    const map = {
      CSF_1: { match_id: "CSF_1", stage: "CSF", team1: "Inter Miami", team2: "Orlando City", result: "team1" },
      CSF_2: { match_id: "CSF_2", stage: "CSF", team1: "Columbus Crew", team2: "FC Cincinnati", result: "team1" },
      CSF_3: { match_id: "CSF_3", stage: "CSF", team1: "LAFC", team2: "Seattle Sounders", result: "team1" },
      CSF_4: { match_id: "CSF_4", stage: "CSF", team1: "LA Galaxy", team2: "Real Salt Lake", result: "team2" },
    };

    computeBracketCascade(map, "CSF_1", "Inter Miami");
    computeBracketCascade(map, "CSF_2", "Columbus Crew");
    assert.equal(map.CF_1.team1, "Inter Miami");
    assert.equal(map.CF_1.team2, "Columbus Crew");

    map.CF_1.result = "team1";
    computeBracketCascade(map, "CF_1", "Inter Miami");
    assert.equal(map.CUP_1.team1, "Inter Miami");

    map.CUP_1.result = "team1";

    // Now clear CSF_1 -> CF_1.team1, CF_1.result, CUP_1.team1, CUP_1.result all clear
    map.CSF_1.result = null;
    computeBracketCascade(map, "CSF_1", "");
    assert.equal(map.CF_1.team1, "");
    assert.equal(map.CF_1.team2, "Columbus Crew");
    assert.equal(map.CF_1.result, null);
    assert.equal(map.CUP_1.team1, "");
    assert.equal(map.CUP_1.result, null);
  });
});

// ── 5. END-TO-END SMOKE SIMULATION (FAKE IN-MEMORY DB) ────────────────────────
describe("End-to-end smoke test: Stage 1 -> Auto-fill CSF -> User Stage 2 Picks -> Admin Stage 2 Results", () => {
  it("never clears user Stage 2 picks when admin enters official Stage 2 results", () => {
    // In-memory store representing Supabase tables
    const db = {
      match_results: [],     // keyed by match_id
      group_standings: [],   // keyed by group_code
      stage2_picks: [],      // keyed by user_id + slot_id
    };

    const upsertRow = (table, row, keyFn) => {
      const idx = db[table].findIndex((r) => keyFn(r) === keyFn(row));
      if (idx >= 0) db[table][idx] = { ...row };
      else db[table].push({ ...row });
    };

    const recordStage1 = (matchId, resultWinner) => {
      const m = ALL_GROUP_MATCHES.find((x) => x.matchId === matchId);
      const mrMap = Object.fromEntries(db.match_results.map((r) => [r.match_id, r]));
      const [t1, t2] = getResolvedMatchTeams(m, {}, mrMap);
      upsertRow("match_results", { match_id: matchId, stage: "group", group_code: m.group, team1: t1, team2: t2, result: resultWinner }, (r) => r.match_id);
      if (!m.isWildCard) {
        const sPicks = {};
        db.match_results.filter((r) => r.group_code === m.group && r.result).forEach((r) => { sPicks[r.match_id] = r.result; });
        const nextMr = Object.fromEntries(db.match_results.map((r) => [r.match_id, r]));
        const { winner, length } = deriveSeriesOutcome(calcSeriesWins(m.group, sPicks, nextMr));
        if (winner && length) {
          upsertRow("group_standings", { group_code: m.group, first_place: winner, second_place: length }, (s) => s.group_code);
        }
        const koRows = db.match_results.filter((r) => ["CSF", "CF", "CUP"].includes(r.stage));
        const { changedRows } = computeCSFUpdates(db.group_standings, koRows);
        changedRows.forEach((row) => upsertRow("match_results", row, (r) => r.match_id));
      }
    };

    // Step 1: Admin enters Wild Cards + all 8 Round 1 series (higher seeds sweep)
    recordStage1("WC_E", "team1"); // CF Montréal
    recordStage1("WC_W", "team2"); // Portland Timbers
    for (const sId of Object.keys(GROUPS)) {
      recordStage1(`${sId}_G1`, "team1");
      recordStage1(`${sId}_G2`, "team2");
    }

    assert.equal(db.group_standings.length, 8);
    const knockoutBracket = buildKnockoutBracketSlots(
      db.match_results.filter((r) => ["CSF", "CF", "CUP"].includes(r.stage)),
      db.group_standings
    );
    assert.deepEqual(getStage2SlotTeams("CSF_1", {}, knockoutBracket), ["Inter Miami", "Orlando City"]);
    assert.deepEqual(getStage2SlotTeams("CSF_2", {}, knockoutBracket), ["Columbus Crew", "FC Cincinnati"]);
    assert.deepEqual(getStage2SlotTeams("CSF_3", {}, knockoutBracket), ["LAFC", "Seattle Sounders"]);
    assert.deepEqual(getStage2SlotTeams("CSF_4", {}, knockoutBracket), ["LA Galaxy", "Real Salt Lake"]);

    // Step 2: User makes all 7 Stage 2 picks (auto-saved on each click)
    const userId = "user-123";
    let userPicksState = {};
    const userClickPick = (slotId, team) => {
      const { nextPicks, changedSlots } = applyStage2Pick(userPicksState, slotId, team);
      userPicksState = nextPicks;
      for (const sid of changedSlots) {
        const val = nextPicks[sid];
        if (!val) {
          db.stage2_picks = db.stage2_picks.filter((p) => !(p.user_id === userId && p.slot_id === sid));
        } else {
          upsertRow(
            "stage2_picks",
            { user_id: userId, slot_id: sid, round: sid.replace(/_\d+$/, ""), picked_team: val },
            (p) => `${p.user_id}:${p.slot_id}`
          );
        }
      }
    };

    userClickPick("CSF_1", "Inter Miami");
    userClickPick("CSF_2", "Columbus Crew");
    userClickPick("CSF_3", "LAFC");
    userClickPick("CSF_4", "LA Galaxy");
    userClickPick("CF_1", "Inter Miami");
    userClickPick("CF_2", "LAFC");
    userClickPick("CUP_1", "Inter Miami");

    assert.equal(db.stage2_picks.length, 7);

    // Step 3: Admin enters official Stage 2 results (including an upset in CSF_1)
    const recordStage2 = (slotId, round, winnerOpt, t1, t2) => {
      const koMap = Object.fromEntries(
        db.match_results.filter((r) => ["CSF", "CF", "CUP"].includes(r.stage)).map((r) => [r.match_id, { ...r }])
      );
      const row = { match_id: slotId, stage: round, team1: t1, team2: t2, result: winnerOpt };
      koMap[slotId] = row;
      upsertRow("match_results", row, (r) => r.match_id);
      const winner = winnerOpt === "team1" ? t1 : winnerOpt === "team2" ? t2 : "";
      const downRows = computeBracketCascade(koMap, slotId, winner);
      downRows.forEach((dr) => upsertRow("match_results", dr, (r) => r.match_id));
    };

    recordStage2("CSF_1", "CSF", "team2", "Inter Miami", "Orlando City");   // Orlando upsets Miami
    recordStage2("CSF_2", "CSF", "team1", "Columbus Crew", "FC Cincinnati"); // Columbus wins
    recordStage2("CSF_3", "CSF", "team1", "LAFC", "Seattle Sounders");       // LAFC wins
    recordStage2("CSF_4", "CSF", "team1", "LA Galaxy", "Real Salt Lake");    // LA Galaxy wins
    recordStage2("CF_1", "CF", "team2", "Orlando City", "Columbus Crew");    // Columbus wins East
    recordStage2("CF_2", "CF", "team1", "LAFC", "LA Galaxy");                // LAFC wins West
    recordStage2("CUP_1", "CUP", "team1", "Columbus Crew", "LAFC");          // Columbus wins MLS Cup

    // Step 4: Verify user's 7 Stage 2 selections were NOT wiped from DB or UI state
    assert.equal(db.stage2_picks.length, 7);
    assert.deepEqual(userPicksState, {
      CSF_1: "Inter Miami",
      CSF_2: "Columbus Crew",
      CSF_3: "LAFC",
      CSF_4: "LA Galaxy",
      CF_1: "Inter Miami",
      CF_2: "LAFC",
      CUP_1: "Inter Miami",
    });

    const koResultsCache = db.match_results.filter((r) => ["CSF", "CF", "CUP"].includes(r.stage));
    const koResultsMap = Object.fromEntries(koResultsCache.map((r) => [r.match_id, r]));

    // Display state keeps user's picks and grades accurately
    const cupDisplay = getStage2SlotDisplayState("CUP_1", userPicksState, koResultsMap, knockoutBracket, false);
    assert.equal(cupDisplay.picked, "Inter Miami");
    assert.equal(cupDisplay.userCorrect, false);
    assert.equal(cupDisplay.actualWinner, "Columbus Crew");
    assert.equal(cupDisplay.isReadOnly, true);

    const cf2Display = getStage2SlotDisplayState("CF_2", userPicksState, koResultsMap, knockoutBracket, false);
    assert.equal(cf2Display.picked, "LAFC");
    assert.equal(cf2Display.userCorrect, true);
    assert.equal(cf2Display.t1State, "correct");
    assert.equal(cf2Display.isReadOnly, true);

    // Stage 2 score: CSF_2 (+4) + CSF_3 (+4) + CSF_4 (+4) + CF_2 (+8) = 20
    const s2score = calcStage2Score(db.stage2_picks, koResultsCache);
    assert.deepEqual(s2score, { score: 20, correct: 4 });
  });
});

// ── 6. USER PICK COMPLETENESS REPORTING ──────────────────────────────────────
describe("User pick completeness reporting (calcUserPickProgress)", () => {
  it("reports not_started when user has no picks", () => {
    const prog = calcUserPickProgress({});
    assert.equal(prog.stage1.status, "not_started");
    assert.equal(prog.stage1.done, 0);
    assert.equal(prog.stage1.pct, 0);
    assert.deepEqual(prog.stage1.missingWC, ["WC_E", "WC_W"]);
    assert.equal(prog.stage1.missingSeries.length, 8);
    assert.equal(prog.stage2.status, "not_started");
    assert.equal(prog.stage2.done, 0);
    assert.equal(prog.stage2.pct, 0);
    assert.equal(prog.stage2.championPick, null);
  });

  it("reports complete Stage 1 with 2-0 sweeps (no Game 3 needed) and in_progress when partial", () => {
    const partialMatchPicks = [
      { match_id: "WC_E", pick: "team1" },
      { match_id: "E_S1_G1", pick: "team1" }, // only Game 1 picked -> not clinched
    ];
    const partial = calcUserPickProgress({ userMatchPicks: partialMatchPicks });
    assert.equal(partial.stage1.status, "in_progress");
    assert.equal(partial.stage1.wcDone, 1);
    assert.equal(partial.stage1.seriesDone, 0);
    assert.equal(partial.stage1.round1GamesPicked, 1);
    assert.equal(partial.stage1.pct, 10);

    // Complete all 2 WC + 8 Round 1 series via 2-0 sweeps (only 16 R1 rows instead of 24)
    const fullSweepPicks = [
      { match_id: "WC_E", pick: "team1" },
      { match_id: "WC_W", pick: "team2" },
    ];
    for (const sId of Object.keys(GROUPS)) {
      fullSweepPicks.push({ match_id: `${sId}_G1`, pick: "team1" });
      fullSweepPicks.push({ match_id: `${sId}_G2`, pick: "team2" });
    }
    const complete = calcUserPickProgress({
      userMatchPicks: fullSweepPicks,
      userStage2Picks: [
        { slot_id: "CSF_1", picked_team: "Inter Miami" },
        { slot_id: "CUP_1", picked_team: "LAFC" },
      ],
    });
    assert.equal(complete.stage1.status, "complete");
    assert.equal(complete.stage1.wcDone, 2);
    assert.equal(complete.stage1.seriesDone, 8);
    assert.equal(complete.stage1.pct, 100);
    assert.deepEqual(complete.stage1.missingWC, []);
    assert.deepEqual(complete.stage1.missingSeries, []);

    assert.equal(complete.stage2.status, "in_progress");
    assert.equal(complete.stage2.done, 2);
    assert.equal(complete.stage2.total, 7);
    assert.equal(complete.stage2.pct, 29);
    assert.equal(complete.stage2.championPick, "LAFC");
  });
});

