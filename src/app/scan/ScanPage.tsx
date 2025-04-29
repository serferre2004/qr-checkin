"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

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
  const [attendant, setAttendant] = useState<Attendant | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceDone, setAttendanceDone] = useState(false);

  useEffect(() => {
    const storedAttendant = localStorage.getItem('attendant');
    if (storedAttendant) {
      const parsedAttendant = JSON.parse(storedAttendant);
      setAttendant(parsedAttendant);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const registerAttendance = async () => {
      if (attendant && sessionId && !attendanceDone) {
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
      }
    };

    registerAttendance();
  }, [attendant, sessionId, attendanceDone]);

  useEffect(() => {
    if (!attendant) {
      const timer = setTimeout(() => {
        router.push('/login'); // Redirect after 3 seconds
      }, 3000); // 3000 ms = 3 seconds

      return () => clearTimeout(timer); // Clear the timer if the component unmounts
    }
  }, [attendant, router]);

  if (loading) return <p>Cargando...</p>;

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
}
