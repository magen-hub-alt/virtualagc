import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const src = fs.readFileSync("src/main.js", "utf8");
const fn = src
  .match(/async function loadLab\(\)\s*\{[\s\S]*?\nfunction renderCPU/)[0]
  .replace(/\nfunction renderCPU$/, "");
for (const staleReject of [false, true])
  test(`latest rope selection wins a reversed async completion (stale error=${staleReject})`, async () => {
    const el = {
        "#lab-program": { value: "Manche72R3" },
        "#lab-status": { textContent: "" },
      },
      pending = [];
    const ctx = vm.createContext({
      labGeneration: 0,
      labRunning: false,
      labBusy: false,
      lab: null,
      labIndex: null,
      $: (s) => el[s],
      document: { querySelectorAll: () => [] },
      fetch: async () => ({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(0),
      }),
      asset: (x) => x,
      getIndex: async (program) => ({ program }),
      createAGC: (_w, _r, isLM) =>
        new Promise((resolve, reject) =>
          pending.push({ isLM, resolve, reject }),
        ),
      renderCPU() {},
      Uint8Array,
    });
    vm.runInContext(fn, ctx);
    const first = ctx.loadLab();
    await new Promise((r) => setTimeout(r, 0));
    el["#lab-program"].value = "LM131R1";
    const second = ctx.loadLab();
    await new Promise((r) => setTimeout(r, 0));
    pending[1].resolve({ isLM: true });
    await second;
    if (staleReject) pending[0].reject(Error("stale compilation error"));
    else pending[0].resolve({ isLM: false });
    await first;
    assert.equal(ctx.labIndex.program, "LM131R1");
    assert.equal(ctx.lab.isLM, true);
    assert.match(el["#lab-status"].textContent, /^LM131R1 loaded/);
    assert.equal(ctx.labBusy, false);
  });
