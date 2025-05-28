// lib/supabase.ts (o .js)
import { createClient } from '@supabase/supabase-js'

// Verifica que estas variables estén correctamente definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Debug: verificar que las variables existen
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Debug en desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key exists:', !!supabaseAnonKey)
  console.log('Supabase Key prefix:', supabaseAnonKey.substring(0, 20) + '...')
}

// Crear cliente con configuración explícita
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export default supabase

// Función de debug para verificar configuración
export const debugSupabaseConfig = () => {
  console.log('=== Supabase Configuration Debug ===')
  console.log('URL:', supabaseUrl)
  console.log('Key exists:', !!supabaseAnonKey)
  console.log('Key length:', supabaseAnonKey?.length)
  console.log('Key starts with eyJ:', supabaseAnonKey?.startsWith('eyJ'))
  
  // Test básico de conexión
  supabase.auth.getSession().then(({ data, error }) => {
    console.log('Connection test:', { hasSession: !!data.session, error })
  })
}