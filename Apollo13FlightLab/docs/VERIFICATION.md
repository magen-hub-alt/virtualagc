# Verification record — 9 October 2026

## Automated verification

- `npm run check`: PASS. Prettier source formatting, 24 Node regression tests, Vite production build, and standalone HTML build.
- `node --check`: PASS for authored JavaScript modules and build scripts.
- Both real yaAGC WASM instances execute the assembled rope and reset deterministically.
- V35 Enter immediately after load and after reset: PASS for both ropes. The demonstration advances through startup first; tests inspect the actual VERBREG (CM 01001; LM 01000).
- Reversed async rope loads and stale failures: PASS. Only the latest selected CPU/index/status commits.
- Every mapped opcode checked against rope memory: PASS, 35,809 LM + 35,781 CM = 71,590 words.
- Exact excerpt text/line ranges, binary hashes, chronological chapters, finite geometry/state, reverse scrub/reset, short-burn tour visibility, and LM-versus-CSM RCS selection: PASS.
- Independent code review identified four substantive defects (short-burn visibility, wrong-module RCS exhaust, startup input readiness and stale async rope selection); all were fixed and rechecked.

## Authentic software assembly

Pinned upstream `c9d3953778030af9f49aa74f88b2bbd9a9387053`.

```sh
make -C yaYUL cc=gcc 'NVER="2026-10-09"' -j4
(cd LM131R1 && ../yaYUL/yaYUL --html MAIN.agc)
(cd Manche72R3 && ../yaYUL/yaYUL --html MAIN.agc)
cp LM131R1/MAIN.agc.bin Apollo13FlightLab/public/agc/LM131R1.bin
cp Manche72R3/MAIN.agc.bin Apollo13FlightLab/public/agc/Manche72R3.bin
python3 Tools/check_buggers.py Apollo13FlightLab/public/agc/LM131R1.bin LM131R1/LM131R1.buggers
python3 Tools/check_buggers.py Apollo13FlightLab/public/agc/Manche72R3.bin Manche72R3/Manche72R3.buggers
cd Apollo13FlightLab
WASI_SDK_PATH=/path/to/wasi-sdk-34.0-x86_64-linux bash scripts/build-agc.sh
python3 scripts/build-sources.py
```

- LM assembler: 0 fatal errors, 2 known erasable-assignment overflow warnings. CM: 0 errors, 0 warnings.
- Both bank-checksum checks: PASS.
- LM composite dump: all 36,864 data words match after stripping parity. Independently rechecked.
- CM reconstruction has the upstream-documented instruction-order ambiguities. A matching checksum is not proof of an unavailable original full dump.

## Actual browser verification

Tested in desktop Chromium on the assistant's cloud computer. The regular Vite production build and the identical self-contained HTML were served locally. No public hosting or production deployment was created.

- All 22 chapter buttons navigate to the correct mission titles; reset restores launch.
- Timeline End reaches 142:54:41; Home restores the beginning. GET jump reaches PC+2 at 079:27:39. Invalid GET is flagged.
- Play/pause, speed selection, repeated reset, source tabs, exact-source links, complete-file filtering and both rope selections checked.
- CPU stepping produces actual cycle/register changes; both cold-load lamp-test paths, reset and source-address display checked.
- Real Three.js rendering checked using Chromium's software graphics backend in a clean temporary profile, without disabling the browser sandbox. The default managed browser disables WebGL; its graceful fallback keeps the timeline, source explorer and CPU lab usable.
- Standalone artifact contains embedded fonts, geographic data, rope images, WASM and source indexes. Its generated JavaScript is syntax-validated and the HTML has exactly one inline script. There are no external script, stylesheet or asset tags; historical/source links are ordinary click-through links.

## Not verified / limitations

- Direct `file://` opening: NOT VERIFIED. Browser organization policy explicitly blocks file URLs. The policy was not bypassed. Use the supplied localhost-server instructions if your browser also blocks local files.
- Mobile devices, Safari and Firefox: NOT RUN. Desktop Chromium is the verified target.
- No automated network-capture assertion was available; offline asset completeness was checked in the built file and by exercising the self-contained build over local HTTP.
- This is an educational mission model. Dynamics, dimensions, navigation readouts, throttle effects, stage drift and entry aerothermodynamics are not validated flight models.
- Source mappings are explanatory relationships, not evidence of execution at a mission timestamp. The real CPU laboratory is independent of the 3D mission and has no flight pad load or Apollo 13 sensor replay.
- No real Saturn LVDC emulator is included; its control responsibility is explicitly distinguished.
