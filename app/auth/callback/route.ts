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
      const { id, email, user_metadata } = data.user;
      const fullName = user_metadata?.full_name ?? user_metadata?.name ?? null;
      const avatar = user_metadata?.avatar_url ?? user_metadata?.picture ?? null;

      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id, username, birth_date")
        .eq("id", id)
        .single();

      if (!existing) {
        await supabaseAdmin.from("profiles").insert({
          id,
          email: email ?? null,
          name: fullName,
          first_name: user_metadata?.given_name ?? null,
          last_name: user_metadata?.family_name ?? null,
          avatar_url: avatar,
        });
        return NextResponse.redirect(`${origin}/completar-perfil`);
      } else {
        // Actualizar nombre y avatar en cada login
        await supabaseAdmin.from("profiles").update({
          name: fullName ?? existing.username,
          avatar_url: avatar,
        }).eq("id", id);

        // Si falta username o fecha de nacimiento → completar perfil
        if (!existing.username || !existing.birth_date) {
          return NextResponse.redirect(`${origin}/completar-perfil`);
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/home`);
}
