/**
 * Fix images — sync covers with gallery, use verified working URLs.
 * Run: node scripts/fix-images.mjs
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, "..", ".env.local")
const envContent = readFileSync(envPath, "utf-8")
const g = (k) => (envContent.match(new RegExp(`^${k}=(.+)$`, "m")) || [])[1]

const supabase = createClient(g("NEXT_PUBLIC_SUPABASE_URL"), g("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Clean project cover cards — always loads, title matches content
const SITE_URL = g("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000"

const url = (seed) =>
  `${SITE_URL}/api/placeholder/1200/800/${encodeURIComponent(seed)}`

async function main() {
  console.log("🔧 Fixing cover images and gallery sync...\n")

  const { data: projects, error } = await supabase.from("projects").select("id, title")
  if (error || !projects) { console.error(error); process.exit(1) }

  // Delete all old project_images
  console.log("  Clearing old gallery images...")
  const { error: delErr } = await supabase.from("project_images").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  if (delErr) console.error("  Delete error:", delErr.message)
  else console.log("  ✓ Old images cleared\n")

  let totalImages = 0
  for (let pi = 0; pi < projects.length; pi++) {
    const p = projects[pi]
    // Cover card with full project info — title, stage, category, description
    const { data: project } = await supabase.from("projects").select("stage, category, description").eq("id", p.id).single()
    const stage = project?.stage || "concept"
    const category = project?.category || ""
    const desc = (project?.description || "").slice(0, 200)
    const seed = `${p.title}|${stage}|${category}|${desc}`
    const coverUrl = url(seed)

    // Update cover
    await supabase.from("projects").update({ cover_image_url: coverUrl }).eq("id", p.id)

    // Insert single gallery image (same as cover)
    const images = [{
      project_id: p.id,
      url: coverUrl,
      caption: "Project presentation board",
      sort_order: 0,
    }]

    const { error: insErr } = await supabase.from("project_images").insert(images)
    if (insErr) {
      console.error(`  ❌ "${p.title}": ${insErr.message}`)
    } else {
      console.log(`  ✓  "${p.title}" (${stage}) — cover = gallery`)
      totalImages += 1
    }
  }

  console.log(`\n  ✅ Fixed ${projects.length} projects with ${totalImages} total images`)
  console.log("  Covers now match the first gallery image. Hard refresh (Ctrl+Shift+R) to see!\n")
}

main()
