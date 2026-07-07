export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert = Row, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      metrics: Table<
        {
          id: string;
          slug: string;
          name: string;
          category: string;
          unit: string;
          orientation_higher_is_frothier: boolean;
          description_short: string;
          description_long: string;
          why_it_matters: string;
          interpretation_bands: Json;
          source_name: string;
          source_url: string;
          source_tier: number;
          update_frequency: string;
          methodology_notes: string;
          caveats: string;
          included_in_composite: boolean;
          active: boolean;
          manual_entry: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          slug: string;
          name: string;
          category: string;
          unit?: string;
          orientation_higher_is_frothier?: boolean;
          description_short?: string;
          description_long?: string;
          why_it_matters?: string;
          interpretation_bands?: Json;
          source_name?: string;
          source_url?: string;
          source_tier?: number;
          update_frequency?: string;
          methodology_notes?: string;
          caveats?: string;
          included_in_composite?: boolean;
          active?: boolean;
          manual_entry?: boolean;
        }
      >;
      metric_values: Table<
        {
          metric_id: string;
          date: string;
          value: number;
          is_estimate: boolean;
          source_details: Json;
          created_at: string;
          updated_at: string;
        },
        {
          metric_id: string;
          date: string;
          value: number;
          is_estimate?: boolean;
          source_details?: Json;
        }
      >;
      composite_scores: Table<
        { date: string; score: number; breakdown: Json; created_at: string; updated_at: string },
        { date: string; score: number; breakdown?: Json }
      >;
      user_alerts: Table<
        {
          id: string;
          user_id: string;
          target_type: string;
          metric_id: string | null;
          operator: string;
          threshold: number;
          active: boolean;
          last_triggered_at: string | null;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          target_type: string;
          metric_id?: string | null;
          operator: string;
          threshold: number;
          active?: boolean;
          last_triggered_at?: string | null;
        }
      >;
      user_notifications: Table<
        {
          id: string;
          user_id: string;
          alert_id: string | null;
          title: string;
          body: string;
          triggered_on: string;
          read_at: string | null;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          alert_id?: string | null;
          title: string;
          body: string;
          triggered_on: string;
          read_at?: string | null;
        }
      >;
      user_watchlist: Table<
        { user_id: string; metric_id: string; created_at: string },
        { user_id: string; metric_id: string }
      >;
      metric_submissions: Table<
        {
          id: string;
          user_id: string | null;
          email: string | null;
          proposed_name: string;
          description: string;
          proposed_source_url: string;
          rationale: string;
          status: string;
          votes: number;
          created_at: string;
        },
        {
          id?: string;
          user_id?: string | null;
          email?: string | null;
          proposed_name: string;
          description: string;
          proposed_source_url: string;
          rationale: string;
          status?: string;
          votes?: number;
        }
      >;
      metric_submission_votes: Table<
        { submission_id: string; user_id: string; created_at: string },
        { submission_id: string; user_id: string }
      >;
      ingestion_runs: Table<
        { id: string; run_at: string; status: string; source_details: Json },
        { id?: string; run_at?: string; status: string; source_details?: Json }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
