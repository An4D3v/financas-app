import { createClient } from '@supabase/supabase-js'

// A URL e a chave ANON sao PUBLICAS (a chave anon ja vai no bundle do navegador;
// quem protege os dados e o RLS no banco). Por isso ter um fallback aqui e seguro,
// e faz o deploy funcionar mesmo sem env vars configuradas.
// Segredos DE VERDADE (chave do Gemini, service_role) ficam SO no servidor
// (Edge Function / secret do Supabase), nunca neste arquivo do cliente.
const FALLBACK_URL = 'https://exokogdbvmmcaaipiunk.supabase.co'
const FALLBACK_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4b2tvZ2Ridm1tY2FhaXBpdW5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDI3NDIsImV4cCI6MjA5Nzg3ODc0Mn0.McEJFJ0XDcGrtU55Ft6m3r6cmf09WZAiLGZe21phXNo'

const url = (import.meta.env.VITE_SUPABASE_URL as string) || FALLBACK_URL
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || FALLBACK_ANON

export const supabase = createClient(url, key)
