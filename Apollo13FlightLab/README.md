# Apollo 13 Flight Lab

An interactive JavaScript / Three.js exploration of the **actual Apollo 13 mission**, from Saturn V liftoff to Pacific splashdown. Includes 22 chapters, a 3D spacecraft view, a schematic route, exact guidance-source excerpts, all 173 source files from the reconstructed flown software, and a separate **real yaAGC CPU laboratory** compiled to WebAssembly.

## Open it

The easiest version is `Apollo13-Flight-Lab.html` in the release package. Save it and open it in a modern desktop browser with WebGL 2 and WebAssembly. It contains all assets and is designed for offline use; source links open the internet only when clicked. No account or API key is needed. Direct file opening could not be verified in the test environment because its browser policy blocks file URLs. The identical self-contained HTML was tested over local HTTP. Mobile compatibility is not claimed.

If your browser also blocks local files, open a terminal in the release folder, run `python3 -m http.server 4173 --bind 127.0.0.1`, and visit `http://127.0.0.1:4173/Apollo13-Flight-Lab.html`. This serves only to your own computer.

To develop this folder inside the Virtual AGC fork:

```sh
npm ci
npm run dev
```

Then open the address printed by Vite. Node 22.12+ or 24 is recommended. For a production build, `npm run build`; serve `dist/` with any static HTTP server. `npm run standalone` writes `release/Apollo13-Flight-Lab.html`.

## Explore

- Play/pause, choose guided tour or 1×–1,000× speed, scrub, jump to a ground-elapsed time, or step chapters.
- Drag to orbit the camera, scroll to zoom, reset the camera, or select the mission-path view.
- **Source map:** inspect the input → computation → output chain and its modeled hardware effect. Each excerpt links to exact source lines at a pinned upstream commit.
- **Live AGC:** select Odyssey or Aquarius, step one CPU cycle or 10 ms, run/pause, reset, or send V35 Enter lamp-test keys. Registers, sampled program counter and I/O come from the real emulator.
- **Files:** filter and read the complete source of either reconstructed flown revision.
- **Sources & fidelity:** read the provenance, historical references and limits.

## What is real, and what is modeled?

The mission timeline and the CPU lab are deliberately **independent**. The 3D mission is a deterministic educational model, not a flight-qualified simulator. It does not claim an instruction-exact Apollo 13 replay. Geometry, trajectories, velocity/altitude readouts, engine plumes and entry effects are illustrative. Long coasts are compressed in guided-tour mode; short burns remain visible for 12 seconds of viewing time.

The CPU lab runs the actual upstream yaAGC engine against assembled reconstructed Apollo 13 rope images. It uses synthetic peripheral defaults, no flight pad load, and no reconstructed sensor stream. Cold-start alarms are expected. A sampled PC identifies actual source near the current instruction, not a complete execution trace. I/O timestamps are drain-batch endpoints, at most 128 cycles after a write.

Saturn's **LVDC**, not the spacecraft AGC, controls nominal launch and translunar injection. Hardware failures, manual corrections, module separation and parachutes are labeled with their real control responsibility. Apollo 13 never lands on or enters orbit around the Moon.

## Correct flown revisions

Pinned upstream: [`c9d3953778030af9f49aa74f88b2bbd9a9387053`](https://github.com/virtualagc/virtualagc/tree/c9d3953778030af9f49aa74f88b2bbd9a9387053).

- **LM131 revision 1 (`LM131R1`)**: reconstructed from Luminary 131 and the changed B5 rope module. Every assembled data word matches the upstream composite dump after parity bits are excluded.
- **MANCHE72 revision 3 (`Manche72R3`)**: reconstructed from Comanche 072 and approved changes. Reference bank checksums match. Upstream documents two instruction-order ambiguities inherited from Comanche 072; there is no complete original listing or rope dump.

Plain Luminary 131 and Comanche 072 are not presented as the flown revisions. See `data/provenance.json` for hashes and counts and `THIRD_PARTY_NOTICES.md` for licenses.

## Rebuild authentic CPU and source maps

From the upstream repository, build `yaYUL`, then assemble each program with `yaYUL --html MAIN.agc`. Copy the resulting `MAIN.agc.bin` to `public/agc/LM131R1.bin` and `public/agc/Manche72R3.bin`, respectively. Check both with `Tools/check_buggers.py` and the corresponding `.buggers` files. The exact commands used are recorded in `docs/VERIFICATION.md`.

Install the official [WASI SDK](https://github.com/WebAssembly/wasi-sdk) (this build used version 34), set `WASI_SDK_PATH`, then run:

```sh
bash scripts/build-agc.sh
python3 scripts/build-sources.py
npm test
npm run build
npm run standalone
```

The engine files are compiled unchanged. `scripts/agc-lab.c` adds a small register/configuration bridge around upstream `wasm.c`. The source index is derived from yaYUL listings, and tests compare **every mapped opcode** with its actual assembled rope word.

## Tests

`npm test` checks chronology, deterministic scrub/reset state, short-burn tour visibility, correct LM versus CSM RCS selection, geometry structure/finite vertices, actual WASM execution and reset for both ropes, exact excerpts, hashes and 71,590 address-to-opcode mappings. `npm run check` runs tests and the production build. See `docs/VERIFICATION.md` for actual browser checks and remaining limits.

## License

This application and its yaAGC-based WebAssembly runtime are **GPL-2.0-or-later**. The original AGC source carries public-domain notices. Bundled third-party components retain their own licenses. Complete corresponding source is included in the source package and this fork; `LICENSE` contains GPL version 2.
