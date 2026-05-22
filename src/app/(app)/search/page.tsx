"use client";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import PostCard from "@/components/posts/PostCard";

const POPULAR_SEARCHES = [
  "수학 시험 범위", "영어 수행평가", "삼각함수", "국어 서술형",
  "과학 프린트", "족보", "중간고사", "기말고사",
];

export default function SearchPage() {
  const examMode = useUIStore((s) => s.examMode);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["search", submitted],
    queryFn: () => fetch(`/api/search?q=${encodeURIComponent(submitted)}`).then((r) => r.json()),
    enabled: submitted.trim().length >= 2,
    staleTime: 30000,
  });

  const results = data?.posts ?? [];

  const handleSearch = useCallback(() => {
    if (query.trim().length < 2) return;
    setSubmitted(query.trim());
  }, [query]);

  const textColor = examMode ? "text-white" : "text-[#0d253d]";
  const mutedText = examMode ? "text-white/50" : "text-[#64748d]";

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2.5",
        examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]",
        "focus-within:border-[#533afd] transition-colors"
      )}>
        <svg viewBox="0 0 20 20" fill="none" className={cn("w-5 h-5 flex-shrink-0", mutedText)}>
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth={1.8} />
          <path d="M14 14l4 4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="게시물 검색... (2자 이상)"
          autoFocus
          className={cn(
            "flex-1 bg-transparent text-sm focus:outline-none",
            examMode ? "text-white placeholder:text-white/30" : "text-[#0d253d] placeholder:text-[#64748d]"
          )}
        />
        {query && (
          <button onClick={() => { setQuery(""); setSubmitted(""); }} className={cn("p-0.5", mutedText)}>
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
            </svg>
          </button>
        )}
        <button
          onClick={handleSearch}
          disabled={query.trim().length < 2}
          className="px-3 py-1.5 bg-[#533afd] text-white rounded-lg text-sm disabled:opacity-40 hover:bg-[#4434d4] transition-colors"
        >
          검색
        </button>
      </div>

      {/* Popular */}
      {!submitted && (
        <div>
          <p className={cn("text-xs font-medium uppercase tracking-wider mb-2 px-1", mutedText)}>인기 검색어</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((s) => (
              <button key={s} onClick={() => { setQuery(s); setSubmitted(s); }}
                className={cn("px-3 py-1.5 rounded-full text-sm border transition-colors",
                  examMode ? "bg-[#1c1e54] border-[#2a2d6b] text-white/70 hover:border-[#533afd]" : "bg-white border-[#e3e8ee] text-[#273951] hover:border-[#533afd] hover:text-[#533afd]")}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isFetching && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn("rounded-xl border h-24 animate-pulse", examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]")} />
          ))}
        </div>
      )}

      {/* Results */}
      {!isFetching && submitted && (
        <div>
          <p className={cn("text-sm mb-3", mutedText)}>
            "{submitted}" 검색 결과 <span className="font-medium text-[#533afd]">{results.length}개</span>
          </p>
          {results.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full bg-[#f6f9fc] flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-[#64748d]">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={1.5} />
                  <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
                  <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
                </svg>
              </div>
              <p className={cn("font-medium mb-1", textColor)}>검색 결과가 없어요</p>
              <p className={cn("text-sm", mutedText)}>다른 키워드로 검색해보세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((post: any) => <PostCard key={post.id} post={post} examMode={examMode} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
