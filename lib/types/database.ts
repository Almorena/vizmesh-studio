export interface Database {
  public: {
    Tables: {
      dashboards: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      widgets: {
        Row: {
          id: string
          dashboard_id: string
          prompt: string
          title: string
          data_source: any
          visualization: any
          position: { x: number; y: number }
          size: { width: number; height: number }
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          dashboard_id: string
          prompt: string
          title: string
          data_source: any
          visualization: any
          position?: { x: number; y: number }
          size?: { width: number; height: number }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          dashboard_id?: string
          prompt?: string
          title?: string
          data_source?: any
          visualization?: any
          position?: { x: number; y: number }
          size?: { width: number; height: number }
          created_at?: string
          updated_at?: string
        }
      }
      data_sources: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          config: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: string
          config: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          config?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
