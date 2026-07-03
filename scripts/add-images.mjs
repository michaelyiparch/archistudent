/**
 * Quick fix — adds project_images rows so the detail page gallery works.
 * Run: node scripts/add-images.mjs
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, "..", ".env.local")
const envContent = readFileSync(envPath, "utf-8")

const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.+)$`, "m"))
  return match ? match[1].trim() : null
}

const supabase = createClient(
  getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Architecture images that work well as project gallery
const GALLERY_IMAGES = [
  // Different architecture shots
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1464146072230-91cabc968266?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1600585154084-4e5fe4e97bf5?w=1200&h=800&fit=crop",
  // Interior shots
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1600210492493-0946911123f1?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1600607686527-6fb886090705?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1600573472556-a704e8132aa2?w=1200&h=800&fit=crop",
  // Model / drawing shots
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1618221381711-42ca8ab6e408?w=1200&h=800&fit=crop",
  // Urban / landscape
  "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1448630360428-65456659c677?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1481026469463-66327c86e544?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1464938050520-ef2270bb8ce8?w=1200&h=800&fit=crop",
  "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=1200&h=800&fit=crop",
]

const captions = [
  "Site plan and context analysis",
  "Ground floor plan",
  "Longitudinal section A-A'",
  "Cross section B-B'",
  "South elevation",
  "Physical study model at 1:200 scale",
  "Interior perspective — main atrium",
  "Detail axonometric — wall assembly",
  "Structural concept diagram",
  "Daylight analysis study",
  "Material palette and samples",
  "Night rendering — street level",
  "Program diagram",
  "Climate analysis — wind and solar study",
  "1:50 detail model",
  "Render — view from the park",
  "Upper floor plan",
  "Roof terrace view",
]

async function main() {
  console.log("🖼️  Adding gallery images to existing projects...\n")

  // Get all projects
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, title")

  if (error || !projects) {
    console.error("Failed to fetch projects:", error)
    process.exit(1)
  }

  let total = 0
  for (let pi = 0; pi < projects.length; pi++) {
    const project = projects[pi]

    // Check if project already has images
    const { data: existing } = await supabase
      .from("project_images")
      .select("id")
      .eq("project_id", project.id)

    if (existing && existing.length > 0) {
      console.log(`  ⏭  "${project.title}" already has ${existing.length} images`)
      continue
    }

    // Each project gets 3-5 gallery images
    const numImages = 3 + Math.floor(Math.random() * 3)
    const images = []

    for (let i = 0; i < numImages; i++) {
      const imgIdx = (pi * 5 + i * 7) % GALLERY_IMAGES.length
      const capIdx = (pi * 3 + i * 2) % captions.length
      images.push({
        project_id: project.id,
        url: GALLERY_IMAGES[imgIdx],
        caption: captions[capIdx],
        sort_order: i,
      })
    }

    const { error: insertErr } = await supabase
      .from("project_images")
      .insert(images)

    if (insertErr) {
      console.error(`  ❌ "${project.title}": ${insertErr.message}`)
    } else {
      console.log(`  ✓  "${project.title}" — ${numImages} images`)
      total += numImages
    }
  }

  console.log(`\n  ✅ Added ${total} images across ${projects.length} projects`)
  console.log("  Refresh the project detail pages!\n")
}

main()
