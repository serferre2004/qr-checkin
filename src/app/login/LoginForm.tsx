"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

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
      .from("attendants")
      .insert([formData])
      .select()
      .single();

    if (error) {
      setErrorMsg("Error al registrar. Intenta nuevamente.");
      setLoading(false);
      return;
    }

    localStorage.setItem("attendant", JSON.stringify(data));

    if (sessionId) {
      router.push(`/scan?id=${sessionId}`);
    } else {
      router.push("/program");
    }
  };

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Registro de Asistente</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Nombre completo"
          required
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          name="email"
          type="email"
          placeholder="Correo electrónico"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          name="type"
          placeholder="Tipo (estudiante, ponente...)"
          value={formData.type}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-blue-600 text-white rounded"
        >
          {loading ? "Registrando..." : "Registrarme"}
        </button>

        {errorMsg && <p className="text-red-600">{errorMsg}</p>}
      </form>
    </main>
  );
}
