import { useEffect } from 'react'
import { useRouter } from 'next/router'
import supabase from '../../lib/supabase'
import { useSearchParams } from 'next/navigation'

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams('session');

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN') {
            if (sessionId) {
                router.push(`/scan?id=${sessionId}`);
            } else {
                router.push('/confirmation');
            }
        }
      }
    )

    return () => authListener?.unsubscribe()
  }, [])

  return <div>Revisa tu correo y haz clic en el enlace recibido</div>;
}