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

// Crear cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ConfirmationPage() {
  const router = useRouter();
  const [attendant, setAttendant] = useState<Attendant | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceDone, setAttendanceDone] = useState(false);


  useEffect(() => {
    const verifyStoredUser = async () => {
      const storedAttendant = localStorage.getItem('attendant');
      
      if (!storedAttendant) {
        setLoading(false);
        return;
      }
      else {
        try {
          const parsedAttendant = JSON.parse(storedAttendant);
          
          // 1. Verificar en Supabase si el usuario existe
          const { data, error } = await supabase
            .from('attendants')
            .select('*')
            .eq('id', parsedAttendant.id) // Usar el ID único
            .single();
    
          // 2. Si hay error o no existe
          if (error || !data) {
            console.log('Usuario no existe en la base de datos');
            localStorage.removeItem('attendant');
            setAttendant(null);
            return;
          }
    
          // 3. Si existe, actualizar el estado
          setAttendant(parsedAttendant);
    
        } catch (error) {
          console.error('Error al verificar usuario:', error);
          localStorage.removeItem('attendant');
          setAttendant(null);
        } finally {
          setLoading(false);
        }
      };
    }
    verifyStoredUser();
  }, []);

  useEffect(() => {
    const registerAttendance = async () => {
      try {
        if (!attendant || attendanceDone) return;

        // 1. Verificar si ya existe un registro hoy
        const today = new Date().toLocaleDateString('es-CO', {
          timeZone: 'America/Bogota',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).split('/').reverse().join('-');
        const { data: existingRegistration, error: queryError } = await supabase
        .from('registrations')
        .select('*')
        .eq('attendant_id', attendant.id)
        .eq('date', today)
        .limit(1);
        
        if (queryError) {
          throw new Error(`Error al verificar registro: ${queryError.message}`);
        }
        
        if (!existingRegistration || existingRegistration.length == 0) {
          const { error: insertError } = await supabase
            .from('registrations')
            .insert([
              {
                attendant_id: attendant.id,
                date: today
              }
            ]);

          if (insertError) {
            throw new Error(`Error al insertar registro: ${insertError.message}`);
          }
        }

        setAttendanceDone(true);

      } catch (error) {
        console.error('Error en registerAttendance:', error);
        // Aquí podrías agregar un toast o alerta al usuario
      }
    };

    registerAttendance();
  }, [attendant, attendanceDone]);

  useEffect(() => {
    if (loading) return;
    if (!attendant) {
      const timer = setTimeout(() => {
        router.push('/login'); // Redirect after 3 seconds
      }, 3000); // 3000 ms = 3 seconds

      return () => clearTimeout(timer); // Clear the timer if the component unmounts
    }
  }, [attendant, loading, router]);

  if (loading) return <div className={styles.loader}><Image src="/logo_transparente.png" alt="logo" width={400} height={400} className={styles.loaderImage}/></div>
  return (
  <div className={styles.page}>
    <div className={styles.container}>
      <header className={styles.header}>
        <Image src="/logo_transparente.png" alt="logo" width={100} height={100} className={styles.logo}/>
      </header>
      <div className={styles.statusContainer}>
      { attendant ? (
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