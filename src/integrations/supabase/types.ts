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
      approval_requests: {
        Row: {
          created_at: string
          id: string
          requested_role: Database["public"]["Enums"]["app_role"]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["account_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          requested_role: Database["public"]["Enums"]["app_role"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          requested_role?: Database["public"]["Enums"]["app_role"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          user_id?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          schedule_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          subject_id: string
          suspicious: boolean
          time_in: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          schedule_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          subject_id: string
          suspicious?: boolean
          time_in?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          schedule_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          subject_id?: string
          suspicious?: boolean
          time_in?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      face_embeddings: {
        Row: {
          created_at: string
          embedding: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          embedding: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          embedding?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      face_recognition_logs: {
        Row: {
          anti_spoof_passed: boolean | null
          confidence: number | null
          created_at: string
          id: string
          liveness_passed: boolean | null
          metadata: Json | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          anti_spoof_passed?: boolean | null
          confidence?: number | null
          created_at?: string
          id?: string
          liveness_passed?: boolean | null
          metadata?: Json | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          anti_spoof_passed?: boolean | null
          confidence?: number | null
          created_at?: string
          id?: string
          liveness_passed?: boolean | null
          metadata?: Json | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      otp_logs: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          purpose: string
          user_id: string | null
          verified: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_code: string
          purpose?: string
          user_id?: string | null
          verified?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          purpose?: string
          user_id?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          course: string | null
          created_at: string
          department: string | null
          email: string
          face_registered: boolean
          force_password_change: boolean
          full_name: string
          id: string
          otp_enabled: boolean
          section: string | null
          status: Database["public"]["Enums"]["account_status"]
          student_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          course?: string | null
          created_at?: string
          department?: string | null
          email: string
          face_registered?: boolean
          force_password_change?: boolean
          full_name: string
          id?: string
          otp_enabled?: boolean
          section?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          student_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          course?: string | null
          created_at?: string
          department?: string | null
          email?: string
          face_registered?: boolean
          force_password_change?: boolean
          full_name?: string
          id?: string
          otp_enabled?: boolean
          section?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          student_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          room: string | null
          section: string
          start_time: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          room?: string | null
          section: string
          start_time: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          room?: string | null
          section?: string
          start_time?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          suspicious: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          suspicious?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          suspicious?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
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
      mark_otp_verified: { Args: { otp_id: string }; Returns: undefined }
    }
    Enums: {
      account_status: "pending" | "active" | "rejected" | "suspended"
      app_role: "admin" | "teacher" | "student"
      attendance_status: "present" | "late" | "absent"
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
      account_status: ["pending", "active", "rejected", "suspended"],
      app_role: ["admin", "teacher", "student"],
      attendance_status: ["present", "late", "absent"],
    },
  },
} as const
