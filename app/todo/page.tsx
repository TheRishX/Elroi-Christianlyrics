import { getSongs } from "@/lib/api";
import { SongManager } from "@/components/SongManager";
import { TodoGate } from "@/components/TodoGate";
import { cookies } from "next/headers";
import { todoCookieName, validTodoSession } from "@/lib/todo-auth";

export const metadata = { title: "Song manager" };
export const dynamic = "force-dynamic";

export default async function TodoPage() {
  const cookieStore = await cookies();
  if (!validTodoSession(cookieStore.get(todoCookieName)?.value)) return <TodoGate />;
  const uploadedSongs = await getSongs();
  return <SongManager uploadedSongs={uploadedSongs} />;
}
