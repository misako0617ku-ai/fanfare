export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "moderator" | "admin";
export type PostScope = "home" | "community";
export type PostStatus = "published" | "hidden" | "under_review";
export type EventType = "live" | "tv" | "release" | "other";
export type EventSource = "itunes" | "youtube" | "scrape" | "user";
export type StampCategory = "normal" | "info";
export type CommunityMemberRole = "member" | "moderator";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: { id: string; nickname: string; icon_url: string | null; birth_year: number; role: UserRole; reporter_score: number; created_at: string };
        Insert: { id: string; nickname: string; icon_url?: string | null; birth_year: number; role?: UserRole; reporter_score?: number };
        Update: { nickname?: string; icon_url?: string | null; birth_year?: number; role?: UserRole; reporter_score?: number };
        Relationships: [];
      };
      artists: {
        Row: { id: string; name: string; agency: string | null; starto_artist_id: number | null; youtube_channel_id: string | null; official_urls: Json; created_at: string };
        Insert: { name: string; agency?: string | null; starto_artist_id?: number | null; youtube_channel_id?: string | null; official_urls?: Json };
        Update: { name?: string; agency?: string | null; starto_artist_id?: number | null; youtube_channel_id?: string | null; official_urls?: Json };
        Relationships: [];
      };
      user_oshi: {
        Row: { user_id: string; artist_id: string };
        Insert: { user_id: string; artist_id: string };
        Update: { user_id?: string; artist_id?: string };
        Relationships: [
          { foreignKeyName: "user_oshi_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "user_oshi_artist_id_fkey"; columns: ["artist_id"]; isOneToOne: false; referencedRelation: "artists"; referencedColumns: ["id"] }
        ];
      };
      follows: {
        Row: { follower_id: string; followee_id: string; created_at: string };
        Insert: { follower_id: string; followee_id: string };
        Update: never;
        Relationships: [];
      };
      blocks: {
        Row: { blocker_id: string; blocked_id: string; created_at: string };
        Insert: { blocker_id: string; blocked_id: string };
        Update: never;
        Relationships: [];
      };
      posts: {
        Row: { id: string; user_id: string; body: string; scope: PostScope; community_id: string | null; status: PostStatus; review_flag: boolean; ai_score: number | null; ai_reason: string | null; created_at: string };
        Insert: { user_id: string; body: string; scope?: PostScope; community_id?: string | null; status?: PostStatus; review_flag?: boolean; ai_score?: number | null; ai_reason?: string | null };
        Update: { body?: string; scope?: PostScope; community_id?: string | null; status?: PostStatus; review_flag?: boolean; ai_score?: number | null; ai_reason?: string | null };
        Relationships: [
          { foreignKeyName: "posts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ];
      };
      post_artists: {
        Row: { post_id: string; artist_id: string };
        Insert: { post_id: string; artist_id: string };
        Update: never;
        Relationships: [
          { foreignKeyName: "post_artists_post_id_fkey"; columns: ["post_id"]; isOneToOne: false; referencedRelation: "posts"; referencedColumns: ["id"] },
          { foreignKeyName: "post_artists_artist_id_fkey"; columns: ["artist_id"]; isOneToOne: false; referencedRelation: "artists"; referencedColumns: ["id"] }
        ];
      };
      post_media: {
        Row: { id: string; post_id: string; type: "image" | "video"; r2_key: string; order: number };
        Insert: { post_id: string; type: "image" | "video"; r2_key: string; order?: number };
        Update: { type?: "image" | "video"; r2_key?: string; order?: number };
        Relationships: [];
      };
      communities: {
        Row: { id: string; name: string; artist_id: string | null; owner_id: string; description: string | null; created_at: string };
        Insert: { name: string; artist_id?: string | null; owner_id: string; description?: string | null };
        Update: { name?: string; artist_id?: string | null; description?: string | null };
        Relationships: [];
      };
      community_members: {
        Row: { community_id: string; user_id: string; role: CommunityMemberRole; joined_at: string };
        Insert: { community_id: string; user_id: string; role?: CommunityMemberRole };
        Update: { role?: CommunityMemberRole };
        Relationships: [];
      };
      stamps: {
        Row: { id: string; label: string; emoji: string; category: StampCategory; sort_order: number };
        Insert: { label: string; emoji: string; category?: StampCategory; sort_order?: number };
        Update: { label?: string; emoji?: string; category?: StampCategory; sort_order?: number };
        Relationships: [];
      };
      post_stamps: {
        Row: { post_id: string; user_id: string; stamp_id: string; created_at: string };
        Insert: { post_id: string; user_id: string; stamp_id: string };
        Update: never;
        Relationships: [];
      };
      events: {
        Row: { id: string; artist_id: string; type: EventType; event_date: string; title: string; source_url: string | null; source: EventSource; created_by: string | null; verified_count: number; status: "published" | "hidden"; created_at: string };
        Insert: { artist_id: string; type: EventType; event_date: string; title: string; source_url?: string | null; source: EventSource; created_by?: string | null; verified_count?: number; status?: "published" | "hidden" };
        Update: { artist_id?: string; type?: EventType; event_date?: string; title?: string; source_url?: string | null; source?: EventSource; created_by?: string | null; verified_count?: number; status?: "published" | "hidden" };
        Relationships: [];
      };
      event_corrections: {
        Row: { id: string; event_id: string; user_id: string; corrected_text: string; created_at: string };
        Insert: { event_id: string; user_id: string; corrected_text: string };
        Update: never;
        Relationships: [];
      };
      reports: {
        Row: { id: string; reporter_id: string; target_type: "post" | "event"; target_id: string; reason_code: string; ai_verdict: string | null; ai_confidence: number | null; status: "pending" | "resolved" | "dismissed"; created_at: string };
        Insert: { reporter_id: string; target_type: "post" | "event"; target_id: string; reason_code: string; ai_verdict?: string | null; ai_confidence?: number | null; status?: "pending" | "resolved" | "dismissed" };
        Update: { ai_verdict?: string | null; ai_confidence?: number | null; status?: "pending" | "resolved" | "dismissed" };
        Relationships: [];
      };
      ng_words: {
        Row: { id: string; word: string; created_at: string };
        Insert: { word: string };
        Update: { word?: string };
        Relationships: [];
      };
      app_settings: {
        Row: { key: string; value: string; updated_at: string };
        Insert: { key: string; value: string };
        Update: { value?: string };
        Relationships: [];
      };
      scrape_targets: {
        Row: { id: string; site_name: string; url: string; is_enabled: boolean; last_etag: string | null; last_content_hash: string | null; last_item_date: string | null; last_success_at: string | null; consecutive_failures: number };
        Insert: { site_name: string; url: string; is_enabled?: boolean; last_etag?: string | null; last_content_hash?: string | null; last_item_date?: string | null; last_success_at?: string | null; consecutive_failures?: number };
        Update: { site_name?: string; url?: string; is_enabled?: boolean; last_etag?: string | null; last_content_hash?: string | null; last_item_date?: string | null; last_success_at?: string | null; consecutive_failures?: number };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, string[]>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
