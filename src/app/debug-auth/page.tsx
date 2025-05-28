"use client";
import { useState, useEffect } from 'react';
import styles from './Login.module.css'; // Create this CSS module file
import supabase from '../../../lib/supabase';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { User } from '@supabase/supabase-js';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState('');
  const [session, setSession] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [attendanceDone, setAttendanceDone] = useState(false);
  const [userName, setUserName] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [authInfo, setAuthInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
    useEffect(() => {
        const registerAttendance = async () => {
          try {
            if (!user || attendanceDone) return;
    
            const today = new Date().toLocaleDateString('es-CO', {
              timeZone: 'America/Bogota',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).split('/').reverse().join('-');
    
            const { data: existingRegistration, error: queryError } = await supabase
              .from('registrations')
              .select('*')
              .eq('attendant_id', user.id)
              .eq('date', today)
              .limit(1);
    
            if (queryError) throw queryError;
            
            if (!existingRegistration?.length) {
              const { error: insertError } = await supabase
                .from('registrations')
                .insert([{
                  attendant_id: user.id,
                  date: today,
                }]);
    
              if (insertError) throw insertError;
            }
            
            const { data: userData, error: queryUserError } = await supabase
              .from('attendants')
              .select('name')
              .eq('id', user.id)
              .limit(1);

            if (queryUserError) {
              throw queryUserError;
            } else {
              setUserName(userData?.[0]?.name || '');
            }
            setAttendanceDone(true);
    
          } catch (error) {
            console.error('Error en registro:', error);
          }
        };
        
        registerAttendance();
      }, [user, attendanceDone]);

  const checkAuthStatus = async () => {
    try {
      
      // Verificar sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Verificar usuario
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (user) {
        setSession(true);
        setUser(user);
      }
      
      // Información del localStorage
      const localStorageInfo = typeof window !== 'undefined' ? {
        supabaseKeys: Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.includes('sb-')
        ),
        hasAuthToken: !!localStorage.getItem('sb-auth-token')
      } : null;
      
      setAuthInfo({
        session: session,
        user: user,
        sessionError: sessionError?.message || null,
        userError: userError?.message || null,
        localStorage: localStorageInfo,
        timestamp: new Date().toISOString()
      });
      console.log('Auth Info:', authInfo);
      
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (email: string) => {
    const { data: attendantData, error: dbError } = await supabase
        .from('usuarios_excel')
        .select('*')
        .eq('correo', email)
        .limit(1);
        
        if (dbError || !attendantData) {
          return false;
        }
        return true;
      }
      
      useEffect(() => {
        checkAuthStatus();
        
        // Escuchar cambios de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth changed:', event, session?.user?.email);
          checkAuthStatus();
        });
        
        return () => subscription.unsubscribe();
      }, []);
      
      const logIn = async () => {
        try {
          const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: false,
              emailRedirectTo: `${window.location.origin}/auth/callback`
            }
          });
          if (error) {
            setMagicLinkError(error.message);
          } else {
            setMagicLinkSent(true);
        setMagicLinkError('');
      }
      console.log('Magic link test result:', { data, error });
    } catch (error) {
      console.error('Magic link test error:', error);
    }
    setLoading(false);
  }

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (!email.trim()) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    
    // Handle form submission here
    const userExist = verifyEmail(email);
    if (!userExist) {
      setError('Email not registered');
      setLoading(false);
      return;
    }
    console.log('Submitting:', email);
    logIn();
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.container}>
        <Image 
          src="/logo_transparente.png" 
          alt="PEPQA Logo" 
          className={styles.logo}
          width={200}
          height={200}
        />
        {session? (
          <><h1 className={styles.formTitle}>Welcome to PEPQA {userName}!</h1>
          <p>Registration confirmed</p></> ): (
        magicLinkSent? (
          <h1 className={styles.formTitle}>Check your email to continue</h1>) : (
          magicLinkError? (
            <h1 className={styles.formTitleError}>Error sending email confirmation</h1>) : (
          <>  
          <h1 className={styles.formTitle}>Log in to PEPQA</h1>
          
          <form onSubmit={handleSubmit}>
            <div className={`${styles.inputGroup} ${error ? styles.error : ''}`}>
              <FontAwesomeIcon 
                icon={faEnvelope} 
                className={styles.inputIcon}
              />
              <input
                className={styles.inputField}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                aria-invalid={!!error}
                aria-describedby="emailError"
              />
              {error && (
                <div id="emailError" className={styles.errorMessage} role="alert">
                  {error}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Continue with Email'}
            </button>
          </form>
          </>
        )
      )
      )}
      </div>
    </div>
  );
}




// export default function AuthDebug() {

//   const testMagicLink = async () => {
//     const email = prompt('Enter email for magic link test:');
//     if (!email) return;


//   const clearAuth = async () => {
//     await supabase.auth.signOut();
//     if (typeof window !== 'undefined') {
//       localStorage.clear();
//     }
//     window.location.reload();
//   };


//   if (loading) {
//     return <div className="p-6">Loading...</div>;
//   }

//   return (
//     <div className="p-6 max-w-4xl mx-auto">
//       <h1 className="text-2xl font-bold mb-6">Auth Debug Dashboard</h1>
      
//       {/* Estado actual */}
//       <div className={`p-4 rounded-lg mb-6 ${
//         authInfo.session ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
//       }`}>
//         <h2 className="font-semibold text-lg mb-2">
//           Status: {authInfo.session ? '✅ Authenticated' : '❌ Not Authenticated'}
//         </h2>
//         {authInfo.user && (
//           <p>Email: {authInfo.user.email}</p>
//         )}
//       </div>

//       {/* Acciones */}
//       <div className="flex gap-3 mb-6">
//         <button
//           onClick={checkAuthStatus}
//           className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//         >
//           Refresh Status
//         </button>
//         <button
//           onClick={testMagicLink}
//           className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
//         >
//           Test Magic Link
//         </button>
//         <button
//           onClick={clearAuth}
//           className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
//         >
//           Clear Auth
//         </button>
//         <button
//           onClick={() => window.location.href = '/login'}
//           className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
//         >
//           Go to Login
//         </button>
//       </div>

//       {/* Debug info */}
//   );
// }