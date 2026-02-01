import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'rad_tech' | 'doctor';
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: 'rad_tech' | 'doctor';
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'rad_tech' | 'doctor';
          created_at?: string;
        };
      };
      cases: {
        Row: {
          id: string;
          case_number: string;
          patient_name: string;
          patient_id: string;
          study_type: string;
          status: 'pending' | 'in_progress' | 'completed';
          uploaded_by: string;
          assigned_to: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_number: string;
          patient_name: string;
          patient_id: string;
          study_type: string;
          status?: 'pending' | 'in_progress' | 'completed';
          uploaded_by: string;
          assigned_to: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_number?: string;
          patient_name?: string;
          patient_id?: string;
          study_type?: string;
          status?: 'pending' | 'in_progress' | 'completed';
          uploaded_by?: string;
          assigned_to?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      media_files: {
        Row: {
          id: string;
          case_id: string;
          file_name: string;
          file_path: string;
          file_type: 'image' | 'video';
          file_size: number;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          file_name: string;
          file_path: string;
          file_type: 'image' | 'video';
          file_size?: number;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          file_name?: string;
          file_path?: string;
          file_type?: 'image' | 'video';
          file_size?: number;
          uploaded_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          case_id: string;
          content: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          content?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          content?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
