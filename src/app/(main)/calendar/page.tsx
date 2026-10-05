import { createClient } from "@/lib/supabase/server";
import CalendarView from "@/components/calendar/CalendarView";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 推しアーティストIDを取得
  const { data: oshi } = await supabase
    .from("user_oshi")
    .select("artist_id")
    .eq("user_id", user!.id);
  const oshiIds = (oshi ?? []).map((o) => o.artist_id);

  // 推しのイベント（前後3ヶ月）
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  const to = new Date();
  to.setMonth(to.getMonth() + 3);

  const { data: events } = await supabase
    .from("events")
    .select("id, title, event_date, type, source_url, artist_id, artists(name)")
    .in("artist_id", oshiIds.length > 0 ? oshiIds : ["__none__"])
    .eq("status", "published")
    .gte("event_date", from.toISOString().split("T")[0])
    .lte("event_date", to.toISOString().split("T")[0])
    .order("event_date");

  // 自分の参戦予定
  const eventIds = (events ?? []).map((e) => e.id);
  const { data: attendances } = await supabase
    .from("event_attendances")
    .select("event_id")
    .eq("user_id", user!.id)
    .in("event_id", eventIds.length > 0 ? eventIds : ["__none__"]);

  const attendingIds = new Set((attendances ?? []).map((a) => a.event_id));

  return (
    <CalendarView
      events={(events ?? []) as any}
      attendingIds={[...attendingIds]}
      userId={user!.id}
    />
  );
}
