/**
 * ArchiStudent Seed Script
 *
 * Creates demo users, projects, reviews, likes, and comments
 * to make the platform look active and populated.
 *
 * Usage:
 *   1. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (get it from Supabase Dashboard → Project Settings → API → service_role key)
 *   2. Run: node scripts/seed.mjs
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

const SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL")
const SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY")

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local")
  console.error("   Get it from: Supabase Dashboard → Project Settings → API → service_role key")
  console.error("   Then add: SUPABASE_SERVICE_ROLE_KEY=eyJhbG... to .env.local")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Demo Users ─────────────────────────────────────────────
const DEMO_USERS = [
  // Professionals (architects who review)
  { email: "elena.architect@demo.com", password: "demo123456", full_name: "Elena Vasquez", role: "professional", university_or_firm: "Studio Morphosis", bio: "Licensed architect with 8 years of experience in cultural and institutional projects. Passionate about mentoring the next generation.", verified_professional: true },
  { email: "marcus.studio@demo.com", password: "demo123456", full_name: "Marcus Chen", role: "professional", university_or_firm: "Chen + Partners Architects", bio: "Specializing in sustainable residential design and adaptive reuse. RIBA chartered.", verified_professional: true },
  { email: "sarah.reviewer@demo.com", password: "demo123456", full_name: "Dr. Sarah Owusu", role: "professional", university_or_firm: "Owusu Urban Design Collective", bio: "Urban designer and educator. PhD in Urban Morphology from ETH Zurich. Published in Architectural Review.", verified_professional: true },
  // Students
  { email: "alex.student@demo.com", password: "demo123456", full_name: "Alex Rivera", role: "student", university_or_firm: "Columbia GSAPP", bio: "M.Arch candidate interested in public housing and community-centered design.", verified_professional: false },
  { email: "mei.student@demo.com", password: "demo123456", full_name: "Mei Tanaka", role: "student", university_or_firm: "TU Delft", bio: "Architecture student exploring the intersection of traditional Japanese carpentry and computational design.", verified_professional: false },
  { email: "oscar.student@demo.com", password: "demo123456", full_name: "Oscar Bergman", role: "student", university_or_firm: "KTH Stockholm", bio: "Final year student focused on Nordic sustainable architecture and timber construction.", verified_professional: false },
  { email: "priya.student@demo.com", password: "demo123456", full_name: "Priya Kapoor", role: "student", university_or_firm: "MIT School of Architecture", bio: "Exploring parametric design and digital fabrication techniques for affordable housing in the Global South.", verified_professional: false },
  { email: "james.student@demo.com", password: "demo123456", full_name: "James O'Brien", role: "student", university_or_firm: "UCL Bartlett", bio: "Interested in speculative architecture, narrative-driven design, and urban futures.", verified_professional: false },
]

// ─── Architecture Project Cover Images (Unsplash) ───────────
const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1448630360428-65456659c677?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1481026469463-66327c86e544?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1464938050520-ef2270bb8ce8?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600566753086-00f18f6b0050?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800&h=600&fit=crop",
]

// ─── Demo Projects ──────────────────────────────────────────
const DEMO_PROJECTS = [
  {
    studentEmail: "alex.student@demo.com",
    title: "Cascadia Public Library",
    description: "A community-centered library design for the Pacific Northwest that integrates biophilic principles and mass timber construction. The design features a dramatic cantilevered reading room overlooking a restored wetland, with daylight carefully calibrated through a series of wooden louver systems. The project explores how public architecture can serve as both a knowledge repository and an ecological steward.",
    category: "institutional",
    stage: "design_development",
  },
  {
    studentEmail: "mei.student@demo.com",
    title: "Weaving Thresholds — Mixed-Use Housing",
    description: "This project reimagines the traditional Japanese machiya townhouse for contemporary urban living. Located in a dense Kyoto neighborhood, the design uses a 'weaving' concept to interlace public and private spaces across three connected volumes. Traditional timber joinery techniques are reinterpreted through CNC fabrication, creating a dialogue between craft and digital manufacturing.",
    category: "residential",
    stage: "final",
  },
  {
    studentEmail: "oscar.student@demo.com",
    title: "Fjord Observation Center",
    description: "A landscape-integrated observation center on the Norwegian coastline that responds to extreme tidal shifts. The building emerges from the rocky shore as a series of folded concrete planes, with a green roof that merges with the surrounding terrain. Interior spaces are organized along a choreographed descent path, framing curated views of the fjord and horizon.",
    category: "landscape",
    stage: "schematic",
  },
  {
    studentEmail: "priya.student@demo.com",
    title: "Modular Market Hall — Mumbai",
    description: "A reimagined market hall for Mumbai's Dadar district that uses a modular bamboo-and-steel structural system. The design addresses flooding resilience through an elevated plinth strategy, while a perforated brick screen modulates light, ventilation, and privacy. The project proposes a replicable typology for informal market consolidation across Indian cities.",
    category: "commercial",
    stage: "concept",
  },
  {
    studentEmail: "james.student@demo.com",
    title: "The Archive of Lost Futures",
    description: "A speculative design project exploring memory, ruin, and adaptive reuse. Set within an abandoned Victorian pumping station in East London, the project proposes a 'living archive' where fragments of demolished social housing estates are reconstructed as spatial installations. The design negotiates between preservation and transformation, asking whether architecture can heal urban trauma.",
    category: "urban",
    stage: "concept",
  },
  {
    studentEmail: "alex.student@demo.com",
    title: "Micro-Unit Tower — NYC",
    description: "A 28-story residential tower on a tight Midtown Manhattan infill lot, exploring the extreme limits of micro-apartment living (180–320 sq ft). Each unit features a transformable 'core wall' that shifts between day and night configurations. The tower's facade is a gradient of solid and void, calibrated to privacy gradients and solar exposure across all four orientations.",
    category: "residential",
    stage: "schematic",
  },
  {
    studentEmail: "mei.student@demo.com",
    title: "Kyoto Craft Incubator",
    description: "A co-working and exhibition space for traditional Kyoto artisans to collaborate with contemporary designers. The campus is organized around a series of courtyards inspired by Zen gardens, with workshop spaces opening directly onto shared outdoor rooms. The roofscape is a folded timber diagrid that references origami principles while providing north-facing clerestory light ideal for craft work.",
    category: "commercial",
    stage: "design_development",
  },
  {
    studentEmail: "priya.student@demo.com",
    title: "Floating Schools — Bangladesh Delta",
    description: "An amphibious school typology for climate-vulnerable communities in the Ganges-Brahmaputra delta. During the dry season, the school sits on a stabilized earth plinth. During monsoon flooding, buoyant bamboo-fiber hulls lift the classrooms with the rising water. The project integrates rainwater harvesting, solar power, and a community garden that survives both seasons.",
    category: "institutional",
    stage: "final",
  },
  {
    studentEmail: "oscar.student@demo.com",
    title: "Thermal Baths — Reykjavik",
    description: "A geothermal bath complex that frames the drama of the Icelandic landscape. Three primary volumes—hot, warm, and cold—are carved into a basalt escarpment, each offering a distinct sensory and thermal experience. The concrete walls are pigmented with local volcanic ash, and the roofscape is a walkable moss garden that changes color with the seasons.",
    category: "interior",
    stage: "design_development",
  },
  {
    studentEmail: "james.student@demo.com",
    title: "Vertical Farm Typologies",
    description: "A research-driven project investigating five vertical farming typologies for five different urban contexts: London terrace, Shenzhen tower, Mumbai chawl, São Paulo favela, and Lagos compound. Each typology adapts hydroponic systems to local climate, construction culture, and food traditions. The project argues that food infrastructure should be as site-specific as housing.",
    category: "urban",
    stage: "concept",
  },
  {
    studentEmail: "alex.student@demo.com",
    title: "Brooklyn Waterfront Arts Center",
    description: "A multi-venue arts complex on a former industrial pier in Red Hook, Brooklyn. The design embraces the site's gritty material history through exposed steel, reclaimed timber, and a weathering Cor-ten steel envelope. Performance spaces are organized as a 'village' of distinct volumes connected by a covered public boardwalk, maintaining porosity between the street and the water.",
    category: "institutional",
    stage: "schematic",
  },
  {
    studentEmail: "mei.student@demo.com",
    title: "Paper Tea House Pavilion",
    description: "A temporary pavilion exploring the structural potential of recycled washi paper pulp formed into self-supporting catenary shells. The installation was constructed over two weeks as part of the Echigo-Tsumari Art Triennale. Despite its apparent fragility, the pavilion withstood a typhoon season, documenting the surprising durability of cellulose-based composites.",
    category: "other",
    stage: "final",
  },
]

// ─── Review Comments (per dimension) ────────────────────────
const PROFESSIONAL_REVIEWS = [
  // Elena Vasquez reviews
  {
    reviewerEmail: "elena.architect@demo.com",
    projectTitle: "Cascadia Public Library",
    concept_rating: 5, execution_rating: 4, presentation_rating: 5, overall_rating: 5,
    comment: "Exceptional clarity of design intent. The biophilic integration goes beyond superficial greenery — the louver system's daylight calibration shows rigorous environmental thinking. The wetland restoration as part of the architectural proposition is the kind of ecological ambition we need more of. For execution, the mass timber connection details at the cantilever need further resolution — the load path at the support junction feels slightly unresolved. Overall, a mature and compelling project that would stand out in any professional portfolio."
  },
  {
    reviewerEmail: "elena.architect@demo.com",
    projectTitle: "Weaving Thresholds — Mixed-Use Housing",
    concept_rating: 4, execution_rating: 5, presentation_rating: 5, overall_rating: 5,
    comment: "The weaving metaphor is beautifully sustained throughout the design — this isn't just a formal gesture but a genuine organizational principle. Your CNC joinery research is publication-worthy; the detail drawings at 1:5 scale are better than most professional submissions I've seen. My one critique: the ground-floor threshold between the public lane and the private courtyard could be more nuanced — right now it's a binary condition in what is otherwise a gradient-driven project."
  },
  {
    reviewerEmail: "elena.architect@demo.com",
    projectTitle: "Brooklyn Waterfront Arts Center",
    concept_rating: 4, execution_rating: 4, presentation_rating: 4, overall_rating: 4,
    comment: "Strong urban strategy — the 'village of volumes' approach maintains the waterfront porosity that most pier projects lose. The material palette is well-judged for the Red Hook context. I'd like to see more development of the acoustic separation between performance venues — the boardwalk as connector is poetic, but in practice, sound bleed could be an issue. The Cor-ten weathering studies on page 23 are excellent and show professional-level foresight."
  },
  // Marcus Chen reviews
  {
    reviewerEmail: "marcus.studio@demo.com",
    projectTitle: "Micro-Unit Tower — NYC",
    concept_rating: 5, execution_rating: 4, presentation_rating: 4, overall_rating: 4,
    comment: "The transformable core wall is genuinely innovative — I haven't seen this level of micro-unit thinking since the Nakagin Capsule Tower. Your ergonomic studies at 1:1 scale in the test mockup photos are convincing. The facade gradient logic is sound but could be pushed further — the transition from solid to void on the north face feels arbitrary compared to the rigorous solar logic on the south. A very strong project that is 90% of the way to being exceptional."
  },
  {
    reviewerEmail: "marcus.studio@demo.com",
    projectTitle: "Floating Schools — Bangladesh Delta",
    concept_rating: 5, execution_rating: 5, presentation_rating: 5, overall_rating: 5,
    comment: "This is the kind of architecture the world desperately needs — technically sophisticated, culturally embedded, and climate-adaptive. The buoyant bamboo-fiber hull is a brilliant material innovation, and I appreciate that you tested it with physical prototypes rather than just digital simulations. The community garden integration is thoughtful. The one thing I'd add: a maintenance manual for the amphibious system, since long-term community stewardship will determine success. This project deserves to be built."
  },
  {
    reviewerEmail: "marcus.studio@demo.com",
    projectTitle: "Thermal Baths — Reykjavik",
    concept_rating: 4, execution_rating: 4, presentation_rating: 5, overall_rating: 4,
    comment: "The sensory choreography — hot, warm, cold carved into basalt — is a strong narrative framework. The volcanic ash concrete pigmentation is a lovely contextual touch. However, the thermal zoning at the pool edges needs more detailed resolution — in a cold climate, the transition from 40°C water to -5°C air is a genuine safety and comfort concern. The moss roof section drawings are gorgeous and entirely convincing."
  },
  // Sarah Owusu reviews
  {
    reviewerEmail: "sarah.reviewer@demo.com",
    projectTitle: "Modular Market Hall — Mumbai",
    concept_rating: 5, execution_rating: 3, presentation_rating: 4, overall_rating: 4,
    comment: "The modular bamboo-steel system is a very strong idea with real applicability across Indian cities — this isn't just a one-off design but a replicable typology, which is exactly what the profession needs more of. The flood-resilience strategy is well-researched. Execution-wise, the bamboo-to-steel connection detailing needs significant development — this is the critical joint that will determine both cost and durability. Develop this further and you have a competition-winning project."
  },
  {
    reviewerEmail: "sarah.reviewer@demo.com",
    projectTitle: "The Archive of Lost Futures",
    concept_rating: 5, execution_rating: 4, presentation_rating: 5, overall_rating: 5,
    comment: "Rarely do I see a student project that engages so thoughtfully with the politics of architecture. The question — 'can architecture heal urban trauma?' — is profound, and the project doesn't pretend to have easy answers. The spatial installations are haunting and beautiful. The theoretical framework could be strengthened with more references to memory studies literature, but the design itself communicates the ideas more powerfully than any text could. This is Bartlett-level conceptual work at its best."
  },
  {
    reviewerEmail: "sarah.reviewer@demo.com",
    projectTitle: "Vertical Farm Typologies",
    concept_rating: 5, execution_rating: 3, presentation_rating: 5, overall_rating: 4,
    comment: "The comparative methodology across five urban contexts is ambitious and well-structured — this is PhD-level research thinking applied to design. The argument for site-specific food infrastructure is compelling and timely. However, the hydroponic system integration at the architectural scale needs more development — currently the systems feel applied to the buildings rather than shaping them. The Lagos compound typology is the strongest of the five; develop that one further."
  },
]

// ─── Comments ───────────────────────────────────────────────
const DEMO_COMMENTS = [
  { authorEmail: "oscar.student@demo.com", projectTitle: "Cascadia Public Library", content: "The daylighting studies are incredible! What software did you use for the louver calibration analysis?" },
  { authorEmail: "priya.student@demo.com", projectTitle: "Cascadia Public Library", content: "Love how the building gives back ecologically. The wetland restoration is a powerful statement." },
  { authorEmail: "james.student@demo.com", projectTitle: "Weaving Thresholds — Mixed-Use Housing", content: "The CNC joinery work is stunning. Have you looked at Shigeru Ban's timber connections as a reference?" },
  { authorEmail: "alex.student@demo.com", projectTitle: "Weaving Thresholds — Mixed-Use Housing", content: "Would love to see more of the interior courtyard — the sectional drawings hint at something really special." },
  { authorEmail: "mei.student@demo.com", projectTitle: "Fjord Observation Center", content: "The folded concrete planes remind me of Utzon's Bagsværd Church. Intentional reference?" },
  { authorEmail: "priya.student@demo.com", projectTitle: "Floating Schools — Bangladesh Delta", content: "Thank you for the kind review! The bamboo-fiber hull prototypes were built with local boat builders in Dhaka — their knowledge was invaluable." },
  { authorEmail: "oscar.student@demo.com", projectTitle: "Thermal Baths — Reykjavik", content: "The moss roof detail is beautiful. Did you test different moss species for the seasonal color study?" },
  { authorEmail: "alex.student@demo.com", projectTitle: "The Archive of Lost Futures", content: "This is genuinely moving. The fragments from demolished estates carry so much weight. Would love to see this exhibited." },
  { authorEmail: "james.student@demo.com", projectTitle: "Modular Market Hall — Mumbai", content: "The bamboo connection detail is the key challenge — maybe look at Simón Vélez's work in Colombia for inspiration on bolted bamboo joints?" },
  { authorEmail: "mei.student@demo.com", projectTitle: "Vertical Farm Typologies", content: "Fascinating research framework! The Lagos compound typology feels the most resolved — would love to see that one developed into a full project." },
]

// ─── Main ───────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Seeding ArchiStudent with demo data...\n")

  // Step 1: Create auth users
  console.log("─".repeat(50))
  console.log("👤 Creating demo users...")
  const profileMap = new Map() // email → profile id

  for (const u of DEMO_USERS) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const exists = existingUsers?.users?.find(eu => eu.email === u.email)

    if (exists) {
      console.log(`  ⏭  ${u.email} already exists`)
      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", exists.id)
        .single()
      if (profile) profileMap.set(u.email, { id: profile.id, role: u.role, userId: exists.id })
      continue
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    })

    if (authError) {
      console.error(`  ❌ Failed to create ${u.email}: ${authError.message}`)
      continue
    }

    console.log(`  ✓  ${u.email} (${u.role})`)

    // Profile is auto-created by trigger — update it with full info
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", authUser.user.id)
      .single()

    if (profile) {
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          role: u.role,
          full_name: u.full_name,
          university_or_firm: u.university_or_firm,
          bio: u.bio,
          verified_professional: u.verified_professional,
        })
        .eq("id", profile.id)

      if (updateErr) {
        console.error(`  ⚠  Profile update error for ${u.email}: ${updateErr.message}`)
      }

      profileMap.set(u.email, { id: profile.id, role: u.role, userId: authUser.user.id })
    }
  }

  console.log(`\n  ✅ ${profileMap.size} profiles ready\n`)

  // Step 2: Create projects
  console.log("─".repeat(50))
  console.log("🏛️  Creating demo projects...")
  const projectMap = new Map() // title → project id

  for (let i = 0; i < DEMO_PROJECTS.length; i++) {
    const p = DEMO_PROJECTS[i]
    const profile = profileMap.get(p.studentEmail)
    if (!profile) {
      console.log(`  ⚠  Skipping "${p.title}" — author profile not found`)
      continue
    }

    // Check if project already exists
    const { data: existing } = await supabase
      .from("projects")
      .select("id")
      .eq("title", p.title)
      .eq("user_id", profile.id)
      .single()

    if (existing) {
      console.log(`  ⏭  "${p.title}" already exists`)
      projectMap.set(p.title, existing.id)
      continue
    }

    const coverUrl = COVER_IMAGES[i % COVER_IMAGES.length]

    const { data: project, error: projError } = await supabase
      .from("projects")
      .insert({
        user_id: profile.id,
        title: p.title,
        description: p.description,
        category: p.category,
        stage: p.stage,
        cover_image_url: coverUrl,
      })
      .select("id")
      .single()

    if (projError) {
      console.error(`  ❌ Failed to create "${p.title}": ${projError.message}`)
      continue
    }

    console.log(`  ✓  "${p.title}" (${p.stage}) — by ${p.studentEmail}`)
    projectMap.set(p.title, project.id)
  }

  console.log(`\n  ✅ ${projectMap.size} projects ready\n`)

  // Step 3: Create reviews
  console.log("─".repeat(50))
  console.log("⭐ Creating professional reviews...")
  let reviewCount = 0

  for (const r of PROFESSIONAL_REVIEWS) {
    const reviewerProfile = profileMap.get(r.reviewerEmail)
    const projectId = projectMap.get(r.projectTitle)

    if (!reviewerProfile || !projectId) {
      console.log(`  ⚠  Skipping review — missing reviewer or project`)
      continue
    }

    // Check if review already exists (unique per project+reviewer)
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("project_id", projectId)
      .eq("reviewer_id", reviewerProfile.id)
      .single()

    if (existing) {
      console.log(`  ⏭  Review for "${r.projectTitle}" by ${r.reviewerEmail} already exists`)
      continue
    }

    const { error: reviewErr } = await supabase
      .from("reviews")
      .insert({
        project_id: projectId,
        reviewer_id: reviewerProfile.id,
        concept_rating: r.concept_rating,
        execution_rating: r.execution_rating,
        presentation_rating: r.presentation_rating,
        overall_rating: r.overall_rating,
        comment: r.comment,
      })

    if (reviewErr) {
      console.error(`  ❌ Review error: ${reviewErr.message} (code: ${reviewErr.code}, details: ${JSON.stringify(reviewErr.details)})`)
      continue
    }

    console.log(`  ✓  ${r.reviewerEmail} reviewed "${r.projectTitle}" — ${r.overall_rating}/5`)
    reviewCount++
  }

  console.log(`\n  ✅ ${reviewCount} reviews created\n`)

  // Step 4: Create likes
  console.log("─".repeat(50))
  console.log("❤️  Creating likes...")
  let likeCount = 0

  // Spread likes across projects from various users
  const likePairs = []
  const allProjectTitles = [...projectMap.keys()]
  const allStudentEmails = DEMO_USERS.filter(u => u.role === "student").map(u => u.email)

  for (const projectTitle of allProjectTitles) {
    const projectId = projectMap.get(projectTitle)
    // Each project gets 2-5 likes from random students (excluding the author)
    const authorEmail = DEMO_PROJECTS.find(p => p.title === projectTitle)?.studentEmail
    const eligibleLikers = allStudentEmails.filter(e => e !== authorEmail)
    const numLikes = 2 + Math.floor(Math.random() * 4)

    for (let i = 0; i < Math.min(numLikes, eligibleLikers.length); i++) {
      const likerEmail = eligibleLikers[Math.floor(Math.random() * eligibleLikers.length)]
      likePairs.push({ projectId, likerEmail, projectTitle })
    }
  }

  // Deduplicate
  const uniqueLikes = []
  const seen = new Set()
  for (const lp of likePairs) {
    const key = `${lp.projectId}-${lp.likerEmail}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueLikes.push(lp)
    }
  }

  for (const lp of uniqueLikes) {
    const likerProfile = profileMap.get(lp.likerEmail)
    if (!likerProfile) continue

    const { error: likeErr } = await supabase
      .from("likes")
      .insert({
        project_id: lp.projectId,
        user_id: likerProfile.id,
      })
      .select("id")
      .single()

    if (likeErr) {
      // Skip duplicate key errors (unique constraint)
      if (likeErr.code !== "23505") {
        console.error(`  ❌ Like error for "${lp.projectTitle}" by ${lp.likerEmail}: ${likeErr.message}`)
      }
      continue
    }

    likeCount++
  }

  console.log(`  ✅ ${likeCount} likes spread across projects\n`)

  // Step 5: Create comments
  console.log("─".repeat(50))
  console.log("💬 Creating comments...")
  let commentCount = 0

  for (const c of DEMO_COMMENTS) {
    const authorProfile = profileMap.get(c.authorEmail)
    const projectId = projectMap.get(c.projectTitle)

    if (!authorProfile || !projectId) continue

    const { error: commentErr } = await supabase
      .from("comments")
      .insert({
        project_id: projectId,
        user_id: authorProfile.id,
        content: c.content,
      })

    if (commentErr) {
      console.error(`  ❌ Comment error: ${commentErr.message}`)
      continue
    }

    console.log(`  ✓  ${c.authorEmail} on "${c.projectTitle}"`)
    commentCount++
  }

  console.log(`\n  ✅ ${commentCount} comments created\n`)

  // ─── Done ─────────────────────────────────────────────────
  console.log("─".repeat(50))
  console.log("🎉 Seed complete!")
  console.log("─".repeat(50))
  console.log(`  👤 ${profileMap.size} users`)
  console.log(`  🏛️  ${projectMap.size} projects`)
  console.log(`  ⭐ ${reviewCount} reviews`)
  console.log(`  ❤️  ${likeCount} likes`)
  console.log(`  💬 ${commentCount} comments`)
  console.log("\n  Visit http://localhost:3000 to see the seeded data!\n")
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
