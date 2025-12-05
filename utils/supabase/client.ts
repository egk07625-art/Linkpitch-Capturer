import { createClient } from '@supabase/supabase-js';

// 환경변수에서 주소와 키를 가져와서 '만능 키'를 만듭니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);