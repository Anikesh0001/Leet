import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      problems: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          difficulty: 'easy' | 'medium' | 'hard';
          category: string;
          tags: string[];
          acceptance_rate: number;
          likes: number;
          dislikes: number;
          is_premium: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          code: string;
          language: string;
          status: string;
          runtime_ms: number;
          memory_kb: number;
          test_cases_passed: number;
          test_cases_total: number;
          created_at: string;
        };
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          problem_id: string;
          status: 'attempted' | 'solved';
          attempts: number;
          last_attempted_at: string;
          solved_at: string | null;
          created_at: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          problems_solved: number;
          streak_days: number;
          ranking: number;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
