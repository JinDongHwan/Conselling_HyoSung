import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "magic.ai — 마음을 털어놓는 AI 상담",
  description: "공공기관 정신건강 자료를 근거로 답하는 AI 심리상담 서비스 — 성인 개인과 학교·기관을 위한 마음 상담",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
