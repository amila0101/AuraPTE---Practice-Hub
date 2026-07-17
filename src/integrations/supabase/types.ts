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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          sent_by: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sent_by: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sent_by?: string
          title?: string
        }
        Relationships: []
      }
      daily_stats: {
        Row: {
          created_at: string
          date: string
          id: string
          listening_score: number | null
          questions_done: number | null
          reading_score: number | null
          speaking_score: number | null
          study_minutes: number | null
          user_id: string
          writing_score: number | null
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          listening_score?: number | null
          questions_done?: number | null
          reading_score?: number | null
          speaking_score?: number | null
          study_minutes?: number | null
          user_id: string
          writing_score?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          listening_score?: number | null
          questions_done?: number | null
          reading_score?: number | null
          speaking_score?: number | null
          study_minutes?: number | null
          user_id?: string
          writing_score?: number | null
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_tests: {
        Row: {
          answers: Json
          completed_at: string | null
          exam_type: string
          id: string
          overall_score: number | null
          question_ids: Json
          scores: Json | null
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          exam_type?: string
          id?: string
          overall_score?: number | null
          question_ids?: Json
          scores?: Json | null
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          exam_type?: string
          id?: string
          overall_score?: number | null
          question_ids?: Json
          scores?: Json | null
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          answer_audio_url: string | null
          answer_text: string | null
          created_at: string
          feedback: string | null
          id: string
          overall_score: number | null
          question_id: string
          score: Json | null
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          answer_audio_url?: string | null
          answer_text?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          overall_score?: number | null
          question_id: string
          score?: Json | null
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          answer_audio_url?: string | null
          answer_text?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          overall_score?: number | null
          question_id?: string
          score?: Json | null
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          target_exam: string | null
          target_score: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          target_exam?: string | null
          target_score?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          target_exam?: string | null
          target_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          audio_url: string | null
          content: string
          correct_answer: Json | null
          created_at: string
          difficulty: string | null
          exam_type: string
          id: string
          image_url: string | null
          instruction: string
          is_ai_generated: boolean | null
          options: Json | null
          skill: string
          sub_type: string
          title: string
        }
        Insert: {
          audio_url?: string | null
          content: string
          correct_answer?: Json | null
          created_at?: string
          difficulty?: string | null
          exam_type?: string
          id?: string
          image_url?: string | null
          instruction: string
          is_ai_generated?: boolean | null
          options?: Json | null
          skill: string
          sub_type: string
          title: string
        }
        Update: {
          audio_url?: string | null
          content?: string
          correct_answer?: Json | null
          created_at?: string
          difficulty?: string | null
          exam_type?: string
          id?: string
          image_url?: string | null
          instruction?: string
          is_ai_generated?: boolean | null
          options?: Json | null
          skill?: string
          sub_type?: string
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_vocab: {
        Row: {
          created_at: string
          example_sentence: string | null
          id: string
          is_mastered: boolean | null
          is_starred: boolean | null
          meaning: string
          pronunciation: string | null
          user_id: string
          word: string
        }
        Insert: {
          created_at?: string
          example_sentence?: string | null
          id?: string
          is_mastered?: boolean | null
          is_starred?: boolean | null
          meaning: string
          pronunciation?: string | null
          user_id: string
          word: string
        }
        Update: {
          created_at?: string
          example_sentence?: string | null
          id?: string
          is_mastered?: boolean | null
          is_starred?: boolean | null
          meaning?: string
          pronunciation?: string | null
          user_id?: string
          word?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
