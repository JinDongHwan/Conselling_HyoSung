import { requireProfile } from "@/lib/auth";
import { Chat } from "./Chat";

export default async function CounselPage() {
  const profile = await requireProfile();
  return <Chat nickname={profile.nickname} />;
}
