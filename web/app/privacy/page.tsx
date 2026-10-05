import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { PrivacyBody } from "@/components/legal/PrivacyBody";

export const metadata: Metadata = { title: "개인정보처리방침 — magic.ai" };

export default function Page() {
  return (
    <LegalPage title="개인정보처리방침">
      <PrivacyBody />
    </LegalPage>
  );
}
