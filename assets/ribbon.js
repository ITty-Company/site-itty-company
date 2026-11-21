/* ITty «Стрічка» — one iridescent violet chrome ribbon for the whole site (three.js r170, local).
   Controller: set({head, tail, x, y, z, rx, ry, rz, s, spin, show}) — values are lerped (silk, .06–.1). */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createRibbon(canvas, { mobile = false } = {}) {
  const R = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  R.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
  R.outputColorSpace = THREE.SRGBColorSpace;
  const S = new THREE.Scene();
  const C = new THREE.PerspectiveCamera(35, 1, .1, 100); C.position.set(0, 0, 9);
  const pm = new THREE.PMREMGenerator(R);
  S.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  const lime = new THREE.PointLight(0xC6F23A, 30, 30); lime.position.set(4, 3, 3); S.add(lime);
  const vio = new THREE.PointLight(0xB79CFF, 40, 30); vio.position.set(-4, -2, 4); S.add(vio);
  S.add(new THREE.AmbientLight(0xffffff, .25));

  // ribbon geometry: flat band along a CatmullRom curve, with twist
  const pts = [[-9, -3.2, -1], [-5.5, -1.2, 1.2], [-2.2, -2.4, .4], [0, .2, -.6], [2.4, -.4, 1.2], [4.6, 1.8, .2], [7, 1.2, -1], [10, 3.2, .4]]
    .map(p => new THREE.Vector3(...p));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .5);
  const N = 420, W = .62, TW = 2.2;
  const pos = new Float32Array((N + 1) * 2 * 3), nor = new Float32Array((N + 1) * 2 * 3), uv = new Float32Array((N + 1) * 2 * 2);
  const frames = curve.computeFrenetFrames(N, false);
  const up = new THREE.Vector3(), tmp = new THREE.Vector3();
  for (let i = 0; i <= N; i++) {
    const t = i / N, p = curve.getPointAt(t), T = frames.tangents[i];
    const a = Math.sin(t * Math.PI * TW) * 1.25 + t * 2.2;
    up.copy(frames.normals[i]).applyAxisAngle(T, a);
    const w = W * (.55 + .45 * Math.sin(Math.PI * Math.min(1, t * 1.1)));
    for (let s = 0; s < 2; s++) {
      tmp.copy(p).addScaledVector(up, (s ? 1 : -1) * w / 2);
      const k = (i * 2 + s);
      pos.set([tmp.x, tmp.y, tmp.z], k * 3);
      const n = new THREE.Vector3().crossVectors(T, up).normalize();
      nor.set([n.x, n.y, n.z], k * 3);
      uv.set([t, s], k * 2);
    }
  }
  const idx = [];
  for (let i = 0; i < N; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x7a3ff0, metalness: 1, roughness: .16, clearcoat: 1, clearcoatRoughness: .1,
    iridescence: .7, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 720], envMapIntensity: 1.35, side: THREE.DoubleSide,
    sheen: .6, sheenColor: new THREE.Color(0xB79CFF),
  });
  const mesh = new THREE.Mesh(geo, mat);
  const grp = new THREE.Group(); grp.add(mesh); S.add(grp);

  const cur = { head: 0, tail: 0, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, spin: 0 };
  const tgt = { ...cur };
  let show = false, vis = true, raf = 0, last = 0;
  const size = () => { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); C.aspect = w / h; C.fov = w / h < .8 ? 52 : 35; C.updateProjectionMatrix(); };
  size(); addEventListener('resize', size);
  document.addEventListener('visibilitychange', () => { vis = !document.hidden; if (vis) loop(); });

  function loop(t = performance.now()) {
    cancelAnimationFrame(raf);
    if (!vis) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(50, t - last); last = t;
    const k = 1 - Math.pow(1 - .085, dt / 16.7);
    for (const key in tgt) cur[key] += (tgt[key] - cur[key]) * (key === 'head' || key === 'tail' ? Math.min(1, k * 1.6) : k);
    const on = show && cur.head - cur.tail > .004;
    canvas.classList.toggle('on', show);
    if (!on && !show) return;
    const a = Math.max(0, Math.min(1, cur.tail)), b = Math.max(0, Math.min(1, cur.head));
    const s0 = Math.floor(a * N), s1 = Math.ceil(b * N);
    geo.setDrawRange(s0 * 6, Math.max(0, s1 - s0) * 6);
    grp.position.set(cur.x, cur.y, cur.z); grp.rotation.set(cur.rx, cur.ry, cur.rz); grp.scale.setScalar(cur.s);
    mesh.rotation.x = Math.sin(t / 2600) * .08 + cur.spin;
    lime.position.x = 4 + Math.sin(t / 1800) * 2;
    R.render(S, C);
  }
  loop();
  return {
    set(o) { if ('show' in o) show = !!o.show; for (const k in o) if (k in tgt) tgt[k] = o[k]; },
    jump(o) { for (const k in o) if (k in cur) { cur[k] = o[k]; tgt[k] = o[k]; } },
    get state() { return { ...tgt, show }; },
  };
}
