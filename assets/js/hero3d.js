/* =============================================================================
   Plume & Crumb — 3D hero ("weightless patisserie")
   Three distinct, hand-baked-looking procedural pastries float in soft studio
   light: a laminated croissant, a fluted kouign-amann, and a spiral morning bun.
   PBR + image-based lighting, matte flaky crust (bump-mapped, uneven browning,
   crevice shading), a soft contact shadow grounding it, drifting motes, light
   beams, and a tasteful bloom. It drifts, shrinks, and warms toward golden hour
   as you scroll.

   Refined for a premium, edible feel: organic (non-symmetric) forms, a grounding
   contact shadow, calm/slow motion, and an elevated product-shot camera. Stays
   smooth and never breaks: env precomputed once; pauses when hidden; FPS sampler
   auto-downgrades; drag-orbit on desktop only; static fallback with no WebGL;
   calm pose for reduced-motion. Set window.PNC.hero.model to a .glb to swap in a
   real model. window.__setHeroPastry('croissant'|'bundt'|'bun') switches shape.
   ============================================================================= */

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

/* low-frequency global warp — nudges the whole form so it reads hand-shaped, not
   mathematically perfect. Re-normals + re-centers afterward. Subtle by design. */
function organicWarp(THREE, geo, amp) {
  amp = amp || 0.045;
  const pos = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const wx = fbm(v.x * 0.55 + 3.1, v.y * 0.55, v.z * 0.55);
    const wy = fbm(v.x * 0.55, v.y * 0.55 + 7.2, v.z * 0.55);
    const wz = fbm(v.x * 0.55, v.y * 0.55, v.z * 0.55 + 1.7);
    pos.setXYZ(i, v.x + wx * amp, v.y + wy * amp * 0.7, v.z + wz * amp);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals(); geo.computeBoundingSphere();
  const c = geo.boundingSphere.center; geo.translate(-c.x, -c.y, -c.z);
  return geo;
}

/* ---- the croissant: a tapered tube curled into a crescent, with rolled-segment
   ridges + a pinched seam underneath. Baked golden colour, darker grooves,
   browned tips, floury + over-baked patches. ---- */
function buildCroissant(THREE, lowQ) {
  const NU = lowQ ? 260 : 480, NV = lowQ ? 44 : 84;
  const Rc = 1.18, SPAN = 2.55, Rt = 0.56, NROLL = 7;
  const cRidge = new THREE.Color(0xE8A85C), cGroove = new THREE.Color(0x6E3713), cTip = new THREE.Color(0x7A3F18), cFlour = new THREE.Color(0xEAD6AE), tmp = new THREE.Color();
  const rowV = NV + 1, count = (NU + 1) * rowV;
  const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3), uvs = new Float32Array(count * 2);
  const P = new THREE.Vector3(), T = new THREE.Vector3(), Nrm = new THREE.Vector3(), B = new THREE.Vector3(0, 0, 1), off = new THREE.Vector3();
  let k = 0;
  for (let i = 0; i <= NU; i++) {
    const u = i / NU, a = (u - 0.5) * SPAN;
    P.set(Rc * Math.sin(a), Rc * Math.cos(a), 0);
    T.set(Math.cos(a), -Math.sin(a), 0).normalize();
    Nrm.copy(T).cross(B).normalize();
    const band = 0.5 + 0.5 * Math.cos(2 * Math.PI * u * NROLL), roll = Math.pow(band, 0.7);
    let rad = Rt * Math.pow(Math.sin(Math.PI * u), 0.6) + 0.02; rad *= 1 + 0.17 * roll;
    for (let j = 0; j <= NV; j++) {
      const v = (j / NV) * Math.PI * 2, cosv = Math.cos(v), sinv = Math.sin(v);
      const wrap = 0.5 + 0.5 * Math.cos(v * 2 + u * NROLL * 6.2832);
      const lam = 0.5 + 0.5 * Math.cos(u * NROLL * 12.566 + v);
      const nx = cosv * 1.7 + a * 2.2, ny = sinv * 1.7, nz = u * 5.2;
      const lump = fbm(nx, ny, nz), blis = fbm(nx * 2.7, ny * 2.7, nz * 2.7), fine = fbm(nx * 6.6, ny * 6.6, nz * 6.6);
      const bumpN = 0.05 * lump + 0.028 * blis + 0.015 * fine;
      const cr = rad * (1 + 0.05 * wrap + 0.02 * lam) + bumpN;
      off.copy(Nrm).multiplyScalar(cr * cosv).addScaledVector(B, cr * sinv);
      positions[k * 3] = P.x + off.x; positions[k * 3 + 1] = P.y + off.y; positions[k * 3 + 2] = P.z + off.z;
      uvs[k * 2] = u * 2.5; uvs[k * 2 + 1] = j / NV;
      const ridgeT = THREE.MathUtils.clamp(roll * 0.5 + wrap * 0.22 + lam * 0.12 + (lump * 0.5 + 0.5) * 0.22, 0, 1);
      tmp.copy(cGroove).lerp(cRidge, ridgeT);
      const bake = fbm(nx * 1.2 + 11, ny * 1.2, nz * 0.8);
      if (bake > 0.12) tmp.lerp(cTip, Math.min(0.55, (bake - 0.12)));
      else if (bake < -0.18) tmp.lerp(cFlour, Math.min(0.4, (-0.18 - bake) * 0.8));
      tmp.lerp(cTip, Math.pow(Math.abs(u - 0.5) * 2, 2.4) * 0.5);
      tmp.multiplyScalar(0.8 + 0.2 * THREE.MathUtils.clamp(bumpN / 0.07 + 0.5, 0, 1));
      colors[k * 3] = tmp.r; colors[k * 3 + 1] = tmp.g; colors[k * 3 + 2] = tmp.b;
      k++;
    }
  }
  const indices = [];
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
    const p0 = i * rowV + j, p1 = (i + 1) * rowV + j, p2 = (i + 1) * rowV + j + 1, p3 = i * rowV + j + 1;
    indices.push(p0, p2, p1, p0, p3, p2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices); geo.computeVertexNormals(); geo.computeBoundingSphere();
  const c = geo.boundingSphere.center; geo.translate(-c.x, -c.y, -c.z);
  return geo;
}

/* ---- kouign-amann: a fluted, caramelized ring (torus with radial flutes) ---- */
function buildBundt(THREE, lowQ) {
  const NU = lowQ ? 240 : 460, NV = lowQ ? 40 : 80, R = 0.98, Rt = 0.46, FL = 14;
  const cRidge = new THREE.Color(0xE8A85C), cGroove = new THREE.Color(0x6E3713), cTop = new THREE.Color(0xCE8A38), cFlour = new THREE.Color(0xEAD6AE), tmp = new THREE.Color();
  const rowV = NV + 1, count = (NU + 1) * rowV;
  const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
  let k = 0;
  for (let i = 0; i <= NU; i++) {
    const u = i / NU, ang = u * Math.PI * 2, cu = Math.cos(ang), su = Math.sin(ang), flute = 0.5 + 0.5 * Math.cos(ang * FL);
    for (let j = 0; j <= NV; j++) {
      const v = (j / NV) * Math.PI * 2, cv = Math.cos(v), sv = Math.sin(v);
      const lump = fbm(cu * 1.7 + ang, su * 1.7, v), blis = fbm(cu * 4 + ang * 2, su * 4, v * 2.6);
      const bumpN = 0.045 * lump + 0.022 * blis, tr = Rt * (1 + 0.17 * flute) + bumpN;
      positions[k * 3] = (R + tr * cv) * cu; positions[k * 3 + 1] = (R + tr * cv) * su; positions[k * 3 + 2] = tr * sv;
      const t = THREE.MathUtils.clamp(flute * 0.6 + (sv * 0.5 + 0.5) * 0.26 + (lump * 0.5 + 0.5) * 0.18, 0, 1);
      tmp.copy(cGroove).lerp(cRidge, t).lerp(cTop, Math.max(0, sv) * 0.28);
      const bake = fbm(cu * 1.3 + 7, su * 1.3, v * 0.8);
      if (bake > 0.14) tmp.lerp(cGroove, Math.min(0.45, bake - 0.14));
      else if (bake < -0.2) tmp.lerp(cFlour, Math.min(0.36, (-0.2 - bake) * 0.8));
      tmp.multiplyScalar(0.82 + 0.18 * THREE.MathUtils.clamp(bumpN / 0.06 + 0.5, 0, 1));
      colors[k * 3] = tmp.r; colors[k * 3 + 1] = tmp.g; colors[k * 3 + 2] = tmp.b;
      k++;
    }
  }
  return finishGeo(THREE, positions, colors, NU, NV);
}

/* ---- morning bun: a tube swept along a flat Archimedean spiral ---- */
function buildBun(THREE, lowQ) {
  const TURNS = 2.7, NU = lowQ ? 320 : 560, NV = lowQ ? 28 : 44, Rt = 0.17;
  const cRidge = new THREE.Color(0xE3A75A), cGroove = new THREE.Color(0x5A3214), cSugar = new THREE.Color(0xF4D9A6), cFlour = new THREE.Color(0xEAD6AE), tmp = new THREE.Color();
  const rowV = NV + 1, count = (NU + 1) * rowV;
  const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
  const P = new THREE.Vector3(), T = new THREE.Vector3(), Nrm = new THREE.Vector3(), B = new THREE.Vector3(0, 0, 1), off = new THREE.Vector3(), Pn = new THREE.Vector3();
  const center = (t) => { const ang = t * TURNS * Math.PI * 2, rad = 0.16 + 0.62 * t; return [rad * Math.cos(ang), rad * Math.sin(ang)]; };
  let k = 0;
  for (let i = 0; i <= NU; i++) {
    const u = i / NU, c0 = center(u), c1 = center(Math.min(1, u + 1e-3));
    P.set(c0[0], c0[1], 0); Pn.set(c1[0], c1[1], 0); T.copy(Pn).sub(P).normalize(); Nrm.copy(T).cross(B).normalize();
    const taper = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.06)), 0.4);
    for (let j = 0; j <= NV; j++) {
      const v = (j / NV) * Math.PI * 2, cv = Math.cos(v), sv = Math.sin(v);
      const lump = fbm(c0[0] * 4, c0[1] * 4, v), blis = fbm(c0[0] * 9, c0[1] * 9, v * 2.5);
      const bumpN = 0.028 * lump + 0.015 * blis, cr = Rt * taper + bumpN;
      off.copy(Nrm).multiplyScalar(cr * cv).addScaledVector(B, cr * sv);
      positions[k * 3] = P.x + off.x; positions[k * 3 + 1] = P.y + off.y; positions[k * 3 + 2] = off.z;
      const swirl = 0.5 + 0.5 * Math.cos(u * TURNS * Math.PI * 2 - v);
      tmp.copy(cGroove).lerp(cRidge, THREE.MathUtils.clamp(swirl * 0.66 + (lump * 0.5 + 0.5) * 0.2 + 0.14, 0, 1));
      tmp.lerp(cSugar, Math.max(0, sv) * 0.22);
      const bake = fbm(c0[0] * 1.5 + 5, c0[1] * 1.5, v * 0.8);
      if (bake > 0.16) tmp.lerp(cGroove, Math.min(0.4, bake - 0.16));
      else if (bake < -0.2) tmp.lerp(cFlour, Math.min(0.32, (-0.2 - bake) * 0.7));
      tmp.multiplyScalar(0.84 + 0.16 * THREE.MathUtils.clamp(bumpN / 0.04 + 0.5, 0, 1));
      colors[k * 3] = tmp.r; colors[k * 3 + 1] = tmp.g; colors[k * 3 + 2] = tmp.b;
      k++;
    }
  }
  return finishGeo(THREE, positions, colors, NU, NV);
}

function finishGeo(THREE, positions, colors, NU, NV) {
  const rowV = NV + 1, indices = [], uvs = new Float32Array((NU + 1) * rowV * 2);
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) { const k = i * rowV + j; uvs[k * 2] = (i / NU) * 2.5; uvs[k * 2 + 1] = j / NV; }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
    const p0 = i * rowV + j, p1 = (i + 1) * rowV + j, p2 = (i + 1) * rowV + j + 1, p3 = i * rowV + j + 1;
    indices.push(p0, p2, p1, p0, p3, p2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices); geo.computeVertexNormals(); geo.computeBoundingSphere();
  const c = geo.boundingSphere.center; geo.translate(-c.x, -c.y, -c.z);
  return geo;
}

function crustRoughness(THREE) {
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
  const x = c.getContext('2d'), img = x.createImageData(s, s), d = img.data;
  for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) { const nv = (fbm(i / 20, j / 20, 3.3) + 1) / 2, val = Math.floor(135 + nv * 95), k = (j * s + i) * 4; d[k] = d[k + 1] = d[k + 2] = val; d[k + 3] = 255; }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t;
}
function crustBump(THREE) {
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
  const x = c.getContext('2d'), img = x.createImageData(s, s), d = img.data;
  for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) { let nv = (fbm(i / 8, j / 8, 7.1) + 1) / 2; nv = Math.pow(nv, 1.6); const val = Math.floor(50 + nv * 205), k = (j * s + i) * 4; d[k] = d[k + 1] = d[k + 2] = val; d[k + 3] = 255; }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); return t;
}
/* TRUE normal map, derived from a sharpened flaky-crust height field. This is the
   big realism lever: it gives the surface real per-pixel relief so light catches
   every laminated layer, blister, and flake — instead of a smooth painted shell. */
function crustNormal(THREE) {
  const s = 512;
  const Hf = (i, j) => {
    const h = fbm(i / 26, j / 26, 1.7) * 0.6 + fbm(i / 9, j / 9, 5.3) * 0.3 + fbm(i / 3.4, j / 3.4, 9.1) * 0.2;
    return Math.pow((h + 1) / 2, 1.45);   // 0..1, sharpen the flakes
  };
  const c = document.createElement('canvas'); c.width = c.height = s;
  const x = c.getContext('2d'), img = x.createImageData(s, s), d = img.data, str = 2.6;
  for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) {
    const hL = Hf((i - 1 + s) % s, j), hR = Hf((i + 1) % s, j), hD = Hf(i, (j - 1 + s) % s), hU = Hf(i, (j + 1) % s);
    let nx = (hL - hR) * str, ny = (hD - hU) * str, nz = 1;
    const inv = 1 / Math.hypot(nx, ny, nz); nx *= inv; ny *= inv; nz *= inv;
    const k = (j * s + i) * 4;
    d[k] = (nx * 0.5 + 0.5) * 255; d[k + 1] = (ny * 0.5 + 0.5) * 255; d[k + 2] = (nz * 0.5 + 0.5) * 255; d[k + 3] = 255;
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
/* soft warm-brown contact shadow — grounds the floating pastry without making it
   sit on a hard surface. */
function shadowTexture(THREE) {
  const s = 128, c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d');
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(46,26,12,0.62)'); g.addColorStop(0.45, 'rgba(46,26,12,0.26)'); g.addColorStop(1, 'rgba(46,26,12,0)');
  x.fillStyle = g; x.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}
function washTexture(THREE, stops) {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  const g = x.createRadialGradient(S * 0.7, S * 0.3, 0, S * 0.5, S * 0.42, S * 1.15);
  g.addColorStop(0, stops[0]); g.addColorStop(0.42, stops[1]); g.addColorStop(1, stops[2]);
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export async function initHero() {
  const backdrop = document.querySelector('.backdrop');
  const canvas = document.getElementById('bgCanvas');
  if (!canvas || !backdrop) return false;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  let mobile = window.innerWidth < 760 || touch;

  const webglOK = (() => { try { const t = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (t.getContext('webgl2') || t.getContext('webgl'))); } catch { return false; } })();
  if (!webglOK) { backdrop.classList.add('is-static'); return false; }

  let THREE, OrbitControls, RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, OutputPass;
  try {
    THREE = await import('three');
    ({ OrbitControls } = await import('three/addons/controls/OrbitControls.js'));
    ({ RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js'));
    ({ EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js'));
    ({ RenderPass } = await import('three/addons/postprocessing/RenderPass.js'));
    ({ UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js'));
    ({ OutputPass } = await import('three/addons/postprocessing/OutputPass.js'));
  } catch (e) { console.warn('Plume & Crumb hero: three failed to load — static fallback.', e && e.message); backdrop.classList.add('is-static'); return false; }

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !mobile, powerPreference: 'high-performance' }); }
  catch { backdrop.classList.add('is-static'); return false; }

  const W = () => window.innerWidth, H = () => window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, mobile ? 2 : 2.5);
  renderer.setPixelRatio(dpr); renderer.setSize(W(), H());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;   // a touch warmer/brighter

  const scene = new THREE.Scene();
  // elevated "product-shot" camera — looks gently down on the pastry
  const camera = new THREE.PerspectiveCamera(36, W() / H(), 0.1, 100);
  camera.position.set(0, 0.95, 6.05);
  const LOOK = new THREE.Vector3(0, -0.18, 0);
  camera.lookAt(LOOK);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const keyBase = new THREE.Color(0xFFE6B8), keyGold = new THREE.Color(0xF6B26B);
  const key = new THREE.DirectionalLight(0xFFE7BC, 2.25); key.position.set(4, 6, 5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xFFF1DD, 0.9); fill.position.set(-5, 1, -3); scene.add(fill);

  // theme-aware backdrop wash (the bloom compositor makes the canvas opaque, so the CSS
  // gradient can't show through — this paints it into the scene). Light, or night-kitchen.
  const WASH = {
    light: washTexture(THREE, ['#F8EACB', '#EFDBB2', '#D98E3F']),
    dark:  washTexture(THREE, ['#5A3C20', '#3D2814', '#241710']),
  };
  let heroTheme = 'light';
  try { const sv = localStorage.getItem('pnc_bg'); if (sv === 'dark' || sv === 'light') heroTheme = sv; } catch (e) {}
  scene.background = WASH[heroTheme];
  window.__setHeroTheme = (mode) => {
    heroTheme = (mode === 'dark') ? 'dark' : 'light';
    scene.background = WASH[heroTheme];
    if (bloom) bloom.threshold = heroTheme === 'dark' ? 0.78 : 0.9;
    render();
  };

  // ---- soft contact shadow (grounding) ----
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.4),
    new THREE.MeshBasicMaterial({ map: shadowTexture(THREE), transparent: true, depthWrite: false, opacity: 0.5, toneMapped: false })
  );
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(0, -1.7, 0); shadow.renderOrder = -2; scene.add(shadow);

  // ---- the pastry: PBR + baked colour + matte flaky crust ----
  const pastry = new THREE.Group(); scene.add(pastry);
  const lowQ = reduced || mobile || saveData;
  const mat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.8, metalness: 0.0,
    roughnessMap: crustRoughness(THREE),
    normalMap: crustNormal(THREE), normalScale: new THREE.Vector2(0.85, 0.85),   // real per-pixel crust relief
    clearcoat: 0.18, clearcoatRoughness: 0.55,
    sheen: 0.38, sheenColor: new THREE.Color(0xF1D2A0), sheenRoughness: 0.78,
    emissive: new THREE.Color(0x3A1F0C), emissiveIntensity: 0.05,
    envMapIntensity: 1.1,
  });
  // ---- the hero: a cheerful TOON-SHADED layer cake. Stylized on purpose — it reads as a
  //      crafted illustration, not a failed photo, so it dodges the uncanny "old-game" look.
  //      Built procedurally with cel shading + dark inverted-hull outlines. No model to load. ----
  const cakeRamp = (() => {                       // 4-step neutral ramp → crisp cartoon banding
    const c = document.createElement('canvas'); c.width = 4; c.height = 1; const x = c.getContext('2d');
    ['#6a6a6a', '#9e9e9e', '#cfcfcf', '#ffffff'].forEach((s, i) => { x.fillStyle = s; x.fillRect(i, 0, 1, 1); });
    const t = new THREE.CanvasTexture(c); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; return t;
  })();
  const toon = (hex) => new THREE.MeshToonMaterial({ color: hex, gradientMap: cakeRamp });
  const outlineMat = new THREE.MeshBasicMaterial({ color: 0x35200F, side: THREE.BackSide });   // cartoon edge
  const SPONGE = 0xE7C39A, FROST = 0xFBEFDC, BERRY = 0xC4424F, GOLD = 0xD98E3F, LEAF = 0x9CAE84, STEM = 0x6B4A2A;
  const cake = new THREE.Group();
  const part = (geo, material, y, outline = true, oScale = 1.06) => {       // mesh + optional inverted-hull outline
    const m = new THREE.Mesh(geo, material); m.position.y = y; cake.add(m);
    if (outline) { const o = new THREE.Mesh(geo, outlineMat); o.position.y = y; o.scale.setScalar(oScale); cake.add(o); }
    return m;
  };
  part(new THREE.CylinderGeometry(1.35, 1.42, 0.92, 64), toon(SPONGE), -0.55);   // bottom tier (sponge)
  part(new THREE.CylinderGeometry(1.46, 1.46, 0.30, 64), toon(FROST), 0.00);     // bottom frosting ledge
  part(new THREE.CylinderGeometry(0.92, 0.98, 0.78, 64), toon(SPONGE), 0.55);    // top tier (sponge)
  part(new THREE.CylinderGeometry(1.02, 1.02, 0.26, 64), toon(FROST), 1.00);     // top frosting
  part(new THREE.SphereGeometry(0.20, 32, 24), toon(BERRY), 1.32);               // cherry on top
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.22, 8), toon(STEM));
  stem.position.set(0.05, 1.46, 0); stem.rotation.z = -0.32; cake.add(stem);     // cherry stem
  const sprinkleCols = [BERRY, GOLD, LEAF, 0xFFFFFF, 0xE89AB0];                   // sprinkles around the ledge
  const ring = new THREE.CylinderGeometry(0.028, 0.028, 0.14, 6);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const s = new THREE.Mesh(ring, toon(sprinkleCols[i % sprinkleCols.length]));
    s.position.set(Math.cos(a) * 1.2, 0.12, Math.sin(a) * 1.2);
    s.rotation.set(Math.PI / 2, 0, a + 0.6); cake.add(s);
  }
  cake.position.y = -0.34;   // gentle float, centered behind the copy
  cake.scale.setScalar(0.68);   // a floating accent (kept clear of the copy by a light scrim)
  cake.rotation.y = -0.35;   // friendly 3/4 view
  pastry.add(cake);
  let activeObj = cake;

  // ---- light beams (fake volumetrics; glow under bloom) ----
  const beams = [];
  if (!reduced && !saveData) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, 'rgba(255,247,232,0)'); g.addColorStop(0.5, 'rgba(255,238,200,0.5)'); g.addColorStop(1, 'rgba(255,247,232,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 256);
    const beamTex = new THREE.CanvasTexture(c);
    for (let i = 0; i < (mobile ? 1 : 2); i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 9), new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
      m.position.set(i === 0 ? -1.7 : 1.9, 0, -2.6); m.rotation.z = i === 0 ? 0.32 : -0.24; scene.add(m); beams.push(m);
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
      pSpeed[i] = 0.12 + Math.random() * 0.28; pPhase[i] = Math.random() * 6.28;   // slower drift
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    points = new THREE.Points(g, new THREE.PointsMaterial({ size: mobile ? 0.11 : 0.08, map: softSprite(THREE), vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, sizeAttenuation: true, toneMapped: false }));
    scene.add(points);
  }

  // ---- bloom ----
  let composer = null, bloom = null;
  if (!reduced && !saveData && !mobile) {
    composer = new EffectComposer(renderer); composer.setPixelRatio(Math.min(dpr, 2)); composer.setSize(W(), H());
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(W(), H()), 0.26, 0.5, heroTheme === 'dark' ? 0.78 : 0.9); composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }
  const render = () => (composer ? composer.render() : renderer.render(scene, camera));

  // ---- controls (desktop drag only; calmer) ----
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(LOOK);
  controls.enableZoom = false; controls.enablePan = false; controls.enableRotate = !touch;
  controls.enableDamping = true; controls.dampingFactor = 0.07; controls.rotateSpeed = 0.5;
  controls.minPolarAngle = Math.PI * 0.34; controls.maxPolarAngle = Math.PI * 0.62;
  controls.autoRotate = !reduced; controls.autoRotateSpeed = 0.34;   // slow, controlled
  controls.update();
  let lastInteract = 0;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  controls.addEventListener('end', () => { lastInteract = performance.now(); });
  const updatePointer = () => { canvas.style.pointerEvents = (!touch && window.scrollY < window.innerHeight * 0.85) ? 'auto' : 'none'; };
  updatePointer();

  // ---- scroll ----
  let scrollTarget = 0, scrollSmooth = 0;
  const readScroll = () => { const max = document.documentElement.scrollHeight - window.innerHeight; scrollTarget = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0; };
  // The cake is a HERO moment. As you scroll into the content it dissolves into the warm
  // background wash, so section text never has to fight a busy 3D object behind it.
  const fadeCanvas = () => { const f = Math.min(1, window.scrollY / ((window.innerHeight || 1) * 0.8)); canvas.style.opacity = (1 - f * 0.93).toFixed(3); };
  window.addEventListener('scroll', () => { readScroll(); updatePointer(); fadeCanvas(); }, { passive: true });
  canvas.style.transition = 'opacity .3s ease'; fadeCanvas();
  readScroll();

  // ---- resize ----
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { mobile = window.innerWidth < 760 || touch; camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H()); if (composer) composer.setSize(W(), H()); }, 150);
  });

  // ---- loop + pause + FPS auto-downgrade ----
  const clock = new THREE.Clock();
  let running = !document.hidden, rafId = 0, frames = 0, fpsT = performance.now(), downgraded = false;
  function downgrade() {
    downgraded = true; dpr = Math.min(dpr, 1.5); renderer.setPixelRatio(dpr);
    if (composer) composer = null; beams.forEach((b) => (b.visible = false)); if (points) points.material.size *= 0.85; controls.autoRotateSpeed = 0.25;
  }
  function frame() {
    const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
    scrollSmooth += (scrollTarget - scrollSmooth) * 0.07;
    const p = scrollSmooth, warm = Math.min(1, p * 1.2);

    const lift = Math.sin(t * 0.85) * 0.08 * (1 - p * 0.7);   // gentler, slower bob
    pastry.position.x = p * 2.2;
    pastry.position.y = lift - p * 0.4;
    pastry.scale.setScalar(1 - p * 0.45);
    pastry.rotation.z = p * 0.28;
    activeObj.rotation.y += dt * 0.06;  // gentle turn on whichever pastry is showing
    key.color.copy(keyBase).lerp(keyGold, warm);
    mat.emissiveIntensity = 0.05 + warm * 0.06;
    mat.envMapIntensity = 1.1 + warm * 0.2;
    if (bloom) bloom.strength = 0.16 + warm * 0.1;

    // contact shadow tracks + softens with the float height + scroll
    const sc = (1 - p * 0.45) * (1 + Math.max(0, lift) * 3.2);
    shadow.scale.setScalar(sc);
    shadow.position.x = pastry.position.x; shadow.position.z = -0.15;
    shadow.material.opacity = Math.max(0, (0.5 - Math.max(0, lift) * 1.4) * (1 - p * 0.6));

    if (!controls.autoRotate && !reduced && lastInteract && performance.now() - lastInteract > 4500) controls.autoRotate = true;
    controls.update();

    if (points) {
      const a = points.geometry.attributes.position, arr = a.array;
      for (let i = 0; i < pCount; i++) { arr[i * 3 + 1] += pSpeed[i] * dt; arr[i * 3] += Math.sin(t * 0.35 + pPhase[i]) * dt * 0.12; if (arr[i * 3 + 1] > TOP) { arr[i * 3 + 1] = BOT; arr[i * 3] = (Math.random() * 2 - 1) * 5; } }
      a.needsUpdate = true;
    }
    for (let i = 0; i < beams.length; i++) beams[i].material.opacity = 0.09 + 0.035 * Math.sin(t * 0.45 + i);

    render();
    frames++; const now = performance.now();
    if (now - fpsT > 2000) { const fps = (frames * 1000) / (now - fpsT); frames = 0; fpsT = now; if (!downgraded && fps < 38) downgrade(); }
  }
  function loop() { if (!running) return; frame(); rafId = requestAnimationFrame(loop); }
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running && !reduced) { clock.getDelta(); loop(); } });

  if (reduced) { cake.rotation.x -= 0.05; render(); } else loop();
  return true;
}
