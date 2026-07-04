import { NextRequest } from "next/server"

// 8 distinct visual styles — each project gets a different one, like different students
const STAGE_LABELS: Record<string, string> = {
  concept: "CONCEPT", schematic: "SCHEMATIC",
  design_development: "DESIGN DEVELOPMENT", final: "FINAL",
}
const CAT_LABELS: Record<string, string> = {
  residential: "Residential", commercial: "Commercial", institutional: "Institutional",
  landscape: "Landscape", urban: "Urban Design", interior: "Interior", other: "Other",
}

// Escape text for safe inclusion in SVG/XML
function escXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ w: string; h: string; seed: string }> }
) {
  const { w, h, seed } = await params
  const W = parseInt(w) || 1200
  const H = parseInt(h) || 800

  let parts: string[]
  try {
    parts = decodeURIComponent(seed).split("|")
  } catch {
    parts = seed.split("|")
  }

  const title = escXml((parts[0] || seed).toUpperCase())
  const stage = escXml(STAGE_LABELS[parts[1]] || "")
  const category = escXml(CAT_LABELS[parts[2]] || "")
  const desc = escXml(parts[3] || "")
  const descLines = wrapText(desc, 55)

  // Pick style based on hash — 8 distinct styles
  const rawHash = hashCode(seed)
  const hash = rawHash < 0 ? -rawHash : rawHash
  const styleIdx = hash % 8

  let svg = ""
  if (styleIdx === 0) svg = styleMinimalist(W, H, hash, title, stage, category, descLines)
  else if (styleIdx === 1) svg = styleBoldBlock(W, H, hash, title, stage, category, descLines)
  else if (styleIdx === 2) svg = stylePlanHeavy(W, H, hash, title, stage, category, descLines)
  else if (styleIdx === 3) svg = styleSectionCut(W, H, hash, title, stage, category, descLines)
  else if (styleIdx === 4) svg = styleDiagram(W, H, hash, title, stage, category, descLines)
  else if (styleIdx === 5) svg = styleIsometric(W, H, hash, title, stage, category, descLines)
  else if (styleIdx === 6) svg = styleCollage(W, H, hash, title, stage, category, descLines)
  else svg = styleDarkMode(W, H, hash, title, stage, category, descLines)

  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=31536000, immutable" },
  })
}

// ─── helpers ────────────────────────────────────
function wrapText(t: string, max: number): string[] {
  const words = t.split(" "), lines: string[] = []
  let cur = ""
  for (const w of words) {
    if (cur && (cur + " " + w).length > max) { lines.push(cur); cur = w }
    else cur = cur ? cur + " " + w : w
  }
  if (cur) lines.push(cur)
  return lines
}
function hashCode(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return h < 0 ? -h : h }
function r(h: number, o: number, min: number, max: number) { return min + Math.abs(Math.sin(h * 0.731 + o * 1.317)) * (max - min) }

function pickPal(hash: number, idx: number) {
  const pals = [
    // Warm stone + gold
    { bg: "#f7f3ec", fg: "#2d2d2d", acc: "#c4a35a", bg2: "#ebe3d4" },
    // Cool slate + blue
    { bg: "#edf0f4", fg: "#1a232e", acc: "#5a7da4", bg2: "#d9dfe7" },
    // Terracotta + clay
    { bg: "#f5ede6", fg: "#2c2219", acc: "#c47d5c", bg2: "#e8d9ce" },
    // Sage + olive
    { bg: "#ecf0e8", fg: "#1a2a1f", acc: "#6d8a5e", bg2: "#d8e2d2" },
    // Lavender + plum
    { bg: "#f2eef6", fg: "#1f1a2e", acc: "#8b7da8", bg2: "#e3ddec" },
    // Warm cream + amber
    { bg: "#f8f3ec", fg: "#2a221d", acc: "#d0804e", bg2: "#ede2d4" },
    // Bone + ochre
    { bg: "#faf7f0", fg: "#1c1917", acc: "#b8860e", bg2: "#f0e9d8" },
    // Cool concrete + steel
    { bg: "#eff1f3", fg: "#0f172a", acc: "#64748b", bg2: "#e0e3e7" },
  ]
  return pals[(hash + idx * 7) % pals.length]
}

// ─── STYLE 0: Minimalist ────────────────────────
function styleMinimalist(W: number, H: number, hash: number, title: string, stage: string, category: string, descLines: string[]): string {
  const pal = pickPal(hash, 0)
  let e = `<rect width="${W}" height="${H}" fill="${pal.bg}" />`
  // Thin rule at top
  e += `<line x1="40" y1="40" x2="${W - 40}" y2="40" stroke="${pal.fg}" stroke-width="0.5" opacity="0.15" />`
  // Category
  if (category) e += `<text x="40" y="80" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="${pal.acc}" opacity="0.7" letter-spacing="2">${category.toUpperCase()}</text>`
  // Title — large
  const lines = wrapText(title, 40)
  let y = category ? 110 : 80
  for (const l of lines) {
    e += `<text x="40" y="${y}" font-family="system-ui,sans-serif" font-size="28" font-weight="800" fill="${pal.fg}" opacity="0.9" letter-spacing="-0.5">${l}</text>`
    y += 34
  }
  // Stage
  if (stage) {
    y += 8
    e += `<rect x="40" y="${y}" width="${stage.length * 8 + 20}" height="22" rx="3" fill="${pal.acc}" opacity="0.15" />`
    e += `<text x="${40 + (stage.length * 8 + 20) / 2}" y="${y + 15}" font-family="system-ui,sans-serif" font-size="10" font-weight="600" fill="${pal.acc}" opacity="0.7" text-anchor="middle" letter-spacing="1">${stage}</text>`
    y += 38
  }
  // Description
  for (const l of descLines.slice(0, 5)) { e += `<text x="40" y="${y}" font-family="system-ui,sans-serif" font-size="13" fill="${pal.fg}" opacity="0.4">${l}</text>`; y += 20 }
  // Single clean geometric accent
  e += `<circle cx="${W - 80}" cy="${H - 80}" r="50" fill="none" stroke="${pal.acc}" stroke-width="1" opacity="0.2" />`
  e += `<circle cx="${W - 80}" cy="${H - 80}" r="30" fill="${pal.acc}" opacity="0.08" />`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${e}</svg>`
}

// ─── STYLE 1: Bold Color Block ──────────────────
function styleBoldBlock(W: number, H: number, hash: number, title: string, stage: string, category: string, descLines: string[]): string {
  const pal = pickPal(hash, 1)
  let e = `<rect width="${W}" height="${H}" fill="${pal.fg}" />`
  // Large accent rectangle
  const bx = W * 0.45, by = 0, bw = W * 0.55, bh = H
  e += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${pal.bg2}" opacity="0.15" />`
  // Diagonal lines
  for (let i = 0; i < 12; i++) {
    e += `<line x1="${bx + i * 40}" y1="0" x2="${bx + bh + i * 40}" y2="${H}" stroke="${pal.bg}" stroke-width="0.3" opacity="0.08" />`
  }
  // Title on dark side
  const lines = wrapText(title, 22)
  let y = H * 0.2
  e += `<text x="48" y="${y}" font-family="system-ui,sans-serif" font-size="32" font-weight="900" fill="${pal.bg}" opacity="0.95" letter-spacing="-1">${lines[0]}</text>`
  y += 38
  if (lines[1]) { e += `<text x="48" y="${y}" font-family="system-ui,sans-serif" font-size="32" font-weight="900" fill="${pal.bg}" opacity="0.95" letter-spacing="-1">${lines[1]}</text>`; y += 38 }
  // Badges
  if (stage || category) {
    const badgeText = [category, stage].filter(Boolean).join("  ·  ")
    y += 10
    e += `<text x="48" y="${y}" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="${pal.acc}" opacity="0.8" letter-spacing="2">${badgeText}</text>`
    y += 28
  }
  for (const l of descLines.slice(0, 4)) { e += `<text x="48" y="${y}" font-family="system-ui,sans-serif" font-size="12" fill="${pal.bg}" opacity="0.3">${l}</text>`; y += 18 }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${e}</svg>`
}

// ─── STYLE 2: Floor Plan Heavy ─────────────────
function stylePlanHeavy(W: number, H: number, hash: number, title: string, stage: string, category: string, descLines: string[]): string {
  const pal = pickPal(hash, 2)
  let e = `<rect width="${W}" height="${H}" fill="${pal.bg}" />`
  // Grid
  for (let x = 0; x < W; x += 30) e += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${pal.fg}" stroke-width="0.3" opacity="0.06" />`
  for (let y = 0; y < H; y += 30) e += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${pal.fg}" stroke-width="0.3" opacity="0.06" />`
  // Plan outline
  const px = W * 0.08, py = H * 0.1, pw = W * 0.84, ph = H * 0.55
  e += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="${pal.bg2}" opacity="0.3" stroke="${pal.fg}" stroke-width="2" opacity="0.2" />`
  // Interior walls
  for (let i = 0; i < 7; i++) {
    const wx = px + pw * (0.05 + r(hash, 30 + i, 0, 0.9))
    e += `<line x1="${wx}" y1="${py}" x2="${wx}" y2="${py + ph}" stroke="${pal.fg}" stroke-width="1" opacity="0.15" />`
    const wy = py + ph * (0.05 + r(hash, 40 + i, 0, 0.9))
    e += `<line x1="${px}" y1="${wy}" x2="${px + pw}" y2="${wy}" stroke="${pal.fg}" stroke-width="1" opacity="0.15" />`
  }
  // Room labels
  const rooms = ["Entry", "Living", "Studio", "Gallery", "Courtyard", "Workshop"]
  for (let i = 0; i < 4; i++) {
    e += `<text x="${px + pw * (0.15 + i * 0.22)}" y="${py + ph * 0.35}" font-family="monospace" font-size="9" fill="${pal.fg}" opacity="0.2" text-anchor="middle">${rooms[i]}</text>`
  }
  // Title block below plan
  let y = py + ph + 30
  const lines = wrapText(title, 50)
  for (const l of lines.slice(0, 2)) { e += `<text x="40" y="${y}" font-family="system-ui,sans-serif" font-size="20" font-weight="700" fill="${pal.fg}" opacity="0.8">${l}</text>`; y += 26 }
  if (stage) e += `<text x="40" y="${y}" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="${pal.acc}" opacity="0.6" letter-spacing="1.5">${stage}</text>`
  // Compass
  e += `<circle cx="${W - 60}" cy="${py + 30}" r="16" fill="none" stroke="${pal.fg}" stroke-width="0.8" opacity="0.3" />`
  e += `<polygon points="${W - 60},${py + 16} ${W - 64},${py + 33} ${W - 56},${py + 33}" fill="${pal.acc}" opacity="0.5" />`
  e += `<text x="${W - 60}" y="${py + 10}" font-family="monospace" font-size="9" fill="${pal.fg}" opacity="0.4" text-anchor="middle">N</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${e}</svg>`
}

// ─── STYLE 3: Section Cut ──────────────────────
function styleSectionCut(W: number, H: number, hash: number, title: string, stage: string, category: string, descLines: string[]): string {
  const pal = pickPal(hash, 3)
  let e = `<rect width="${W}" height="${H}" fill="${pal.bg}" />`
  const g = H * 0.65
  // Ground
  e += `<line x1="0" y1="${g}" x2="${W}" y2="${g}" stroke="${pal.fg}" stroke-width="3" opacity="0.4" />`
  // Earth hatching
  for (let y = g; y < H; y += 8) e += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${pal.fg}" stroke-width="0.3" opacity="0.08" />`
  for (let x = 0; x < W; x += 16) e += `<line x1="${x}" y1="${g}" x2="${x + 10}" y2="${H}" stroke="${pal.fg}" stroke-width="0.3" opacity="0.06" />`
  // Building structure
  const bx = W * 0.12, bw = W * 0.5
  const floors = 4
  const fh = (g - 80) / floors
  for (let f = 0; f < floors; f++) {
    const fy = g - (f + 1) * fh
    e += `<rect x="${bx - 8}" y="${fy - 6}" width="${bw + 16}" height="6" fill="${pal.fg}" opacity="0.3" />` // slab
    e += `<rect x="${bx - 3}" y="${fy}" width="6" height="${fh - 6}" fill="${pal.fg}" opacity="0.12" />` // left wall
    e += `<rect x="${bx + bw - 3}" y="${fy}" width="6" height="${fh - 6}" fill="${pal.fg}" opacity="0.12" />` // right wall
    // Interior space
    e += `<rect x="${bx + 15}" y="${fy + 10}" width="${bw * 0.45}" height="${fh - 14}" fill="${pal.bg2}" opacity="0.2" />`
  }
  // Roof
  e += `<polygon points="${bx - 8},${g - floors * fh} ${bx + bw / 2},${g - floors * fh - 35} ${bx + bw + 8},${g - floors * fh}" fill="none" stroke="${pal.fg}" stroke-width="1.5" opacity="0.3" />`
  // Labels on right
  let y = 60
  const lines = wrapText(title, 30)
  for (const l of lines.slice(0, 2)) { e += `<text x="${W * 0.68}" y="${y}" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="${pal.fg}" opacity="0.8">${l}</text>`; y += 24 }
  if (stage) { e += `<text x="${W * 0.68}" y="${y}" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="${pal.acc}" opacity="0.6" letter-spacing="1">${stage}</text>`; y += 24 }
  for (const l of descLines.slice(0, 4)) { e += `<text x="${W * 0.68}" y="${y}" font-family="system-ui,sans-serif" font-size="11" fill="${pal.fg}" opacity="0.35">${l}</text>`; y += 16 }
  // Elevation marks
  for (let f = 0; f <= floors; f++) {
    const fy = f === 0 ? (g - floors * fh) : g - (floors - f) * fh
    e += `<line x1="${bx - 20}" y1="${fy}" x2="${bx - 6}" y2="${fy}" stroke="${pal.fg}" stroke-width="0.5" opacity="0.3" />`
    e += `<text x="${bx - 24}" y="${fy + 4}" font-family="monospace" font-size="8" fill="${pal.fg}" opacity="0.4" text-anchor="end">+${(f * 4.5).toFixed(1)}</text>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${e}</svg>`
}

// ─── STYLE 4: Diagram ──────────────────────────
function styleDiagram(W: number, H: number, hash: number, title: string, stage: string, category: string, descLines: string[]): string {
  const pal = pickPal(hash, 4)
  let e = `<rect width="${W}" height="${H}" fill="${pal.bg}" />`
  // Diagram elements — circles + arrows
  const nodes = 5
  const cx = W * 0.25, cy = H * 0.35, spacing = W * 0.15
  for (let i = 0; i < nodes; i++) {
    const x = cx + i * spacing
    const sz = 10 + r(hash, 50 + i, 0, 15)
    e += `<circle cx="${x}" cy="${cy}" r="${sz}" fill="${pal.bg2}" stroke="${pal.fg}" stroke-width="1.5" opacity="0.5" />`
    const labels = ["Site", "Form", "Space", "Light", "Material"]
    e += `<text x="${x}" y="${cy + sz + 16}" font-family="monospace" font-size="9" fill="${pal.fg}" opacity="0.4" text-anchor="middle">${labels[i % labels.length]}</text>`
    if (i < nodes - 1) {
      e += `<line x1="${x + sz}" y1="${cy}" x2="${x + spacing - sz}" y2="${cy}" stroke="${pal.acc}" stroke-width="1.5" opacity="0.25" />`
      e += `<polygon points="${x + spacing - sz - 4},${cy - 3} ${x + spacing - sz},${cy} ${x + spacing - sz - 4},${cy + 3}" fill="${pal.acc}" opacity="0.3" />`
    }
  }
  // Title below
  let y = cy + 60
  const lines = wrapText(title, 50)
  for (const l of lines.slice(0, 2)) { e += `<text x="40" y="${y}" font-family="system-ui,sans-serif" font-size="22" font-weight="700" fill="${pal.fg}" opacity="0.85">${l}</text>`; y += 28 }
  if (stage) { e += `<text x="40" y="${y}" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="${pal.acc}" opacity="0.6" letter-spacing="1.5">${stage}</text>`; y += 24 }
  for (const l of descLines.slice(0, 2)) { e += `<text x="40" y="${y}" font-family="system-ui,sans-serif" font-size="12" fill="${pal.fg}" opacity="0.35">${l}</text>`; y += 16 }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${e}</svg>`
}

// ─── STYLE 5: Isometric ────────────────────────
function styleIsometric(W: number, H: number, hash: number, title: string, stage: string, category: string, descLines: string[]): string {
  const pal = pickPal(hash, 5)
  let e = `<rect width="${W}" height="${H}" fill="${pal.bg}" />`
  // Isometric grid
  const originX = W * 0.65, originY = H * 0.45
  for (let i = -10; i < 10; i++) {
    const x1 = originX + i * 25, y1 = originY + i * 13
    e += `<line x1="${x1}" y1="${y1 - 200}" x2="${x1 + 150}" y2="${y1 - 120}" stroke="${pal.fg}" stroke-width="0.2" opacity="0.07" />`
    e += `<line x1="${x1}" y1="${y1 - 200}" x2="${x1 - 150}" y2="${y1 - 120}" stroke="${pal.fg}" stroke-width="0.2" opacity="0.07" />`
  }
  // Massing blocks
  for (let i = 0; i < 6; i++) {
    const bx = originX + r(hash, 60 + i * 3, -100, 100)
    const bz = originY + r(hash, 61 + i * 3, -80, 50)
    const bw = r(hash, 62 + i * 3, 20, 55)
    const bd = r(hash, 63 + i * 3, 15, 35)
    const bh = r(hash, 64 + i * 3, 25, 90)
    const iso = (xp: number, zp: number, hh: number) => [originX + (xp - zp) * 0.866, originY + (xp + zp) * 0.5 - hh]
    const pts = {
      t0: iso(bx, bz, bh), t1: iso(bx + bw, bz, bh), t2: iso(bx + bw, bz + bd, bh), t3: iso(bx, bz + bd, bh),
      b0: iso(bx, bz, 0), b1: iso(bx + bw, bz, 0), b2: iso(bx + bw, bz + bd, 0), b3: iso(bx, bz + bd, 0),
    }
    e += `<polygon points="${pts.t0[0]},${pts.t0[1]} ${pts.t1[0]},${pts.t1[1]} ${pts.t2[0]},${pts.t2[1]} ${pts.t3[0]},${pts.t3[1]}" fill="${pal.bg2}" stroke="${pal.fg}" stroke-width="0.8" opacity="0.5" />`
    e += `<polygon points="${pts.b1[0]},${pts.b1[1]} ${pts.b2[0]},${pts.b2[1]} ${pts.t2[0]},${pts.t2[1]} ${pts.t1[0]},${pts.t1[1]}" fill="${pal.fg}" opacity="0.06" />`
    e += `<polygon points="${pts.b0[0]},${pts.b0[1]} ${pts.b1[0]},${pts.b1[1]} ${pts.t1[0]},${pts.t1[1]} ${pts.t0[0]},${pts.t0[1]}" fill="${pal.acc}" opacity="0.08" />`
  }
  // Title block
  let y = 50
  const lines = wrapText(title, 35)
  for (const l of lines.slice(0, 2)) { e += `<text x="36" y="${y}" font-family="system-ui,sans-serif" font-size="22" font-weight="700" fill="${pal.fg}" opacity="0.85">${l}</text>`; y += 28 }
  if (stage) { e += `<text x="36" y="${y}" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="${pal.acc}" opacity="0.6" letter-spacing="1">${stage}</text>`; y += 22 }
  for (const l of descLines.slice(0, 3)) { e += `<text x="36" y="${y}" font-family="system-ui,sans-serif" font-size="11" fill="${pal.fg}" opacity="0.35">${l}</text>`; y += 15 }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${e}</svg>`
}

// ─── STYLE 6: Collage / Mixed ──────────────────
function styleCollage(W: number, H: number, hash: number, title: string, stage: string, category: string, descLines: string[]): string {
  const pal = pickPal(hash, 6)
  let e = `<rect width="${W}" height="${H}" fill="${pal.bg}" />`
  // Overlapping geometric shapes like a collage
  e += `<rect x="${W * 0.05}" y="${H * 0.1}" width="${W * 0.55}" height="${H * 0.7}" fill="${pal.bg2}" opacity="0.35" />`
  e += `<circle cx="${W * 0.35}" cy="${H * 0.45}" r="${W * 0.2}" fill="${pal.acc}" opacity="0.06" />`
  e += `<rect x="${W * 0.3}" y="${H * 0.55}" width="${W * 0.5}" height="${H * 0.35}" fill="${pal.fg}" opacity="0.04" transform="rotate(${r(hash, 70, -5, 5)}, ${W * 0.3}, ${H * 0.55})" />`
  // Textured dots
  for (let i = 0; i < 40; i++) {
    e += `<circle cx="${r(hash, 80 + i, W * 0.1, W * 0.55)}" cy="${r(hash, 81 + i, H * 0.12, H * 0.65)}" r="${r(hash, 82 + i, 2, 8)}" fill="${pal.fg}" opacity="${((r(hash, 83 + i, 3, 15)) / 100).toFixed(2)}" />`
  }
  // Title overlay
  let y = H * 0.55
  const lines = wrapText(title, 30)
  for (const l of lines.slice(0, 2)) { e += `<text x="44" y="${y}" font-family="system-ui,sans-serif" font-size="26" font-weight="800" fill="${pal.fg}" opacity="0.85" letter-spacing="-0.5">${l}</text>`; y += 32 }
  if (stage) { e += `<text x="46" y="${y}" font-family="system-ui,sans-serif" font-size="12" font-weight="600" fill="${pal.acc}" opacity="0.7" letter-spacing="1.5">${stage}</text>`; y += 26 }
  for (const l of descLines.slice(0, 3)) { e += `<text x="44" y="${y}" font-family="system-ui,sans-serif" font-size="12" fill="${pal.fg}" opacity="0.35">${l}</text>`; y += 16 }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${e}</svg>`
}

// ─── STYLE 7: Dark Mode ────────────────────────
function styleDarkMode(W: number, H: number, hash: number, title: string, stage: string, category: string, descLines: string[]): string {
  const pal = pickPal(hash, 7)
  const bg = pal.fg // swap — dark background
  const fg = pal.bg
  let e = `<rect width="${W}" height="${H}" fill="${bg}" />`
  // Glowing accent line
  e += `<line x1="40" y1="40" x2="${W - 40}" y2="40" stroke="${pal.acc}" stroke-width="0.5" opacity="0.3" />`
  // Grid of glowing dots
  for (let x = 40; x < W; x += 50) {
    for (let y = 50; y < H * 0.6; y += 50) {
      e += `<circle cx="${x}" cy="${y}" r="1.5" fill="${pal.acc}" opacity="0.12" />`
    }
  }
  // Title
  let y = H * 0.35
  const lines = wrapText(title, 35)
  for (const l of lines.slice(0, 2)) { e += `<text x="44" y="${y}" font-family="system-ui,sans-serif" font-size="30" font-weight="800" fill="${fg}" opacity="0.9" letter-spacing="-0.5">${l}</text>`; y += 38 }
  if (stage) { e += `<text x="46" y="${y}" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="${pal.acc}" opacity="0.6" letter-spacing="2">${stage}</text>`; y += 26 }
  for (const l of descLines.slice(0, 4)) { e += `<text x="44" y="${y}" font-family="system-ui,sans-serif" font-size="12" fill="${fg}" opacity="0.25">${l}</text>`; y += 16 }
  // Accent rectangle
  e += `<rect x="${W * 0.58}" y="${H * 0.15}" width="${W * 0.35}" height="${H * 0.55}" fill="${pal.acc}" opacity="0.06" />`
  e += `<rect x="${W * 0.58}" y="${H * 0.15}" width="${W * 0.35}" height="${H * 0.55}" fill="none" stroke="${pal.acc}" stroke-width="0.5" opacity="0.15" />`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${e}</svg>`
}
