import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
    "Set them in .env (local) or in Vercel → Settings → Environment Variables (production), then redeploy."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  phone_verified?: boolean;
  email?: string | null;
  date_of_birth?: string | null;
  weight?: number | null;
  blood_pressure?: string | null;
  avatar_url?: string | null;
  gender?: string | null;
  blood_group?: string | null;
  address?: string | null;
  abha_id?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_relation?: string | null;
  emergency_contact_phone?: string | null;
  notify_sms?: boolean;
  notify_whatsapp?: boolean;
  notify_email?: boolean;
  notify_report_ready?: boolean;
  notify_health_tips?: boolean;
  notify_promotional?: boolean;
  two_factor_enabled?: boolean;
  report_sharing_allowed?: boolean;
  profile_visible_to_labs?: boolean;
  preferred_language?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Lab = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  license_number?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type LabUser = {
  id: string;
  user_id: string;
  lab_id: string;
  role: string;
  created_at?: string;
};

export type Report = {
  id: string;
  lab_id: string;
  patient_id?: string | null;
  patient_name: string;
  patient_phone: string;
  test_name: string;
  file_url: string;
  file_size?: number | null;
  status: string;
  uploaded_by?: string | null;
  uploaded_at: string;
  delivered_at?: string | null;
  viewed_at?: string | null;
  test_date?: string | null;
  notes?: string | null;
};

export type FamilyMember = {
  id: string;
  user_id: string;
  name: string;
  relation: string;
  phone?: string | null;
  date_of_birth?: string | null;
  email?: string | null;
  created_at?: string;
};
