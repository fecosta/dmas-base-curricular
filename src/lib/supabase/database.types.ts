// Schema shape verified with `supabase gen types typescript --local`.
export type Database = {
  public: {
    Tables: {
      memberships: {
        Row: { is_active: boolean; organization_id: string; role: Database["public"]["Enums"]["product_role"]; user_id: string };
        Insert: { is_active?: boolean; organization_id: string; role?: Database["public"]["Enums"]["product_role"]; user_id: string };
        Update: { is_active?: boolean; organization_id?: string; role?: Database["public"]["Enums"]["product_role"]; user_id?: string };
        Relationships: [{ foreignKeyName: "memberships_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] }];
      };
      organization_domains: {
        Row: { domain: string; organization_id: string };
        Insert: { domain: string; organization_id: string };
        Update: { domain?: string; organization_id?: string };
        Relationships: [{ foreignKeyName: "organization_domains_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] }];
      };
      organizations: {
        Row: { id: string; is_active: boolean; name: string };
        Insert: { id?: string; is_active?: boolean; name: string };
        Update: { id?: string; is_active?: boolean; name?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      current_access: {
        Args: never;
        Returns: { organization_id: string; organization_name: string; role: Database["public"]["Enums"]["product_role"]; user_id: string }[];
      };
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: { product_role: "Contributor" | "Admin" };
    CompositeTypes: { [_ in never]: never };
  };
};
