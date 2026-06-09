export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          bride_name: string
          groom_name: string
          created_at: string
        }
        Insert: {
          id: string
          bride_name: string
          groom_name: string
          created_at?: string
        }
        Update: {
          bride_name?: string
          groom_name?: string
        }
        Relationships: []
      }
      weddings: {
        Row: {
          id: string
          user_id: string
          slug: string
          wedding_date: string
          venue_name: string
          venue_address: string | null
          venue_state: string | null
          venue_lat: number | null
          venue_lng: number | null
          cover_image_url: string | null
          bank_name: string | null
          bank_code: string | null
          account_number: string | null
          account_name: string | null
          currency: 'NGN' | 'USD' | 'GBP' | 'USDT' | 'USDC'
          crypto_chain: string | null
          crypto_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          slug: string
          wedding_date: string
          venue_name: string
          venue_address?: string | null
          venue_state?: string | null
          venue_lat?: number | null
          venue_lng?: number | null
          cover_image_url?: string | null
          bank_name?: string | null
          bank_code?: string | null
          account_number?: string | null
          account_name?: string | null
          currency?: 'NGN' | 'USD' | 'GBP' | 'USDT' | 'USDC'
          crypto_chain?: string | null
          crypto_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          slug?: string
          wedding_date?: string
          venue_name?: string
          venue_address?: string | null
          venue_state?: string | null
          venue_lat?: number | null
          venue_lng?: number | null
          cover_image_url?: string | null
          bank_name?: string | null
          bank_code?: string | null
          account_number?: string | null
          account_name?: string | null
          currency?: 'NGN' | 'USD' | 'GBP' | 'USDT' | 'USDC'
          crypto_chain?: string | null
          crypto_address?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      relationship_subcategories: {
        Row: {
          id: string
          category_id: string
          label: string
          sort_order: number
        }
        Insert: {
          id?: string
          category_id: string
          label: string
          sort_order?: number
        }
        Update: {
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'relationship_subcategories_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'relationship_categories'
            referencedColumns: ['id']
          }
        ]
      }
      relationship_categories: {
        Row: {
          id: string
          wedding_id: string
          side: 'bride' | 'groom'
          label: string
          sort_order: number
        }
        Insert: {
          id?: string
          wedding_id: string
          side: 'bride' | 'groom'
          label: string
          sort_order?: number
        }
        Update: {
          side?: 'bride' | 'groom'
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'relationship_categories_wedding_id_fkey'
            columns: ['wedding_id']
            isOneToOne: false
            referencedRelation: 'weddings'
            referencedColumns: ['id']
          }
        ]
      }
      seat_tables: {
        Row: {
          id: string
          wedding_id: string
          label: string
          capacity: number
          sort_order: number
          category_id: string | null
          subcategory_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          label: string
          capacity: number
          sort_order?: number
          category_id?: string | null
          subcategory_id?: string | null
          created_at?: string
        }
        Update: {
          label?: string
          capacity?: number
          sort_order?: number
          category_id?: string | null
          subcategory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'seat_tables_wedding_id_fkey'
            columns: ['wedding_id']
            isOneToOne: false
            referencedRelation: 'weddings'
            referencedColumns: ['id']
          }
        ]
      }
      guests: {
        Row: {
          id: string
          wedding_id: string
          full_name: string
          phone: string
          email: string | null
          side: 'bride' | 'groom' | 'both'
          category_id: string
          table_id: string | null
          rsvp_date: string
          is_removed: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          full_name: string
          phone: string
          email?: string | null
          side: 'bride' | 'groom' | 'both'
          category_id: string
          table_id?: string | null
          rsvp_date?: string
          is_removed?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          full_name?: string
          phone?: string
          email?: string | null
          side?: 'bride' | 'groom' | 'both'
          category_id?: string
          table_id?: string | null
          is_removed?: boolean
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'guests_wedding_id_fkey'
            columns: ['wedding_id']
            isOneToOne: false
            referencedRelation: 'weddings'
            referencedColumns: ['id']
          }
        ]
      }
      registry_items: {
        Row: {
          id: string
          wedding_id: string
          name: string
          description: string | null
          image_url: string | null
          price: number
          currency: string | null
          checkout_link: string | null
          quantity_needed: number
          quantity_claimed: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          wedding_id: string
          name: string
          description?: string | null
          image_url?: string | null
          price: number
          currency?: string | null
          checkout_link?: string | null
          quantity_needed?: number
          quantity_claimed?: number
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          image_url?: string | null
          price?: number
          currency?: string | null
          checkout_link?: string | null
          quantity_needed?: number
          quantity_claimed?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'registry_items_wedding_id_fkey'
            columns: ['wedding_id']
            isOneToOne: false
            referencedRelation: 'weddings'
            referencedColumns: ['id']
          }
        ]
      }
      gift_claims: {
        Row: {
          id: string
          registry_item_id: string
          guest_name: string
          phone: string | null
          guest_id: string | null
          claimed_at: string
          is_received: boolean
        }
        Insert: {
          id?: string
          registry_item_id: string
          guest_name: string
          phone?: string | null
          guest_id?: string | null
          claimed_at?: string
          is_received?: boolean
        }
        Update: {
          is_received?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'gift_claims_registry_item_id_fkey'
            columns: ['registry_item_id']
            isOneToOne: false
            referencedRelation: 'registry_items'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_gift: {
        Args: { item_id: string; claimer_name: string; claimer_phone?: string | null; p_guest_id?: string | null }
        Returns: {
          id: string
          registry_item_id: string
          guest_name: string
          phone: string | null
          guest_id: string | null
          claimed_at: string
          is_received: boolean
        }
      }
    }
    Enums: {
      guest_side: 'bride' | 'groom' | 'both'
      category_side: 'bride' | 'groom'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type WeddingRow = Tables<'weddings'>
export type UserProfile = Tables<'user_profiles'>
export type RelationshipCategory = Tables<'relationship_categories'>
export type RelationshipSubcategory = Tables<'relationship_subcategories'>
export type SeatTable = Tables<'seat_tables'>
export type GuestRow = Tables<'guests'>
export type RegistryItem = Tables<'registry_items'>
export type GiftClaim = Tables<'gift_claims'>

// Legacy aliases
export type Wedding = WeddingRow
export type Guest = GuestRow
