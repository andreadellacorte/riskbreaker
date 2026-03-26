/**
 * WEP 3D weapon viewer — parses PS1 .WEP binary format and renders via Three.js.
 * Ported from https://github.com/morris/vstools
 */

import * as THREE from "three";

// ── Binary reader ─────────────────────────────────────────────────────────────

class Reader {
  private view: DataView;
  pos = 0;

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
  }

  u8(): number { return this.view.getUint8(this.pos++); }
  s8(): number { const v = this.view.getInt8(this.pos++); return v; }
  u16(): number { const v = this.view.getUint16(this.pos, true); this.pos += 2; return v; }
  s16(): number { const v = this.view.getInt16(this.pos, true); this.pos += 2; return v; }
  u32(): number { const v = this.view.getUint32(this.pos, true); this.pos += 4; return v; }
  s32(): number { const v = this.view.getInt32(this.pos, true); this.pos += 4; return v; }

  buffer(len: number): Uint8Array {
    const b = new Uint8Array(this.view.buffer, this.pos, len);
    this.pos += len;
    return b;
  }

  constant(bytes: number[]): void {
    for (const b of bytes) {
      if (this.u8() !== b) throw new Error(`Unexpected byte at ${this.pos - 1}`);
    }
  }

  skip(n: number): void { this.pos += n; }
  seek(i: number): void { this.pos = i; }
}

// ── WEP data types ────────────────────────────────────────────────────────────

interface WEPBone { length: number; parentId: number; groupId: number; mode: number; }
interface WEPGroup { boneId: number; lastVertex: number; }
interface WEPVertex { x: number; y: number; z: number; }
interface WEPFace {
  v: number[]; u: number[]; uv: number[];
  r: number[]; g: number[]; b: number[];
  isQuad: boolean; double: boolean;
}

interface WEPData {
  numBones: number; numGroups: number;
  numTriangles: number; numQuads: number; numPolygons: number; numAllPolygons: number;
  texturePtr: number; groupPtr: number; vertexPtr: number; facePtr: number;
  bones: WEPBone[];
  groups: WEPGroup[];
  vertices: WEPVertex[];
  faces: WEPFace[];
  texVersion: number;
  colorsPerPalette: number;
  palettes: number[][][]; // palette index -> rgba colors
  map: number[][]; // map[x][y] -> color index byte
  texWidth: number; texHeight: number;
  texBuiltWidth: number;
}

// ── Parse color from 15-bit PS1 BGR ─────────────────────────────────────────

function parseColor(c: number): number[] {
  if (c === 0) return [0, 0, 0, 0];
  const r = (c & 0x001f) * 8;
  const g = ((c & 0x03e0) >> 5) * 8;
  const b = ((c & 0x7c00) >> 10) * 8;
  return [r, g, b, 255];
}

// ── Main WEP parser ───────────────────────────────────────────────────────────

export function parseWEP(buffer: ArrayBuffer): WEPData {
  const r = new Reader(buffer);

  // Header
  r.constant([0x48, 0x30, 0x31, 0x00]);
  const numBones = r.u8();
  const numGroups = r.u8();
  const numTriangles = r.u16();
  const numQuads = r.u16();
  const numPolygons = r.u16();
  const numAllPolygons = numTriangles + numQuads + numPolygons;

  const texturePtr1 = r.u32() + 0x10;
  void texturePtr1;
  r.skip(0x30);
  const texturePtr = r.u32() + 0x10;
  const groupPtr = r.u32() + 0x10;
  const vertexPtr = r.u32() + 0x10;
  const facePtr = r.u32() + 0x10;

  // Bones (match vstools flow directly after header)
  const bones: WEPBone[] = [];
  for (let i = 0; i < numBones; i++) {
    const length = r.s32();
    const parentId = r.s8();
    const groupId = r.s8();
    r.skip(2); // mountId, bodyPartId
    const mode = r.s8();
    r.skip(7); // unknowns + padding
    bones.push({ length, parentId, groupId, mode });
  }

  // Groups
  r.seek(groupPtr);
  const groups: WEPGroup[] = [];
  for (let i = 0; i < numGroups; i++) {
    const boneId = r.s16();
    const lastVertex = r.u16();
    groups.push({ boneId, lastVertex });
  }

  // Vertices
  r.seek(vertexPtr);
  const numVertices = groups[numGroups - 1]?.lastVertex ?? 0;
  const vertices: WEPVertex[] = [];
  for (let i = 0; i < numVertices; i++) {
    const x = r.s16(), y = r.s16(), z = r.s16();
    r.skip(2);
    vertices.push({ x, y, z });
  }

  // Faces — try v1, fall back to v2 colored
  r.seek(facePtr);
  const faces: WEPFace[] = [];
  const totalFaces = numAllPolygons;

  let parseOk = true;
  const savedPos = r.pos;

  try {
    for (let i = 0; i < totalFaces; i++) {
      const type = r.u8();
      const _size = r.u8(); void _size;
      const info = r.u8();
      r.skip(1);

      if (type === 0x24) {
        // Triangle v1
        const v = [r.u16() >> 2, r.u16() >> 2, r.u16() >> 2];
        const uv = [r.u8(), r.u8(), r.u8(), r.u8(), r.u8(), r.u8()];
        faces.push({ v, u: [uv[0], uv[2], uv[4]], uv: [uv[1], uv[3], uv[5]], r: [0x80, 0x80, 0x80], g: [0x80, 0x80, 0x80], b: [0x80, 0x80, 0x80], isQuad: false, double: info === 0x5 });
      } else if (type === 0x2c) {
        // Quad v1
        const v = [r.u16() >> 2, r.u16() >> 2, r.u16() >> 2, r.u16() >> 2];
        const uv = [r.u8(), r.u8(), r.u8(), r.u8(), r.u8(), r.u8(), r.u8(), r.u8()];
        faces.push({ v, u: [uv[0], uv[2], uv[4], uv[6]], uv: [uv[1], uv[3], uv[5], uv[7]], r: [0x80, 0x80, 0x80, 0x80], g: [0x80, 0x80, 0x80, 0x80], b: [0x80, 0x80, 0x80, 0x80], isQuad: true, double: info === 0x5 });
      } else {
        parseOk = false;
        break;
      }
    }
  } catch {
    parseOk = false;
  }

  if (!parseOk) {
    // Fall back to version 2 colored faces
    faces.length = 0;
    r.seek(savedPos);

    for (let i = 0; i < totalFaces; i++) {
      // Peek at byte 11 for v2 type
      const start = r.pos;
      r.skip(11);
      const type2 = r.u8();
      r.seek(start);

      if (type2 === 0x34) {
        // Colored triangle v2 (28 bytes)
        const v = [r.u16() >> 2, r.u16() >> 2, r.u16() >> 2];
        const u1 = r.u8(), v1 = r.u8();
        const r1 = r.u8(), g1 = r.u8(), b1 = r.u8();
        r.skip(1); // type
        const r2 = r.u8(), g2 = r.u8(), b2 = r.u8();
        r.skip(1); // size
        const r3 = r.u8(), g3 = r.u8(), b3 = r.u8();
        r.skip(1); // info
        const u2 = r.u8(), v2 = r.u8(), u3 = r.u8(), v3 = r.u8();
        faces.push({ v, u: [u1, u2, u3], uv: [v1, v2, v3], r: [r1, r2, r3], g: [g1, g2, g3], b: [b1, b2, b3], isQuad: false, double: false });
      } else if (type2 === 0x3c) {
        // Colored quad v2 (36 bytes)
        const v = [r.u16() >> 2, r.u16() >> 2, r.u16() >> 2, r.u16() >> 2];
        const r1 = r.u8(), g1 = r.u8(), b1 = r.u8();
        r.skip(1); // type
        const r2 = r.u8(), g2 = r.u8(), b2 = r.u8();
        r.skip(1); // size
        const r3 = r.u8(), g3 = r.u8(), b3 = r.u8();
        r.skip(1); // info
        const r4 = r.u8(), g4 = r.u8(), b4 = r.u8();
        r.skip(1); // skip
        const u1 = r.u8(), v1 = r.u8(), u2 = r.u8(), v2 = r.u8();
        const u3 = r.u8(), v3 = r.u8(), u4 = r.u8(), v4 = r.u8();
        faces.push({ v, u: [u1, u2, u3, u4], uv: [v1, v2, v3, v4], r: [r1, r2, r3, r4], g: [g1, g2, g3, g4], b: [b1, b2, b3, b4], isQuad: true, double: false });
      } else {
        // Unknown — skip 16 bytes as minimum and move on
        r.skip(16);
      }
    }
  }

  // Texture (WEP uses handle palette + 7 palettes)
  r.seek(texturePtr);
  void r.u32(); // size
  const texVersion = r.u8();
  const texWidth = r.u8() * 2;
  const texHeight = r.u8() * 2;
  const colorsPerPalette = r.u8();
  const palettes: number[][][] = [];
  const handleColors: number[][] = [];
  const handleCount = Math.floor(colorsPerPalette / 3);
  for (let i = 0; i < handleCount; i++) {
    handleColors.push(parseColor(r.u16()));
  }
  for (let p = 0; p < 7; p++) {
    const palette: number[][] = [];
    palette.push(...handleColors);
    for (let i = 0; i < handleCount * 2; i++) {
      palette.push(parseColor(r.u16()));
    }
    palettes.push(palette);
  }

  const map: number[][] = [];
  for (let y = 0; y < texHeight; y++) {
    for (let x = 0; x < texWidth; x++) {
      if (!map[x]) map[x] = [];
      map[x][y] = r.u8();
    }
  }

  const texBuiltWidth = texVersion === 16 ? texWidth * 2 : texWidth;
  return {
    numBones, numGroups, numTriangles, numQuads, numPolygons, numAllPolygons,
    texturePtr, groupPtr, vertexPtr, facePtr,
    bones, groups, vertices, faces,
    texVersion, colorsPerPalette, palettes, map, texWidth, texHeight, texBuiltWidth,
  };
}

// ── Three.js builders ─────────────────────────────────────────────────────────

function buildTexture(wep: WEPData): THREE.DataTexture {
  const { palettes, map, texVersion, colorsPerPalette, texWidth, texHeight, texBuiltWidth } = wep;
  const palette = palettes[0] ?? [];
  const data = new Uint8Array(texBuiltWidth * texHeight * 4);
  let o = 0;
  for (let y = 0; y < texHeight; y++) {
    for (let x = 0; x < texWidth; x++) {
      const c = map[x]?.[y] ?? 0;
      if (texVersion === 16) {
        const lo = c & 0x0f;
        const hi = c >> 4;
        const cLo = lo < colorsPerPalette ? (palette[lo] ?? [0, 0, 0, 0]) : [0, 0, 0, 0];
        const cHi = hi < colorsPerPalette ? (palette[hi] ?? [0, 0, 0, 0]) : [0, 0, 0, 0];
        data[o++] = cLo[0]; data[o++] = cLo[1]; data[o++] = cLo[2]; data[o++] = cLo[3];
        data[o++] = cHi[0]; data[o++] = cHi[1]; data[o++] = cHi[2]; data[o++] = cHi[3];
      } else {
        const rgba = c < colorsPerPalette ? (palette[c] ?? [0, 0, 0, 0]) : [0, 0, 0, 0];
        data[o++] = rgba[0]; data[o++] = rgba[1]; data[o++] = rgba[2]; data[o++] = rgba[3];
      }
    }
  }
  const tex = new THREE.DataTexture(data, texBuiltWidth, texHeight, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function buildGeometry(wep: WEPData): THREE.BufferGeometry {
  const { bones, groups, vertices, faces, texBuiltWidth, texHeight } = wep;

  // Compute bone X offsets (cumulative parent lengths)
  const boneOffset: number[] = new Array(bones.length).fill(0);
  for (let i = 0; i < bones.length; i++) {
    let offset = 0;
    let b = bones[i];
    const seen = new Set<number>();
    while (b.parentId < bones.length) {
      if (seen.has(b.parentId)) break;
      seen.add(b.parentId);
      const parent = bones[b.parentId];
      if (!parent) break;
      offset += -parent.length;
      b = parent;
    }
    boneOffset[i] = offset;
  }

  // Map vertex → group/bone
  const vertexGroup: number[] = [];
  for (let g = 0; g < groups.length; g++) {
    const start = g === 0 ? 0 : groups[g - 1].lastVertex;
    const end = groups[g].lastVertex;
    for (let v = start; v < end; v++) vertexGroup[v] = g;
  }

  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];
  const indices: number[] = [];

  let vtxBase = 0;

  function emitVertex(faceIdx: number, vIdx: number, face: WEPFace) {
    const vi = face.v[vIdx];
    const vert = vertices[vi];
    const g = vertexGroup[vi] ?? 0;
    const boneId = groups[g]?.boneId ?? 0;
    const ox = boneOffset[boneId] ?? 0;

    positions.push(vert.x + ox, vert.y, vert.z);
    uvs.push(face.u[vIdx] / texBuiltWidth, face.uv[vIdx] / texHeight);
    colors.push(face.r[vIdx] / 255, face.g[vIdx] / 255, face.b[vIdx] / 255);
    skinIndices.push(boneId, 0, 0, 0);
    skinWeights.push(1, 0, 0, 0);
    void faceIdx;
  }

  function emitTri(a: number, b: number, c: number) {
    indices.push(vtxBase + a, vtxBase + b, vtxBase + c);
  }

  for (let fi = 0; fi < faces.length; fi++) {
    const face = faces[fi];
    if (face.isQuad) {
      for (let k = 0; k < 4; k++) emitVertex(fi, k, face);
      emitTri(2, 1, 0);
      emitTri(1, 2, 3);
      if (face.double) { emitTri(0, 1, 2); emitTri(3, 2, 1); }
      vtxBase += 4;
    } else {
      // Match vstools triangle UV/vertex order: v2, v3, v1.
      emitVertex(fi, 1, face);
      emitVertex(fi, 2, face);
      emitVertex(fi, 0, face);
      emitTri(2, 1, 0);
      if (face.double) emitTri(0, 1, 2);
      vtxBase += 3;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setIndex(indices);
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(new Uint16Array(skinIndices), 4));
  geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeights, 4));
  geo.computeBoundingSphere();
  geo.computeVertexNormals();
  return geo;
}

function buildSkeleton(wep: WEPData): { skeleton: THREE.Skeleton; rootBone: THREE.Bone } {
  const { bones } = wep;
  const threeBones: THREE.Bone[] = bones.map(() => new THREE.Bone());

  for (let i = 0; i < bones.length; i++) {
    const b = bones[i];
    const parentId = b.parentId;
    // Some WEPs can contain invalid/self parent references; skip those links.
    if (parentId >= 0 && parentId < bones.length && parentId !== i) {
      threeBones[parentId].add(threeBones[i]);
      threeBones[i].position.x = -bones[parentId].length;
    }
  }

  const rootBone = threeBones[0] ?? new THREE.Bone();
  return { skeleton: new THREE.Skeleton(threeBones), rootBone };
}

// ── Mount / unmount API ───────────────────────────────────────────────────────

interface ViewerState {
  renderer: THREE.WebGLRenderer;
  rafId: number;
  dispose: () => void;
  wepFileIndex: number;
}
const _viewers = new WeakMap<HTMLElement, ViewerState>();
const _mountToken = new WeakMap<HTMLElement, symbol>();

type BuiltWEP = {
  wep: WEPData;
  mesh: THREE.SkinnedMesh;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
};

async function loadAndBuildWEP(
  container: HTMLElement,
  wepFileIndex: number,
): Promise<BuiltWEP | null> {
  if (_viewers.get(container)?.wepFileIndex === wepFileIndex) {
    return null;
  }

  unmountWEPViewer(container);
  const token = Symbol("wep-mount");
  _mountToken.set(container, token);

  const hex = wepFileIndex.toString(16).padStart(2, "0").toUpperCase();
  console.info(`[wep-viewer] loading /wep/${hex}.WEP (wepFile=${wepFileIndex})`);
  let buffer: ArrayBuffer;
  try {
    const res = await fetch(`/wep/${hex}.WEP`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    buffer = await res.arrayBuffer();
  } catch (err) {
    console.warn(`[wep-viewer] Failed to load /wep/${hex}.WEP:`, err);
    return null;
  }

  // If another mount came in while this one was fetching, bail.
  if (_mountToken.get(container) !== token) {
    return null;
  }

  let wep: WEPData;
  try {
    wep = parseWEP(buffer);
  } catch (err) {
    console.warn(`[wep-viewer] Failed to parse /wep/${hex}.WEP:`, err);
    return null;
  }

  const geo = buildGeometry(wep);
  const tex = buildTexture(wep);
  const { skeleton, rootBone } = buildSkeleton(wep);

  const mat = new THREE.MeshBasicMaterial({ map: tex, vertexColors: false, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide });
  const mesh = new THREE.SkinnedMesh(geo, mat);
  mesh.add(rootBone);
  mesh.bind(skeleton);
  mesh.rotation.x = Math.PI; // PS1 coord flip

  const scene = new THREE.Scene();
  scene.add(mesh);
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(1, 2, 3);
  scene.add(dirLight);

  const w = container.clientWidth || 300;
  const h = container.clientHeight || 200;
  const camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
  camera.position.z = 500;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  return { wep, mesh, scene, camera, renderer };
}

export async function mountWEPViewer(container: HTMLElement, wepFileIndex: number): Promise<void> {
  const built = await loadAndBuildWEP(container, wepFileIndex);
  if (!built) return;

  const { wep, mesh, scene, camera, renderer } = built;
  void wep;

  let rafId = 0;
  function animate() {
    rafId = requestAnimationFrame(animate);
    mesh.rotation.y += 0.005;
    renderer.render(scene, camera);
  }
  animate();

  const dispose = () => {
    renderer.dispose();
  };

  _viewers.set(container, { renderer, rafId, dispose, wepFileIndex });
}

/**
 * Mount a static, non-animating WEP viewer suitable for thumbnail galleries.
 * The weapon is shown once with a sideways tilt and then left unchanged.
 */
export async function mountWEPStaticViewer(
  container: HTMLElement,
  wepFileIndex: number,
  rotationY: number = -Math.PI / 4,
): Promise<void> {
  const built = await loadAndBuildWEP(container, wepFileIndex);
  if (!built) return;

  const { mesh, scene, camera, renderer } = built;
  mesh.rotation.y = rotationY;

  renderer.render(scene, camera);

  const dispose = () => {
    renderer.dispose();
  };

  _viewers.set(container, { renderer, rafId: 0, dispose, wepFileIndex });
}

export function unmountWEPViewer(container: HTMLElement): void {
  _mountToken.delete(container);
  const state = _viewers.get(container);
  if (state) {
    try {
      cancelAnimationFrame(state.rafId);
      state.dispose();
    } finally {
      _viewers.delete(container);
    }
  }
  // Always clear container so stale canvas does not block remount/close UX.
  container.innerHTML = "";
}
