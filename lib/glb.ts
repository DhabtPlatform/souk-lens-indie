// Client-side image → real .glb: builds a textured 3D photo card (thin double-sided
// plane with the product photo as its material) as a valid binary glTF 2.0 file.
// No external API, works offline. Honest scope: a 2.5D display card for rotate/zoom
// and download — NOT a full 3D scan. Pairs with the existing <model-viewer> GlbViewer.
export async function photoToGlbCard(src: string): Promise<{ blob: Blob; width: number; height: number }> {
  const { bytes, mime, width, height } = await loadImageBytes(src);
  const blob = buildGlb(bytes, mime, width, height);
  return { blob, width, height };
}

async function loadImageBytes(src: string): Promise<{ bytes: ArrayBuffer; mime: string; width: number; height: number }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("image"));
    el.src = src;
  });
  const res = await fetch(src);
  if (!res.ok) throw new Error("fetch");
  const buf = await res.arrayBuffer();
  const ct = res.headers.get("content-type") ?? "";
  const mime = ct.includes("png") ? "image/png" : "image/jpeg";
  return { bytes: buf, mime, width: img.naturalWidth || 800, height: img.naturalHeight || 600 };
}

function buildGlb(imgBytes: ArrayBuffer, mime: string, iw: number, ih: number): Blob {
  const W = 1, H = Math.min(2, Math.max(0.5, ih / Math.max(1, iw)));
  const pos = new Float32Array([-W / 2, -H / 2, 0, W / 2, -H / 2, 0, W / 2, H / 2, 0, -W / 2, H / 2, 0]);
  const nor = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
  const uv = new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]);
  const idx = new Uint16Array([0, 1, 2, 0, 2, 3]);

  const parts: ArrayBuffer[] = [pos.buffer as ArrayBuffer, nor.buffer as ArrayBuffer, uv.buffer as ArrayBuffer, idx.buffer as ArrayBuffer, imgBytes];
  const bufferViews: Record<string, unknown>[] = [];
  let offset = 0;
  const targets = [34962, 34962, undefined, 34963, undefined];
  parts.forEach((p, i) => {
    const bv: Record<string, unknown> = { buffer: 0, byteOffset: offset, byteLength: p.byteLength };
    if (targets[i] !== undefined) bv.target = targets[i];
    bufferViews.push(bv);
    offset += p.byteLength + ((4 - (p.byteLength % 4)) % 4);
  });

  const json = {
    asset: { version: "2.0", generator: "Souk Lens photo-to-GLB" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: "photo-card" }],
    meshes: [{ name: "photo-card", primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0 }] }],
    materials: [{ name: "photo", doubleSided: true, pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughness: 0.9 } }],
    textures: [{ source: 0 }],
    images: [{ bufferView: 4, mimeType: mime, name: "photo" }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 4, type: "VEC3", min: [-W / 2, -H / 2, 0], max: [W / 2, H / 2, 0] },
      { bufferView: 1, componentType: 5126, count: 4, type: "VEC3" },
      { bufferView: 2, componentType: 5126, count: 4, type: "VEC2" },
      { bufferView: 3, componentType: 5123, count: 6, type: "SCALAR" },
    ],
    bufferViews,
    buffers: [{ byteLength: offset }],
  };

  const enc = new TextEncoder();
  const jsonBytes = enc.encode(JSON.stringify(json));
  const jsonPad = (4 - (jsonBytes.length % 4)) % 4;
  const total = 12 + 8 + jsonBytes.length + jsonPad + 8 + offset;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint32(0, 0x46546c67, true); // glTF
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  let o = 12;
  view.setUint32(o, jsonBytes.length + jsonPad, true);
  view.setUint32(o + 4, 0x4e4f534a, true); // JSON
  out.set(jsonBytes, o + 8);
  out.fill(0x20, o + 8 + jsonBytes.length, o + 8 + jsonBytes.length + jsonPad);
  o += 8 + jsonBytes.length + jsonPad;
  view.setUint32(o, offset, true);
  view.setUint32(o + 4, 0x004e4942, true); // BIN
  o += 8;
  for (const p of parts) {
    out.set(new Uint8Array(p), o);
    o += p.byteLength + ((4 - (p.byteLength % 4)) % 4);
  }
  return new Blob([out], { type: "model/gltf-binary" });
}
