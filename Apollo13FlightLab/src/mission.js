// Educational state model. Event times are historical; interpolation is illustrative.
export const END_TIME = 142 * 3600 + 54 * 60 + 41;
export const EVENT_SOURCE =
  "https://ntrs.nasa.gov/api/citations/19710015677/downloads/19710015677.pdf";
export const CHAPTERS = [
  {
    id: "launch",
    start: 0,
    title: "Leave the Earth",
    label: "Liftoff",
    section: "LAUNCH",
    vehicle: "saturn-v",
    computer: "Manche72R3",
    authority: "Saturn LVDC · CMC monitors",
    routines: ["p11-clock", "p11-monitor", "servicer"],
    summary:
      "Five F-1 engines lift AS-508 from Kennedy Space Center. The launch vehicle computer steers Saturn; Odyssey’s AGC starts the mission clock and independently monitors the climb.",
    note: "P11 is a monitor. The AGC does not command Saturn’s nominal ascent.",
  },
  {
    id: "s-ii",
    start: 164,
    title: "The second stage",
    label: "S-IC separation",
    section: "LAUNCH",
    vehicle: "s-ii",
    computer: "Manche72R3",
    authority: "Saturn LVDC · CMC monitors",
    routines: ["p11-monitor", "servicer"],
    summary:
      "The S-IC falls away. Five hydrogen-fuelled J-2 engines on the S-II continue the climb. Staging is controlled by Saturn’s systems, not these spacecraft routines.",
    note: "Stage geometry and separation drift are scaled illustrations.",
  },
  {
    id: "engine-out",
    start: 330,
    title: "An early engine shutdown",
    label: "S-II engine out",
    section: "LAUNCH",
    vehicle: "s-ii",
    computer: "Manche72R3",
    authority: "Saturn engine protection / LVDC",
    routines: ["p11-monitor"],
    summary:
      "Severe pogo oscillation causes the S-II center engine to shut down early. The remaining engines burn longer, with the S-IVB compensating. P11 keeps displaying the ascent state.",
    note: "This launch anomaly is separate from the later oxygen-tank accident.",
  },
  {
    id: "s-ivb",
    start: 593,
    title: "One engine to orbit",
    label: "S-II separation",
    section: "LAUNCH",
    vehicle: "s-ivb",
    computer: "Manche72R3",
    authority: "Saturn LVDC · CMC monitors",
    routines: ["p11-monitor", "servicer"],
    summary:
      "The S-II separates and the S-IVB’s single J-2 completes orbital insertion. The launch escape tower has already been discarded.",
    note: "Nominal launch guidance remains in Saturn’s instrument unit.",
  },
  {
    id: "orbit",
    start: 750,
    title: "A brief home orbit",
    label: "Parking orbit",
    section: "EARTH ORBIT",
    vehicle: "s-ivb",
    computer: "Manche72R3",
    authority: "Crew / ground · Saturn coast",
    routines: ["coast", "servicer"],
    summary:
      "Apollo 13 coasts in a low Earth parking orbit while the crew and ground verify readiness for the Moon. Odyssey’s navigation state is maintained for the next maneuver.",
    note: "The orbit shown is an educational path, not a propagated ephemeris.",
  },
  {
    id: "tli",
    start: 9346,
    title: "Commit to the Moon",
    label: "Translunar injection",
    section: "DEPARTURE",
    vehicle: "s-ivb",
    computer: "Manche72R3",
    authority: "Saturn LVDC · spacecraft monitoring",
    routines: ["tli-monitor", "servicer"],
    summary:
      "The S-IVB restarts for translunar injection. Spacecraft instruments monitor the acceleration; Saturn’s LVDC controls the nominal burn.",
    note: "Mission report times are rounded. The animated thrust is modeled.",
  },
  {
    id: "docking",
    start: 11040,
    title: "Turn around. Dock. Extract.",
    label: "Docking & extraction",
    section: "DEPARTURE",
    vehicle: "docking",
    computer: "Manche72R3",
    authority: "Crew · CSM RCS / digital autopilot",
    routines: ["rcs", "attitude"],
    summary:
      "Odyssey separates, turns through 180 degrees, docks nose-to-nose with Aquarius and extracts the Lunar Module from the S-IVB adapter.",
    note: "The chapter compresses the docking sequence; the crew flies the maneuver.",
  },
  {
    id: "outbound",
    start: 14400,
    title: "Odyssey and Aquarius",
    label: "Outbound coast",
    section: "TRANSLUNAR",
    vehicle: "docked",
    computer: "Manche72R3",
    authority: "Crew / CMC attitude control",
    routines: ["coast", "attitude", "rcs"],
    summary:
      "The joined spacecraft coast toward the Moon. Passive thermal-control rotation distributes solar heating. Navigation depends on state estimates, ground tracking and crew observations.",
    note: "Camera views show the docked configuration; distances and rotation are illustrative.",
  },
  {
    id: "mcc2",
    start: 110450,
    title: "Aim for Fra Mauro",
    label: "Midcourse correction 2",
    section: "TRANSLUNAR",
    vehicle: "docked",
    computer: "Manche72R3",
    authority: "CMC P40 · service propulsion system",
    routines: ["target", "cm-burn", "cm-steer"],
    summary:
      "A short Service Propulsion System burn adjusts the outbound path to the planned hybrid trajectory. P30 prepares the target; P40 organizes the SPS maneuver.",
    note: "The pre-accident maneuver took the spacecraft off a free-return trajectory.",
  },
  {
    id: "accident",
    start: 201293,
    title: "“We’ve had a problem.”",
    label: "Oxygen tank accident",
    section: "ABORT",
    vehicle: "docked",
    computer: "Manche72R3",
    authority: "Physical failure · crew / ground response",
    routines: ["accident", "coast"],
    summary:
      "Oxygen tank 2 ruptures in the Service Module. Oxygen and electrical power are lost. The lunar landing is abandoned and Aquarius becomes a lifeboat.",
    note: "No AGC routine caused or repaired the tank failure. The flash and vent plume are illustrative.",
  },
  {
    id: "lifeboat",
    start: 208620,
    title: "Wake the lifeboat",
    label: "Aquarius takes over",
    section: "ABORT",
    vehicle: "docked",
    computer: "LM131R1",
    authority: "Crew / ground · LM guidance",
    routines: ["lm-start", "lm-align", "lm-target"],
    summary:
      "The crew activates the Lunar Module and preserves Odyssey’s batteries for entry. Aquarius’s guidance platform is aligned for the emergency return maneuvers.",
    note: "Activation spans hours. This marker denotes the reported LM signal-on period.",
  },
  {
    id: "free-return",
    start: 221383,
    title: "Recover a path home",
    label: "Free-return burn",
    section: "RESCUE",
    vehicle: "docked",
    computer: "LM131R1",
    authority: "LGC P40 · descent propulsion system",
    routines: ["lm-target", "lm-burn", "ignition", "lm-steer", "cutoff"],
    summary:
      "Aquarius fires its descent engine to restore a free-return path around the Moon. Target preparation, ignition sequencing, steering and cutoff work together with crew controls.",
    note: "A roughly 35-second DPS maneuver; no lunar landing is attempted.",
  },
  {
    id: "flyby",
    start: 277740,
    title: "Around the far side",
    label: "Lunar flyby",
    section: "RESCUE",
    vehicle: "docked",
    computer: "LM131R1",
    authority: "Gravity · crew / ground navigation",
    routines: ["coast", "lm-nav"],
    summary:
      "Apollo 13 passes behind the Moon, temporarily losing radio contact. Lunar gravity bends the path toward Earth. The spacecraft never enters lunar orbit.",
    note: "The Moon and flight path are enlarged and schematic in the map view.",
  },
  {
    id: "pc2",
    start: 286059,
    title: "Shorten the return",
    label: "PC+2 burn",
    section: "RESCUE",
    vehicle: "docked",
    computer: "LM131R1",
    authority: "LGC P40 · descent propulsion system",
    routines: ["lm-target", "lm-burn", "ignition", "lm-steer", "cutoff"],
    summary:
      "Two hours after closest lunar approach, a longer descent-engine burn accelerates the trip home and shifts the recovery area to the Pacific.",
    note: "The PC+2 burn lasts about 4 minutes 23 seconds, with a staged throttle profile.",
  },
  {
    id: "homeward",
    start: 286322,
    title: "Bring three people home",
    label: "Homeward coast",
    section: "RETURN",
    vehicle: "docked",
    computer: "LM131R1",
    authority: "Crew / ground · power conservation",
    routines: ["coast", "lm-nav"],
    summary:
      "The crew conserves power and water while ground teams work the return plan. The improvised carbon-dioxide adapter is a life-support solution, not a guidance-computer program.",
    note: "This is a cold, low-power coast; most scheduled landing software is unused.",
  },
  {
    id: "manual-burn",
    start: 379108,
    title: "Fly it by hand",
    label: "Manual correction",
    section: "RETURN",
    vehicle: "docked",
    computer: "LM131R1",
    authority: "Crew manual attitude / timed DPS burn",
    routines: ["manual", "lm-monitor"],
    summary:
      "The crew uses the Earth in the window as an attitude reference and times a small descent-engine correction manually to refine the entry corridor.",
    note: "Do not read the linked P47 capability as proof it controlled this burn. It did not steer a manual maneuver.",
  },
  {
    id: "final-trim",
    start: 495592,
    title: "One final correction",
    label: "Final trim",
    section: "RETURN",
    vehicle: "docked",
    computer: "LM131R1",
    authority: "Crew / LM reaction-control system",
    routines: ["manual", "lm-rcs"],
    summary:
      "A final small reaction-control maneuver tunes the return trajectory before the spacecraft modules are separated.",
    note: "Crew and ground decisions remain essential; there is no autonomous rescue program.",
  },
  {
    id: "sm-separation",
    start: 496908,
    title: "Expose the damage",
    label: "Service Module away",
    section: "REENTRY",
    vehicle: "cm-lm",
    computer: "Manche72R3",
    authority: "Crew · separation hardware / CM reactivation",
    routines: ["separation", "cm-start", "entry-prepare"],
    summary:
      "The damaged Service Module is jettisoned. Its missing panel reveals the accident’s severity. Odyssey is brought back to life for atmospheric entry.",
    note: "Pyrotechnic separation is a crew/hardware action, not the output of the displayed entry calculation.",
  },
  {
    id: "lm-separation",
    start: 509400,
    title: "Farewell, Aquarius",
    label: "Lunar Module away",
    section: "REENTRY",
    vehicle: "cm",
    computer: "Manche72R3",
    authority: "Crew · CMC entry preparation",
    routines: ["entry-prepare", "entry-attitude"],
    summary:
      "Aquarius is released after keeping the crew alive. Only Odyssey’s Command Module, with its heat shield, can survive entry.",
    note: "The Lunar Module is not a reentry vehicle.",
  },
  {
    id: "entry",
    start: 513646,
    title: "Ride the entry corridor",
    label: "Atmospheric entry",
    section: "REENTRY",
    vehicle: "cm",
    computer: "Manche72R3",
    authority: "CMC entry guidance / CM RCS",
    routines: ["entry-prepare", "entry-guidance", "entry-attitude"],
    summary:
      "Odyssey enters the atmosphere. Guidance estimates the entry state and commands bank control; RCS jets orient the capsule while aerodynamic lift and drag change its path.",
    note: "Plasma, deceleration and bank angle are illustrative, not a validated aerothermal simulation.",
  },
  {
    id: "parachutes",
    start: 514220,
    title: "Under three canopies",
    label: "Parachute descent",
    section: "RECOVERY",
    vehicle: "cm",
    computer: "Manche72R3",
    authority: "Earth landing system · aerodynamic descent",
    routines: ["chutes"],
    summary:
      "The recovery system deploys the parachutes. Three orange-and-white main canopies slow Odyssey for the Pacific Ocean.",
    note: "The Earth landing system, not an AGC parachute algorithm, performs this sequence. Chapter timing is rounded.",
  },
  {
    id: "splashdown",
    start: END_TIME,
    title: "A successful failure",
    label: "Splashdown",
    section: "RECOVERY",
    vehicle: "cm",
    computer: "Manche72R3",
    authority: "Recovery team",
    routines: ["chutes"],
    summary:
      "Odyssey splashes down on April 17, 1970. Jim Lovell, Jack Swigert and Fred Haise return safely after 142 hours, 54 minutes and 41 seconds.",
    note: "The historical mission ends here. No landing on the Moon occurred.",
  },
];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const finite = (x) => (Number.isFinite(x) ? x : 0);
export const formatGET = (t) => {
  t = Math.max(0, Math.floor(finite(t)));
  return [
    Math.floor(t / 3600)
      .toString()
      .padStart(3, "0"),
    Math.floor(t / 60) % 60,
    t % 60,
  ]
    .map((v, i) => (i ? v.toString().padStart(2, "0") : v))
    .join(":");
};
export function parseGET(value) {
  const parts = value.trim().split(":").map(Number);
  if (
    parts.length !== 3 ||
    parts.some((x) => !Number.isFinite(x) || x < 0) ||
    parts[1] >= 60 ||
    parts[2] >= 60
  )
    return null;
  return clamp(parts[0] * 3600 + parts[1] * 60 + parts[2], 0, END_TIME);
}
export function chapterIndex(t) {
  t = clamp(finite(t), 0, END_TIME);
  let i = 0;
  while (i < CHAPTERS.length - 1 && CHAPTERS[i + 1].start <= t) i++;
  return i;
}
export function timeToProgress(t) {
  t = clamp(finite(t), 0, END_TIME);
  const i = chapterIndex(t);
  if (t === END_TIME) return 1;
  return (
    (i +
      (t - CHAPTERS[i].start) / (CHAPTERS[i + 1].start - CHAPTERS[i].start)) /
    (CHAPTERS.length - 1)
  );
}
export function progressToTime(p) {
  p = clamp(finite(p), 0, 1);
  if (p === 1) return END_TIME;
  const x = p * (CHAPTERS.length - 1),
    i = Math.floor(x);
  return (
    CHAPTERS[i].start + (x - i) * (CHAPTERS[i + 1].start - CHAPTERS[i].start)
  );
}
// Give each chapter 24 seconds; burns followed by a long coast get the first
// 12 seconds. This preserves the historical duration while keeping short burns visible.
const burnEnds = {
  tli: 9697,
  mcc2: 110454,
  "free-return": 221418,
  "manual-burn": 379122,
  "final-trim": 495614,
};
function tourPosition(t) {
  const i = chapterIndex(t);
  if (t >= END_TIME) return CHAPTERS.length - 1;
  const a = CHAPTERS[i].start,
    b = CHAPTERS[i + 1].start,
    end = burnEnds[CHAPTERS[i].id];
  return (
    i +
    (end
      ? t < end
        ? (0.5 * (t - a)) / (end - a)
        : 0.5 + (0.5 * (t - end)) / (b - end)
      : (t - a) / (b - a))
  );
}
function tourTime(p) {
  p = clamp(p, 0, CHAPTERS.length - 1);
  if (p === CHAPTERS.length - 1) return END_TIME;
  const i = Math.floor(p),
    q = p - i,
    a = CHAPTERS[i].start,
    b = CHAPTERS[i + 1].start,
    end = burnEnds[CHAPTERS[i].id];
  return end
    ? q < 0.5
      ? a + (end - a) * q * 2
      : end + (b - end) * (q - 0.5) * 2
    : a + (b - a) * q;
}
export function advanceTime(t, dt, speed = 1, mode = "tour") {
  return mode === "realtime"
    ? clamp(t + Math.max(0, dt) * speed, 0, END_TIME)
    : tourTime(tourPosition(t) + (Math.max(0, dt) * speed) / 24);
}
export function rcsActivity(s, focus) {
  return {
    csm: s.vehicle === "docking" || (focus === "rcs" && s.time < 496908),
    lm: s.engine === "LM RCS",
  };
}

const samples = [
  [0, 0, 0],
  [10, 0.09, 0.065],
  [60, 7, 0.6],
  [164, 67, 2.75],
  [330, 120, 4.4],
  [593, 180, 6.9],
  [750, 185, 7.8],
  [9346, 185, 7.8],
  [9697, 330, 10.85],
  [11040, 4500, 9.8],
  [14400, 24000, 8.0],
  [110450, 230000, 1.3],
  [201293, 321000, 1.0],
  [221383, 347000, 0.94],
  [277740, 393000, 1.0],
  [278400, 399000, 1.02],
  [286059, 387000, 1.2],
  [286322, 385000, 1.4],
  [379108, 250000, 1.7],
  [495592, 45000, 4.2],
  [496908, 39000, 4.7],
  [509400, 7000, 7.8],
  [513646, 122, 11.04],
  [514000, 25, 3.2],
  [514220, 7, 0.13],
  [END_TIME, 0, 0],
];
function interpolate(t, col) {
  let i = 0;
  while (i < samples.length - 2 && samples[i + 1][0] < t) i++;
  const a = samples[i],
    b = samples[i + 1];
  return a[col] + (b[col] - a[col]) * clamp((t - a[0]) / (b[0] - a[0]), 0, 1);
}
export function missionState(value) {
  const time = clamp(finite(value), 0, END_TIME),
    index = chapterIndex(time),
    chapter = CHAPTERS[index],
    next = CHAPTERS[index + 1]?.start ?? END_TIME;
  let throttle = 0,
    engine = "OFF";
  if (time < 164) {
    throttle = 1;
    engine = time < 136 ? "5 × F-1" : "4 × F-1";
  } else if (time < 593) {
    throttle = 1;
    engine = time < 330 ? "5 × J-2" : "4 × J-2";
  } else if (time < 750) {
    throttle = 1;
    engine = "1 × J-2";
  } else if (time >= 9346 && time < 9697) {
    throttle = 1;
    engine = "S-IVB J-2";
  } else if (time >= 110450 && time < 110454) {
    throttle = 1;
    engine = "SPS";
  } else if (time >= 221383 && time < 221418) {
    throttle = 0.4;
    engine = "LM DPS";
  } else if (time >= 286059 && time < 286322) {
    const elapsed = time - 286059;
    throttle = elapsed < 26 ? 0.1 : elapsed < 81 ? 0.4 : 1;
    engine = "LM DPS";
  } else if (time >= 379108 && time < 379122) {
    throttle = 0.1;
    engine = "DPS · manual";
  } else if (time >= 495592 && time < 495614) {
    throttle = 1;
    engine = "LM RCS";
  }
  const vehicle =
    chapter.vehicle === "docking"
      ? time < 13500
        ? "docking"
        : "docked"
      : chapter.vehicle;
  return {
    time,
    index,
    chapter,
    progress:
      next > chapter.start
        ? clamp((time - chapter.start) / (next - chapter.start), 0, 1)
        : 1,
    vehicle,
    computer: chapter.computer,
    authority: chapter.authority,
    altitude: interpolate(time, 1),
    earthDistance: 6371 + interpolate(time, 1),
    speed: interpolate(time, 2),
    throttle,
    engine,
    damaged: time >= 201293,
    moonNear: time > 270000 && time < 290000,
    entry: time >= 513646 && time < 514220,
    parachutes: time >= 514220,
    splashdown: time === END_TIME,
    escapeTower: time < 200,
    cmPower: time < 211200 || time >= 496908,
    lmPower: time >= 208620 && time < 509400,
  };
}
