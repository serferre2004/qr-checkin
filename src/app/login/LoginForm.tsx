"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase, { debugSupabaseConfig } from "../../../lib/supabase";
import styles from './Loginstyle.module.css';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("id");
  const [loading, setLoading] = useState(false);
  const [userEmail, setEmail] = useState('');
  const [participation, setParticipation] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Debug en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('=== Login Component Debug ===');
    debugSupabaseConfig();
  }

  // Función para verificar si el usuario existe
  const checkUserExists = async (email: string): Promise<boolean> => {
    try {
      // Consultar directamente la tabla 'attendants'
      const { data, error } = await supabase
        .from('usuarios_excel')
        .select('correo')  // Seleccionar solo el campo necesario
        .eq('correo', email)  // Filtrar por el email proporcionado
        .limit(1);  // Limitar a 1 resultado para optimizar

      if (error) {
        throw error;  // Cualquier error en la consulta se manejará en el catch
      }

      // Si hay al menos un resultado, el email existe
      console.log(data);
      return data.length > 0;
    } catch (error) {
      // Manejar errores de conexión, permisos, etc.
      console.error('Error checking user:', error);
      return false;
    }
  };

  // const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setErrorMsg('');

  //   try {
  //     // 1. Verificar si el usuario existe
  //     const userExists = await checkUserExists(userEmail);
      
  //     if (!userExists) {
  //       setErrorMsg('Email not found');
  //       setLoading(false);
  //       return;
  //     }

  //     // 2. Si el usuario existe, enviar magic link
  //     const { error } = await supabase.auth.signInWithOtp({
  //       email: userEmail,
  //       options: {
  //         shouldCreateUser: false,
  //         emailRedirectTo: `${window.location.origin}/confirmation`,  // Redirigir a la página de confirmación
  //       }
  //     });

  //     if (error) {
  //       setErrorMsg(`Error al enviar el enlace: ${error.message}`);
  //     } else {
  //       setEmail('');
  //       setParticipation('');
        
  //       // Opcional: redirigir después de unos segundos
  //       setTimeout(() => {
  //         if (sessionId) {
  //           router.push(`/verify?session=${sessionId}`);
  //         } else {
  //           router.push('/verify');
  //         }
  //       }, 3000);
  //     }
  //   } catch (error) {
  //     setErrorMsg(`Error inesperado: ${error}`);
  //   }
    
  //   setLoading(false);
  // };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Verificar si el usuario existe
      const userExists = await checkUserExists(userEmail);
    
      if (!userExists) {
        setErrorMsg('Email not found');
        setLoading(false);
        return;
      }

      // 2. Construir URL de redirección
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      console.log('=== Enviando Magic Link ===');
      console.log('Email:', userEmail);
      console.log('Redirect URL:', redirectUrl);

      // 3. Enviar magic link
      const { error } = await supabase.auth.signInWithOtp({
        email: userEmail,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: redirectUrl,
          data: {
            participation: participation,
            sessionId: sessionId
          }
        }
      });

      if (error) {
        console.error('Error enviando magic link:', error);
        setErrorMsg(`Error: ${error.message}`);
      } else {
        console.log('Magic link enviado exitosamente');
        
        // Limpiar formulario
        setEmail('');
        setParticipation('');
        
        // Redirigir a página de verificación
        setTimeout(() => {
          if (sessionId) {
            router.push(`/auth/verify?session=${sessionId}`);
          } else {
            router.push('/auth/verify');
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      setErrorMsg(`Error inesperado: ${error}`);
    }
    
    setLoading(false);
  };
  return (
    <main className={styles.mainContainer}>
      <h1 className={styles.title}>Log in to the event</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          value={userEmail}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.inputField}
        />
        <input
          name="type"
          placeholder="Registration type"
          value={participation}
          onChange={(e) => setParticipation(e.target.value)}
          className={styles.inputField}
        />

        <button
          type="submit"
          disabled={loading}
          className={styles.button}
        >
          {loading ? "Logging..." : "Log In"}
        </button>

        {errorMsg && <p className="text-red-600">{errorMsg}</p>}
      </form>
    </main>
  );
}
