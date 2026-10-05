import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { TermsBody } from "@/components/legal/TermsBody";

export const metadata: Metadata = { title: "이용약관 — magic.ai" };

export default function Page() {
  return (
    <LegalPage title="이용약관">
      <TermsBody />
    </LegalPage>
  );
}
