"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Buscar email por username vía API
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Usuario o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    // Refrescar sesión del lado del cliente
    await supabaseClient.auth.refreshSession();
    router.push("/home");
    router.refresh();
  }

  async function handleGoogle() {
    await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <Image src="/iconofinal.png" alt="Insitus" width={56} height={56} className="rounded-xl mb-4" />
          <h1 className="text-2xl font-bold tracking-[0.15em] text-white">INCONTRO</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-white/45 mb-1.5 uppercase tracking-wider">Usuario</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                required autoComplete="username" placeholder="tu_usuario"
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/45 mb-1.5 uppercase tracking-wider">Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password" placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border text-white text-sm outline-none focus:border-[#8296E3] transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
          <span className="text-xs text-white/30">o</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>

        <button onClick={handleGoogle}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white border flex items-center justify-center gap-2 transition-colors hover:bg-white/5"
          style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuar con Google
        </button>

        <p className="text-center text-xs text-white/30 mt-6">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="text-[#8296E3] hover:underline">Registrate</Link>
        </p>
      </div>
    </main>
  );
}
