import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createAGC } from "../src/agc.js";
const wasm = await fs
  .readFile("public/agc/yaAGC.wasm")
  .catch(() => new Uint8Array());
for (const name of ["LM131R1", "Manche72R3"])
  test(`${name}: actual rope executes and resets deterministically`, async () => {
    const rom = await fs.readFile(`public/agc/${name}.bin`);
    const cpu = await createAGC(wasm, rom, name === "LM131R1");
    assert.equal(cpu.snapshot().z, 0o4000);
    const before = cpu.snapshot();
    cpu.step(10000);
    assert.equal(cpu.snapshot().cycles, 10000);
    assert.notDeepEqual(cpu.snapshot(), before);
    const after = cpu.snapshot();
    await cpu.reset();
    cpu.step(10000);
    assert.deepEqual(cpu.snapshot(), after);
    assert.ok(cpu.snapshot().z > 0);
  });
test("invalid rope length is rejected", async () => {
  await assert.rejects(() => createAGC(wasm, new Uint8Array(8)), /rope/i);
});
for (const name of ["LM131R1", "Manche72R3"])
  test(`${name}: lamp-test demonstration survives immediate cold start`, async () => {
    const cpu = await createAGC(
      wasm,
      await fs.readFile(`public/agc/${name}.bin`),
      name === "LM131R1",
    );
    cpu.lampTest();
    assert.equal(cpu.memoryWord(name === "LM131R1" ? 0o1000 : 0o1001), 35);
    assert.ok(cpu.outputs().length > 0);
    await cpu.reset();
    cpu.lampTest();
    assert.equal(cpu.memoryWord(name === "LM131R1" ? 0o1000 : 0o1001), 35);
  });
