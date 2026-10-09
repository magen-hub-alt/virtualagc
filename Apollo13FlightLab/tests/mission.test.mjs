import test from "node:test";
import assert from "node:assert/strict";
import {
  CHAPTERS,
  END_TIME,
  missionState,
  timeToProgress,
  progressToTime,
  formatGET,
  advanceTime,
  rcsActivity,
} from "../src/mission.js";
test("chapters are chronological and cover the actual return, with no lunar landing", () => {
  assert.equal(CHAPTERS[0].start, 0);
  assert.equal(CHAPTERS.at(-1).id, "splashdown");
  assert.equal(END_TIME, 514481);
  assert.ok(
    CHAPTERS.every((c, i) => i === 0 || c.start > CHAPTERS[i - 1].start),
  );
  assert.ok(!CHAPTERS.some((c) => c.id === "landing"));
});
test("stages separate deterministically at their boundaries", () => {
  assert.equal(missionState(160).vehicle, "saturn-v");
  assert.equal(missionState(165).vehicle, "s-ii");
  assert.equal(missionState(594).vehicle, "s-ivb");
  assert.equal(missionState(15000).vehicle, "docked");
  assert.equal(missionState(499000).vehicle, "cm-lm");
  assert.equal(missionState(511800).vehicle, "cm");
});
test("scrubbing forward and back cannot retain future failures or discarded stages", () => {
  const initial = missionState(12);
  missionState(END_TIME);
  assert.deepEqual(missionState(12), initial);
  assert.equal(missionState(200000).damaged, false);
  assert.equal(missionState(202000).damaged, true);
});
test("all times produce finite deterministic state and bounded chapter progress", () => {
  for (let t = 0; t <= END_TIME; t += 137) {
    const s = missionState(t);
    for (const k of [
      "altitude",
      "speed",
      "earthDistance",
      "throttle",
      "progress",
    ])
      assert.ok(Number.isFinite(s[k]), `${k} @ ${t}`);
    assert.ok(s.progress >= 0 && s.progress <= 1);
    assert.ok(s.throttle >= 0 && s.throttle <= 1);
  }
});
test("piecewise narrative timeline round-trips and clamps invalid input", () => {
  for (const t of [0, 150, 754, 9406, 201293, 278100, END_TIME])
    assert.ok(Math.abs(progressToTime(timeToProgress(t)) - t) < 1e-6);
  assert.equal(progressToTime(-1), 0);
  assert.equal(progressToTime(2), END_TIME);
  assert.equal(missionState(NaN).time, 0);
});
test("adaptive playback progresses, stops at splashdown and reset format is stable", () => {
  assert.ok(advanceTime(100, 1, 1) > 100);
  assert.equal(advanceTime(END_TIME - 1, 100, 20), END_TIME);
  assert.equal(formatGET(514481), "142:54:41");
  assert.equal(formatGET(0), "000:00:00");
});
test("manual corrections and launch hardware are honestly distinguished", () => {
  assert.match(missionState(100).authority, /LVDC/);
  assert.match(missionState(379120).authority, /crew|manual/i);
  assert.equal(missionState(222000).computer, "LM131R1");
  assert.equal(missionState(514000).computer, "Manche72R3");
});
test("guided tour holds every short burn on screen for at least eight seconds", () => {
  for (const [start, end] of [
    [110450, 110454],
    [221383, 221418],
    [379108, 379122],
    [495592, 495614],
  ]) {
    let t = start;
    for (let i = 0; i < 80; i++) {
      assert.ok(t < end, `burn ${start} vanished at frame ${i}`);
      t = advanceTime(t, 0.1, 1, "tour");
    }
    assert.ok(t < end);
  }
});

test("final trim fires only Aquarius RCS, not the CSM", () => {
  assert.deepEqual(rcsActivity(missionState(495600), "lm-rcs"), {
    csm: false,
    lm: true,
  });
  assert.deepEqual(rcsActivity(missionState(12000), "rcs"), {
    csm: true,
    lm: false,
  });
});
