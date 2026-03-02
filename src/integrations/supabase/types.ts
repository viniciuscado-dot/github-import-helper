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
      briefing_form_labels: {
        Row: {
          created_at: string
          description_text: string | null
          field_key: string
          id: string
          label_text: string | null
          section_description: string | null
          section_title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description_text?: string | null
          field_key: string
          id?: string
          label_text?: string | null
          section_description?: string | null
          section_title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description_text?: string | null
          field_key?: string
          id?: string
          label_text?: string | null
          section_description?: string | null
          section_title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      copy_forms: {
        Row: {
          ai_provider: string | null
          ai_response: string | null
          avatar_principal: string | null
          cases_impressionantes: string | null
          copy_type: string
          created_at: string
          created_by: string
          diferencial_competitivo: string | null
          document_files: Json | null
          id: string
          informacao_extra: string | null
          investimento_medio: string | null
          maior_objecao: string | null
          momento_jornada: string | null
          nicho_empresa: string | null
          nome_empresa: string | null
          nomes_empresas: string | null
          numeros_certificados: string | null
          pergunta_qualificatoria: string | null
          principal_inimigo: string | null
          publico_alvo: string | null
          response_generated_at: string | null
          reuniao_boas_vindas: string | null
          reuniao_brainstorm: string | null
          reuniao_kick_off: string | null
          servicos_produtos: string | null
          status: string
          tamanho_lp: string | null
          updated_at: string
        }
        Insert: {
          ai_provider?: string | null
          ai_response?: string | null
          avatar_principal?: string | null
          cases_impressionantes?: string | null
          copy_type?: string
          created_at?: string
          created_by: string
          diferencial_competitivo?: string | null
          document_files?: Json | null
          id?: string
          informacao_extra?: string | null
          investimento_medio?: string | null
          maior_objecao?: string | null
          momento_jornada?: string | null
          nicho_empresa?: string | null
          nome_empresa?: string | null
          nomes_empresas?: string | null
          numeros_certificados?: string | null
          pergunta_qualificatoria?: string | null
          principal_inimigo?: string | null
          publico_alvo?: string | null
          response_generated_at?: string | null
          reuniao_boas_vindas?: string | null
          reuniao_brainstorm?: string | null
          reuniao_kick_off?: string | null
          servicos_produtos?: string | null
          status?: string
          tamanho_lp?: string | null
          updated_at?: string
        }
        Update: {
          ai_provider?: string | null
          ai_response?: string | null
          avatar_principal?: string | null
          cases_impressionantes?: string | null
          copy_type?: string
          created_at?: string
          created_by?: string
          diferencial_competitivo?: string | null
          document_files?: Json | null
          id?: string
          informacao_extra?: string | null
          investimento_medio?: string | null
          maior_objecao?: string | null
          momento_jornada?: string | null
          nicho_empresa?: string | null
          nome_empresa?: string | null
          nomes_empresas?: string | null
          numeros_certificados?: string | null
          pergunta_qualificatoria?: string | null
          principal_inimigo?: string | null
          publico_alvo?: string | null
          response_generated_at?: string | null
          reuniao_boas_vindas?: string | null
          reuniao_brainstorm?: string | null
          reuniao_kick_off?: string | null
          servicos_produtos?: string | null
          status?: string
          tamanho_lp?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      default_briefing_documents: {
        Row: {
          copy_type: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_active: boolean
          uploaded_by: string
        }
        Insert: {
          copy_type?: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_active?: boolean
          uploaded_by: string
        }
        Update: {
          copy_type?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_active?: boolean
          uploaded_by?: string
        }
        Relationships: []
      }
      default_prompts: {
        Row: {
          content: string
          copy_type: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          copy_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          copy_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          approval_status: string | null
          client_name: string | null
          copy_comment: string | null
          copy_score: number | null
          created_at: string
          creative_index: number | null
          design_comment: string | null
          design_score: number | null
          feedback_copy: string | null
          feedback_design: string | null
          id: string
          is_official: boolean
          material_id: string
          per_creative: Json | null
          project_id: string | null
          status: string | null
          submitted_at: string | null
          version_number: number
        }
        Insert: {
          approval_status?: string | null
          client_name?: string | null
          copy_comment?: string | null
          copy_score?: number | null
          created_at?: string
          creative_index?: number | null
          design_comment?: string | null
          design_score?: number | null
          feedback_copy?: string | null
          feedback_design?: string | null
          id?: string
          is_official?: boolean
          material_id: string
          per_creative?: Json | null
          project_id?: string | null
          status?: string | null
          submitted_at?: string | null
          version_number?: number
        }
        Update: {
          approval_status?: string | null
          client_name?: string | null
          copy_comment?: string | null
          copy_score?: number | null
          created_at?: string
          creative_index?: number | null
          design_comment?: string | null
          design_score?: number | null
          feedback_copy?: string | null
          feedback_design?: string | null
          id?: string
          is_official?: boolean
          material_id?: string
          per_creative?: Json | null
          project_id?: string | null
          status?: string | null
          submitted_at?: string | null
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
          {
            foreignKeyName: "evaluations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          custom_role_id: string | null
          department: string | null
          email: string | null
          group_name: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          project_scope: string | null
          role: string
          selected_celebration_id: string | null
          squad: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          custom_role_id?: string | null
          department?: string | null
          email?: string | null
          group_name?: string | null
          id: string
          is_active?: boolean
          name?: string
          phone?: string | null
          project_scope?: string | null
          role?: string
          selected_celebration_id?: string | null
          squad?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          custom_role_id?: string | null
          department?: string | null
          email?: string | null
          group_name?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          project_scope?: string | null
          role?: string
          selected_celebration_id?: string | null
          squad?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          attached_files: Json | null
          campaign_name: string | null
          caption: string | null
          client_name: string | null
          copy_text: string | null
          copywriter_name: string | null
          created_at: string
          creation_date: string | null
          deadline: string | null
          description: string | null
          designer_name: string | null
          end_date: string | null
          external_reference_id: string | null
          format: string | null
          id: string
          landing_page_link: string | null
          material_type: string | null
          name: string
          notes: string | null
          pending_creative_indices: Json | null
          position: number | null
          responsible_name: string | null
          responsible_user_id: string | null
          sent_for_approval_at: string | null
          share_token: string | null
          squad: string | null
          squad_source: string | null
          start_date: string | null
          static_captions: Json | null
          static_creative_count: number | null
          static_files_data: Json | null
          status: string
          title: string | null
          type: string
          updated_at: string | null
          video_captions: Json | null
          video_count: number | null
          video_files_data: Json | null
          video_notes: Json | null
        }
        Insert: {
          attached_files?: Json | null
          campaign_name?: string | null
          caption?: string | null
          client_name?: string | null
          copy_text?: string | null
          copywriter_name?: string | null
          created_at?: string
          creation_date?: string | null
          deadline?: string | null
          description?: string | null
          designer_name?: string | null
          end_date?: string | null
          external_reference_id?: string | null
          format?: string | null
          id?: string
          landing_page_link?: string | null
          material_type?: string | null
          name: string
          notes?: string | null
          pending_creative_indices?: Json | null
          position?: number | null
          responsible_name?: string | null
          responsible_user_id?: string | null
          sent_for_approval_at?: string | null
          share_token?: string | null
          squad?: string | null
          squad_source?: string | null
          start_date?: string | null
          static_captions?: Json | null
          static_creative_count?: number | null
          static_files_data?: Json | null
          status?: string
          title?: string | null
          type?: string
          updated_at?: string | null
          video_captions?: Json | null
          video_count?: number | null
          video_files_data?: Json | null
          video_notes?: Json | null
        }
        Update: {
          attached_files?: Json | null
          campaign_name?: string | null
          caption?: string | null
          client_name?: string | null
          copy_text?: string | null
          copywriter_name?: string | null
          created_at?: string
          creation_date?: string | null
          deadline?: string | null
          description?: string | null
          designer_name?: string | null
          end_date?: string | null
          external_reference_id?: string | null
          format?: string | null
          id?: string
          landing_page_link?: string | null
          material_type?: string | null
          name?: string
          notes?: string | null
          pending_creative_indices?: Json | null
          position?: number | null
          responsible_name?: string | null
          responsible_user_id?: string | null
          sent_for_approval_at?: string | null
          share_token?: string | null
          squad?: string | null
          squad_source?: string | null
          start_date?: string | null
          static_captions?: Json | null
          static_creative_count?: number | null
          static_files_data?: Json | null
          status?: string
          title?: string | null
          type?: string
          updated_at?: string | null
          video_captions?: Json | null
          video_count?: number | null
          video_files_data?: Json | null
          video_notes?: Json | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          id: string
          quick_access: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          quick_access?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          quick_access?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { _user_id: string }; Returns: string }
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
