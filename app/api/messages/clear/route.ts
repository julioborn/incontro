import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase.server";
import { supabaseAdmin } from "@/lib/supabase.admin";

// Al ABRIR el chat — resetea solo el unread del usuario actual (receptor)
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ ok: false });
  const uid = session.user.id;

  const matchId = req.nextUrl.searchParams.get("matchId");
  if (!matchId) return NextResponse.json({ ok: false });

  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("user_a, user_b")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ ok: false });

  // Resetear solo el campo del receptor (quien abre el chat)
  const field = match.user_a === uid ? "unread_for_a" : "unread_for_b";
  await supabaseAdmin
    .from("matches")
    .update({ [field]: false })
    .eq("id", matchId);

  return NextResponse.json({ ok: true });
}

// Al SALIR del chat — borra mensajes recibidos y resetea unread del receptor
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ ok: false });
  const uid = session.user.id;

  const { matchId } = await req.json();
  if (!matchId) return NextResponse.json({ ok: false });

  const { data: match } = await supabaseAdmin
    .from("matches")
    .select("user_a, user_b")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ ok: false });

  const otherId = match.user_a === uid ? match.user_b : match.user_a;
  const field = match.user_a === uid ? "unread_for_a" : "unread_for_b";

  // Borrar mensajes del otro (los que el receptor leyó)
  await supabaseAdmin
    .from("messages")
    .delete()
    .eq("match_id", matchId)
    .eq("sender_id", otherId);

  // Resetear badge del receptor
  await supabaseAdmin
    .from("matches")
    .update({ [field]: false })
    .eq("id", matchId);

  return NextResponse.json({ ok: true });
}
