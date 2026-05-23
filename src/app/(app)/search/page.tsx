"use client";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUIStore } from "@/store/ui-store";
import { cn, getLevelName, calculateLevel } from "@/lib/utils";
import PostCard from "@/components/posts/PostCard";
import GradientHero from "@/components/ui/GradientHero";
import Avatar from "@/components/ui/Avatar";
import Link from "next/link";

const POPULAR_SEARCHES = [
  "수학 시험 범위", "영어 수행평가", "삼각함수", "국어 서술형",
  "과학 프린트", "족보", "중간고사", "기말고사",
];

export default function SearchPage() {
  const examMode = useUIStore((s) => s.examMode);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [searchTab, setSearchTab] = useState<"posts" | "users">("posts");

  const { data, isFetching } = useQuery({
    queryKey: ["search", submitted, searchTab],
    queryFn: () => fetch(`/api/search?q=${encodeURIComponent(submitted)}&type=${searchTab}`).then((r) => r.json()),
    enabled: submitted.trim().length >= 2,
    staleTime: 30000,
  });

  const results = data?.posts ?? [];
  const userResults = data?.users ?? [];

  const handleSearch = useCallback(() => {
    if (query.trim().length < 2) return;
    setSubmitted(query.trim());
  }, [query]);

  const textColor = examMode ? "text-white" : "text-[#0d253d]";
  const mutedText = examMode ? "text-white/50" : "text-[#64748d]";

  return (
    <div className="space-y-4">
      <GradientHero
        title="검색"
        subtitle="게시물, 태그, 과목을 검색해요"
        compact
        illustration={
          <svg viewBox="0 0 48 48" fill="none" style={{ width: "44px", height: "44px" }}>
            <circle cx="20" cy="20" r="12" stroke="white" strokeWidth="2" strokeOpacity="0.7"/>
            <path d="M29 29l10 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8"/>
            <path d="M15 20h10M20 15v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9"/>
          </svg>
        }
      />
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
          onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleSearch()}
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

      {/* Search type tabs */}
      {submitted && (
        <div className={cn("flex rounded-xl p-1 gap-1", examMode ? "bg-[#1c1e54]" : "bg-[#f6f9fc]")}>
          {(["posts", "users"] as const).map((t) => (
            <button key={t} onClick={() => setSearchTab(t)}
              className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                searchTab === t ? "bg-[#533afd] text-white" : examMode ? "text-white/50 hover:text-white" : "text-[#64748d] hover:text-[#273951]")}>
              {t === "posts" ? "게시물" : "사용자"}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {!isFetching && submitted && searchTab === "posts" && (
        <div>
          <p className={cn("text-sm mb-3", mutedText)}>
            게시물 <span className="font-medium text-[#533afd]">{results.length}개</span>
          </p>
          {results.length === 0 ? (
            <div className="text-center py-12">
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

      {!isFetching && submitted && searchTab === "users" && (
        <div>
          <p className={cn("text-sm mb-3", mutedText)}>
            사용자 <span className="font-medium text-[#533afd]">{userResults.length}개</span>
          </p>
          {userResults.length === 0 ? (
            <div className="text-center py-12">
              <p className={cn("font-medium mb-1", textColor)}>사용자를 찾을 수 없어요</p>
              <p className={cn("text-sm", mutedText)}>닉네임으로 검색해보세요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {userResults.map((u: any) => (
                <Link key={u.id} href={`/profile/${u.id}`}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all hover:-translate-y-0.5",
                    examMode ? "bg-[#1c1e54] border-[#2a2d6b] hover:border-[#533afd]" : "bg-white border-[#e3e8ee] hover:border-[#b9b9f9]"
                  )}
                  style={{ boxShadow: "0 1px 3px rgba(0,55,112,0.06)" }}>
                  <Avatar nickname={u.nickname} level={calculateLevel(u.points ?? 0)} size="md" imageUrl={u.avatar} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium text-sm", examMode ? "text-white" : "text-[#0d253d]")}>{u.nickname}</p>
                    <p className={cn("text-xs", mutedText)}>{u.schoolName} · {u.grade}학년</p>
                  </div>
                  <span className="text-xs text-[#533afd] bg-[#eeeaff] px-2 py-0.5 rounded-full">
                    {getLevelName(calculateLevel(u.points ?? 0))}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
