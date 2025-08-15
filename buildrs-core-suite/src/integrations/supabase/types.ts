export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          client_id: string
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          id: string
          metadata: Json | null
          note_id: string | null
          project_id: string | null
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          client_id: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          note_id?: string | null
          project_id?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          client_id?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          note_id?: string | null
          project_id?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "abm_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_overview_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "activity_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "campaign_ready_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "activity_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "activity_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "activity_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "meeting_prep"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "activity_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "activity_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "v_company_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "my_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "my_tasks_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_board"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_calendar"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_task_fields"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_task_meta"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "activity_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_timeline"
            referencedColumns: ["task_id"]
          },
        ]
      }
      campaign_contacts: {
        Row: {
          added_at: string | null
          campaign_id: string
          completed_at: string | null
          contact_id: string
          id: string
          next_eligible_at: string | null
          notes: string | null
          status: string | null
        }
        Insert: {
          added_at?: string | null
          campaign_id: string
          completed_at?: string | null
          contact_id: string
          id?: string
          next_eligible_at?: string | null
          notes?: string | null
          status?: string | null
        }
        Update: {
          added_at?: string | null
          campaign_id?: string
          completed_at?: string | null
          contact_id?: string
          id?: string
          next_eligible_at?: string | null
          notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "campaign_ready_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "campaign_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "campaign_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "campaign_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "meeting_prep"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "campaign_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      campaigns: {
        Row: {
          audience_filter: Json | null
          auto_assign_enabled: boolean | null
          campaign_purpose: string | null
          channel: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          priority: number | null
          proposition_id: string | null
          sending_window: Json | null
          start_date: string | null
          stats: Json | null
          status: string | null
          type: string
        }
        Insert: {
          audience_filter?: Json | null
          auto_assign_enabled?: boolean | null
          campaign_purpose?: string | null
          channel?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          priority?: number | null
          proposition_id?: string | null
          sending_window?: Json | null
          start_date?: string | null
          stats?: Json | null
          status?: string | null
          type: string
        }
        Update: {
          audience_filter?: Json | null
          auto_assign_enabled?: boolean | null
          campaign_purpose?: string | null
          channel?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          priority?: number | null
          proposition_id?: string | null
          sending_window?: Json | null
          start_date?: string | null
          stats?: Json | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_proposition_id_fkey"
            columns: ["proposition_id"]
            isOneToOne: false
            referencedRelation: "propositions"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company: string
          contact: string | null
          created_at: string | null
          domain: string | null
          email: string | null
          id: string
          phone: string | null
        }
        Insert: {
          company: string
          contact?: string | null
          created_at?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          phone?: string | null
        }
        Update: {
          company?: string
          contact?: string | null
          created_at?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      communications: {
        Row: {
          campaign_id: string | null
          channel: string
          client_id: string
          contact_id: string
          content: string | null
          created_at: string | null
          direction: string
          id: string
          is_automated: boolean | null
          is_first_message: boolean | null
          is_last_message: boolean | null
          is_read: boolean | null
          metadata: Json | null
          sentiment: string | null
          timestamp: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          channel: string
          client_id: string
          contact_id: string
          content?: string | null
          created_at?: string | null
          direction: string
          id?: string
          is_automated?: boolean | null
          is_first_message?: boolean | null
          is_last_message?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          sentiment?: string | null
          timestamp?: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          channel?: string
          client_id?: string
          contact_id?: string
          content?: string | null
          created_at?: string | null
          direction?: string
          id?: string
          is_automated?: boolean | null
          is_first_message?: boolean | null
          is_last_message?: boolean | null
          is_read?: boolean | null
          metadata?: Json | null
          sentiment?: string | null
          timestamp?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "campaign_ready_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "meeting_prep"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      companies: {
        Row: {
          city: string | null
          company_common_problems: string | null
          company_keywords: string[] | null
          company_linkedinurl: string | null
          company_size: number | null
          company_summary: string | null
          company_target_customers: string | null
          company_technologies: Json | null
          company_unique_characteristics: string[] | null
          company_unique_qualities: string | null
          country: string | null
          created_at: string | null
          domain: string | null
          full_enrichment: boolean | null
          id: string
          industry_label: string | null
          industry_slug: string | null
          last_updated_at: string | null
          name: string
          notused: string | null
          state: string | null
          subindustry_label: string | null
          tags: string[] | null
          website: string | null
        }
        Insert: {
          city?: string | null
          company_common_problems?: string | null
          company_keywords?: string[] | null
          company_linkedinurl?: string | null
          company_size?: number | null
          company_summary?: string | null
          company_target_customers?: string | null
          company_technologies?: Json | null
          company_unique_characteristics?: string[] | null
          company_unique_qualities?: string | null
          country?: string | null
          created_at?: string | null
          domain?: string | null
          full_enrichment?: boolean | null
          id?: string
          industry_label?: string | null
          industry_slug?: string | null
          last_updated_at?: string | null
          name: string
          notused?: string | null
          state?: string | null
          subindustry_label?: string | null
          tags?: string[] | null
          website?: string | null
        }
        Update: {
          city?: string | null
          company_common_problems?: string | null
          company_keywords?: string[] | null
          company_linkedinurl?: string | null
          company_size?: number | null
          company_summary?: string | null
          company_target_customers?: string | null
          company_technologies?: Json | null
          company_unique_characteristics?: string[] | null
          company_unique_qualities?: string | null
          country?: string | null
          created_at?: string | null
          domain?: string | null
          full_enrichment?: boolean | null
          id?: string
          industry_label?: string | null
          industry_slug?: string | null
          last_updated_at?: string | null
          name?: string
          notused?: string | null
          state?: string | null
          subindustry_label?: string | null
          tags?: string[] | null
          website?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          city: string | null
          client_id: string | null
          company_id: string | null
          company_phone: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          function_group: string | null
          id: string
          is_linkedin_connected: boolean | null
          job_title: string | null
          last_linkedin_connection_check: string | null
          last_name: string | null
          linkedin_url: string | null
          mobile_phone: string | null
          notes: string | null
          optedin: boolean | null
          seniority: string | null
          state: string | null
          status: string | null
          tags: string[] | null
        }
        Insert: {
          city?: string | null
          client_id?: string | null
          company_id?: string | null
          company_phone?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          function_group?: string | null
          id?: string
          is_linkedin_connected?: boolean | null
          job_title?: string | null
          last_linkedin_connection_check?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          mobile_phone?: string | null
          notes?: string | null
          optedin?: boolean | null
          seniority?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
        }
        Update: {
          city?: string | null
          client_id?: string | null
          company_id?: string | null
          company_phone?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          function_group?: string | null
          id?: string
          is_linkedin_connected?: boolean | null
          job_title?: string | null
          last_linkedin_connection_check?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          mobile_phone?: string | null
          notes?: string | null
          optedin?: boolean | null
          seniority?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "abm_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_overview_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["company_id"]
          },
        ]
      }
      deal_attachments: {
        Row: {
          client_id: string
          created_at: string | null
          deal_id: string
          file_name: string | null
          file_url: string
          id: string
          mime_type: string | null
          size_bytes: number | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          deal_id: string
          file_name?: string | null
          file_url: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          deal_id?: string
          file_name?: string | null
          file_url?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_attachments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_attachments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_attachments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "v_company_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_custom_fields: {
        Row: {
          client_id: string
          created_at: string | null
          deal_id: string
          id: string
          key: string
          value: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          deal_id: string
          id?: string
          key: string
          value?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          deal_id?: string
          id?: string
          key?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_custom_fields_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_custom_fields_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_custom_fields_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "v_company_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_line_items: {
        Row: {
          amount: number | null
          client_id: string
          created_at: string | null
          currency: string
          deal_id: string
          discount_pct: number
          id: string
          name: string
          proposition_id: string | null
          quantity: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          client_id: string
          created_at?: string | null
          currency?: string
          deal_id: string
          discount_pct?: number
          id?: string
          name: string
          proposition_id?: string | null
          quantity?: number
          unit_price?: number
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          client_id?: string
          created_at?: string | null
          currency?: string
          deal_id?: string
          discount_pct?: number
          id?: string
          name?: string
          proposition_id?: string | null
          quantity?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_line_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_line_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_line_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "v_company_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_line_items_proposition_id_fkey"
            columns: ["proposition_id"]
            isOneToOne: false
            referencedRelation: "propositions"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          campaign_id: string | null
          client_id: string
          closed_at: string | null
          company_id: string | null
          confidence: number | null
          contact_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          extra: Json | null
          id: string
          is_active: boolean | null
          is_auto_created: boolean | null
          meeting_prep_summary: string | null
          owner_id: string | null
          pipeline_id: string
          priority: number | null
          proposition_id: string | null
          source: string | null
          stage_id: string
          status: string
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          campaign_id?: string | null
          client_id: string
          closed_at?: string | null
          company_id?: string | null
          confidence?: number | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          extra?: Json | null
          id?: string
          is_active?: boolean | null
          is_auto_created?: boolean | null
          meeting_prep_summary?: string | null
          owner_id?: string | null
          pipeline_id: string
          priority?: number | null
          proposition_id?: string | null
          source?: string | null
          stage_id: string
          status?: string
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          campaign_id?: string | null
          client_id?: string
          closed_at?: string | null
          company_id?: string | null
          confidence?: number | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          extra?: Json | null
          id?: string
          is_active?: boolean | null
          is_auto_created?: boolean | null
          meeting_prep_summary?: string | null
          owner_id?: string | null
          pipeline_id?: string
          priority?: number | null
          proposition_id?: string | null
          source?: string | null
          stage_id?: string
          status?: string
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "abm_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_overview_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "campaign_ready_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "meeting_prep"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_proposition_id_fkey"
            columns: ["proposition_id"]
            isOneToOne: false
            referencedRelation: "propositions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      industries: {
        Row: {
          description: string | null
          keywords: Json | null
          label: string
          parent_slug: string | null
          slug: string
        }
        Insert: {
          description?: string | null
          keywords?: Json | null
          label: string
          parent_slug?: string | null
          slug: string
        }
        Update: {
          description?: string | null
          keywords?: Json | null
          label?: string
          parent_slug?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "industries_parent_slug_fkey"
            columns: ["parent_slug"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["slug"]
          },
        ]
      }
      notes: {
        Row: {
          author_id: string | null
          client_id: string
          company_id: string | null
          contact_id: string | null
          content: string
          created_at: string | null
          deal_id: string | null
          id: string
          is_ai_generated: boolean | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          client_id: string
          company_id?: string | null
          contact_id?: string | null
          content: string
          created_at?: string | null
          deal_id?: string | null
          id?: string
          is_ai_generated?: boolean | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          client_id?: string
          company_id?: string | null
          contact_id?: string | null
          content?: string
          created_at?: string | null
          deal_id?: string | null
          id?: string
          is_ai_generated?: boolean | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "abm_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_overview_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "campaign_ready_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "meeting_prep"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "v_company_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          archived: boolean | null
          client_id: string
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          proposition_id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          client_id: string
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          proposition_id: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          client_id?: string
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          proposition_id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipelines_proposition_id_fkey"
            columns: ["proposition_id"]
            isOneToOne: false
            referencedRelation: "propositions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          client_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_field_values: {
        Row: {
          client_id: string
          field_id: string
          id: string
          project_id: string
          task_id: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          client_id: string
          field_id: string
          id?: string
          project_id: string
          task_id: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          client_id?: string
          field_id?: string
          id?: string
          project_id?: string
          task_id?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "project_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_field_values_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_field_values_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "my_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_field_values_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "my_tasks_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_field_values_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_field_values_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_board"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "project_field_values_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_calendar"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "project_field_values_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_task_fields"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "project_field_values_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_task_meta"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "project_field_values_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_timeline"
            referencedColumns: ["task_id"]
          },
        ]
      }
      project_fields: {
        Row: {
          archived: boolean
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          is_required: boolean
          key: string
          label: string
          options: Json | null
          order_index: number
          project_id: string
          type: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_required?: boolean
          key: string
          label: string
          options?: Json | null
          order_index?: number
          project_id: string
          type: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_required?: boolean
          key?: string
          label?: string
          options?: Json | null
          order_index?: number
          project_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_fields_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_groups: {
        Row: {
          client_id: string
          color: string
          id: string
          key: string
          label: string
          order_index: number
          project_id: string
        }
        Insert: {
          client_id: string
          color?: string
          id?: string
          key: string
          label: string
          order_index?: number
          project_id: string
        }
        Update: {
          client_id?: string
          color?: string
          id?: string
          key?: string
          label?: string
          order_index?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_groups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_task_assignees: {
        Row: {
          added_at: string
          client_id: string
          project_id: string
          task_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          client_id: string
          project_id: string
          task_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          client_id?: string
          project_id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_task_assignees_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "my_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "my_tasks_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_board"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "project_task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_calendar"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "project_task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_task_fields"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "project_task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_task_meta"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "project_task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_timeline"
            referencedColumns: ["task_id"]
          },
        ]
      }
      project_views: {
        Row: {
          client_id: string
          config: Json
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean
          name: string
          project_id: string
          type: string
        }
        Insert: {
          client_id: string
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          name: string
          project_id: string
          type: string
        }
        Update: {
          client_id?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          name?: string
          project_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_views_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          key: string | null
          labels: string[]
          name: string
          owner_id: string | null
          pinned: boolean
          priority: string | null
          start_date: string | null
          status: string
          type: string | null
          updated_at: string | null
          view_config: Json | null
        }
        Insert: {
          client_id: string
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          key?: string | null
          labels?: string[]
          name: string
          owner_id?: string | null
          pinned?: boolean
          priority?: string | null
          start_date?: string | null
          status?: string
          type?: string | null
          updated_at?: string | null
          view_config?: Json | null
        }
        Update: {
          client_id?: string
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          key?: string | null
          labels?: string[]
          name?: string
          owner_id?: string | null
          pinned?: boolean
          priority?: string | null
          start_date?: string | null
          status?: string
          type?: string | null
          updated_at?: string | null
          view_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "abm_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_overview_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["company_id"]
          },
        ]
      }
      proposals: {
        Row: {
          accepted_at: string | null
          amount_monthly: number
          amount_total: number
          amount_upfront: number
          client_id: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          deal_id: string
          id: string
          is_ai_generated: boolean | null
          notes: string | null
          proposal_url: string | null
          rejected_at: string | null
          sent_at: string | null
          status: string | null
          title: string
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          amount_monthly?: number
          amount_total?: number
          amount_upfront?: number
          client_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deal_id: string
          id?: string
          is_ai_generated?: boolean | null
          notes?: string | null
          proposal_url?: string | null
          rejected_at?: string | null
          sent_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          amount_monthly?: number
          amount_total?: number
          amount_upfront?: number
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          deal_id?: string
          id?: string
          is_ai_generated?: boolean | null
          notes?: string | null
          proposal_url?: string | null
          rejected_at?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "v_company_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      propositions: {
        Row: {
          ai_personalization_prompt: string | null
          ai_summary: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          offer_type: string | null
          pain_triggers: string | null
          problems_solved: string | null
          target_audience: string | null
          unique_value: string | null
        }
        Insert: {
          ai_personalization_prompt?: string | null
          ai_summary?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          offer_type?: string | null
          pain_triggers?: string | null
          problems_solved?: string | null
          target_audience?: string | null
          unique_value?: string | null
        }
        Update: {
          ai_personalization_prompt?: string | null
          ai_summary?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          offer_type?: string | null
          pain_triggers?: string | null
          problems_solved?: string | null
          target_audience?: string | null
          unique_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "propositions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          created_at: string | null
          default_probability: number | null
          description: string | null
          id: string
          is_lost: boolean | null
          is_won: boolean | null
          name: string
          pipeline_id: string
          position: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_probability?: number | null
          description?: string | null
          id?: string
          is_lost?: boolean | null
          is_won?: boolean | null
          name: string
          pipeline_id: string
          position: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_probability?: number | null
          description?: string | null
          id?: string
          is_lost?: boolean | null
          is_won?: boolean | null
          name?: string
          pipeline_id?: string
          position?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          file_name: string
          file_path: string
          id: string
          project_id: string
          size_bytes: number | null
          task_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          file_name: string
          file_path: string
          id?: string
          project_id: string
          size_bytes?: number | null
          task_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          file_name?: string
          file_path?: string
          id?: string
          project_id?: string
          size_bytes?: number | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "my_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "my_tasks_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_board"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_calendar"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_task_fields"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_task_meta"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_timeline"
            referencedColumns: ["task_id"]
          },
        ]
      }
      task_checklist_items: {
        Row: {
          client_id: string
          created_at: string
          done: boolean
          id: string
          position: number
          project_id: string
          task_id: string
          title: string
        }
        Insert: {
          client_id: string
          created_at?: string
          done?: boolean
          id?: string
          position?: number
          project_id: string
          task_id: string
          title: string
        }
        Update: {
          client_id?: string
          created_at?: string
          done?: boolean
          id?: string
          position?: number
          project_id?: string
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "my_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "my_tasks_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_board"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_calendar"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_task_fields"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_task_meta"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_timeline"
            referencedColumns: ["task_id"]
          },
        ]
      }
      task_comments: {
        Row: {
          body: string
          client_id: string
          created_at: string
          id: string
          project_id: string
          task_id: string
          user_id: string
        }
        Insert: {
          body: string
          client_id: string
          created_at?: string
          id?: string
          project_id: string
          task_id: string
          user_id: string
        }
        Update: {
          body?: string
          client_id?: string
          created_at?: string
          id?: string
          project_id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "my_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "my_tasks_completed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_board"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_calendar"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_task_fields"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_task_meta"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_timeline"
            referencedColumns: ["task_id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          client_id: string
          company_id: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          due_at: string | null
          group_id: string | null
          id: string
          position: number
          priority: number | null
          project_id: string | null
          status: string
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          group_id?: string | null
          id?: string
          position?: number
          priority?: number | null
          project_id?: string | null
          status?: string
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          group_id?: string | null
          id?: string
          position?: number
          priority?: number | null
          project_id?: string | null
          status?: string
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "abm_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_overview_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "campaign_ready_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "meeting_prep"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "v_company_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "project_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      abm_candidates: {
        Row: {
          company_city: string | null
          company_country: string | null
          company_id: string | null
          company_name: string | null
          company_size: number | null
          company_state: string | null
          company_unique_qualities: string | null
          decision_maker_count: number | null
          domain: string | null
          industry: string | null
          industry_label: string | null
          last_communication_at: string | null
          location: string | null
          subindustry_label: string | null
          website: string | null
        }
        Relationships: []
      }
      campaign_ready_contacts: {
        Row: {
          client_id: string | null
          company_id: string | null
          company_phone: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          function_group: string | null
          id: string | null
          job_title: string | null
          last_name: string | null
          linkedin_url: string | null
          mobile_phone: string | null
          notes: string | null
          seniority: string | null
          status: string | null
          suggested_campaign_id: string | null
          tags: string[] | null
        }
        Insert: {
          client_id?: string | null
          company_id?: string | null
          company_phone?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          function_group?: string | null
          id?: string | null
          job_title?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          mobile_phone?: string | null
          notes?: string | null
          seniority?: string | null
          status?: string | null
          suggested_campaign_id?: never
          tags?: string[] | null
        }
        Update: {
          client_id?: string | null
          company_id?: string | null
          company_phone?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          function_group?: string | null
          id?: string | null
          job_title?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          mobile_phone?: string | null
          notes?: string | null
          seniority?: string | null
          status?: string | null
          suggested_campaign_id?: never
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "abm_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_overview_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["company_id"]
          },
        ]
      }
      cold_email_candidates: {
        Row: {
          client_id: string | null
          company_city: string | null
          company_country: string | null
          company_id: string | null
          company_name: string | null
          company_size: number | null
          company_state: string | null
          company_unique_qualities: string | null
          contact_id: string | null
          domain: string | null
          email: string | null
          first_name: string | null
          function_group: string | null
          industry: string | null
          industry_label: string | null
          job_title: string | null
          last_communication_at: string | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          status: string | null
          subindustry_label: string | null
          suggested_campaign_id: string | null
          total_campaigns: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      full_timeline: {
        Row: {
          author_id: string | null
          campaign_id: string | null
          channel: string | null
          client_id: string | null
          company_id: string | null
          contact_id: string | null
          content: string | null
          created_at: string | null
          deal_id: string | null
          direction: string | null
          id: string | null
          is_ai_generated: boolean | null
          metadata: Json | null
          note_id: string | null
          occurred_at: string | null
          project_id: string | null
          sentiment: string | null
          source: string | null
          task_id: string | null
          type: string | null
        }
        Relationships: []
      }
      linkedin_candidates: {
        Row: {
          company_city: string | null
          company_common_problems: string | null
          company_country: string | null
          company_id: string | null
          company_keywords: string[] | null
          company_name: string | null
          company_size: number | null
          company_state: string | null
          company_summary: string | null
          company_target_customers: string | null
          company_unique_characteristics: string[] | null
          company_unique_qualities: string | null
          contact_id: string | null
          created_at: string | null
          domain: string | null
          email: string | null
          first_name: string | null
          function_group: string | null
          industry: string | null
          industry_label: string | null
          is_linkedin_connected: boolean | null
          job_title: string | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          seniority: string | null
          status: string | null
          subindustry_label: string | null
          total_campaigns: number | null
          website: string | null
        }
        Relationships: []
      }
      linkedin_reactivation_candidates: {
        Row: {
          campaign_count: number | null
          company_city: string | null
          company_country: string | null
          company_id: string | null
          company_keywords: string[] | null
          company_name: string | null
          company_size: number | null
          company_state: string | null
          company_summary: string | null
          company_unique_qualities: string | null
          contact_id: string | null
          created_at: string | null
          domain: string | null
          email: string | null
          first_name: string | null
          function_group: string | null
          industry: string | null
          industry_label: string | null
          is_linkedin_connected: boolean | null
          job_title: string | null
          last_linkedin_comm_at: string | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          seniority: string | null
          status: string | null
          subindustry_label: string | null
          website: string | null
        }
        Relationships: []
      }
      meeting_prep: {
        Row: {
          company_city: string | null
          company_common_problems: string | null
          company_country: string | null
          company_keywords: string[] | null
          company_name: string | null
          company_size: number | null
          company_state: string | null
          company_summary: string | null
          company_tags: string[] | null
          company_target_customers: string | null
          company_unique_characteristics: string[] | null
          company_unique_qualities: string | null
          contact_id: string | null
          domain: string | null
          email: string | null
          first_name: string | null
          function_group: string | null
          industry: string | null
          industry_label: string | null
          job_title: string | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          notes: string | null
          recent_communications: Json | null
          seniority: string | null
          subindustry_label: string | null
          tags: string[] | null
          website: string | null
        }
        Relationships: []
      }
      my_tasks: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          company_id: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          due_at: string | null
          id: string | null
          priority: number | null
          status: string | null
          title: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          id?: string | null
          priority?: number | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          id?: string | null
          priority?: number | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "abm_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_overview_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "campaign_ready_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "meeting_prep"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "v_company_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      my_tasks_completed: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          company_id: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          due_at: string | null
          id: string | null
          priority: number | null
          status: string | null
          title: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          id?: string | null
          priority?: number | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          company_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          id?: string | null
          priority?: number | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "abm_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_overview_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "campaign_ready_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "meeting_prep"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "v_company_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      v_company_contacts: {
        Row: {
          city: string | null
          client_id: string | null
          company_id: string | null
          company_phone: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          function_group: string | null
          id: string | null
          is_linkedin_connected: boolean | null
          job_title: string | null
          last_linkedin_connection_check: string | null
          last_name: string | null
          linkedin_url: string | null
          mobile_phone: string | null
          notes: string | null
          optedin: boolean | null
          seniority: string | null
          state: string | null
          status: string | null
          tags: string[] | null
        }
        Insert: {
          city?: string | null
          client_id?: string | null
          company_id?: string | null
          company_phone?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          function_group?: string | null
          id?: string | null
          is_linkedin_connected?: boolean | null
          job_title?: string | null
          last_linkedin_connection_check?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          mobile_phone?: string | null
          notes?: string | null
          optedin?: boolean | null
          seniority?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
        }
        Update: {
          city?: string | null
          client_id?: string | null
          company_id?: string | null
          company_phone?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          function_group?: string | null
          id?: string | null
          is_linkedin_connected?: boolean | null
          job_title?: string | null
          last_linkedin_connection_check?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          mobile_phone?: string | null
          notes?: string | null
          optedin?: boolean | null
          seniority?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "abm_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_overview_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["company_id"]
          },
        ]
      }
      v_company_deals: {
        Row: {
          campaign_id: string | null
          client_id: string | null
          closed_at: string | null
          company_id: string | null
          confidence: number | null
          contact_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          is_auto_created: boolean | null
          meeting_prep_summary: string | null
          pipeline_id: string | null
          pipeline_name: string | null
          priority: number | null
          proposition_id: string | null
          source: string | null
          stage_id: string | null
          stage_name: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "abm_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_company_overview_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "campaign_ready_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "cold_email_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "linkedin_reactivation_candidates"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "meeting_prep"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "v_contacts_enriched"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "deals_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_proposition_id_fkey"
            columns: ["proposition_id"]
            isOneToOne: false
            referencedRelation: "propositions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      v_company_overview_full: {
        Row: {
          city: string | null
          company_common_problems: string | null
          company_keywords: string[] | null
          company_linkedinurl: string | null
          company_size: number | null
          company_summary: string | null
          company_target_customers: string | null
          company_technologies: Json | null
          company_unique_characteristics: string[] | null
          company_unique_qualities: string | null
          contact_count: number | null
          country: string | null
          created_at: string | null
          domain: string | null
          full_enrichment: boolean | null
          id: string | null
          industry_label: string | null
          industry_slug: string | null
          last_comm_at: string | null
          last_deal_at: string | null
          last_updated_at: string | null
          name: string | null
          notused: string | null
          state: string | null
          subindustry_label: string | null
          tags: string[] | null
          website: string | null
        }
        Insert: {
          city?: string | null
          company_common_problems?: string | null
          company_keywords?: string[] | null
          company_linkedinurl?: string | null
          company_size?: number | null
          company_summary?: string | null
          company_target_customers?: string | null
          company_technologies?: Json | null
          company_unique_characteristics?: string[] | null
          company_unique_qualities?: string | null
          contact_count?: never
          country?: string | null
          created_at?: string | null
          domain?: string | null
          full_enrichment?: boolean | null
          id?: string | null
          industry_label?: string | null
          industry_slug?: string | null
          last_comm_at?: never
          last_deal_at?: never
          last_updated_at?: string | null
          name?: string | null
          notused?: string | null
          state?: string | null
          subindustry_label?: string | null
          tags?: string[] | null
          website?: string | null
        }
        Update: {
          city?: string | null
          company_common_problems?: string | null
          company_keywords?: string[] | null
          company_linkedinurl?: string | null
          company_size?: number | null
          company_summary?: string | null
          company_target_customers?: string | null
          company_technologies?: Json | null
          company_unique_characteristics?: string[] | null
          company_unique_qualities?: string | null
          contact_count?: never
          country?: string | null
          created_at?: string | null
          domain?: string | null
          full_enrichment?: boolean | null
          id?: string | null
          industry_label?: string | null
          industry_slug?: string | null
          last_comm_at?: never
          last_deal_at?: never
          last_updated_at?: string | null
          name?: string | null
          notused?: string | null
          state?: string | null
          subindustry_label?: string | null
          tags?: string[] | null
          website?: string | null
        }
        Relationships: []
      }
      v_company_timeline: {
        Row: {
          channel: string | null
          company_id: string | null
          contact_id: string | null
          content: string | null
          created_at: string | null
          deal_id: string | null
          direction: string | null
          id: string | null
          kind: string | null
          meta: Json | null
          note_id: string | null
          occurred_at: string | null
          project_id: string | null
          sentiment: string | null
          task_id: string | null
          type: string | null
        }
        Relationships: []
      }
      v_contacts_enriched: {
        Row: {
          client_id: string | null
          company_city: string | null
          company_common_problems: string | null
          company_country: string | null
          company_created_at: string | null
          company_id: string | null
          company_keywords: string[] | null
          company_last_updated_at: string | null
          company_linkedinurl: string | null
          company_name: string | null
          company_phone: string | null
          company_size: number | null
          company_state: string | null
          company_summary: string | null
          company_tags: string[] | null
          company_target_customers: string | null
          company_technologies: Json | null
          company_unique_characteristics: string[] | null
          company_unique_qualities: string | null
          contact_city: string | null
          contact_country: string | null
          contact_id: string | null
          contact_state: string | null
          created_at: string | null
          domain: string | null
          email: string | null
          first_name: string | null
          full_enrichment: boolean | null
          function_group: string | null
          industry: string | null
          industry_label: string | null
          is_linkedin_connected: boolean | null
          job_title: string | null
          last_campaign_added_at: string | null
          last_campaign_id: string | null
          last_campaign_status: string | null
          last_linkedin_connection_check: string | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          mobile_phone: string | null
          notes: string | null
          optedin: boolean | null
          seniority: string | null
          status: string | null
          subindustry_label: string | null
          tags: string[] | null
          website: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      v_current_client: {
        Row: {
          client_id: string | null
        }
        Insert: {
          client_id?: string | null
        }
        Update: {
          client_id?: string | null
        }
        Relationships: []
      }
      v_project_board: {
        Row: {
          due_at: string | null
          position: number | null
          priority: number | null
          project_id: string | null
          status: string | null
          task_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          due_at?: string | null
          position?: number | null
          priority?: number | null
          project_id?: string | null
          status?: string | null
          task_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          due_at?: string | null
          position?: number | null
          priority?: number | null
          project_id?: string | null
          status?: string | null
          task_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      v_project_calendar: {
        Row: {
          assigned_to: string | null
          end_at: string | null
          project_id: string | null
          start_at: string | null
          status: string | null
          task_id: string | null
          title: string | null
        }
        Insert: {
          assigned_to?: string | null
          end_at?: never
          project_id?: string | null
          start_at?: string | null
          status?: string | null
          task_id?: string | null
          title?: string | null
        }
        Update: {
          assigned_to?: string | null
          end_at?: never
          project_id?: string | null
          start_at?: string | null
          status?: string | null
          task_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      v_project_task_fields: {
        Row: {
          assigned_to: string | null
          custom_fields: Json | null
          due_at: string | null
          group_id: string | null
          position: number | null
          project_id: string | null
          status: string | null
          task_id: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "project_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      v_project_task_meta: {
        Row: {
          attachments_count: number | null
          checklist_done: number | null
          checklist_total: number | null
          comments_count: number | null
          project_id: string | null
          task_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      v_project_timeline: {
        Row: {
          end_at: string | null
          project_id: string | null
          start_at: string | null
          status: string | null
          task_id: string | null
          title: string | null
        }
        Insert: {
          end_at?: never
          project_id?: string | null
          start_at?: never
          status?: string | null
          task_id?: string | null
          title?: string | null
        }
        Update: {
          end_at?: never
          project_id?: string | null
          start_at?: never
          status?: string | null
          task_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_client_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      debug_auth_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_next_campaign_for_contact: {
        Args: { input_contact_id: string }
        Returns: string
      }
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
