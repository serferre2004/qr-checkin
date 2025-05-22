import { useEffect, useState } from 'react'
import { AuthSession } from '../types/supabase';
import supabase from '../lib/supabase'

export const useSession = (): AuthSession => {
  const [session, setSession] = useState<AuthSession>(null)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    
    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  return session
}