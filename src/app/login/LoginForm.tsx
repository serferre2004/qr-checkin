"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import styles from './Loginstyle.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("id");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "",
    password: "1234",
    country: "test",
    phone_number: "test",
    gender: "test",
    occupation: "test",
    role: "test",
    ieee_member: true,
    organization: "test"
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
      .from('attendants')
      .select('*')
      .eq('email', formData.email)
      .single();
    
    if (error) {
      setErrorMsg('Email not found');
      setLoading(false);
      return;
    }
      
    // Si llega aquí, las credenciales son válidas
    
    localStorage.setItem("attendant", JSON.stringify(data));

    if (sessionId) {
      router.push(`/scan?id=${sessionId}`);
    } else {
      router.push("/");
    }
  };

  return (
    <main className={styles.mainContainer}>
      <h1 className={styles.title}>Log in to the event</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Full name"
          required
          value={formData.name}
          onChange={handleChange}
          className={styles.inputField}
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          value={formData.email}
          onChange={handleChange}
          className={styles.inputField}
        />
        <input
          name="type"
          placeholder="Registration type"
          value={formData.type}
          onChange={handleChange}
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
