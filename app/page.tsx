import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase.server";
import Image from "next/image";
import Link from "next/link";

export default async function RootPage() {
  const session = await getServerSession();
  if (session) redirect("/home");

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black px-6">
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <Image src="/iconofinal.png" alt="Insitus" width={96} height={96} className="rounded-2xl" priority />
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-libre-baskerville)", fontStyle:"italic" }}>INCONTRO</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Conectate con quienes están en el mismo lugar que vos.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/login"
            className="w-full py-3 rounded-xl text-center text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #8296E3, #4762C7)" }}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="w-full py-3 rounded-xl text-center text-sm font-semibold text-white border"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)" }}
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </main>
  );
}
