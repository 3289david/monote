"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-rose-500">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.5}/>
          <path d="M12 7v6M12 15v1" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
        </svg>
      </div>
      <h1 className="text-xl font-medium text-[#0d253d] mb-2">오류가 발생했어요</h1>
      <p className="text-sm text-[#64748d] mb-8">일시적인 오류가 발생했어요. 다시 시도해주세요.</p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-[#533afd] text-white rounded-full text-sm font-medium hover:bg-[#4434d4] transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}
