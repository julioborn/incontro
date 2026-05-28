import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client — uses cookies so the server can read the session
export const supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);

// ─── Type definitions ───────────────────────────────────────────────────────

export interface Venue {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  radius_meters: number;
  open_days: string[] | null;
  open_time: string | null;
  close_time: string | null;
  logo_url: string | null;
  is_open: boolean;
  created_at: string;
}
export type VenueInsert = Omit<Venue, "id" | "created_at">;

export interface Profile {
  id: string;
  name: string | null;
  age: number | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  bio: string | null;
  instagram_handle: string | null;
  avatar_url: string | null;
  push_subscription: object | null;
  created_at: string;
}
export type ProfileInsert = Omit<Profile, "created_at">;

export interface Presence {
  id: string;
  user_id: string;
  venue_id: string;
  entered_at: string;
  expires_at: string | null;
  is_active: boolean;
}
export type PresenceInsert = Omit<Presence, "id" | "entered_at">;

export interface Like {
  id: string;
  from_user: string;
  to_user: string;
  venue_id: string;
  created_at: string;
}
export type LikeInsert = Omit<Like, "id" | "created_at">;

export interface Match {
  id: string;
  user_a: string;
  user_b: string;
  venue_id: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}
export type MatchInsert = Omit<Match, "id" | "created_at">;

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}
export type MessageInsert = Omit<Message, "id" | "created_at">;
