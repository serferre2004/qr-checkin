"use client";
import styles from './confirmation.module.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

interface Attendant {
  id: string;
  name: string;
  email: string;
  type: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ConfirmationPage() {
  const router = useRouter();
  const [user, setUser] = useState<Attendant | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceDone, setAttendanceDone] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!session || error) {
          throw new Error('No hay sesión activa');
        }

        // Obtener datos del usuario desde auth.users
        const { user } = session;
        
        // Verificar en tabla attendants
        const { data: attendantData, error: dbError } = await supabase
          .from('attendants')
          .select('*')
          .eq('email', user.email)
          .single();

        if (dbError || !attendantData) {
          throw new Error('Usuario no registrado');
        }

        setUser({
          id: user.id,
          name: attendantData.name,
          email: user.email!,
          type: attendantData.type
        });

      } catch (error) {
        console.error('Error de autenticación:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

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
          .eq('user_id', user.id)
          .eq('date', today)
          .limit(1);

        if (queryError) throw queryError;
        
        if (!existingRegistration?.length) {
          const { error: insertError } = await supabase
            .from('registrations')
            .insert([{
              user_id: user.id,
              date: today,
              email: user.email
            }]);

          if (insertError) throw insertError;
        }

        setAttendanceDone(true);

      } catch (error) {
        console.error('Error en registro:', error);
      }
    };

    registerAttendance();
  }, [user, attendanceDone]);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      const timer = setTimeout(() => {
        router.push('/login');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  if (loading) return <div className={styles.loader}><Image src="/logo_transparente.png" alt="logo" width={400} height={400} className={styles.loaderImage}/></div>
  return (
  <div className={styles.page}>
    <div className={styles.container}>
      <header className={styles.header}>
        <Image src="/logo_transparente.png" alt="logo" width={100} height={100} className={styles.logo}/>
      </header>
      <div className={styles.statusContainer}>
      { user ? (
          <>
            <h1>Registration completed</h1>
            <a href='/program'>
              <div className={styles.button}>
              Check the event program
              </div>
            </a>
          </>
      ) : (
        <h1>Didn&apos;t find any data. Redirecting to login...</h1>
      )}
      </div>
    </div>
    <div className={styles.decorContainer}>
      <Image className={styles.decor} src='./decor.svg' alt='' width={2000} height={200}/>
    </div>
  </div>
  );
}