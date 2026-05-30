export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      builds: {
        Row: {
          id: string
          user_id: string
          name: string
          repo: string | null
          lang: string | null
          description: string | null
          checks: Json
          auto_checks: Json
          custom_items: Json
          docs: Json
          section_open: Json
          gh_data: Json
          signals: Json
          dep: Json
          last_scan: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['builds']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['builds']['Insert']>
      }
    }
  }
}
