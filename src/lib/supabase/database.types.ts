// Schema shape verified with `supabase gen types typescript --local`.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Array<{
    foreignKeyName: string;
    columns: string[];
    isOneToOne: boolean;
    referencedRelation: string;
    referencedColumns: string[];
  }>;
};

type IdentityRow = {
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
  created_by: string | null;
  current_published_revision_id: string | null;
  id: string;
};
type IdentityInsert = {
  archived_at?: string | null;
  archived_by?: string | null;
  created_at?: string;
  created_by?: string | null;
  current_published_revision_id?: string | null;
  id: string;
};
type RevisionStatus = Database["public"]["Enums"]["curriculum_revision_status"];
type RevisionMetadata = {
  contributor_organization_id: string | null;
  created_at: string;
  created_by: string | null;
  id: string;
  published_at: string | null;
  revision_number: number;
  status: RevisionStatus;
  submitted_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      axes: Table<
        { description: string | null; display_order: number; id: string; is_active: boolean; name: string },
        { description?: string | null; display_order: number; id: string; is_active?: boolean; name: string }
      >;
      organizations: Table<
        { id: string; is_active: boolean; name: string },
        { id?: string; is_active?: boolean; name: string }
      >;
      organization_domains: Table<
        { domain: string; organization_id: string },
        { domain: string; organization_id: string }
      >;
      memberships: Table<
        { is_active: boolean; organization_id: string; role: Database["public"]["Enums"]["product_role"]; user_id: string },
        { is_active?: boolean; organization_id: string; role?: Database["public"]["Enums"]["product_role"]; user_id: string }
      >;
      curriculum_attachments: Table<{
        contributor_organization_id: string; created_at: string; created_by: string; id: string;
        material_revision_id: string | null; mime_type: string; object_name: string; original_filename: string;
        size_bytes: number; state: Database["public"]["Enums"]["curriculum_attachment_state"];
        teaching_note_revision_id: string | null;
      }>;
      curriculum_lifecycle_events: Table<{
        action: Database["public"]["Enums"]["curriculum_lifecycle_action"];
        actor_organization_id: string; actor_user_id: string; content_id: string;
        content_type: Database["public"]["Enums"]["curriculum_content_type"];
        id: number; occurred_at: string; previous_status: RevisionStatus | null;
        resulting_status: RevisionStatus | null; revision_id: string | null;
      }>;
      modules: Table<IdentityRow, IdentityInsert>;
      program_topics: Table<IdentityRow, IdentityInsert>;
      instructors: Table<IdentityRow, IdentityInsert>;
      teaching_notes: Table<IdentityRow, IdentityInsert>;
      materials: Table<IdentityRow, IdentityInsert>;
      institutions: Table<IdentityRow, IdentityInsert>;
      module_revisions: Table<RevisionMetadata & {
        axis_id: string; delivery_format: string | null; description: string; learning_outcomes: string[];
        level: string | null; module_id: string; suggested_duration: string | null; theme: string | null; title: string;
      }>;
      program_topic_revisions: Table<RevisionMetadata & {
        description: string | null; module_id: string; position: number | null; program_topic_id: string; title: string;
      }>;
      instructor_revisions: Table<RevisionMetadata & {
        country: string | null; institution: string | null; instructor_id: string; linkedin_url: string | null;
        name: string; profile: string | null; role_or_title: string | null; thematic_axis_or_themes: string[];
      }>;
      teaching_note_revisions: Table<RevisionMetadata & {
        module_id: string; program_topic_id: string | null; source_url: string | null;
        teaching_note_id: string; text: string | null; title: string;
      }>;
      material_revisions: Table<RevisionMetadata & {
        country_or_scope: string | null; description: string | null; material_id: string; material_type: string;
        source_or_institution: string | null; source_url: string | null; theme: string | null; title: string;
      }>;
      institution_revisions: Table<RevisionMetadata & {
        country_or_scope: string | null; description: string | null; institution_id: string; institution_type: string;
        name: string; themes: string[]; website_url: string | null;
      }>;
      module_instructors: Table<
        { instructor_id: string; module_revision_id: string },
        { instructor_id: string; module_revision_id: string }
      >;
      module_materials: Table<
        { material_id: string; module_revision_id: string },
        { material_id: string; module_revision_id: string }
      >;
      module_institutions: Table<
        { institution_id: string; module_revision_id: string },
        { institution_id: string; module_revision_id: string }
      >;
      teaching_note_materials: Table<
        { material_id: string; teaching_note_revision_id: string },
        { material_id: string; teaching_note_revision_id: string }
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      current_access: {
        Args: never;
        Returns: { organization_id: string; organization_name: string; role: Database["public"]["Enums"]["product_role"]; user_id: string }[];
      };
      is_admin: { Args: never; Returns: boolean };
      list_published_modules: {
        Args: { axis_filter?: string; search_query?: string; theme_filter?: string };
        Returns: {
          axis_id: string; axis_name: string; description: string; id: string; learning_outcomes: string[];
          revision_id: string; suggested_duration: string | null; theme: string | null; title: string;
        }[];
      };
      get_published_module: { Args: { target_id: string }; Returns: Json };
      search_curriculum: {
        Args: { axis_filter?: string; country_filter?: string; entity_filter?: string; search_query?: string; theme_filter?: string };
        Returns: {
          classification: string; country_or_scope: string | null; description: string | null; entity_type: string;
          id: string; rank: number; theme: string | null; title: string;
        }[];
      };
      get_published_reference: { Args: { reference_type: string; target_id: string }; Returns: Json };
      import_published_curriculum: { Args: { payload: Json }; Returns: Json };
      create_contribution: {
        Args: { payload: Json; requested_type: Database["public"]["Enums"]["curriculum_content_type"] };
        Returns: Json;
      };
      update_contribution: {
        Args: { payload: Json; requested_revision_id: string; requested_type: Database["public"]["Enums"]["curriculum_content_type"] };
        Returns: Json;
      };
      submit_contribution: {
        Args: { requested_revision_id: string; requested_type: Database["public"]["Enums"]["curriculum_content_type"] };
        Returns: Json;
      };
      delete_contribution: {
        Args: { requested_revision_id: string; requested_type: Database["public"]["Enums"]["curriculum_content_type"] };
        Returns: undefined;
      };
      publish_content_draft: {
        Args: { requested_revision_id: string; requested_type: Database["public"]["Enums"]["curriculum_content_type"] };
        Returns: Json;
      };
      create_successor_draft: {
        Args: { requested_content_id: string; requested_type: Database["public"]["Enums"]["curriculum_content_type"] };
        Returns: Json;
      };
      archive_governed_content: {
        Args: { requested_content_id: string; requested_type: Database["public"]["Enums"]["curriculum_content_type"] };
        Returns: Json;
      };
      restore_governed_content: {
        Args: { requested_content_id: string; requested_type: Database["public"]["Enums"]["curriculum_content_type"] };
        Returns: Json;
      };
      list_curriculum_lifecycle_history: {
        Args: {
          action_filter?: Database["public"]["Enums"]["curriculum_lifecycle_action"];
          before_event_id?: number;
          content_id_filter?: string;
          content_type_filter?: Database["public"]["Enums"]["curriculum_content_type"];
          page_size?: number;
        };
        Returns: {
          action: Database["public"]["Enums"]["curriculum_lifecycle_action"];
          actor_organization_id: string; actor_organization_name: string | null;
          actor_user_id: string; content_id: string;
          content_type: Database["public"]["Enums"]["curriculum_content_type"];
          event_id: number; occurred_at: string; previous_status: RevisionStatus | null;
          resulting_status: RevisionStatus | null; revision_id: string | null;
        }[];
      };
      list_archived_governed_content: {
        Args: {
          before_archived_at?: string;
          before_content_id?: string;
          content_type_filter?: Database["public"]["Enums"]["curriculum_content_type"];
          page_size?: number;
        };
        Returns: {
          archived_at: string; archived_by: string | null; content_id: string;
          content_type: Database["public"]["Enums"]["curriculum_content_type"];
          current_published_revision_id: string | null; revision_number: number | null;
          title: string | null;
        }[];
      };
      reserve_attachment: {
        Args: {
          requested_filename: string; requested_mime_type: string; requested_revision_id: string;
          requested_size_bytes: number; requested_type: Database["public"]["Enums"]["curriculum_content_type"];
        };
        Returns: Json;
      };
      cancel_attachment_reservation: { Args: { requested_attachment_id: string }; Returns: undefined };
      finalize_attachment_upload: { Args: { requested_attachment_id: string }; Returns: undefined };
      begin_attachment_deletion: { Args: { requested_attachment_id: string }; Returns: undefined };
      cancel_attachment_deletion: { Args: { requested_attachment_id: string }; Returns: undefined };
      finalize_attachment_deletion: { Args: { requested_attachment_id: string }; Returns: undefined };
    };
    Enums: {
      curriculum_content_type: "module" | "program_topic" | "instructor" | "teaching_note" | "material" | "institution";
      curriculum_attachment_state: "Reserved" | "Ready" | "Deleting";
      curriculum_lifecycle_action: "content_created" | "revision_created" | "revision_edited" | "content_submitted" | "draft_deleted" | "content_published" | "content_archived" | "content_restored";
      curriculum_revision_status: "Draft" | "Submitted" | "Under Review" | "Changes Requested" | "Resubmitted" | "Approved" | "Published";
      product_role: "Contributor" | "Admin";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
