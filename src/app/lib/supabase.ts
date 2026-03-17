import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Chave pública
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Chave privada (servidor)

// Client normal (Respeita o RLS)
export const supabase = createClient(supabaseUrl, anonKey);

// Client Admin (Ignora o RLS)
export const supabaseAdmin = createClient(supabaseUrl, serviceKey);