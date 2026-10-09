import * as T from "three";
import { assetURL } from "./assets.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  createSaturn,
  createCSM,
  createLM,
  createParachutes,
  createPlume,
  materials,
} from "./vehicles.js";
import { END_TIME, rcsActivity } from "./mission.js";
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function makeEarthTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#143c62";
  ctx.fillRect(0, 0, 2048, 1024);
  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  fetch(assetURL("land.geojson"))
    .then((r) => {
      if (!r.ok) throw Error("Earth map unavailable");
      return r.json();
    })
    .then((geo) => {
      ctx.fillStyle = "#61766a";
      for (const f of geo.features) {
        const polys =
          f.geometry.type === "MultiPolygon"
            ? f.geometry.coordinates
            : [f.geometry.coordinates];
        for (const poly of polys) {
          ctx.beginPath();
          for (const ring of poly) {
            ring.forEach(([lon, lat], i) => {
              const x = ((lon + 180) / 360) * 2048,
                y = ((90 - lat) / 180) * 1024;
              i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            });
            ctx.closePath();
          }
          ctx.fill("evenodd");
        }
      }
      ctx.fillStyle = "rgba(230,240,239,.82)";
      ctx.fillRect(0, 0, 2048, 22);
      ctx.fillRect(0, 986, 2048, 38);
      tex.needsUpdate = true;
    })
    .catch(() => {});
  return tex;
}
function makeCloudTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext("2d"),
    rand = seeded(131);
  for (let i = 0; i < 1600; i++) {
    const x = rand() * 1024,
      y = rand() * 512,
      r = rand() * 28 + 4;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rand() * Math.PI);
    ctx.scale(3, 0.6);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, `rgba(230,241,247,${rand() * 0.25})`);
    g.addColorStop(1, "rgba(230,241,247,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }
  return new T.CanvasTexture(c);
}
function earth(texture, clouds, radius) {
  const g = new T.Group();
  const globe = new T.Mesh(
    new T.SphereGeometry(radius, 64, 48),
    new T.MeshStandardMaterial({
      map: texture,
      roughness: 0.83,
      metalness: 0.06,
    }),
  );
  g.add(globe);
  const cloud = new T.Mesh(
    new T.SphereGeometry(radius * 1.008, 64, 40),
    new T.MeshStandardMaterial({
      map: clouds,
      transparent: true,
      opacity: 0.66,
      depthWrite: false,
      roughness: 1,
    }),
  );
  g.add(cloud);
  const glow = new T.Mesh(
    new T.SphereGeometry(radius * 1.03, 48, 32),
    new T.ShaderMaterial({
      transparent: true,
      side: T.BackSide,
      depthWrite: false,
      blending: T.AdditiveBlending,
      vertexShader:
        "varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}",
      fragmentShader:
        "varying vec3 n; varying vec3 v; void main(){float a=pow(1.-abs(dot(n,v)),3.);gl_FragColor=vec4(.12,.42,.85,a*.5);}",
    }),
  );
  g.add(glow);
  return g;
}
function moon(radius) {
  const rand = seeded(13);
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#8b9195";
  ctx.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 1400; i++) {
    const x = rand() * 1024,
      y = rand() * 512,
      r = rand() ** 3 * 32 + 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(35,42,49,${0.07 + rand() * 0.16})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + r * 0.06, y + r * 0.1, r * 0.88, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(219,222,216,.17)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  return new T.Mesh(
    new T.SphereGeometry(radius, 48, 32),
    new T.MeshStandardMaterial({ map: tex, roughness: 1 }),
  );
}
export class FlightScene {
  constructor(container, onError) {
    this.container = container;
    this.view = "flight";
    this.current = null;
    this.focusId = null;
    this.showVectors = true;
    this.autoRotate = false;
    this.lastVehicle = null;
    this.scene = new T.Scene();
    this.camera = new T.PerspectiveCamera(40, 1, 0.1, 6000);
    try {
      this.renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (e) {
      onError(e);
      return;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    this.renderer.setClearColor(0x071019, 0);
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.prepend(this.renderer.domElement);
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D Apollo spacecraft. Drag to orbit, scroll to zoom.",
    );
    this.renderer.domElement.setAttribute("role", "img");
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 450;
    this.controls.autoRotateSpeed = 0.55;
    this.scene.add(new T.HemisphereLight(0xb8d8ef, 0x273340, 2.1));
    const sun = new T.DirectionalLight(0xfff1d7, 3.7);
    sun.position.set(-80, 110, 70);
    this.scene.add(sun);
    const rim = new T.DirectionalLight(0x539adb, 2);
    rim.position.set(70, 20, -90);
    this.scene.add(rim);
    const rand = seeded(130713),
      positions = [];
    for (let i = 0; i < 2300; i++) {
      const v = new T.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5)
        .normalize()
        .multiplyScalar(2000);
      positions.push(...v.toArray());
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    this.stars = new T.Points(
      geo,
      new T.PointsMaterial({
        color: 0xd8e7f1,
        size: 1.9,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true,
      }),
    );
    this.scene.add(this.stars);
    this.flight = new T.Group();
    this.scene.add(this.flight);
    this.saturn = createSaturn();
    this.flight.add(this.saturn);
    this.docked = new T.Group();
    this.csm = createCSM();
    this.lm = createLM();
    this.lm.rotation.z = Math.PI;
    this.lm.position.y = 9.3;
    this.docked.add(this.csm, this.lm);
    this.flight.add(this.docked);
    this.chutes = createParachutes();
    this.csm.add(this.chutes);
    this.chutes.visible = false;
    this.detachedSM = createCSM();
    this.detachedSM.getObjectByName("Command Module").visible = false;
    this.detachedSM.getObjectByName("Damaged bay").visible = true;
    this.flight.add(this.detachedSM);
    this.flames = [];
    for (const stageName of ["S-IC", "S-II", "S-IVB"]) {
      const stage = this.saturn.getObjectByName(stageName);
      const bells = stage.children.filter((o) =>
        ["F-1", "J-2"].includes(o.name),
      );
      bells.forEach((bell, i) => {
        const p = createPlume(
          stageName === "S-IC" ? 1.8 : 0.95,
          stageName === "S-IC" ? 45 : 20,
          stageName === "S-IC" ? 0xff8039 : 0x72b8ff,
        );
        p.position.copy(bell.position);
        p.position.y -= stageName === "S-IC" ? 3.7 : 2.8;
        stage.add(p);
        this.flames.push({ p, stage: stageName, index: i });
      });
    }
    this.spsFlame = createPlume(1.05, 10);
    this.spsFlame.position.y = -8.4;
    this.csm.add(this.spsFlame);
    this.dpsFlame = createPlume(0.72, 9, 0x88b9ff);
    this.dpsFlame.position.y = -4;
    this.lm.add(this.dpsFlame);
    this.rcsPlumes = new T.Group();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      const p = createPlume(0.07, 0.9, 0xbcefff);
      p.position.set(Math.sin(a) * 2.1, 0.8, Math.cos(a) * 2.1);
      p.rotation.z = Math.PI / 2;
      p.rotation.y = a;
      this.rcsPlumes.add(p);
    }
    this.csm.add(this.rcsPlumes);
    this.lmRcsPlumes = new T.Group();
    this.lmRcsPlumes.name = "LM RCS exhaust";
    for (const side of [-1, 1]) {
      const p = createPlume(0.09, 1.3, 0xbcefff);
      p.position.set(side * 2, 1.2, 0.5);
      this.lmRcsPlumes.add(p);
    }
    this.lm.add(this.lmRcsPlumes);
    this.earthTexture = makeEarthTexture();
    this.cloudTexture = makeCloudTexture();
    this.earthFlight = earth(this.earthTexture, this.cloudTexture, 85);
    this.earthFlight.position.set(-105, -65, -145);
    this.earthFlight.rotation.y = 2.5;
    this.scene.add(this.earthFlight);
    this.moonFlight = moon(34);
    this.moonFlight.position.set(62, 8, -130);
    this.scene.add(this.moonFlight);
    this.ground = new T.Mesh(
      new T.CircleGeometry(18000, 96),
      new T.MeshStandardMaterial({ color: 0x14272d, roughness: 1 }),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.scene.add(this.ground);
    this.tower = new T.Group();
    const towerMat = new T.MeshStandardMaterial({
      color: 0x8a463b,
      metalness: 0.5,
      roughness: 0.7,
    });
    for (let i = 0; i < 9; i++) {
      const beam = new T.Mesh(new T.BoxGeometry(10, 1, 12), towerMat);
      beam.position.y = i * 11;
      this.tower.add(beam);
    }
    for (const x of [-4.5, 4.5])
      for (const z of [-5.5, 5.5]) {
        const beam = new T.Mesh(new T.BoxGeometry(0.8, 90, 0.8), towerMat);
        beam.position.set(x, 44, z);
        this.tower.add(beam);
      }
    this.scene.add(this.tower);
    this.plasma = new T.Mesh(
      new T.SphereGeometry(3.1, 32, 24),
      new T.MeshBasicMaterial({
        color: 0xff7935,
        transparent: true,
        opacity: 0.2,
        blending: T.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.plasma.scale.set(1, 0.5, 1);
    this.plasma.position.y = 1.7;
    this.csm.add(this.plasma);
    this.vent = new T.Group();
    for (let i = 0; i < 22; i++) {
      const m = new T.Mesh(
        new T.SphereGeometry(0.13 + i * 0.028, 8, 6),
        new T.MeshBasicMaterial({
          color: 0xc3e3ed,
          transparent: true,
          opacity: 0.17 * (1 - i / 24),
          depthWrite: false,
        }),
      );
      m.position.set(i * 0.3, -1 - i * 0.07, 2 + i * 0.27);
      this.vent.add(m);
    }
    this.csm.add(this.vent);
    this.highlight = new T.BoxHelper(this.csm, 0x75dcdf);
    this.highlight.material.transparent = true;
    this.highlight.material.opacity = 0.5;
    this.scene.add(this.highlight);
    this.thrustArrow = new T.ArrowHelper(
      new T.Vector3(0, 1, 0),
      new T.Vector3(9, 0, 0),
      10,
      0x79d8dc,
      1.3,
      0.5,
    );
    this.flight.add(this.thrustArrow);
    this.buildMap();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.home();
    this.renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      onError(
        new Error("The 3D graphics context was lost. Reload to reconnect it."),
      );
    });
  }
  buildMap() {
    this.map = new T.Group();
    this.map.visible = false;
    this.scene.add(this.map);
    this.mapEarth = earth(this.earthTexture, this.cloudTexture, 7.2);
    this.mapEarth.position.set(-35, 0, 0);
    this.mapEarth.rotation.y = 2;
    this.map.add(this.mapEarth);
    this.mapMoon = moon(3.5);
    this.mapMoon.position.set(35, 0, 0);
    this.map.add(this.mapMoon);
    this.route = new T.CatmullRomCurve3([
      new T.Vector3(-34, 7, 0),
      new T.Vector3(-13, 14, -2),
      new T.Vector3(17, 12, 0),
      new T.Vector3(39, 5, 0),
      new T.Vector3(40, -4, 0),
      new T.Vector3(20, -12, 0),
      new T.Vector3(-13, -12, 0),
      new T.Vector3(-34, -6, 0),
    ]);
    for (const [from, to, color] of [
      [0, 0.52, 0xeeb06f],
      [0.52, 1, 0x81dfe1],
    ]) {
      const pts = [];
      for (let i = 0; i <= 120; i++)
        pts.push(this.route.getPoint(from + ((to - from) * i) / 120));
      const line = new T.Line(
        new T.BufferGeometry().setFromPoints(pts),
        new T.LineBasicMaterial({ color, transparent: true, opacity: 0.7 }),
      );
      this.map.add(line);
    }
    const orbit = [];
    for (let i = 0; i <= 100; i++) {
      const a = (i / 100) * Math.PI * 2;
      orbit.push(new T.Vector3(-35 + Math.sin(a) * 9, Math.cos(a) * 9, 0));
    }
    this.map.add(
      new T.Line(
        new T.BufferGeometry().setFromPoints(orbit),
        new T.LineBasicMaterial({
          color: 0x647f94,
          transparent: true,
          opacity: 0.5,
        }),
      ),
    );
    this.mapDot = new T.Mesh(
      new T.SphereGeometry(0.48, 16, 12),
      new T.MeshBasicMaterial({ color: 0xfff2d1 }),
    );
    this.map.add(this.mapDot);
    this.mapHalo = new T.Mesh(
      new T.SphereGeometry(0.9, 16, 12),
      new T.MeshBasicMaterial({
        color: 0x8fe5ec,
        transparent: true,
        opacity: 0.18,
      }),
    );
    this.map.add(this.mapHalo);
  }
  resize() {
    if (!this.renderer) return;
    const w = this.container.clientWidth,
      h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
  setView(view) {
    this.view = view;
    if (!this.renderer) return;
    this.map.visible = view === "map";
    this.flight.visible = view !== "map";
    this.home();
  }
  home() {
    if (!this.controls) return;
    if (this.view === "map") {
      this.camera.position.set(0, 4, 126);
      this.controls.target.set(0, 0, 0);
      this.controls.minDistance = 45;
      this.controls.maxDistance = 230;
    } else {
      const type = this.current?.vehicle ?? "saturn-v";
      const distance =
        type === "saturn-v"
          ? 184
          : type === "s-ii"
            ? 125
            : type === "s-ivb"
              ? 83
              : this.current?.parachutes
                ? 62
                : 39;
      this.camera.position.set(
        distance * 0.65,
        distance * 0.25,
        distance * 0.85,
      );
      this.controls.target.set(0, this.current?.parachutes ? 9 : 0, 0);
      this.controls.minDistance = type.includes("saturn") ? 55 : 8;
      this.controls.maxDistance = type.includes("saturn") ? 360 : 180;
    }
    this.controls.update();
  }
  zoom(factor) {
    if (!this.controls) return;
    const v = this.camera.position
      .clone()
      .sub(this.controls.target)
      .multiplyScalar(factor);
    v.clampLength(this.controls.minDistance, this.controls.maxDistance);
    this.camera.position.copy(this.controls.target).add(v);
    this.controls.update();
  }
  setFocus(id) {
    this.focusId = id;
  }
  update(s, realTime) {
    if (!this.renderer) return;
    const change =
      s.vehicle !== this.lastVehicle || s.parachutes !== this.lastChutes;
    this.current = s;
    this.scene.fog =
      s.time < 120 && this.view !== "map"
        ? new T.FogExp2(0x172b3b, 0.004)
        : null;
    if (change) {
      this.lastVehicle = s.vehicle;
      this.lastChutes = s.parachutes;
      this.home();
    }
    const rocket = ["saturn-v", "s-ii", "s-ivb"].includes(s.vehicle);
    this.saturn.visible = rocket;
    this.docked.visible = !rocket;
    this.saturn.position.y =
      s.vehicle === "saturn-v" ? -55 : s.vehicle === "s-ii" ? -77 : -91;
    this.saturn.rotation.z =
      s.time < 750 ? -Math.min(0.3, (s.time / 750) * 0.3) : -0.65;
    this.saturn.rotation.y = 0.1;
    const first = this.saturn.getObjectByName("S-IC"),
      second = this.saturn.getObjectByName("S-II");
    first.visible = s.time < 205;
    first.position.y = s.time >= 164 ? -(s.time - 164) * 1.1 : 0;
    first.position.x = s.time >= 164 ? -(s.time - 164) * 0.25 : 0;
    first.rotation.z = s.time >= 164 ? -(s.time - 164) * 0.012 : 0;
    second.visible = s.time < 634;
    second.position.y = s.time >= 593 ? -(s.time - 593) * 1.2 : 0;
    second.position.x = s.time >= 593 ? (s.time - 593) * 0.3 : 0;
    second.rotation.z = s.time >= 593 ? (s.time - 593) * 0.009 : 0;
    this.saturn.getObjectByName("Launch Escape System").visible = s.escapeTower;
    for (const { p, stage, index } of this.flames) {
      p.visible =
        (stage === "S-IC" && s.time < 164 && (s.time < 136 || index !== 0)) ||
        (stage === "S-II" &&
          s.time >= 164 &&
          s.time < 593 &&
          (s.time < 330 || index !== 0)) ||
        (stage === "S-IVB" &&
          ((s.time >= 593 && s.time < 750) ||
            (s.time >= 9346 && s.time < 9697)));
      p.scale.y = 0.93 + Math.sin(s.time * 18 + index) * 0.07;
    }
    this.docked.rotation.set(
      0.12,
      Math.sin(s.time / 1200) * 0.14,
      -Math.PI / 2 + 0.15,
    );
    this.docked.position.set(0, -2, 0);
    this.csm.rotation.z = 0;
    this.csm.position.set(0, 0, 0);
    this.lm.position.set(0, 9.3, 0);
    this.lm.rotation.set(0, 0, Math.PI);
    this.lm.visible = s.time < 509470;
    this.csm.getObjectByName("Service Module").visible = s.time < 496908;
    this.csm.getObjectByName("Damaged bay").visible = s.damaged;
    if (s.vehicle === "docking") {
      const q = clamp((s.time - 11040) / 2460, 0, 1);
      this.csm.rotation.z = Math.PI * (1 - clamp(q / 0.6, 0, 1));
      this.csm.position.y = -6 * (1 - q);
      this.lm.position.y = 10.5;
    }
    if (s.time >= 509400 && s.time < 509470) {
      this.lm.position.y += ((s.time - 509400) / 70) * 28;
      this.lm.position.x += (s.time - 509400) * 0.07;
      this.lm.rotation.z += Math.min(1, (s.time - 509400) * 0.013);
    }
    if (s.vehicle === "cm") {
      this.docked.rotation.z = s.parachutes ? 0 : 0.5;
      this.docked.position.y = s.parachutes ? -6 : -2;
    }
    this.detachedSM.visible = s.time >= 496908 && s.time < 497800;
    this.detachedSM.position.set(
      -8 - clamp((s.time - 496908) / 80, 0, 20),
      -7,
      5,
    );
    this.detachedSM.rotation.set(0.3, 0.2, -1.8);
    this.spsFlame.visible = s.engine === "SPS";
    this.dpsFlame.visible = s.engine.includes("DPS");
    this.dpsFlame.scale.set(1, 0.4 + s.throttle * 0.7, 1);
    const rcs = rcsActivity(s, this.focusId);
    this.rcsPlumes.visible = !rocket && rcs.csm;
    this.lmRcsPlumes.visible = !rocket && rcs.lm;
    this.vent.visible = s.damaged && s.time < 496908;
    this.vent.rotation.y = Math.sin(s.time * 0.1) * 0.03;
    this.plasma.visible = s.entry;
    this.plasma.material.opacity = 0.19 + Math.sin(s.time * 2) * 0.025;
    this.chutes.visible = s.parachutes;
    this.ground.visible = this.view !== "map" && (s.time < 120 || s.parachutes);
    this.ground.position.y = s.parachutes
      ? s.splashdown
        ? -6
        : -Math.max(26, s.altitude * 10 + 20)
      : -56 - s.altitude * 1000;
    this.ground.material.color.set(s.parachutes ? 0x102a3b : 0x14272d);
    this.tower.visible = this.view !== "map" && s.time < 35;
    this.tower.position.set(-24, -56 - s.altitude * 1000, -6);
    this.earthFlight.visible =
      this.view !== "map" && s.time > 120 && !s.parachutes;
    this.moonFlight.visible = this.view !== "map" && s.moonNear;
    this.stars.material.opacity = s.time < 120 ? 0.04 : 0.7;
    if (this.view === "map") {
      let p;
      if (s.time < 9346) {
        const a = (s.time / 5200) * Math.PI * 2;
        p = new T.Vector3(-35 + Math.sin(a) * 9, Math.cos(a) * 9, 0);
      } else {
        let u =
          s.time < 278000
            ? ((s.time - 9346) / (278000 - 9346)) * 0.51
            : 0.51 + ((s.time - 278000) / (END_TIME - 278000)) * 0.49;
        p = this.route.getPoint(clamp(u, 0, 1));
      }
      this.mapDot.position.copy(p);
      this.mapHalo.position.copy(p);
      this.mapHalo.scale.setScalar(1 + Math.sin(realTime * 2) * 0.14);
    }
    this.highlight.visible =
      this.view !== "map" &&
      !!this.focusId &&
      !["coast", "manual", "accident", "chutes", "separation"].includes(
        this.focusId,
      );
    if (this.highlight.visible) {
      let target = rocket
        ? this.saturn.getObjectByName("Spacecraft")
        : this.focusId.startsWith("lm") ||
            ["ignition", "cutoff"].includes(this.focusId)
          ? this.lm
          : this.csm;
      if (["ignition", "cutoff"].includes(this.focusId))
        target = this.lm.getObjectByName("DPS");
      if (this.focusId === "cm-burn") target = this.csm.getObjectByName("SPS");
      if (this.focusId.startsWith("entry"))
        target = this.csm.getObjectByName("Command Module");
      target.updateWorldMatrix(true, true);
      this.highlight.setFromObject(target);
    }
    this.thrustArrow.visible =
      this.showVectors && this.view !== "map" && s.throttle > 0;
    this.thrustArrow.position.set(rocket ? 12 : 8, -5, 0);
    this.thrustArrow.setLength(rocket ? 24 : 9, rocket ? 2 : 1, 0.5);
    this.thrustArrow.setDirection(
      rocket
        ? new T.Vector3(0.2, 1, 0).normalize()
        : s.engine.includes("DPS")
          ? new T.Vector3(-1, 0.15, 0).normalize()
          : new T.Vector3(1, -0.15, 0).normalize(),
    );
    this.controls.autoRotate = this.autoRotate;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    this.resizeObserver?.disconnect();
    this.controls?.dispose();
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) {
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          m.dispose();
      }
    });
    this.renderer?.dispose();
  }
}
