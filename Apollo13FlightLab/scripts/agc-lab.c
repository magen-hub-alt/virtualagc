/* Apollo 13 Flight Lab adapter, GPL-2.0-or-later.
 * The emulator itself is unmodified upstream yaAGC. This file adds read-only
 * observability and a CM/LM configuration switch to its existing WASM interface.
 */
#include "../../yaAGC/wasm.c"
export uint32_t lab_get(uint32_t field) {
  switch(field) {
    case 0: return State.CycleCounter;
    case 1: return State.Erasable[0][RegA] & 0177777;
    case 2: return State.Erasable[0][RegL] & 0177777;
    case 3: return State.Erasable[0][RegQ] & 0177777;
    case 4: return State.Erasable[0][RegZ] & 07777;
    case 5: return State.Erasable[0][RegEB] & 077777;
    case 6: return State.Erasable[0][RegFB] & 077777;
    case 7: return State.OutputChannel7;
    case 8: return State.ExtraCode;
    case 9: return State.PendFlag;
    case 10: return State.InIsr;
    case 11: return State.Standby;
    default: return 0;
  }
}
export void lab_configure(uint32_t is_lm) { CmOrLm = is_lm ? 0 : 1; }
