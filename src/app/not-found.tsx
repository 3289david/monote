"use client";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl font-light text-[#533afd] mb-4" style={{ letterSpacing: "-4px" }}>404</div>
      <h1 className="text-xl font-medium text-[#0d253d] mb-2">페이지를 찾을 수 없어요</h1>
      <p className="text-sm text-[#64748d] mb-8">요청하신 페이지가 존재하지 않거나 이동되었어요.</p>
      <Link
        href="/community"
        className="px-6 py-3 bg-[#533afd] text-white rounded-full text-sm font-medium hover:bg-[#4434d4] transition-colors"
      >
        커뮤니티로 돌아가기
      </Link>
    </div>
  );
}
