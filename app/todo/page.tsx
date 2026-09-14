import { getSongs } from "@/lib/api";
import { SongManager } from "@/components/SongManager";

export const metadata = { title: "Song manager" };

export default async function TodoPage() {
  const uploadedSongs = await getSongs();
  return <SongManager uploadedSongs={uploadedSongs} />;
}
