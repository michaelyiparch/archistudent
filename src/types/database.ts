export type UserRole = "student" | "professional"

export interface Profile {
  id: string
  user_id: string
  role: UserRole
  full_name: string
  university_or_firm: string | null
  bio: string | null
  avatar_url: string | null
  verified_professional: boolean
  is_admin: boolean
  skills: string[] | null
  education: string | null
  open_to_work: boolean
  portfolio_url: string | null
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
  // Joined
  sender?: Pick<Profile, "id" | "full_name" | "avatar_url" | "role">
  receiver?: Pick<Profile, "id" | "full_name" | "avatar_url" | "role">
}

export type ProjectCategory =
  | "residential"
  | "commercial"
  | "institutional"
  | "landscape"
  | "urban"
  | "interior"
  | "other"

export type ProjectStage =
  | "concept"
  | "schematic"
  | "design_development"
  | "final"

export interface Project {
  id: string
  user_id: string
  title: string
  description: string
  category: ProjectCategory
  stage: ProjectStage
  cover_image_url: string | null
  created_at: string
  updated_at: string
  // Joined fields
  profiles?: Pick<Profile, "id" | "full_name" | "avatar_url" | "university_or_firm" | "role" | "verified_professional">
  project_images?: ProjectImage[]
  review_count?: number
  like_count?: number
  user_has_liked?: boolean
  avg_rating?: number
}

export interface ProjectImage {
  id: string
  project_id: string
  url: string
  caption: string | null
  sort_order: number
}

export interface Review {
  id: string
  project_id: string
  reviewer_id: string
  concept_rating: number
  execution_rating: number
  presentation_rating: number
  overall_rating: number
  comment: string
  created_at: string
  // Joined
  profiles?: Pick<Profile, "id" | "full_name" | "avatar_url" | "university_or_firm" | "verified_professional">
}

export interface Like {
  id: string
  project_id: string
  user_id: string
  created_at: string
}

export interface Comment {
  id: string
  project_id: string
  user_id: string
  content: string
  created_at: string
  // Joined
  profiles?: Pick<Profile, "id" | "full_name" | "avatar_url" | "role">
}

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  residential: "Residential",
  commercial: "Commercial",
  institutional: "Institutional",
  landscape: "Landscape",
  urban: "Urban Design",
  interior: "Interior",
  other: "Other",
}

export const STAGE_LABELS: Record<ProjectStage, string> = {
  concept: "Concept",
  schematic: "Schematic",
  design_development: "Design Development",
  final: "Final",
}
