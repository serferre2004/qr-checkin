"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "../../../lib/supabase";
import styles from './Loginstyle.module.css';


export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("id");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [participation, setParticipation] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/confirmation`
      }
    })

    if (error) {
      setErrorMsg(error.message);
    } else {
      if (sessionId) {
        router.push(`/verify?session=${sessionId}`)
      } else {
        router.push('/verify')
      }
    }
    setLoading(false)
  }

  return (
    <main className={styles.mainContainer}>
      <h1 className={styles.title}>Log in to the event</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          value={email}
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
