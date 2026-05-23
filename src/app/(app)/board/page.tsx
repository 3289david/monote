"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PostCard from "@/components/posts/PostCard";
import { usePosts } from "@/hooks/usePosts";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { PostCategory } from "@/types";
import GradientHero from "@/components/ui/GradientHero";

const SUBJECTS = ["국어", "수학", "영어", "과학", "사회", "역사", "물리", "화학", "생명과학", "지구과학", "한국사", "음악", "미술", "체육", "기술가정", "정보"];

const CATEGORY_FILTERS: { value: PostCategory | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "exam_range", label: "시험 범위" },
  { value: "performance", label: "수행평가" },
  { value: "materials", label: "자료실" },
  { value: "teacher_info", label: "선생님 정보" },
  { value: "question", label: "질문" },
];

function BoardContent() {
  const searchParams = useSearchParams();
  const examMode = useUIStore((s) => s.examMode);
  const [activeCategory, setActiveCategory] = useState<PostCategory | "all">("all");
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get("subject") ?? "");
  const [selectedGrade, setSelectedGrade] = useState<number>(Number(searchParams.get("grade")) || 0);
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "hot">("latest");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePosts({
    grade: selectedGrade || undefined,
    subject: selectedSubject || undefined,
    category: activeCategory === "all" ? undefined : activeCategory,
    sortBy,
    examMode,
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  const textColor = examMode ? "text-white" : "text-[#0d253d]";
  const mutedText = examMode ? "text-white/50" : "text-[#64748d]";

  return (
    <div className="space-y-4">
      <GradientHero
        title={selectedSubject || "전체 게시판"}
        subtitle={`${selectedGrade ? `${selectedGrade}학년` : "전학년"} · ${isLoading ? "..." : `${posts.length}개 게시물`}`}
        compact
        illustration={
          <svg viewBox="0 0 48 48" fill="none" style={{ width: "48px", height: "48px" }}>
            <rect x="6" y="8" width="36" height="32" rx="4" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
            <path d="M13 18h22M13 24h16M13 30h19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8"/>
            <circle cx="36" cy="34" r="8" fill="white" fillOpacity="0.2"/>
            <path d="M33 34h6M36 31v6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        }
      />
      <div className="flex items-center justify-between">
        <div />
        <div className="flex gap-1">
          {(["latest", "popular", "hot"] as const).map((s) => (
            <button key={s} onClick={() => setSortBy(s)}
              className={cn("text-xs px-2.5 py-1 rounded-full transition-colors",
                sortBy === s ? "bg-[#533afd]/10 text-[#533afd] font-medium" : mutedText)}>
              {s === "latest" ? "최신" : s === "popular" ? "인기" : "핫"}
            </button>
          ))}
        </div>
      </div>

      {/* Grade filter */}
      <div className="flex gap-1.5 flex-wrap">
        {[0, 1, 2, 3].map((g) => (
          <button key={g} onClick={() => setSelectedGrade(g)}
            className={cn("px-3 py-1.5 rounded-full text-sm transition-all",
              selectedGrade === g ? "bg-[#533afd] text-white"
                : examMode ? "bg-[#1c1e54] text-white/60 hover:text-white"
                : "bg-white border border-[#e3e8ee] text-[#273951] hover:border-[#533afd]")}>
            {g === 0 ? "전학년" : `${g}학년`}
          </button>
        ))}
      </div>

      {/* Subject scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <button onClick={() => setSelectedSubject("")}
          className={cn("flex-shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors",
            !selectedSubject ? "bg-[#533afd] text-white border-[#533afd]"
              : examMode ? "bg-[#1c1e54] border-[#2a2d6b] text-white/60"
              : "bg-white border-[#e3e8ee] text-[#273951] hover:border-[#533afd]")}>
          전체 과목
        </button>
        {SUBJECTS.map((subj) => (
          <button key={subj} onClick={() => setSelectedSubject(subj === selectedSubject ? "" : subj)}
            className={cn("flex-shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors",
              selectedSubject === subj ? "bg-[#533afd] text-white border-[#533afd]"
                : examMode ? "bg-[#1c1e54] border-[#2a2d6b] text-white/60"
                : "bg-white border-[#e3e8ee] text-[#273951] hover:border-[#533afd]")}>
            {subj}
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {CATEGORY_FILTERS.map((f) => (
          <button key={f.value} onClick={() => setActiveCategory(f.value)}
            className={cn("flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              activeCategory === f.value ? "bg-[#533afd] text-white"
                : examMode ? "bg-[#1c1e54] text-white/60 hover:text-white"
                : "bg-white text-[#273951] border border-[#e3e8ee] hover:border-[#533afd]")}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn("rounded-xl border p-4 animate-pulse h-28", examMode ? "bg-[#1c1e54] border-[#2a2d6b]" : "bg-white border-[#e3e8ee]")}>
              <div className={cn("h-4 rounded mb-2 w-1/3", examMode ? "bg-[#2a2d6b]" : "bg-[#f6f9fc]")} />
              <div className={cn("h-5 rounded mb-2 w-2/3", examMode ? "bg-[#2a2d6b]" : "bg-[#f6f9fc]")} />
            </div>
          ))}
        </div>
      )}

      {/* Post list */}
      {!isLoading && (
        <div className="space-y-3">
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} examMode={examMode} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
          className={cn("w-full py-3 rounded-xl text-sm border transition-colors",
            examMode ? "bg-[#1c1e54] border-[#2a2d6b] text-white/60" : "bg-white border-[#e3e8ee] text-[#64748d] hover:border-[#533afd]")}>
          {isFetchingNextPage ? "불러오는 중..." : "더 보기"}
        </button>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[#eeeaff] flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[#533afd]">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={1.5} />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
            </svg>
          </div>
          <p className={cn("font-medium", textColor)}>게시물이 없어요</p>
          <p className={cn("text-sm mt-1", mutedText)}>다른 필터를 선택해보세요</p>
        </div>
      )}

      {/* FAB for mobile */}
      <Link href="/post/new"
        className="fixed right-6 bottom-24 md:hidden w-14 h-14 bg-[#533afd] rounded-full flex items-center justify-center shadow-lg shadow-[#533afd]/40 text-white hover:bg-[#4434d4] transition-colors">
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
        </svg>
      </Link>
    </div>
  );
}

export default function BoardPage() {
  return (
    <Suspense fallback={<div className="text-center py-10 text-[#64748d]">불러오는 중...</div>}>
      <BoardContent />
    </Suspense>
  );
}
