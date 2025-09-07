import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  workspace_id: string;
  name: string;
  prompt: string;
  image_url: string;
  metadata?: Record<string, any>;
  status: 'pending' | 'generating' | 'done' | 'error';
  created_at: string;
  updated_at: string;
}

export const WORKSPACE_MAP: Record<string, string> = {
  'default': 'Default Workspace',
  'analog': 'Analog Workspace',
  'metal': 'Metal Workspace', 
  'vintage': 'Vintage Workspace',
  'character': 'Character Design',
  'environment': 'Environment Art',
  'ui': 'UI/UX Design'
};
