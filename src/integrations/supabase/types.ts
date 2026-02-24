export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      evaluations: {
        Row: {
          copy_score: number | null
          created_at: string
          creative_index: number | null
          design_score: number | null
          feedback_copy: string | null
          feedback_design: string | null
          id: string
          is_official: boolean
          material_id: string
          status: string | null
          version_number: number
        }
        Insert: {
          copy_score?: number | null
          created_at?: string
          creative_index?: number | null
          design_score?: number | null
          feedback_copy?: string | null
          feedback_design?: string | null
          id?: string
          is_official?: boolean
          material_id: string
          status?: string | null
          version_number?: number
        }
        Update: {
          copy_score?: number | null
          created_at?: string
          creative_index?: number | null
          design_score?: number | null
          feedback_copy?: string | null
          feedback_design?: string | null
          id?: string
          is_official?: boolean
          material_id?: string
          status?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_status: {
        Row: {
          column_status: string
          id: string
          material_id: string
          updated_at: string
        }
        Insert: {
          column_status?: string
          id?: string
          material_id: string
          updated_at?: string
        }
        Update: {
          column_status?: string
          id?: string
          material_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_status_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          created_at: string
          id: string
          metric_name: string
          metric_value: number
          period: string | null
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_name: string
          metric_value?: number
          period?: string | null
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_name?: string
          metric_value?: number
          period?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      material_files: {
        Row: {
          created_at: string
          creative_index: number | null
          file_type: string
          file_url: string
          id: string
          material_id: string
          slot: string | null
        }
        Insert: {
          created_at?: string
          creative_index?: number | null
          file_type?: string
          file_url: string
          id?: string
          material_id: string
          slot?: string | null
        }
        Update: {
          created_at?: string
          creative_index?: number | null
          file_type?: string
          file_url?: string
          id?: string
          material_id?: string
          slot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_files_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          caption: string | null
          copy_text: string | null
          copywriter_name: string | null
          created_at: string
          designer_name: string | null
          id: string
          is_active_version: boolean
          project_id: string
          status: string
          version_number: number
        }
        Insert: {
          caption?: string | null
          copy_text?: string | null
          copywriter_name?: string | null
          created_at?: string
          designer_name?: string | null
          id?: string
          is_active_version?: boolean
          project_id: string
          status?: string
          version_number?: number
        }
        Update: {
          caption?: string | null
          copy_text?: string | null
          copywriter_name?: string | null
          created_at?: string
          designer_name?: string | null
          id?: string
          is_active_version?: boolean
          project_id?: string
          status?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          campaign_name: string | null
          caption: string | null
          client_name: string | null
          copy_text: string | null
          copywriter_name: string | null
          created_at: string
          deadline: string | null
          description: string | null
          designer_name: string | null
          external_reference_id: string | null
          format: string | null
          id: string
          name: string
          notes: string | null
          squad: string | null
          squad_source: string | null
          status: string
          type: string
        }
        Insert: {
          campaign_name?: string | null
          caption?: string | null
          client_name?: string | null
          copy_text?: string | null
          copywriter_name?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          designer_name?: string | null
          external_reference_id?: string | null
          format?: string | null
          id?: string
          name: string
          notes?: string | null
          squad?: string | null
          squad_source?: string | null
          status?: string
          type?: string
        }
        Update: {
          campaign_name?: string | null
          caption?: string | null
          client_name?: string | null
          copy_text?: string | null
          copywriter_name?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          designer_name?: string | null
          external_reference_id?: string | null
          format?: string | null
          id?: string
          name?: string
          notes?: string | null
          squad?: string | null
          squad_source?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
