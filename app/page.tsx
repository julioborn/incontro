import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

export default async function RootPage() {
  const session = await auth();
  if (session?.user) redirect("/home");

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black px-6">
      <div className="flex flex-col items-center gap-8 animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <Image src="/iconincontro.png" alt="Incontro" width={96} height={96} className="rounded-2xl" priority />
          <Image src="/incontro-banner2.png" alt="Incontro" width={200} height={48} className="object-contain" />
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
