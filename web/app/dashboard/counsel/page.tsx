import { profileAgeBand } from "@/lib/age";
import { requireProfile } from "@/lib/auth";
import { Chat } from "./Chat";

export default async function CounselPage() {
  const profile = await requireProfile();
  const band = profileAgeBand(profile);
  return <Chat nickname={profile.nickname} youth={band === "teen" || band === "under14"} />;
}
