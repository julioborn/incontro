"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabaseClient } from "@/lib/supabase";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

interface Props { searchParams: Promise<{ userId?: string }> }

export default function CompletarPerfilPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 82 }, (_, i) => currentYear - 18 - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" };
  const labelStyle = { color: "rgba(255,255,255,0.45)" };
  const selectClass = "flex-1 px-3 py-3 rounded-xl text-white text-sm outline-none appearance-none text-center";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setError("Usuario: solo minúsculas, números y _ (3-20 caracteres)."); return;
    }
    if (!birthDay || !birthMonth || !birthYear) {
      setError("Ingresá tu fecha de nacimiento."); return;
    }

    const birthDate = `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`;
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    if (age < 18) { setError("Debés tener al menos 18 años."); return; }

    setLoading(true);
    setError("");

    // Verificar username disponible
    const { data: existing } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();
    if (existing) { setLoading(false); setError("Ese nombre de usuario ya está en uso."); return; }

    // Obtener usuario actual
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) { setLoading(false); setError("Sesión expirada."); return; }

    await supabaseClient.from("profiles")
      .update({ username, birth_date: birthDate, age })
      .eq("id", user.id);

    setLoading(false);
    router.push("/home");
    router.refresh();
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black px-6 py-12">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <Image src="/iconofinal.png" alt="Insitus" width={56} height={56} className="rounded-xl mb-4" />
          <h1 className="text-2xl font-bold tracking-[0.15em] text-white">Completá tu perfil</h1>
          <p className="mt-1 text-xs text-center" style={labelStyle}>
            Solo necesitamos un par de datos más.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Usuario</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
              <input
                type="text" value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                required placeholder="tu_usuario" maxLength={20}
                className="w-full pl-8 pr-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#8296E3]"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Fecha de nacimiento</label>
            <div className="grid grid-cols-3 gap-2">
              <select value={birthDay} onChange={e => setBirthDay(e.target.value)}
                className={selectClass} style={{ ...inputStyle, colorScheme: "dark" }}>
                <option value="">Día</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={birthMonth} onChange={e => setBirthMonth(e.target.value)}
                className={selectClass} style={{ ...inputStyle, colorScheme: "dark" }}>
                <option value="">Mes</option>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={birthYear} onChange={e => setBirthYear(e.target.value)}
                className={selectClass} style={{ ...inputStyle, colorScheme: "dark" }}>
                <option value="">Año</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 mt-2"
            style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
            {loading ? "Guardando..." : "Continuar →"}
          </button>
        </form>
      </div>
    </main>
  );
}
