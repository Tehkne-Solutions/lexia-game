import { createClient } from '@supabase/supabase-js';

// Essas variáveis vêm do arquivo .env local ou das configurações da Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase URL ou Chave não encontradas. Verifique o arquivo .env.local ou as variáveis de ambiente da Vercel.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');