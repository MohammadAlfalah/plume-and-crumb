/* =============================================================================
   Plume & Crumb — 3D hero ("weightless patisserie"), high-fidelity rebuild
   A warm, glossy, artisan-baked form floats in soft studio light. Rendered with
   physically-based materials + image-based lighting (real reflections), a smooth
   high-detail surface with baked lamination + crust texture, and a tasteful bloom
   for the "in-the-light" glow. Flour/berry/chocolate motes drift up; light beams
   fall behind it. It drifts, shrinks, and warms toward golden hour as you scroll.

   Still engineered to stay smooth and never break the page:
     - one mesh + one Points field + ≤2 planes; env map is precomputed once
     - pauses when hidden; FPS sampler auto-downgrades (drops bloom, lowers DPR)
     - drag-to-orbit on desktop only (never traps touch scroll)
     - falls back to a static image with no WebGL; calm single pose for reduced-motion
   Set window.PNC.hero.model to a .glb to swap the procedural pastry for a real one.
   ============================================================================= */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ---- tiny CPU value-noise + fbm, used to sculpt + texture the pastry ---- */
function hash(x, y, z) { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); }
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const g = (a, b, c) => hash(xi + a, yi + b, zi + c);
  const x00 = g(0, 0, 0) * (1 - u) + g(1, 0, 0) * u, x10 = g(0, 1, 0) * (1 - u) + g(1, 1, 0) * u;
  const x01 = g(0, 0, 1) * (1 - u) + g(1, 0, 1) * u, x11 = g(0, 1, 1) * (1 - u) + g(1, 1, 1) * u;
  const y0 = x00 * (1 - v) + x10 * v, y1 = x01 * (1 - v) + x11 * v;
  return (y0 * (1 - w) + y1 * w) * 2 - 1;
}
function fbm(x, y, z) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { s += a * vnoise(x * f, y * f, z * f); f *= 2; a *= 0.5; } return s; }

function buildPastry(THREE, detail) {
  const geo = new THREE.IcosahedronGeometry(1.5, detail);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  const cRidge = new THREE.Color(0xE8A85C), cGroove = new THREE.Color(0x6E3713), tmp = new THREE.Color();
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i); n.copy(v).normalize();
    const layers = Math.sin(n.y * 13.0);                 // lamination bands
    const lumps = fbm(n.x * 1.6, n.y * 1.6, n.z * 1.6);  // hand-shaped form
    const cleft = Math.pow(Math.max(0, n.y), 2) * Math.sin(Math.atan2(n.z, n.x) * 5.0) * 0.5; // top character
    const flake = fbm(n.x * 7.0, n.y * 7.0, n.z * 7.0) * 0.5; // crust micro
    const disp = 0.085 * Math.max(0, layers) + 0.14 * lumps + 0.05 * flake + 0.05 * cleft;
    v.addScaledVector(n, disp);
    pos.setXYZ(i, v.x, v.y, v.z);
    const t = THREE.MathUtils.clamp(0.5 + 0.5 * layers + lumps * 0.35 + flake * 0.2, 0, 1);
    tmp.copy(cGroove).lerp(cRidge, t);
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();   // smooth normals → no facets
  return geo;
}

function crustRoughness(THREE) {
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
  const x = c.getContext('2d'), img = x.createImageData(s, s), d = img.data;
  for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) {
    const nv = (fbm(i / 20, j / 20, 3.3) + 1) / 2;
    const val = Math.floor(135 + nv * 95);
    const k = (j * s + i) * 4; d[k] = d[k + 1] = d[k + 2] = val; d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t;
}

function softSprite(THREE) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.beginPath(); x.arc(32, 32, 32, 0, 6.2832); x.fill();
  return new THREE.CanvasTexture(c);
}

export function initHero() {
  const backdrop = document.querySelector('.backdrop');
  const canvas = document.getElementById('bgCanvas');
  if (!canvas || !backdrop) return false;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  let mobile = window.innerWidth < 760 || touch;

  const webglOK = (() => {
    try { const t = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (t.getContext('webgl2') || t.getContext('webgl'))); }
    catch { return false; }
  })();
  if (!webglOK) { backdrop.classList.add('is-static'); return false; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !mobile, powerPreference: 'high-performance' });
  } catch { backdrop.classList.add('is-static'); return false; }

  const W = () => window.innerWidth, H = () => window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, mobile ? 2 : 2.5);   // crisp on phones too
  renderer.setPixelRatio(dpr);
  renderer.setSize(W(), H());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, W() / H(), 0.1, 100);
  camera.position.set(0, 0, 6);

  // ---- image-based lighting (the big quality lever: real reflections) ----
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // warm key + soft fill (on top of the env)
  const keyBase = new THREE.Color(0xFFE6B8), keyGold = new THREE.Color(0xF6B26B);
  const key = new THREE.DirectionalLight(0xFFE6B8, 2.1); key.position.set(4, 6, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xFFF1DD, 0.5); fill.position.set(-5, 1, -3); scene.add(fill);

  // ---- the pastry: PBR + baked colour + crust roughness ----
  const pastry = new THREE.Group(); scene.add(pastry);
  const detail = reduced ? 5 : 6;   // full detail on phones too (smooth normals; FPS sampler protects low-end)
  const mat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.52, metalness: 0.0,
    roughnessMap: crustRoughness(THREE),
    clearcoat: 0.5, clearcoatRoughness: 0.38,                 // glaze sheen
    sheen: 0.6, sheenColor: new THREE.Color(0xFFE2AC), sheenRoughness: 0.65,
    emissive: new THREE.Color(0x40220c), emissiveIntensity: 0.14,
    envMapIntensity: 1.15,
  });
  const mesh = new THREE.Mesh(buildPastry(THREE, detail), mat);
  pastry.add(mesh);

  // ---- light beams (fake volumetrics; glow nicely under bloom) ----
  const beams = [];
  if (!reduced && !saveData) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, 'rgba(255,247,232,0)'); g.addColorStop(0.5, 'rgba(255,238,200,0.5)'); g.addColorStop(1, 'rgba(255,247,232,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 256);
    const beamTex = new THREE.CanvasTexture(c);
    for (let i = 0; i < (mobile ? 1 : 2); i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 9),
        new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
      m.position.set(i === 0 ? -1.7 : 1.9, 0, -2.6); m.rotation.z = i === 0 ? 0.32 : -0.24;
      scene.add(m); beams.push(m);
    }
  }

  // ---- drifting motes ----
  let points = null, pSpeed = null, pPhase = null, pCount = reduced || saveData ? 0 : (mobile ? 40 : 120);
  const TOP = 5, BOT = -5;
  if (pCount) {
    const pos = new Float32Array(pCount * 3), col = new Float32Array(pCount * 3);
    pSpeed = new Float32Array(pCount); pPhase = new Float32Array(pCount);
    const flour = new THREE.Color(0xFFF6E6), berry = new THREE.Color(0xC24A57), choco = new THREE.Color(0x5A3A22);
    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * 5; pos[i * 3 + 1] = (Math.random() * 2 - 1) * 5; pos[i * 3 + 2] = (Math.random() * 2 - 1) * 2.2 - 0.5;
      const r = Math.random(), cc = r < 0.7 ? flour : (r < 0.85 ? berry : choco);
      col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b;
      pSpeed[i] = 0.15 + Math.random() * 0.35; pPhase[i] = Math.random() * 6.28;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    points = new THREE.Points(g, new THREE.PointsMaterial({ size: mobile ? 0.12 : 0.085, map: softSprite(THREE), vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, sizeAttenuation: true, toneMapped: false }));
    scene.add(points);
  }

  // ---- bloom (gated; the soft premium glow) ----
  let composer = null, bloom = null;
  const useBloom = !reduced && !saveData && !mobile;
  if (useBloom) {
    composer = new EffectComposer(renderer);
    composer.setPixelRatio(Math.min(dpr, 2));
    composer.setSize(W(), H());
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(W(), H()), 0.32, 0.5, 0.82);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }
  const render = () => (composer ? composer.render() : renderer.render(scene, camera));

  // ---- controls (desktop drag only) ----
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false; controls.enablePan = false; controls.enableRotate = !touch;
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.rotateSpeed = 0.55;
  controls.minPolarAngle = Math.PI * 0.32; controls.maxPolarAngle = Math.PI * 0.68;
  controls.autoRotate = !reduced; controls.autoRotateSpeed = 0.6;
  let lastInteract = 0;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  controls.addEventListener('end', () => { lastInteract = performance.now(); });
  const updatePointer = () => { canvas.style.pointerEvents = (!touch && window.scrollY < window.innerHeight * 0.85) ? 'auto' : 'none'; };
  updatePointer();

  // ---- scroll ----
  let scrollTarget = 0, scrollSmooth = 0;
  const readScroll = () => { const max = document.documentElement.scrollHeight - window.innerHeight; scrollTarget = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0; };
  window.addEventListener('scroll', () => { readScroll(); updatePointer(); }, { passive: true });
  readScroll();

  // ---- resize ----
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      mobile = window.innerWidth < 760 || touch;
      camera.aspect = W() / H(); camera.updateProjectionMatrix();
      renderer.setSize(W(), H()); if (composer) composer.setSize(W(), H());
    }, 150);
  });

  // ---- loop + pause + FPS auto-downgrade ----
  const clock = new THREE.Clock();
  let running = !document.hidden, rafId = 0, frames = 0, fpsT = performance.now(), downgraded = false;
  function downgrade() {
    downgraded = true;
    dpr = Math.min(dpr, 1.5); renderer.setPixelRatio(dpr);
    if (composer) { composer = null; }       // drop bloom first — biggest cost
    beams.forEach((b) => (b.visible = false));
    if (points) points.material.size *= 0.85;
    controls.autoRotateSpeed = 0.4;
  }
  function frame() {
    const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
    scrollSmooth += (scrollTarget - scrollSmooth) * 0.08;
    const p = scrollSmooth, warm = Math.min(1, p * 1.2);

    pastry.position.x = p * 2.2;
    pastry.position.y = Math.sin(t * 1.05) * 0.12 * (1 - p * 0.7) - p * 0.4;
    pastry.scale.setScalar(1 - p * 0.45);
    pastry.rotation.z = p * 0.3;
    mesh.rotation.y += dt * 0.12;            // gentle turn even with autorotate off
    key.color.copy(keyBase).lerp(keyGold, warm);
    mat.emissiveIntensity = 0.14 + warm * 0.10;
    mat.envMapIntensity = 1.15 + warm * 0.25;
    if (bloom) bloom.strength = 0.32 + warm * 0.12;

    if (!controls.autoRotate && !reduced && lastInteract && performance.now() - lastInteract > 4000) controls.autoRotate = true;
    controls.update();

    if (points) {
      const a = points.geometry.attributes.position, arr = a.array;
      for (let i = 0; i < pCount; i++) {
        arr[i * 3 + 1] += pSpeed[i] * dt; arr[i * 3] += Math.sin(t * 0.4 + pPhase[i]) * dt * 0.15;
        if (arr[i * 3 + 1] > TOP) { arr[i * 3 + 1] = BOT; arr[i * 3] = (Math.random() * 2 - 1) * 5; }
      }
      a.needsUpdate = true;
    }
    for (let i = 0; i < beams.length; i++) beams[i].material.opacity = 0.10 + 0.04 * Math.sin(t * 0.5 + i);

    render();

    frames++; const now = performance.now();
    if (now - fpsT > 2000) { const fps = (frames * 1000) / (now - fpsT); frames = 0; fpsT = now; if (!downgraded && fps < 38) downgrade(); }
  }
  function loop() { if (!running) return; frame(); rafId = requestAnimationFrame(loop); }
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running && !reduced) { clock.getDelta(); loop(); } });

  if (reduced) { pastry.rotation.set(0.2, -0.5, 0); render(); }
  else loop();

  // ---- optional real model ----
  const modelPath = window.PNC && window.PNC.hero && window.PNC.hero.model;
  if (modelPath && !reduced) {
    import('three/addons/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
      new GLTFLoader().load(modelPath, (g) => { mesh.visible = false; g.scene.scale.setScalar(1.5); pastry.add(g.scene); }, undefined, () => {});
    }).catch(() => {});
  }

  return true;
}
