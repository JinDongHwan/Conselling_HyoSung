import type { Metadata } from "next";
import { PrivacyBody } from "@/components/legal/PrivacyBody";
import { TermsBody } from "@/components/legal/TermsBody";
import { Logo } from "@/components/Logo";
import { COMPANY, POLICY_EFFECTIVE_DATE } from "@/lib/company";
import { isPast } from "@/lib/format";
import { guardianConsentByToken } from "@/lib/orgs";
import { GuardianForm } from "./GuardianForm";

export const metadata: Metadata = { title: "보호자 동의 — magic.ai", robots: { index: false } };

// 보호자(법정대리인) 동의 페이지: 자녀가 보낸 링크로 들어온다. 로그인 없이 링크 토큰으로만 확인한다.
export default async function GuardianConsentPage(props: PageProps<"/guardian/[token]">) {
  const { token } = await props.params;
  const found = await guardianConsentByToken(token);
  const expired = isPast(found?.consent.token_expires_at);

  let notice: string | null = null;
  if (!found) notice = "유효하지 않은 링크예요. 자녀에게 새 링크를 받아 주세요.";
  else if (found.consent.status === "submitted") notice = "동의서가 이미 제출됐어요. 운영자가 확인하고 있어요. 감사합니다.";
  else if (found.consent.status === "confirmed") notice = "보호자 동의가 완료됐어요. 감사합니다.";
  else if (found.consent.status !== "requested") notice = "처리가 끝난 요청이에요. 자녀에게 새 링크를 받아 주세요.";
  else if (expired) notice = "링크 기간이 지났어요. 자녀에게 새 링크를 받아 주세요.";

  return (
    <main className="flex min-h-screen justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold">보호자 동의 요청</h1>

        {notice ? (
          <p className="mt-4 rounded-xl bg-surface-2 p-4 leading-relaxed">{notice}</p>
        ) : (
          <>
            <p className="mt-3 leading-relaxed">
              {found!.orgName ? <b>{found!.orgName}</b> : "학교·기관"}에 다니는 <b>{found!.studentName ?? "자녀"}</b> 학생이 AI 마음 상담 서비스 magic.ai를 이용하려고 해요.
              만 14세 미만 아동은 법에 따라 보호자의 동의가 필요해요.
            </p>

            <section className="mt-6 space-y-3 rounded-xl bg-brand-soft p-5 text-[15px] leading-relaxed">
              <h2 className="font-bold">보호자께서 알아 두실 점</h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>magic.ai는 AI가 고민을 들어 주고 마음을 정리하도록 돕는 서비스예요. 의사나 상담 선생님의 진단·치료를 대신하지 않아요.</li>
                <li>
                  자녀의 상담 내용은 <b>보호자에게 자동으로 공개되지 않아요.</b> 아이가 안심하고 이야기할 수 있도록 하기 위해서예요.
                  {/* TODO(법률 검토): 보호자에게 제공할 정보의 범위 */}
                </li>
                <li>자해·자살, 학대, 폭력 같은 위험 신호가 보이면 AI가 상담을 이어 가지 않고 1388·109·112 같은 전문기관을 먼저 안내하며, 운영자가 확인해요.</li>
                <li>상담 내용은 마음 건강에 관한 민감정보로 따로 보호되고, 탈퇴하면 모두 삭제돼요.</li>
                <li>이름·관계·연락처는 동의 여부를 확인하는 데만 써요. 확인을 위해 운영자가 연락드릴 수 있어요.</li>
              </ul>
            </section>

            <GuardianForm token={token} terms={<TermsBody />} privacy={<PrivacyBody />} />
            <p className="mt-3 text-xs text-muted">시행일 {POLICY_EFFECTIVE_DATE}</p>
          </>
        )}

        <p className="mt-8 border-t border-line pt-5 text-sm text-muted">
          문의: {COMPANY.name} · <a href={`mailto:${COMPANY.email}`} className="underline">{COMPANY.email}</a>
        </p>
      </div>
    </main>
  );
}
