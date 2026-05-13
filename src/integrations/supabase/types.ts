export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          reseller_id: string | null
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          reseller_id?: string | null
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          reseller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          beneficiary_id: string
          beneficiary_role: Database["public"]["Enums"]["app_role"]
          created_at: string
          currency: string
          id: string
          order_id: string
          order_item_id: string
          status: string
        }
        Insert: {
          amount: number
          beneficiary_id: string
          beneficiary_role: Database["public"]["Enums"]["app_role"]
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          order_item_id: string
          status?: string
        }
        Update: {
          amount?: number
          beneficiary_id?: string
          beneficiary_role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          order_item_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_orders: boolean
          marketing_emails: boolean
          phone: string | null
          push_orders: boolean
          sms_orders: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_orders?: boolean
          marketing_emails?: boolean
          phone?: string | null
          push_orders?: boolean
          sms_orders?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_orders?: boolean
          marketing_emails?: boolean
          phone?: string | null
          push_orders?: boolean
          sms_orders?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          platform_fee: number
          product_id: string
          quantity: number
          reseller_commission: number
          reseller_id: string | null
          title: string
          unit_price: number
          vendor_id: string
          vendor_payout: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          platform_fee?: number
          product_id: string
          quantity: number
          reseller_commission?: number
          reseller_id?: string | null
          title: string
          unit_price: number
          vendor_id: string
          vendor_payout?: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          platform_fee?: number
          product_id?: string
          quantity?: number
          reseller_commission?: number
          reseller_id?: string | null
          title?: string
          unit_price?: number
          vendor_id?: string
          vendor_payout?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_id: string
          id: string
          order_number: string
          payment_method: string | null
          payment_reference: string | null
          platform_fee: number
          reseller_commission: number
          shipping_address: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_name: string | null
          shipping_phone: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          tracking_number: string | null
          updated_at: string
          vendor_payout: number
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_id: string
          id?: string
          order_number?: string
          payment_method?: string | null
          payment_reference?: string | null
          platform_fee?: number
          reseller_commission?: number
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          vendor_payout?: number
        }
        Update: {
          created_at?: string
          currency?: string
          customer_id?: string
          id?: string
          order_number?: string
          payment_method?: string | null
          payment_reference?: string | null
          platform_fee?: number
          reseller_commission?: number
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          vendor_payout?: number
        }
        Relationships: []
      }
      payout_accounts: {
        Row: {
          account_name: string | null
          account_number: string
          bank_code: string
          bank_name: string | null
          country: string
          created_at: string
          currency: string | null
          id: string
          is_default: boolean
          paystack_recipient_code: string | null
          type: string
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          account_name?: string | null
          account_number: string
          bank_code: string
          bank_name?: string | null
          country: string
          created_at?: string
          currency?: string | null
          id?: string
          is_default?: boolean
          paystack_recipient_code?: string | null
          type: string
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          account_name?: string | null
          account_number?: string
          bank_code?: string
          bank_name?: string | null
          country?: string
          created_at?: string
          currency?: string | null
          id?: string
          is_default?: boolean
          paystack_recipient_code?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          default_currency: string
          id: number
          notification_email: string | null
          notification_telegram_chat_id: string | null
          platform_fee_pct: number
          updated_at: string
        }
        Insert: {
          default_currency?: string
          id?: number
          notification_email?: string | null
          notification_telegram_chat_id?: string | null
          platform_fee_pct?: number
          updated_at?: string
        }
        Update: {
          default_currency?: string
          id?: number
          notification_email?: string | null
          notification_telegram_chat_id?: string | null
          platform_fee_pct?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          price: number
          reseller_commission_pct: number
          sku: string | null
          slug: string | null
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          store_id: string
          title: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price: number
          reseller_commission_pct?: number
          sku?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          store_id: string
          title: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price?: number
          reseller_commission_pct?: number
          sku?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          store_id?: string
          title?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "vendor_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          contact_email: string | null
          country: string | null
          created_at: string
          display_name: string | null
          id: string
          telegram_chat_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          telegram_chat_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          telegram_chat_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_link_tokens: {
        Row: {
          created_at: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      telegram_messages: {
        Row: {
          chat_id: number
          created_at: string
          raw: Json
          text: string | null
          tg_user_id: number | null
          update_id: number
          username: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string
          raw: Json
          text?: string | null
          tg_user_id?: number | null
          update_id: number
          username?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string
          raw?: Json
          text?: string | null
          tg_user_id?: number | null
          update_id?: number
          username?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_applications: {
        Row: {
          business_name: string
          category: string
          country: string
          created_at: string
          description: string
          expected_monthly_volume: string | null
          id: string
          requested_role: Database["public"]["Enums"]["app_role"]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          business_name: string
          category: string
          country: string
          created_at?: string
          description: string
          expected_monthly_volume?: string | null
          id?: string
          requested_role: Database["public"]["Enums"]["app_role"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          business_name?: string
          category?: string
          country?: string
          created_at?: string
          description?: string
          expected_monthly_volume?: string | null
          id?: string
          requested_role?: Database["public"]["Enums"]["app_role"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      vendor_stores: {
        Row: {
          banner_url: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["store_status"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          banner_url?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["store_status"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          banner_url?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["store_status"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      payout_accounts_admin: {
        Row: {
          account_name: string | null
          account_number_masked: string | null
          bank_code: string | null
          bank_name: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          id: string | null
          is_default: boolean | null
          paystack_recipient_code: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          account_name?: string | null
          account_number_masked?: never
          bank_code?: string | null
          bank_name?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          is_default?: boolean | null
          paystack_recipient_code?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          account_name?: string | null
          account_number_masked?: never
          bank_code?: string | null
          bank_name?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          is_default?: boolean | null
          paystack_recipient_code?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_order_customer: {
        Args: { _order_id: string; _uid: string }
        Returns: boolean
      }
      is_order_stakeholder: {
        Args: { _order_id: string; _uid: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "vendor" | "reseller" | "customer"
      order_status:
        | "pending"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      product_status: "draft" | "pending" | "active" | "rejected" | "archived"
      store_status: "pending" | "active" | "suspended"
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
    Enums: {
      app_role: ["admin", "vendor", "reseller", "customer"],
      order_status: [
        "pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      product_status: ["draft", "pending", "active", "rejected", "archived"],
      store_status: ["pending", "active", "suspended"],
    },
  },
} as const
