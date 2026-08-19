/// <reference types="vite/client" />

declare var module: any;

interface ImportMetaEnv {
  readonly VITE_LEXIA_PLATFORM_PROVIDER?: 'base44' | 'supabase';
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_LEXIA_SUPABASE_AUTH_READY?: string;
  readonly VITE_LEXIA_SUPABASE_EDGE_READY?: string;
  readonly VITE_LEXIA_SUPABASE_AI_FUNCTION?: string;
  readonly VITE_LEXIA_SUPABASE_EMAIL_FUNCTION?: string;
  readonly VITE_LEXIA_SUPABASE_UPLOAD_FUNCTION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
