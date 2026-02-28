export type Database = {
  public: {
    Tables: {
      ideas: {
        Row: {
          id: string
          title: string
          created_at: string
          updated_at: string
          deleted_at: string | null
          version: number
        }
        Insert: {
          id?: string
          title: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          version?: number
        }
        Update: {
          id?: string
          title?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          version?: number
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']