import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Convenience singleton for client components that don't need SSR
// (created lazily to avoid SSR issues)
let _client: ReturnType<typeof createClient> | null = null;
export function getSupabase() {
  if (!_client) _client = createClient();
  return _client;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          age: number;
          field_of_study: string;
          university: string;
          bio: string | null;
          photo_urls: string[];
          is_onboarding_complete: boolean;
          is_available: boolean;
          available_until: string | null;
          meet_cute_activity: 'coffee' | 'drink' | 'walk' | null;
          meet_cute_mindset: 'real' | 'flow' | 'friends' | null;
          meet_cute_availability_vibe: 'ready_now' | 'one_hour' | 'chat_first' | null;
          gender: 'male' | 'female' | 'other' | null;
          gender_preference: 'male' | 'female' | 'both';
          sexuality: string | null;
          location: string | null;
          is_suspended: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
    };
  };
};
