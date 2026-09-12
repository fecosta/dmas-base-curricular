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
  created_at: string;
  created_by: string | null;
  id: string;
  published_at: string | null;
  revision_number: number;
  status: RevisionStatus;
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
    };
    Enums: {
      curriculum_revision_status: "Draft" | "Submitted" | "Under Review" | "Changes Requested" | "Resubmitted" | "Approved" | "Published";
      product_role: "Contributor" | "Admin";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
