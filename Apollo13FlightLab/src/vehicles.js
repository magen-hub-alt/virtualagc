import * as T from "three";
const M = {
  white: new T.MeshStandardMaterial({
    color: 0xe7e5dc,
    roughness: 0.62,
    metalness: 0.16,
  }),
  black: new T.MeshStandardMaterial({
    color: 0x172128,
    roughness: 0.65,
    metalness: 0.25,
  }),
  silver: new T.MeshStandardMaterial({
    color: 0xb4c4ca,
    metalness: 0.85,
    roughness: 0.3,
  }),
  dark: new T.MeshStandardMaterial({
    color: 0x303b43,
    metalness: 0.68,
    roughness: 0.55,
  }),
  gold: new T.MeshStandardMaterial({
    color: 0xc9a04e,
    metalness: 0.82,
    roughness: 0.38,
    flatShading: true,
  }),
  foil: new T.MeshStandardMaterial({
    color: 0x7a5329,
    metalness: 0.8,
    roughness: 0.5,
    flatShading: true,
  }),
  window: new T.MeshStandardMaterial({
    color: 0x081923,
    metalness: 0.9,
    roughness: 0.15,
  }),
  red: new T.MeshStandardMaterial({ color: 0xaf352b, roughness: 0.8 }),
  orange: new T.MeshStandardMaterial({
    color: 0xe97840,
    side: T.DoubleSide,
    roughness: 0.7,
  }),
  fabric: new T.MeshStandardMaterial({
    color: 0xe9dfd0,
    side: T.DoubleSide,
    roughness: 0.9,
  }),
};
function mesh(g, mat, parent, name, x = 0, y = 0, z = 0) {
  const o = new T.Mesh(g, mat);
  o.name = name;
  o.position.set(x, y, z);
  parent.add(o);
  return o;
}
function cylinder(
  parent,
  r1,
  r2,
  h,
  y,
  mat = M.white,
  name = "",
  segments = 64,
) {
  return mesh(
    new T.CylinderGeometry(r1, r2, h, segments),
    mat,
    parent,
    name,
    0,
    y,
    0,
  );
}
function box(parent, w, h, d, x, y, z, mat = M.white, name = "") {
  return mesh(new T.BoxGeometry(w, h, d), mat, parent, name, x, y, z);
}
function strut(parent, a, b, r = 0.045, mat = M.silver) {
  const start = new T.Vector3(...a),
    end = new T.Vector3(...b);
  const v = end.clone().sub(start);
  const o = mesh(
    new T.CylinderGeometry(r, r, v.length(), 8),
    mat,
    parent,
    "Strut",
  );
  o.position.copy(start.add(end).multiplyScalar(0.5));
  o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize());
  return o;
}
function ring(parent, r, y, thickness = 0.05, mat = M.dark) {
  const o = mesh(
    new T.TorusGeometry(r, thickness, 6, 64),
    mat,
    parent,
    "Structural ring",
    0,
    y,
    0,
  );
  o.rotation.x = Math.PI / 2;
  return o;
}
function bell(parent, r, h, x, y, z, name) {
  const points = [
    [0.36 * r, 0],
    [0.37 * r, -h * 0.17],
    [0.46 * r, -h * 0.39],
    [0.7 * r, -h * 0.68],
    [r, -h],
  ].map(([a, b]) => new T.Vector2(a, b));
  const o = mesh(
    new T.LatheGeometry(points, 32),
    M.dark,
    parent,
    name,
    x,
    y,
    z,
  );
  o.material = new T.MeshStandardMaterial({
    color: 0x56636a,
    metalness: 0.82,
    roughness: 0.4,
    side: T.DoubleSide,
  });
  ring(o, r, -h, 0.025);
  return o;
}
function panel(parent, r, h, y, theta, width, mat = M.black) {
  const o = mesh(
    new T.CylinderGeometry(r, r, h, 48, 1, true, theta, width),
    mat,
    parent,
    "Paint / thermal panel",
    0,
    y,
    0,
  );
  return o;
}
function marking(parent, text, w, h, x, y, z, rotation = 0) {
  if (typeof document === "undefined") return;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, 256, 128);
  ctx.fillStyle = "#212a31";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 64);
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  const o = mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshStandardMaterial({
      map: tex,
      transparent: true,
      roughness: 0.8,
      side: T.DoubleSide,
    }),
    parent,
    "Marking",
    x,
    y,
    z,
  );
  o.rotation.y = rotation;
  return o;
}
function rcsQuad(parent, x, y, z, angle = 0) {
  const g = new T.Group();
  g.name = "RCS quad";
  g.position.set(x, y, z);
  g.rotation.y = angle;
  parent.add(g);
  box(g, 0.3, 0.45, 0.3, 0, 0, 0, M.silver);
  for (const [a, b, c, rot] of [
    [0, 0.1, 0.18, Math.PI / 2],
    [0, 0.1, -0.18, -Math.PI / 2],
    [0.18, -0.1, 0, 0],
    [-0.18, -0.1, 0, Math.PI],
  ]) {
    const e = bell(g, 0.11, 0.22, a, b, c, "RCS nozzle");
    e.rotation.z = rot;
  }
  return g;
}
export function createCSM() {
  const root = new T.Group();
  root.name = "CSM Odyssey";
  const sm = new T.Group();
  sm.name = "Service Module";
  root.add(sm);
  cylinder(sm, 1.95, 1.95, 7.5, -1.75, M.silver, "SM pressure structure");
  ring(sm, 1.96, 2, 0.07);
  ring(sm, 1.96, -5.5, 0.1);
  cylinder(sm, 1.45, 1.85, 0.6, -5.7, M.dark, "Aft heat shield");
  bell(sm, 1.12, 2.5, 0, -5.9, 0, "SPS");
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    panel(sm, 1.971, 6.9, -1.75, a, 0.024, M.dark);
    if (i % 2 === 0) panel(sm, 1.979, 4.9, -2, a + 0.1, 0.6, M.white);
  }
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    rcsQuad(sm, Math.sin(a) * 2.05, 0.85, Math.cos(a) * 2.05, a);
  }
  const damage = new T.Group();
  damage.name = "Damaged bay";
  damage.visible = false;
  sm.add(damage);
  panel(damage, 2.01, 5.3, -1.5, 0, 1.12, M.black);
  for (let i = 0; i < 7; i++) {
    const o = box(
      damage,
      0.25 + 0.1 * (i % 3),
      0.8 + (i % 3) * 0.65,
      0.35,
      Math.sin(i * 0.15) * 1.75,
      -3.4 + i * 0.6,
      1.65 + Math.cos(i) * 0.12,
      M.dark,
    );
    o.rotation.z = i * 0.35;
  }
  const antenna = new T.Group();
  antenna.position.set(1.8, -4, 1.0);
  sm.add(antenna);
  strut(antenna, [0, 0, 0], [2, -0.7, 1], 0.055);
  for (let i = 0; i < 4; i++) {
    const o = mesh(
      new T.SphereGeometry(0.42, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.35),
      M.silver,
      antenna,
      "High-gain antenna dish",
      1.9 + (i % 2) * 0.75,
      -0.7 + Math.floor(i / 2) * 0.75,
      1,
    );
    o.rotation.x = Math.PI / 2;
  }
  const cm = new T.Group();
  cm.name = "Command Module";
  root.add(cm);
  cylinder(cm, 0.4, 1.96, 3.25, 3.65, M.silver, "Crew capsule");
  cylinder(cm, 1.97, 1.87, 0.26, 1.97, M.dark, "Ablative heat shield");
  cylinder(cm, 0.36, 0.4, 0.42, 5.48, M.dark, "Docking tunnel");
  cylinder(cm, 0.24, 0.34, 0.28, 5.82, M.silver, "Docking probe");
  for (const [x, z, a] of [
    [-0.65, 1.15, -0.2],
    [0.65, 1.15, 0.2],
  ]) {
    const o = box(cm, 0.52, 0.43, 0.045, x, 3.9, z, M.window, "Crew window");
    o.rotation.x = -0.36;
    o.rotation.y = a;
  }
  const hatch = box(cm, 0.65, 0.9, 0.07, 0, 3.0, 1.55, M.dark, "Hatch");
  hatch.rotation.x = -0.45;
  box(hatch, 0.57, 0.8, 0.025, 0, 0, 0.055, M.silver);
  marking(sm, "UNITED STATES", 1.4, 0.7, 0, 0.1, 1.99);
  return root;
}
export function createLM({ deployed = false } = {}) {
  const root = new T.Group();
  root.name = "LM Aquarius";
  const descent = new T.Group();
  descent.name = "Descent stage";
  root.add(descent);
  cylinder(descent, 2.12, 2.12, 2.5, -1.5, M.gold, "Octagonal descent body", 8);
  cylinder(descent, 1.9, 1.9, 0.14, -0.18, M.black, "Top insulation", 8);
  bell(descent, 0.75, 1.5, 0, -2.5, 0, "DPS");
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const p = box(
      descent,
      1.4,
      2.3,
      0.07,
      Math.sin(a) * 1.99,
      -1.5,
      Math.cos(a) * 1.99,
      i % 2 ? M.foil : M.gold,
      "Foil panel",
    );
    p.rotation.y = a;
    for (let j = 0; j < 4; j++)
      strut(
        descent,
        [Math.sin(a - 0.1) * 2.03, -2.5 + j * 0.52, Math.cos(a - 0.1) * 2.03],
        [Math.sin(a + 0.2) * 2.03, -2.25 + j * 0.52, Math.cos(a + 0.2) * 2.03],
        0.016,
        M.foil,
      );
  }
  const ascent = new T.Group();
  ascent.name = "Ascent stage";
  root.add(ascent);
  const cabin = mesh(
    new T.IcosahedronGeometry(1.9, 0),
    M.silver,
    ascent,
    "Faceted cabin",
    0,
    1.35,
    0,
  );
  cabin.scale.set(1.1, 1.05, 0.83);
  box(ascent, 2.5, 2, 1.5, 0, 1.2, -0.75, M.dark, "Equipment bay");
  cylinder(ascent, 0.54, 0.54, 0.55, 3.05, M.silver, "Docking collar");
  ring(ascent, 0.57, 3.3, 0.07);
  for (const side of [-1, 1]) {
    const tank = mesh(
      new T.SphereGeometry(0.61, 16, 12),
      M.silver,
      ascent,
      "Propellant tank",
      side * 1.8,
      0.8,
      -0.25,
    );
    tank.scale.set(0.8, 1.4, 0.9);
    const shape = new T.Shape();
    shape.moveTo(-0.43, -0.2);
    shape.lineTo(0.45, -0.2);
    shape.lineTo(side * 0.24, 0.5);
    shape.closePath();
    const win = mesh(
      new T.ShapeGeometry(shape),
      M.window,
      ascent,
      "Triangular window",
      side * 0.64,
      1.9,
      1.29,
    );
    win.rotation.x = -0.12;
    rcsQuad(ascent, side * 2, 1.2, 0.5, (side * Math.PI) / 2);
  }
  box(ascent, 0.7, 0.85, 0.07, 0, 0.57, 1.35, M.dark, "Forward hatch");
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const leg = new T.Group();
    leg.name = "Landing leg";
    root.add(leg);
    const out = [
      Math.sin(a) * (deployed ? 4.0 : 2.6),
      deployed ? -3.35 : -2.4,
      Math.cos(a) * (deployed ? 4.0 : 2.6),
    ];
    strut(
      leg,
      [Math.sin(a) * 1.6, -0.25, Math.cos(a) * 1.6],
      out,
      0.065,
      M.gold,
    );
    strut(
      leg,
      [Math.sin(a - 0.45) * 1.7, -2.1, Math.cos(a - 0.45) * 1.7],
      out,
      0.045,
      M.silver,
    );
    strut(
      leg,
      [Math.sin(a + 0.45) * 1.7, -2.1, Math.cos(a + 0.45) * 1.7],
      out,
      0.045,
      M.silver,
    );
    const pad = cylinder(
      leg,
      0.5,
      0.55,
      0.12,
      deployed ? -3.4 : -2.4,
      M.gold,
      "Footpad",
      24,
    );
    pad.position.x = out[0];
    pad.position.z = out[2];
  }
  strut(ascent, [0.7, 2.1, 0], [1.15, 4.1, 0], 0.025);
  const dish = mesh(
    new T.SphereGeometry(0.6, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.38),
    M.silver,
    ascent,
    "Rendezvous radar",
    1.15,
    4.12,
    0,
  );
  dish.rotation.z = 0.6;
  strut(ascent, [-0.8, 2.5, -0.3], [-1.7, 3.8, -0.4], 0.022);
  marking(descent, "UNITED STATES", 1.7, 0.65, 0, -1.1, 2.14);
  return root;
}
export function createSaturn() {
  const root = new T.Group();
  root.name = "Saturn V AS-508";
  const first = new T.Group();
  first.name = "S-IC";
  root.add(first);
  cylinder(first, 5.05, 5.05, 37, 22.5, M.white, "S-IC tank");
  cylinder(first, 5.05, 5.05, 4, 2, M.dark, "Thrust structure");
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    panel(first, 5.065, 10, 31, a, 0.6);
    panel(first, 5.067, 12, 10, a, 0.85);
    const fin = box(
      first,
      0.28,
      5,
      5,
      Math.sin(a) * 5.2,
      3,
      Math.cos(a) * 5.2,
      M.white,
      "Stabilizing fin",
    );
    fin.rotation.y = a;
  }
  for (const [x, z] of [
    [0, 0],
    [2.7, 2.7],
    [-2.7, 2.7],
    [2.7, -2.7],
    [-2.7, -2.7],
  ])
    bell(first, 1.7, 3.7, x, 2.8, z, "F-1");
  for (const y of [4, 16, 28, 41]) ring(first, 5.07, y, 0.09);
  marking(first, "U S A", 4, 5, 0, 23, 5.08);
  const second = new T.Group();
  second.name = "S-II";
  root.add(second);
  cylinder(second, 5.05, 5.05, 24.8, 54.1, M.white, "S-II tank");
  cylinder(second, 5.04, 5.04, 3, 42.2, M.dark, "S-II interstage");
  for (let i = 0; i < 8; i++)
    panel(second, 5.07, 4, 64.5, (i * Math.PI) / 4, 0.26);
  for (const [x, z] of [
    [0, 0],
    [2, 2],
    [-2, 2],
    [2, -2],
    [-2, -2],
  ])
    bell(second, 1.03, 2.8, x, 42.4, z, "J-2");
  for (const y of [44, 48, 61, 66.5]) ring(second, 5.06, y, 0.07);
  const third = new T.Group();
  third.name = "S-IVB";
  root.add(third);
  cylinder(third, 3.3, 5.05, 5, 69, M.white, "Interstage transition");
  cylinder(third, 3.3, 3.3, 12.6, 77.8, M.white, "S-IVB tank");
  for (let i = 0; i < 6; i++)
    panel(third, 3.32, 3.3, 81.7, (i * Math.PI) / 3, 0.46);
  bell(third, 1.05, 2.8, 0, 72, 0, "J-2");
  ring(third, 3.32, 84, 0.08);
  cylinder(third, 3.31, 3.31, 1.0, 84.6, M.dark, "Instrument Unit");
  const spacecraft = new T.Group();
  spacecraft.name = "Spacecraft";
  root.add(spacecraft);
  cylinder(spacecraft, 1.96, 3.3, 8.5, 89.35, M.white, "Spacecraft LM adapter");
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    strut(
      spacecraft,
      [Math.sin(a) * 3.3, 85.1, Math.cos(a) * 3.3],
      [Math.sin(a) * 1.96, 93.6, Math.cos(a) * 1.96],
      0.025,
      M.dark,
    );
  }
  const csm = createCSM();
  csm.position.y = 99.1;
  spacecraft.add(csm);
  const escape = new T.Group();
  escape.name = "Launch Escape System";
  root.add(escape);
  cylinder(escape, 0.58, 0.58, 4.6, 111.4, M.white, "Escape motor");
  cylinder(escape, 0, 0.58, 1.3, 114.35, M.white, "Nose cone");
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    strut(
      escape,
      [Math.sin(a) * 1.2, 104.6, Math.cos(a) * 1.2],
      [Math.sin(a) * 0.5, 109.3, Math.cos(a) * 0.5],
      0.075,
      M.white,
    );
    bell(
      escape,
      0.18,
      0.8,
      Math.sin(a) * 0.5,
      109.2,
      Math.cos(a) * 0.5,
      "Escape nozzle",
    );
  }
  return root;
}
export function createParachutes() {
  const g = new T.Group();
  g.name = "Main parachutes";
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3,
      x = Math.sin(a) * 5.6,
      z = Math.cos(a) * 5.6;
    const canopy = new T.Group();
    canopy.position.set(x, 20 + (i === 0 ? 0.8 : 0), z);
    g.add(canopy);
    for (let j = 0; j < 20; j++) {
      const geom = new T.SphereGeometry(
        5,
        5,
        12,
        (j * Math.PI) / 10,
        Math.PI / 10,
        0,
        Math.PI * 0.48,
      );
      const panel = mesh(
        geom,
        j % 2 ? M.orange : M.fabric,
        canopy,
        "Canopy gore",
      );
      panel.scale.y = 0.48;
    }
    for (let j = 0; j < 12; j++) {
      const b = (j * Math.PI) / 6;
      strut(
        g,
        [x + Math.sin(b) * 4.95, 20, z + Math.cos(b) * 4.95],
        [0, 5.6, 0],
        0.013,
        M.white,
      );
    }
  }
  return g;
}
export function createPlume(radius, length, color = 0x77cfff) {
  const g = new T.Group();
  for (let i = 0; i < 3; i++) {
    const m = new T.MeshBasicMaterial({
      color: i === 0 ? 0xfff3cb : color,
      transparent: true,
      opacity: i === 0 ? 0.85 : 0.18,
      depthWrite: false,
      blending: T.AdditiveBlending,
      side: T.DoubleSide,
    });
    const o = mesh(
      new T.ConeGeometry(
        radius * (1 + i * 0.22),
        length * (1 + i * 0.15),
        24,
        1,
        true,
      ),
      m,
      g,
      "Engine exhaust",
      0,
      -length * (0.5 + i * 0.05),
      0,
    );
  }
  return g;
}
export const materials = M;
