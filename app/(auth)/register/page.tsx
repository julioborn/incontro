"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) { setError("El nombre de usuario es obligatorio."); return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
      setError("El usuario solo puede tener letras, números y _ (3-20 caracteres)."); return;
    }
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden."); return; }
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    const birth = new Date(birthDate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear() - (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    if (age < 18) { setError("Debés tener al menos 18 años."); return; }

    setLoading(true);
    setError("");

    // Verificar que el username no esté tomado
    const { data: existing } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("username", username.toLowerCase().trim())
      .single();
    if (existing) { setLoading(false); setError("Ese nombre de usuario ya está en uso."); return; }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const resolvedEmail = email.trim() || `${username.trim().toLowerCase()}.${Date.now()}@incontro.app`;

    const { data, error: signUpError } = await supabaseClient.auth.signUp({
      email: resolvedEmail,
      password,
      options: { data: { name: fullName, age, birth_date: birthDate } },
    });

    if (signUpError) { setLoading(false); setError(signUpError.message); return; }

    if (data.user) {
      await supabaseClient.from("profiles").upsert({
        id: data.user.id,
        username: username.toLowerCase().trim(),
        email: resolvedEmail.includes("@incontro.app") ? null : resolvedEmail,
        name: fullName,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        age,
        birth_date: birthDate,
      });
    }

    setLoading(false);
    router.push("/login?registered=1");
  }

  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" };
  const labelStyle = { color: "rgba(255,255,255,0.45)" };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black px-6 py-12">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <Image src="/iconincontro.png" alt="Incontro" width={56} height={56} className="rounded-xl mb-4" />
          <h1 className="text-2xl font-bold tracking-[0.15em] text-white">INCONTRO</h1>
          <p className="mt-1 text-xs" style={labelStyle}>Creá tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Nombre</label>
              <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                required autoComplete="given-name" placeholder="Juan"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
                style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Apellido</label>
              <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                required autoComplete="family-name" placeholder="Pérez"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
                style={inputStyle} />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Usuario</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
              <input type="text" value={username} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                required autoComplete="username" placeholder="tu_usuario" maxLength={20}
                className="w-full pl-8 pr-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
                style={inputStyle} />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Fecha de nacimiento</label>
            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
              required autoComplete="bday"
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
              style={{ ...inputStyle, colorScheme: "dark" }} />
          </div>

          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>
              Email <span style={{ color: "rgba(255,255,255,0.25)" }}>(opcional)</span>
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              autoComplete="email" placeholder="tu@email.com"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
              style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="new-password" placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
              style={inputStyle} />
          </div>

          <div>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={labelStyle}>Repetir contraseña</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              required autoComplete="new-password" placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
              style={inputStyle} />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.30)" }}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-[#8296E3] hover:underline">Iniciá sesión</Link>
        </p>
      </div>
    </main>
  );
}
