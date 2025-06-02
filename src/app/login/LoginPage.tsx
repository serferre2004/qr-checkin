"use client";
import { useState, useEffect, useRef } from 'react';
import styles from './Login.module.css'; // Create this CSS module file
import supabase from '../../../lib/supabase';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { User } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [session, setSession] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [attendanceDone, setAttendanceDone] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  const [userName, setUserName] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef(Array(6).fill(null));
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');
  const router = useRouter();
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
            setAttendanceError('Error registering attendance. Please contact a staff member.');
          }
        };
        if (user) {
          registerAttendance();
          if (sessionId) {
            router.push(`/scan?id=${sessionId}`);
          }
        }
      }, [user]);

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
    console.log('Attendant data:', attendantData, 'Error:', dbError);
    if (dbError) {
      console.error('Database error:', dbError.message);
      return false;
    }
    if (!attendantData || attendantData.length === 0) {
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
        }
      });
      if (error) {
        setOtpError(error.message);
      } else {
        setOtpSent(true);
      }
      console.log('OTP code test result:', { data, error });
    } catch (error) {
      console.error('OTP code test error:', error);
    }
    setLoading(false);
  }

  async function verifyOtpCode(email:string, token:string) {
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      console.error('OTP verification failed:', error.message);
      setOtpError(error.message);
    } else {
      console.log('OTP verified, user:', data.user);
    }
    setLoading(false);
  }


  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Reset error state
    
    try {
      // Validate email presence
      if (!email.trim()) {
        setError('Please enter your email address');
        return;
      }

      // Validate email format
      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Check if user exists (await the async call)
      const userExist = await verifyEmail(email);
      console.log('User exists:', userExist);
      
      if (!userExist) {
        setError('Email not registered');
      } else {
        console.log('Submitting:', email);
        logIn();
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setError('An error occurred while verifying your email');
    } finally {
      setLoading(false);
    }
  };




  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const otp = digits.join('');
    verifyOtpCode(email, otp);
  }

  const handleChange = (index:number, value:string) => {
    // Allow only single digits
    if (value.length > 1) value = value.charAt(0);
    
    // Update digits state
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Move focus to next input if digit entered
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index:number, e:React.KeyboardEvent) => {
    // Handle backspace on empty input
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  if (session && user && attendanceDone) {
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
          <h1 className={styles.formTitle}>Welcome to PEPQA, {userName}!</h1>
          <p>Registration confirmed</p>
          <button className={styles.submitBtn} onClick={() => {router.push("/program")}}>Check our program</button>
        </div>
      </div>
    );
  } else if (otpError) {
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
          <h1 className={styles.formTitleError}>Code is incorrect or has expired</h1>
          <p className={styles.errorMessage}>Please contact staff member.</p>
          <button className={styles.submitBtn} onClick={() => {window.location.reload()}}>Try Again</button>
        </div>
      </div>
    );
  } else if (otpSent) {
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
          {(attendanceError.length === 0)? (
          <>
          <h1 className={styles.formTitle}>We sent you a code to your email</h1>
          <p>Enter the code below</p>
          <form onSubmit={handleVerify}>
            <div className={styles.tokenInputGroup}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  type="number"
                  className={styles.digitField}
                  placeholder="-"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  ref={(el) => {inputRefs.current[index] = el}}
                  aria-describedby="otpError"
                  maxLength={1}
                />
              ))}
            </div>
            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading || (digits.join('').length < 6)}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
          </>
          ) : (
            <>
            <h1 className={styles.formTitleError}>{attendanceError}</h1>
            <button className={styles.submitBtn} onClick={() => {window.location.reload()}}>Try Again</button>
            </>
          )
        }
        </div>
      </div>
    );
  }





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
                  setEmail(e.target.value.toLowerCase());
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
      </div>
    </div>
  );
}
