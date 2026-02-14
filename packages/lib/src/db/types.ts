export interface Idea {
  id: string
  title: string
  created_at: string
  updated_at: string
  version: number
  deleted_at: string | null
}

export interface Block {
  id: string
  idea_id: string
  content: string
  position: number
  created_at: string
  updated_at: string
  version: number
  deleted_at: string | null
}

export interface Association {
  id: string
  idea_id_1: string
  idea_id_2: string
  created_at: string
  deleted_at: string | null
}
