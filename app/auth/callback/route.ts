import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.admin";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const origin = req.nextUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      const { id, user_metadata } = data.user;
      // Crear perfil si no existe
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", id)
        .single();

      if (!existing) {
        const fullName = user_metadata?.full_name ?? user_metadata?.name ?? null;
        await supabaseAdmin.from("profiles").insert({
          id,
          name: fullName,
          avatar_url: user_metadata?.avatar_url ?? null,
        });
      }
    }
  }

  return NextResponse.redirect(`${origin}/home`);
}
