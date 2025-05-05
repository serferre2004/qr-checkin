"use client";
import styles from './ScanView.module.css';
import { useEffect, useState } from 'react';
import { notFound, useRouter, useSearchParams } from 'next/navigation';
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

export default function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');
  const [sessionName, setSessionName] = useState("");
  const [sessionLink, setSessionLink] = useState("");
  const [attendant, setAttendant] = useState<Attendant | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExists, setSessionExists] = useState(true);
  const [attendanceDone, setAttendanceDone] = useState(false);

  useEffect(() => {
    const sessionDetails = async () => {
      const { data, error } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
      if (error || !data) {
        setLoading(false);
        setSessionExists(false);
        return;
      } else {
        setSessionName(data.name);
        setSessionLink(data.interaction_url);
      }
    }
    sessionDetails();
  }, [sessionId, sessionExists, sessionName, sessionLink]);


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
      if (attendant && sessionId && !attendanceDone) {
        const { data, error } = await supabase.from('attendance').select('*').eq('attendant_id', attendant.id).eq('session_id', sessionId).maybeSingle();
        if (error) {
          console.error(error);
          return;
        }
        if (!data){
          const { error } = await supabase.from('attendance').insert([
            {
              attendant_id: attendant.id,
              session_id: sessionId,
              checked_at: new Date().toISOString()
            }
          ]);
          if (!error) {
            setAttendanceDone(true);
          } else {
            console.error('Error registrando asistencia:', error);
          }
        } else {
          setAttendanceDone(true);
        }
      }
    };

    registerAttendance();
  }, [attendant, sessionId, attendanceDone]);

  useEffect(() => {
    if (loading) return;
    if (!attendant) {
      const timer = setTimeout(() => {
        router.push(`/login?id=${sessionId}`); // Redirect after 3 seconds
      }, 3000); // 3000 ms = 3 seconds

      return () => clearTimeout(timer); // Clear the timer if the component unmounts
    }
  }, [attendant, loading, router, sessionId]);

  if (loading) return <div className={styles.loader}><Image src="/logo_transparente.png" alt="logo" width={400} height={400} className={styles.loaderImage}/></div>
  if (!sessionExists) return notFound();
  return (
  <div className={styles.page}>  
    <div className={styles.container}>
      <header className={styles.header}>
        <Image src="/logo_transparente.png" alt="logo" width={100} height={100} className={styles.logo}/>
      </header>
      <div className={styles.statusContainer}>
      { attendant ? (
          <><h1>Welcome to </h1> <h1 className={styles.sessionName}>TUTORIAL 4</h1></>
      ) : (
        <h1>Didn&apos;t find any data. Redirecting to login...</h1>
      )}
      </div>
    </div>
    <div className={styles.linkContainer}>
      { attendanceDone ? (
          <>
          <p className={styles.preLinkText}>Use slido to interact with the speaker</p>
          <a href='https://app.sli.do/'>
            <button className={styles.slidoButton}><Image src="https://wp.nyu.edu/refathbari/files/2020/05/slido_green.png" alt="slido" className={styles.slidoLogo} width={50} height={20}/></button>
          </a>
          </>
        ) : ( attendant ? (
          <p className={styles.preLinkText}>Processing attendance...</p>
        ) : (<></>)
      )}
    </div>
  </div>
  );
}
  {/* if (loading) return <p>Cargando...</p>;

  if (!attendant) {
    return (
      <div>
        <p>Didn&apos;t find any data. Redirecting to login</p>
      </div>
    );
  }

  return (
    <div className="p-4">
        {attendanceDone ? (
          <p>Asistencia registrada correctamente. ¡Gracias {attendant.name}!</p>
        ) : (
          <p>Registrando tu asistencia...</p>
        )}
    </div>
  );
} */}
