#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
UPSTREAM="$(cd .. && pwd)"
: "${WASI_SDK_PATH:?Set WASI_SDK_PATH to an official WebAssembly/wasi-sdk installation}"
mkdir -p .build public/agc
CC="$WASI_SDK_PATH/bin/clang"
FLAGS=(--target=wasm32-wasip1 "--sysroot=$WASI_SDK_PATH/share/wasi-sysroot" -DWASI=yes -O3 -flto -I"$UPSTREAM/yaAGC")
for file in agc_engine agc_engine_init agc_utilities ringbuffer_api ringbuffer; do
 "$CC" "${FLAGS[@]}" -c "$UPSTREAM/yaAGC/$file.c" -o ".build/$file.o"
done
"$CC" "${FLAGS[@]}" -c scripts/agc-lab.c -o .build/agc-lab.o
"$WASI_SDK_PATH/bin/wasm-ld" --no-entry --export-dynamic --import-undefined \
 -L "$WASI_SDK_PATH/share/wasi-sysroot/lib/wasm32-wasip1" -lc --export=malloc --export=free \
 --lto-O3 --initial-memory=524288 --max-memory=16777216 -o public/agc/yaAGC.wasm .build/*.o
