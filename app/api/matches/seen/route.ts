import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase.server";
import { supabaseAdmin } from "@/lib/supabase.admin";

export async function POST() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const uid = session.user.id;

  // Marcar como visto para user_a
  await supabaseAdmin
    .from("matches")
    .update({ new_for_a: false })
    .eq("user_a", uid)
    .eq("new_for_a", true);

  // Marcar como visto para user_b
  await supabaseAdmin
    .from("matches")
    .update({ new_for_b: false })
    .eq("user_b", uid)
    .eq("new_for_b", true);

  return NextResponse.json({ ok: true });
}
