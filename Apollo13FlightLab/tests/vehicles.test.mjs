import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createSaturn, createCSM, createLM } from "../src/vehicles.js";
test("Saturn has three separable stages, an instrument unit and five F-1 bells", () => {
  const s = createSaturn();
  for (const name of [
    "S-IC",
    "S-II",
    "S-IVB",
    "Instrument Unit",
    "Launch Escape System",
    "Spacecraft",
  ])
    assert.ok(s.getObjectByName(name), name);
  assert.equal(
    s.getObjectByName("S-IC").children.filter((c) => c.name === "F-1").length,
    5,
  );
});
test("CSM retains independently removable service module and capsule", () => {
  const c = createCSM();
  assert.ok(c.getObjectByName("Command Module"));
  assert.ok(c.getObjectByName("Service Module"));
  assert.ok(c.getObjectByName("SPS"));
  assert.ok(c.getObjectByName("Damaged bay"));
});
test("LM has separate descent/ascent stages, descent engine and four landing legs", () => {
  const l = createLM();
  for (const name of ["Descent stage", "Ascent stage", "DPS"])
    assert.ok(l.getObjectByName(name));
  assert.equal(l.children.filter((c) => c.name === "Landing leg").length, 4);
});
test("geometry buffers contain finite vertices", () => {
  for (const build of [createSaturn, createCSM, createLM])
    build().traverse((o) => {
      if (o.isMesh) {
        const p = o.geometry.attributes.position;
        assert.ok(p.count > 0);
        for (const n of p.array) assert.ok(Number.isFinite(n));
      }
    });
});
