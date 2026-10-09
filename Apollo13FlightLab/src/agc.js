// Actual upstream yaAGC WebAssembly bridge. No mission timeline drives this CPU.
export const CYCLES_PER_SECOND = 85333;
export function oct(value, width = 5) {
  return (value >>> 0).toString(8).padStart(width, "0");
}
export function physicalAddress(s) {
  const z = s.z & 0o7777;
  if (z < 0o2000) return null;
  let bank = z >= 0o6000 ? 3 : z >= 0o4000 ? 2 : (s.fb >> 10) & 0o37;
  if (z < 0o4000 && (bank & 0o30) === 0o30 && s.channel7 & 0o100) bank += 0o10;
  return `${oct(bank, 2)},${oct(0o2000 + (z & 0o1777), 4)}`;
}
export async function createAGC(wasmBytes, ropeBytes, isLM = false) {
  if (ropeBytes.length !== 73728)
    throw new Error("The AGC rope must contain exactly 36,864 16-bit words.");
  const module = await WebAssembly.compile(wasmBytes);
  let exports,
    packets = [],
    instance;
  async function reset() {
    packets = [];
    const wasi = {
      clock_time_get: (_id, _precision, p) => {
        new DataView(exports.memory.buffer).setBigUint64(p, 0n, true);
        return 0;
      },
      fd_close: () => 0,
      fd_fdstat_get: () => 8,
      fd_prestat_get: () => 8,
      fd_prestat_dir_name: () => 8,
      fd_seek: () => 8,
      fd_write: (_fd, iovs, len, nwritten) => {
        let n = 0;
        const v = new DataView(exports.memory.buffer);
        for (let i = 0; i < len; i++) n += v.getUint32(iovs + i * 8 + 4, true);
        v.setUint32(nwritten, n, true);
        return 0;
      },
      proc_exit: (code) => {
        throw new Error(`AGC runtime exited (${code}).`);
      },
    };
    instance = await WebAssembly.instantiate(module, {
      wasi_snapshot_preview1: wasi,
    });
    exports = instance.exports;
    const ptr = exports.malloc(ropeBytes.length);
    new Uint8Array(exports.memory.buffer, ptr, ropeBytes.length).set(ropeBytes);
    exports.set_fixed(ptr);
    exports.free(ptr);
    exports.cpu_reset();
    exports.lab_configure(isLM ? 1 : 0);
  }
  const snapshot = () => {
    const fields = [
      "cycles",
      "a",
      "l",
      "q",
      "z",
      "eb",
      "fb",
      "channel7",
      "extended",
      "pending",
      "interrupt",
      "standby",
    ];
    const s = Object.fromEntries(fields.map((k, i) => [k, exports.lab_get(i)]));
    s.address = physicalAddress(s);
    return s;
  };
  function drain() {
    let packet;
    while ((packet = exports.packet_read()) !== 0) {
      packets.push({
        cycle: exports.lab_get(0),
        channel: packet >>> 16,
        value: packet & 0o77777,
      });
    }
    if (packets.length > 80) packets = packets.slice(-80);
  }
  function step(cycles = 1) {
    cycles = Math.max(0, Math.min(853330, Math.floor(cycles)));
    for (let left = cycles; left > 0; left -= 128) {
      exports.cpu_step(Math.min(128, left));
      drain();
    }
    return snapshot();
  }
  function key(code) {
    if (!Number.isInteger(code) || code < 0 || code > 31)
      throw new Error("Invalid DSKY key code");
    exports.packet_write(0o15, code);
    step(256);
    exports.packet_write(0o15, 0);
    step(256);
  }
  function lampTest() {
    step(Math.max(0, CYCLES_PER_SECOND - snapshot().cycles));
    for (const code of [17, 3, 5, 28]) {
      key(code);
      step(8533);
    }
    step(8533);
    return snapshot();
  }
  await reset();
  return {
    snapshot,
    step,
    key,
    lampTest,
    reset,
    outputs: () => packets.slice(),
    memoryWord: (address) =>
      new Int16Array(exports.memory.buffer, exports.get_erasable_ptr(), 2048)[
        address
      ] & 0o77777,
  };
}
