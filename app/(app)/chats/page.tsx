import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase.server";
import { MatchesClient } from "@/components/user/MatchesClient";

export default async function ChatsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return <MatchesClient userId={session.user.id} defaultTab="chats" />;
}
