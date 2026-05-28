import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/supabase.server";
import { getUserRole } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabase.admin";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getUserRole(session.user.id);
    if (role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data, error } = await supabaseAdmin
      .from("venues")
      .select("*")
      .order("name");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getUserRole(session.user.id);
    if (role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { name, address, lat, lng, radius_meters, open_days, open_time, close_time } = body;

    const { data, error } = await supabaseAdmin
      .from("venues")
      .insert({ name, address, lat, lng, radius_meters: radius_meters ?? 100, open_days, open_time, close_time })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
