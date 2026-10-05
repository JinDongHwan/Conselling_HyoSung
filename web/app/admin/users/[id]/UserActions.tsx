"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminDeleteUser, adminSetRole, adminSetSuspended } from "@/app/actions";

// 관리자: 권한 변경 · 이용 정지/해제 · 계정 삭제. 본인 계정이면 버튼 대신 안내만 보여 준다.
export function UserActions({
  userId,
  name,
  role,
  suspended,
  isSelf,
}: {
  userId: string;
  name: string;
  role: "user" | "admin";
  suspended: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const run = (fn: () => Promise<{ ok?: true; error?: string }>, done: string, after?: () => void) => {
    setMessage(null);
    start(async () => {
      const res = await fn();
      if (res.error) return setMessage({ ok: false, text: res.error });
      setMessage({ ok: true, text: done });
      if (after) after();
      else router.refresh();
    });
  };

  if (isSelf) {
    return <p className="text-sm text-muted">본인 계정이에요. 권한 변경·정지·삭제는 다른 관리자만 할 수 있어요.</p>;
  }

  const toggleRole = () => {
    const next = role === "admin" ? "user" : "admin";
    const msg =
      next === "admin"
        ? `${name}님을 관리자로 지정할까요?\n관리자는 사용자 정보와 위기 대화를 볼 수 있어요.`
        : `${name}님의 관리자 권한을 해제할까요?`;
    if (!confirm(msg)) return;
    run(() => adminSetRole(userId, next), next === "admin" ? "관리자로 지정했어요." : "일반 사용자로 바꿨어요.");
  };

  const toggleSuspend = () => {
    const msg = suspended
      ? `${name}님의 이용 정지를 해제할까요?\n다시 로그인할 수 있게 돼요.`
      : `${name}님의 이용을 정지할까요?\n로그인과 상담을 할 수 없게 되며, 기록은 그대로 남아요.`;
    if (!confirm(msg)) return;
    run(() => adminSetSuspended(userId, !suspended), suspended ? "정지를 해제했어요." : "이용을 정지했어요.");
  };

  const remove = () => {
    const typed = prompt(`${name}님의 계정과 모든 상담·기분·자가진단 기록을 삭제합니다.\n되돌릴 수 없어요. 계속하려면 "삭제"라고 입력해 주세요.`);
    if (typed === null) return;
    if (typed.trim() !== "삭제") return setMessage({ ok: false, text: "\"삭제\"를 정확히 입력해야 삭제돼요." });
    run(() => adminDeleteUser(userId), "계정을 삭제했어요.", () => router.push("/admin/users"));
  };

  const btn = "rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">권한</p>
          <p className="text-sm text-muted">지금: {role === "admin" ? "관리자" : "일반 사용자"}</p>
        </div>
        <button type="button" onClick={toggleRole} disabled={pending} className={`${btn} border-line hover:border-brand`}>
          {role === "admin" ? "관리자 권한 해제" : "관리자로 지정"}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <div>
          <p className="font-medium">이용 정지</p>
          <p className="text-sm text-muted">{suspended ? "지금 정지된 계정이에요. 로그인할 수 없어요." : "정지하면 로그인과 상담을 할 수 없어요. 기록은 남아요."}</p>
        </div>
        <button
          type="button"
          onClick={toggleSuspend}
          disabled={pending}
          className={`${btn} ${suspended ? "border-line hover:border-brand" : "border-accent/60 hover:bg-accent-soft"}`}
        >
          {suspended ? "정지 해제" : "이용 정지"}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <div>
          <p className="font-medium text-danger">계정 삭제</p>
          <p className="text-sm text-muted">계정과 모든 기록이 즉시 삭제되며 되돌릴 수 없어요. 사용자의 삭제 요청을 처리할 때 사용해요.</p>
        </div>
        <button type="button" onClick={remove} disabled={pending} className={`${btn} border-danger/50 text-danger hover:bg-danger-soft`}>
          계정 삭제
        </button>
      </div>

      {pending && <p className="text-sm text-muted">처리 중…</p>}
      {message && (
        <p role="status" className={`text-sm ${message.ok ? "text-brand" : "text-danger"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
