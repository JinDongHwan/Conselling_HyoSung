import Link from "next/link";
import { notFound } from "next/navigation";
import { ASSESSMENTS, type AssessmentType } from "@/lib/assessments";
import { AssessmentForm } from "./AssessmentForm";

export default async function AssessmentPage(props: PageProps<"/dashboard/data/assessment/[type]">) {
  const { type } = await props.params;
  const decoded = decodeURIComponent(type) as AssessmentType;
  if (!(decoded in ASSESSMENTS)) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <Link href="/dashboard/data" className="text-sm text-muted hover:text-ink">데이터로</Link>
      <h1 className="mt-4 text-3xl font-bold">{ASSESSMENTS[decoded].name}</h1>
      <p className="mt-2 text-sm text-muted">약 2분 걸려요. 결과는 나만 볼 수 있고, 진단이 아닌 참고용입니다.</p>
      <div className="mt-8">
        <AssessmentForm type={decoded} />
      </div>
    </div>
  );
}
