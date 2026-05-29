import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase.server";
import { supabaseAdmin } from "@/lib/supabase.admin";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;

  const { data, error } = await supabaseAdmin
    .from("matches")
    .select(`
      *,
      user_a_profile:profiles!matches_user_a_fkey(id, name, first_name, avatar_url, username),
      user_b_profile:profiles!matches_user_b_fkey(id, name, first_name, avatar_url, username)
    `)
    .or(`user_a.eq.${uid},user_b.eq.${uid}`)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;

  const { to_user, venue_id } = await req.json();
  if (!to_user || !venue_id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Insertar like (ignorar duplicado)
  const { error: likeError } = await supabaseAdmin
    .from("likes")
    .insert({ from_user: uid, to_user, venue_id });

  if (likeError && likeError.code !== "23505") {
    return NextResponse.json({ error: likeError.message }, { status: 500 });
  }

  // Verificar si existe like inverso (match mutuo)
  const { data: reverseLike } = await supabaseAdmin
    .from("likes")
    .select("id")
    .eq("from_user", to_user)
    .eq("to_user", uid)
    .eq("venue_id", venue_id)
    .maybeSingle();

  let matchId: string | null = null;
  let matched = false;

  if (reverseLike) {
    // Buscar si ya existe el match
    const { data: existingMatch } = await supabaseAdmin
      .from("matches")
      .select("id")
      .or(`and(user_a.eq.${uid},user_b.eq.${to_user}),and(user_a.eq.${to_user},user_b.eq.${uid})`)
      .eq("venue_id", venue_id)
      .eq("is_active", true)
      .maybeSingle();

    if (existingMatch) {
      matchId = existingMatch.id;
      matched = true;
    } else {
      // El trigger debería haberlo creado — si no, lo creamos acá como fallback
      const { data: venue } = await supabaseAdmin
        .from("venues")
        .select("close_time")
        .eq("id", venue_id)
        .single();

      const expires = venue?.close_time
        ? new Date(`${new Date().toDateString()} ${venue.close_time}`).toISOString()
        : null;

      const { data: newMatch } = await supabaseAdmin
        .from("matches")
        .insert({
          user_a: uid,
          user_b: to_user,
          venue_id,
          expires_at: expires,
          is_active: true,
          new_for_a: true,
          new_for_b: true,
        })
        .select("id")
        .single();

      if (newMatch) {
        matchId = newMatch.id;
        matched = true;
      }
    }
  }

  return NextResponse.json({ liked: true, matched, matchId });
}
