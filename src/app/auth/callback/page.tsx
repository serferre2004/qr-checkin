"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import supabase from '../../../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('=== Auth Callback Started ===');
        console.log('URL:', window.location.href);

        // Obtener parámetros de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const code = urlParams.get('code') || hashParams.get('code');
        const access_token = urlParams.get('access_token') || hashParams.get('access_token');
        const refresh_token = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const error_code = urlParams.get('error_code') || hashParams.get('error_code');
        const error_description = urlParams.get('error_description') || hashParams.get('error_description');

        // Si hay error
        if (error_code) {
          setError(error_description || 'Authentication failed');
          setLoading(false);
          return;
        }

        // Método 1: Con código de autorización
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            setError(`Authentication failed: ${exchangeError.message}`);
            setLoading(false);
            return;
          }
          
          if (data.session) {
            console.log('✅ Authentication successful!');
            redirectToApp(data.session.user);
            return;
          }
        }

        // Método 2: Con tokens directos
        if (access_token && refresh_token) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            setError(`Session setup failed: ${sessionError.message}`);
            setLoading(false);
            return;
          }

          if (data.session) {
            console.log('✅ Authentication successful!');
            redirectToApp(data.session.user);
            return;
          }
        }

        setError('No authentication tokens found');
        setLoading(false);

      } catch (err) {
        console.error('Callback error:', err);
        setError('Unexpected error occurred');
        setLoading(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const redirectToApp = (user: any) => {
      const sessionId = user.user_metadata?.sessionId || searchParams.get('session');
      
      setTimeout(() => {
        if (sessionId) {
          router.push(`/scan?session=${sessionId}`);
        } else {
          router.push('/debug-auth'); // o tu página principal
        }
      }, 1000);
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Logging you in...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Login Failed</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-green-600">Success!</h2>
        <p>Redirecting...</p>
      </div>
    </div>
  );
}