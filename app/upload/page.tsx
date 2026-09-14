import { cookies } from "next/headers";
import { cookieName, validSession } from "@/lib/auth";
import { UploadGate } from "@/components/UploadGate";
import { UploadPortal } from "@/components/UploadPortal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Upload a song | Elroi Tunes" };

export default async function UploadPage() {
  const authenticated = validSession((await cookies()).get(cookieName)?.value);
  return authenticated ? <UploadPortal /> : <UploadGate />;
}
