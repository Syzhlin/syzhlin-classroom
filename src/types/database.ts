// Supabase CLI로 자동 생성 전까지 수동 관리.
// npm run db:types 실행 시 이 파일이 교체됩니다.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'teacher' | 'adult_learner' | 'student' | 'parent'
          linked_student_id: string | null
          display_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'teacher' | 'adult_learner' | 'student' | 'parent'
          linked_student_id?: string | null
          display_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'teacher' | 'adult_learner' | 'student' | 'parent'
          linked_student_id?: string | null
          display_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          id: string
          teacher_id: string
          name: string
          phone: string | null
          parent_phone: string | null
          school: string | null
          grade: string | null
          subjects: string[] | null
          hourly_rate: number | null
          color: string
          is_active: boolean
          notes: string | null
          schedule_note: string | null
          recurring_schedule: Array<{ day: number; start_time: string; end_time: string }>
          total_sessions: number
          passport_base_classes: number
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          name: string
          phone?: string | null
          parent_phone?: string | null
          school?: string | null
          grade?: string | null
          subjects?: string[] | null
          hourly_rate?: number | null
          color?: string
          is_active?: boolean
          notes?: string | null
          schedule_note?: string | null
          recurring_schedule?: Array<{ day: number; start_time: string; end_time: string }>
          passport_base_classes?: number
          created_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          name?: string
          phone?: string | null
          parent_phone?: string | null
          school?: string | null
          grade?: string | null
          subjects?: string[] | null
          hourly_rate?: number | null
          color?: string
          is_active?: boolean
          notes?: string | null
          schedule_note?: string | null
          passport_base_classes?: number
          created_at?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          id: string
          teacher_id: string
          student_id: string
          date: string
          start_time: string
          end_time: string
          status: 'scheduled' | 'completed' | 'cancelled' | 'makeup' | 'postponed'
          notes: string | null
          is_recurring: boolean
          recurring_rule: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          student_id: string
          date: string
          start_time: string
          end_time: string
          status?: 'scheduled' | 'completed' | 'cancelled' | 'makeup' | 'postponed'
          notes?: string | null
          is_recurring?: boolean
          recurring_rule?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          student_id?: string
          date?: string
          start_time?: string
          end_time?: string
          status?: 'scheduled' | 'completed' | 'cancelled' | 'makeup' | 'postponed'
          notes?: string | null
          is_recurring?: boolean
          recurring_rule?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          student_id: string
          sender_id: string
          sender_role: 'teacher' | 'parent' | 'student'
          body: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          sender_id: string
          sender_role: 'teacher' | 'parent' | 'student'
          body: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          sender_id?: string
          sender_role?: 'teacher' | 'parent' | 'student'
          body?: string
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
        }
        Relationships: []
      }
      growth_reports: {
        Row: {
          id: string
          student_id: string
          teacher_id: string
          period: string
          lesson_count: number
          score_expression: number | null
          score_comprehension: number | null
          score_reading_fluency: number | null
          score_sentence_building: number | null
          score_willingness: number | null
          note_expression: string | null
          note_comprehension: string | null
          note_reading_fluency: string | null
          note_sentence_building: string | null
          note_willingness: string | null
          teacher_comment: string | null
          generated_report: string | null
          status: 'draft' | 'saved' | 'published'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          teacher_id: string
          period: string
          lesson_count?: number
          score_expression?: number | null
          score_comprehension?: number | null
          score_reading_fluency?: number | null
          score_sentence_building?: number | null
          score_willingness?: number | null
          note_expression?: string | null
          note_comprehension?: string | null
          note_reading_fluency?: string | null
          note_sentence_building?: string | null
          note_willingness?: string | null
          teacher_comment?: string | null
          generated_report?: string | null
          status?: 'draft' | 'saved' | 'published'
          created_at?: string
          updated_at?: string
        }
        Update: {
          lesson_count?: number
          score_expression?: number | null
          score_comprehension?: number | null
          score_reading_fluency?: number | null
          score_sentence_building?: number | null
          score_willingness?: number | null
          note_expression?: string | null
          note_comprehension?: string | null
          note_reading_fluency?: string | null
          note_sentence_building?: string | null
          note_willingness?: string | null
          teacher_comment?: string | null
          generated_report?: string | null
          status?: 'draft' | 'saved' | 'published'
          updated_at?: string
        }
        Relationships: []
      }
      class_change_requests: {
        Row: {
          id: string
          student_id: string
          requester_id: string
          class_id: string | null
          request_type: 'reschedule' | 'cancel' | 'makeup'
          preferred_dates: string | null
          reason: string | null
          status: 'pending' | 'approved' | 'rejected'
          teacher_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          requester_id: string
          class_id?: string | null
          request_type: 'reschedule' | 'cancel' | 'makeup'
          preferred_dates?: string | null
          reason?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          teacher_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected'
          teacher_note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      class_feedback: {
        Row: {
          id: string
          class_id: string
          teacher_id: string
          student_id: string
          topic: string | null
          expressions: string[] | null
          good_points: string | null
          practice_needed: string | null
          homework_text: string | null
          has_homework: boolean
          parent_summary: string | null
          created_at: string
        }
        Insert: {
          id?: string
          class_id: string
          teacher_id: string
          student_id: string
          topic?: string | null
          expressions?: string[] | null
          good_points?: string | null
          practice_needed?: string | null
          homework_text?: string | null
          has_homework?: boolean
          parent_summary?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          teacher_id?: string
          student_id?: string
          topic?: string | null
          expressions?: string[] | null
          good_points?: string | null
          practice_needed?: string | null
          homework_text?: string | null
          has_homework?: boolean
          parent_summary?: string | null
          created_at?: string
        }
        Relationships: []
      }
      daily_lesson_summaries: {
        Row: {
          id: string
          student_id: string
          author_id: string
          date: string
          content: string | null
          next_prep: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          author_id: string
          date: string
          content?: string | null
          next_prep?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          author_id?: string
          date?: string
          content?: string | null
          next_prep?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      class_materials: {
        Row: {
          id: string
          student_id: string
          teacher_id: string
          title: string
          description: string | null
          file_url: string
          file_name: string | null
          file_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          teacher_id: string
          title: string
          description?: string | null
          file_url: string
          file_name?: string | null
          file_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          teacher_id?: string
          title?: string
          description?: string | null
          file_url?: string
          file_name?: string | null
          file_type?: string | null
          created_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          teacher_id: string
          student_id: string
          year_month: string
          planned_sessions: number
          completed_sessions: number
          bonus_sessions: number
          total_sessions: number
          payment_period: string | null
          amount: number
          status: '완납' | '미납' | '부분납'
          payment_method: string | null
          payment_link: string | null
          payment_requested: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          student_id: string
          year_month: string
          planned_sessions?: number
          completed_sessions?: number
          bonus_sessions?: number
          total_sessions?: number
          payment_period?: string | null
          amount?: number
          status?: '완납' | '미납' | '부분납'
          payment_method?: string | null
          payment_link?: string | null
          payment_requested?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          student_id?: string
          year_month?: string
          planned_sessions?: number
          completed_sessions?: number
          bonus_sessions?: number
          total_sessions?: number
          payment_period?: string | null
          amount?: number
          status?: '완납' | '미납' | '부분납'
          payment_method?: string | null
          payment_link?: string | null
          payment_requested?: boolean
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      login_codes: {
        Row: {
          code: string
          student_id: string | null
          role: 'student' | 'parent' | 'adult_learner'
          display_name: string | null
          created_at: string
        }
        Insert: {
          code: string
          student_id?: string | null
          role: 'student' | 'parent' | 'adult_learner'
          display_name?: string | null
          created_at?: string
        }
        Update: {
          code?: string
          student_id?: string | null
          role?: 'student' | 'parent' | 'adult_learner'
          display_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
