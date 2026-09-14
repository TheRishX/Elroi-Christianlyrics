import { getSongs } from "@/lib/api";
import { BookmarksList } from "@/components/BookmarksList";

export default async function Bookmarks() {
  const songs = await getSongs();
  return <BookmarksList songs={songs} />;
}
