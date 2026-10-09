import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { CHAPTERS } from "../src/mission.js";
const routines = JSON.parse(fs.readFileSync("data/routines.json"));
const provenance = JSON.parse(fs.readFileSync("data/provenance.json"));
test("every chapter has a valid honest source mapping", () => {
  for (const c of CHAPTERS)
    for (const id of c.routines)
      assert.ok(
        routines.some((r) => r.id === id),
        `${c.id}: ${id}`,
      );
});
test("excerpts exactly match pinned original source lines", () => {
  for (const r of routines) {
    if (!r.path) {
      assert.ok(["hardware", "manual"].includes(r.kind));
      continue;
    }
    const original = fs
      .readFileSync("../" + r.path, "utf8")
      .split(/\r?\n/)
      .slice(r.start - 1, r.end);
    assert.deepEqual(r.code, original);
    assert.ok(r.url.includes(provenance.commit));
    assert.equal(r.code.length, r.end - r.start + 1);
  }
});
test("ropes and wasm have the recorded reproducible hashes", () => {
  for (const [name, meta] of Object.entries(provenance.programs)) {
    const rope = fs.readFileSync(`public/agc/${name}.bin`);
    assert.equal(rope.length, 73728);
    assert.equal(
      crypto.createHash("sha256").update(rope).digest("hex"),
      meta.ropeSha256,
    );
    assert.ok(meta.mappedWords > 30000);
  }
  assert.equal(
    crypto
      .createHash("sha256")
      .update(fs.readFileSync("public/agc/yaAGC.wasm"))
      .digest("hex"),
    provenance.wasmSha256,
  );
});
test("every source-map opcode equals the corresponding assembled rope word", () => {
  for (const name of ["LM131R1", "Manche72R3"]) {
    const index = JSON.parse(fs.readFileSync(`public/agc/${name}-source.json`));
    const bytes = fs.readFileSync(`public/agc/${name}.bin`);
    for (const [address, [file, line, word]] of Object.entries(
      index.addresses,
    )) {
      const [bank, offset] = address.split(",").map((x) => parseInt(x, 8));
      const fileBank =
        bank === 2
          ? 0
          : bank === 3
            ? 1
            : bank === 0
              ? 2
              : bank === 1
                ? 3
                : bank;
      const at = (fileBank * 1024 + (offset & 1023)) * 2;
      assert.equal(
        bytes.readUInt16BE(at) >> 1,
        parseInt(word, 8),
        `${name} ${address} ${file}:${line}`,
      );
    }
  }
});
