"use client";
import styles from './ScanView.module.css';
import { useEffect, useState } from 'react';
import { notFound, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '../../../hooks/useSession';
import supabase from '../../../lib/supabase';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { User } from '@supabase/supabase-js';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';

export default function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sessionInfo, setSessionInfo] = useState<any>({});
  const [sessionDate, setSessionDate] = useState<Date>(new Date());
  const weekDays = ['Wed', 'Thu', 'Fri'];
  const logos = new Map([
    ['SEL', '/logos/sel.png'],
    ['PQS', '/logos/pqs.png'],
    ['UP Sistemas', '/logos/up-sistemas.png'],
    ['JIC - MTE', '/logos/jic-mte.png'],
    ['Eaton', '/logos/eaton.png'],
    ['Plusenergy', '/logos/plusenergy.png']
  ]);
  const websites = new Map([
    ['SEL', 'https://selinc.com/'],
    ['PQS', 'https://pqs.com.co/'],
    ['UP Sistemas', 'https://www.upsistemas.com/'],
    ['JIC - MTE', 'https://jicingenieria.com/'],
    ['Eaton', 'https://www.eaton.com/co/es-mx.html'],
    ['Plusenergy', 'https://plusenergy.com.co/']
  ]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExists, setSessionExists] = useState(true);
  const [attendanceDone, setAttendanceDone] = useState(false);
  const session = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [authInfo, setAuthInfo] = useState<any>({});
  
  useEffect(() => {
    const checkAuthStatus = async () => {
        try {
          
          // Verificar sesión
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          // Verificar usuario
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (user) {
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
    const sessionDetails = async () => {
      const { data, error } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
      if (error || !data) {
        setLoading(false);
        setSessionExists(false);
        return;
      } else {
        setSessionInfo(data);
        setSessionDate(new Date(data.start_time));
      }
    }
    sessionDetails();
    checkAuthStatus();
  }, []);



  useEffect(() => {
    const registerAttendance = async () => {
      if (user && sessionId && !attendanceDone) {
        const { data, error } = await supabase.from('attendance').select('*').eq('attendant_id', user.id).eq('session_id', sessionId).limit(1);
        if (error) {
          console.error(error);
          return;
        }
        console.log('Registering attendance for user:', user?.id, 'in session:', sessionId);
        if (!data || data.length === 0) {
          const { error } = await supabase.from('attendance').insert([
            {
              attendant_id: user.id,
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
  }, [session, sessionId, attendanceDone, user]);
  
  useEffect(() => {
    setLoading(false);
    if (loading) return;
    if (!user) {
      const timer = setTimeout(() => {
        router.push(`/login?id=${sessionId}`); // Redirect after 3 seconds
      }, 3000); // 3000 ms = 3 seconds

      return () => clearTimeout(timer); // Clear the timer if the component unmounts
    }
  }, [user, loading, router, sessionId]);

  function switchSessionType(sessionType: string) {
    const speakerSessions =(
      <>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>Welcome to </h1> <h1 className={styles.sessionName}>{sessionInfo.name}</h1>
          <hr className={styles.divider}></hr>
        </div>
        <p className={styles.subtitle}>{sessionInfo.title}</p>
        <p className={styles.speaker}>Speaker: {sessionInfo.speaker}</p>
        <p className={styles.description}>{sessionInfo.description}</p>
        <hr className={styles.divider}></hr>
        <div className={styles.dateTimeContainer}>
          <div className={styles.dateContainer}>
            <p className={styles.dateInfo}>{weekDays[sessionDate.getDate()-4]}</p>
            <p className={styles.dateNum}>{sessionDate.getDate()}</p>
            <p className={styles.dateInfo}>Jun</p>
          </div>
          <p className={styles.time}>─</p>
          <p className={styles.time}>{sessionDate.getHours()}:{sessionDate.getMinutes()<10? ("0"+sessionDate.getMinutes()):(sessionDate.getMinutes())}</p>
        </div>
        <div className={styles.locationContainer}>
          <FontAwesomeIcon 
            icon={faLocationDot}
            className={styles.locationIcon} 
            />
          <p className={styles.locationName}>{sessionInfo.location}</p>
        </div>
      </>
      );

    const sponsorSessions = (
      <>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>Welcome to </h1> <h1 className={styles.sessionName}>{sessionInfo.name}</h1>
          <hr className={styles.divider}></hr>
        </div>
        <a href={websites.get(sessionInfo.affiliation) || '#'} target="_blank" rel="noopener noreferrer">
        <Image
          src={logos.get(sessionInfo.affiliation) || '/logos/default.png'}
          alt={`${sessionInfo.affiliation} Logo`}
          width={100}
          height={100}
          className={styles.sponsorLogo}/>
        </a>
        <hr className={styles.divider}></hr>
        <div className={styles.dateTimeContainer}>
          <div className={styles.dateContainer}>
            <p className={styles.dateInfo}>{weekDays[sessionDate.getDate()-4]}</p>
            <p className={styles.dateNum}>{sessionDate.getDate()}</p>
            <p className={styles.dateInfo}>Jun</p>
          </div>
          <p className={styles.time}>─</p>
          <p className={styles.time}>{sessionDate.getHours()}:{sessionDate.getMinutes()<10? ("0"+sessionDate.getMinutes()):(sessionDate.getMinutes())}</p>
        </div>
      </>
    );
    switch (sessionType) {
      case 'keynote':
        return speakerSessions;
      case 'special session':
        return speakerSessions;
      case 'tutorial':
        return speakerSessions;
      case 'sponsor session':
        return sponsorSessions;
      default:
        return (<></>);
    }
  }


  if (loading) return <div className={styles.loader}><Image src="/logo_transparente.png" alt="logo" width={400} height={400} className={styles.loaderImage}/></div>
  if (!sessionExists) return notFound();
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
      { user ? (
        switchSessionType(sessionInfo.type)
      ) : (
        <h1 className={styles.titleContainer}>Didn&apos;t find any data. Redirecting to login...</h1>
      )}
    </div>
  </div>
  );
}