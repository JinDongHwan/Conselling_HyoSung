import { PageHeader, Panel } from "@/components/PageHeader";
import { hasAI, hasServiceRole } from "@/lib/config";
import { listKnowledgeFiles } from "@/lib/data";
import { retrieve } from "@/lib/rag";

export default async function KnowledgePage(props: PageProps<"/admin/knowledge">) {
  const { q } = await props.searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const [files, results] = await Promise.all([listKnowledgeFiles(), query ? retrieve(query, 5, 0) : Promise.resolve([])]);
  const byCategory = Object.groupBy(files, (f) => f.category);
  const ready = hasAI && hasServiceRole;

  return (
    <>
      <PageHeader title="지식베이스" description="챗봇이 답변할 때 참고하는 문서예요. knowledge 폴더의 md 파일을 임베딩해서 저장합니다." />
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-8">
        <Panel title="문서 추가·갱신 방법">
          <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
            <li>
              <code className="rounded bg-surface-2 px-1.5 py-0.5">knowledge/카테고리/</code> 폴더에 md 파일을 넣거나 고칩니다.
            </li>
            <li>
              <code className="rounded bg-surface-2 px-1.5 py-0.5">web</code> 폴더에서{" "}
              <code className="rounded bg-surface-2 px-1.5 py-0.5">npm run ingest</code> 를 실행하면 바뀐 문서만 다시 임베딩됩니다.
            </li>
            <li>아래 검색 테스트로 원하는 문서가 잘 찾아지는지 확인하세요.</li>
          </ol>
        </Panel>

        <Panel title="검색 테스트">
          <form className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="q" className="sr-only">검색할 질문</label>
            <input
              id="q"
              name="q"
              defaultValue={query}
              placeholder="예: 잠이 안 올 때 어떻게 해야 하나요"
              className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 outline-none focus:border-brand"
            />
            <button className="rounded-xl bg-dark px-5 py-2.5 text-sm font-semibold text-page">찾아보기</button>
          </form>
          {!ready && <p className="mt-3 text-sm text-muted">OpenAI 키와 Supabase 서비스 키를 넣으면 검색 테스트를 할 수 있어요.</p>}
          {query && ready && (
            <ol className="mt-5 space-y-3">
              {results.length ? (
                results.map((r) => (
                  <li key={r.id} className="rounded-xl bg-surface-2 p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold">{r.metadata.title}</span>
                      <span className="tabular-nums text-muted">유사도 {r.similarity.toFixed(2)}</span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{r.content}</p>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted">찾은 문서가 없어요.</li>
              )}
            </ol>
          )}
        </Panel>

        <Panel title={`저장된 문서 ${files.length}건`}>
          {files.length ? (
            <div className="space-y-5">
              {Object.entries(byCategory).map(([cat, list]) => (
                <div key={cat}>
                  <p className="text-sm font-semibold text-brand">{cat}</p>
                  <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                    {list!.map((f) => (
                      <li key={f.file} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{f.title}</span>
                          <span className="text-xs text-muted">{f.file}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-muted">{f.chunks}개 조각</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">아직 임베딩된 문서가 없어요. npm run ingest 를 실행해 주세요.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
