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

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getUserRole(session.user.id);
    if (role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const allowed = ["name", "address", "lat", "lng", "radius_meters", "open_days", "open_time", "close_time", "is_open", "zone", "logo_url"];
    const safe = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));

    const { data, error } = await supabaseAdmin
      .from("venues")
      .update(safe)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
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
    const { name, address, lat, lng, radius_meters, open_days, open_time, close_time, zone, logo_url } = body;

    const { data, error } = await supabaseAdmin
      .from("venues")
      .insert({ name, address, lat, lng, radius_meters: radius_meters ?? 100, open_days, open_time, close_time, zone: zone ?? null, logo_url: logo_url ?? null })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
